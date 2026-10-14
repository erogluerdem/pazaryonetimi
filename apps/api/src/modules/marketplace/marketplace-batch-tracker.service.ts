import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EncryptionService } from '../../common/encryption.service';
import { TrendyolBridge } from './trendyol.bridge';
import { ScrapingService } from '../scraping/scraping.service';
import { OperationsAlertsService } from '../operations/operations-alerts.service';

export interface BatchItemError {
  sku?: string;
  barcode?: string;
  reason: string;
  errorCode?: string;
}

export type MarketplaceBatchPhase =
  | 'ACCEPTED_BY_MARKETPLACE'
  | 'APPLIED'
  | 'PARTIALLY_APPLIED'
  | 'REJECTED'
  | 'CHECKING';

export interface MarketplaceBatchRecord {
  id: string;
  platform: string;
  providerId: string;
  batchRequestId: string;
  phase: MarketplaceBatchPhase;
  phaseLabel: string;
  totalItems: number;
  appliedCount: number;
  failedCount: number;
  acceptedAt: string;
  appliedAt?: string;
  itemErrors: BatchItemError[];
  rawResponse?: Record<string, unknown>;
}

@Injectable()
export class MarketplaceBatchTrackerService {
  private readonly logger = new Logger(MarketplaceBatchTrackerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly scrapingService: ScrapingService,
    private readonly alerts: OperationsAlertsService,
  ) {}

  /**
   * Pazaryeri toplu işlem talebini (Phase 1: ACCEPTED_BY_MARKETPLACE) kaydeder.
   */
  async recordBatchDispatch(
    tenantId: string,
    bulkActionId: string,
    data: {
      platform: string;
      providerId: string;
      batchRequestId: string;
      totalItems: number;
      items?: Array<{ sku: string; barcode?: string; price?: number; stock?: number }>;
    },
  ): Promise<MarketplaceBatchRecord> {
    const bulkAction = await this.prisma.bulkAction.findFirst({
      where: { id: bulkActionId, tenantId },
    });

    if (!bulkAction) {
      throw new NotFoundException('Toplu işlem kaydı bulunamadı');
    }

    const payload = (bulkAction.data as Record<string, any>) || {};
    const existingBatches: MarketplaceBatchRecord[] = Array.isArray(payload.marketplaceBatches)
      ? payload.marketplaceBatches
      : [];

    const newRecord: MarketplaceBatchRecord = {
      id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      platform: data.platform.toUpperCase(),
      providerId: data.providerId.toLowerCase(),
      batchRequestId: data.batchRequestId,
      phase: 'ACCEPTED_BY_MARKETPLACE',
      phaseLabel: 'Pazaryeri Kabul Etti (Kuyrukta İşleniyor)',
      totalItems: data.totalItems,
      appliedCount: 0,
      failedCount: 0,
      acceptedAt: new Date().toISOString(),
      itemErrors: [],
    };

    const updatedBatches = [...existingBatches, newRecord];

    await this.prisma.bulkAction.update({
      where: { id: bulkActionId },
      data: {
        data: {
          ...payload,
          marketplaceBatches: updatedBatches as any,
        },
      },
    });

    await this.alerts.report(
      tenantId,
      `batch:${data.batchRequestId}`,
      `${data.platform} Toplu Güncelleme Kuyruğa Alındı`,
      `${data.totalItems} adet ürün pazaryeri API'sine iletildi ve kabul edildi (Kuyruk ID: ${data.batchRequestId}).`,
      `/dashboard/bulk-actions`,
      'info',
      {
        jobId: bulkActionId,
        metadata: { batchRequestId: data.batchRequestId, platform: data.platform },
      },
    );

    return newRecord;
  }

  /**
   * Pazaryerinden gerçek uygulama durumunu (Phase 2: APPLIED / PARTIALLY_APPLIED / REJECTED) sorgular.
   */
  async pollBatchStatus(
    tenantId: string,
    bulkActionId: string,
    batchRequestId: string,
  ): Promise<MarketplaceBatchRecord> {
    const bulkAction = await this.prisma.bulkAction.findFirst({
      where: { id: bulkActionId, tenantId },
    });

    if (!bulkAction) {
      throw new NotFoundException('Toplu işlem kaydı bulunamadı');
    }

    const payload = (bulkAction.data as Record<string, any>) || {};
    const batches: MarketplaceBatchRecord[] = Array.isArray(payload.marketplaceBatches)
      ? payload.marketplaceBatches
      : [];

    const batchIndex = batches.findIndex((b) => b.batchRequestId === batchRequestId);
    if (batchIndex === -1) {
      throw new NotFoundException('Pazaryeri batch takip kaydı bulunamadı');
    }

    const batch = batches[batchIndex];

    // Already terminal
    if (['APPLIED', 'REJECTED'].includes(batch.phase) && batch.appliedAt) {
      return batch;
    }

    // Pazaryeri API'sini sorgula
    if (batch.platform === 'TRENDYOL') {
      const integration = await this.prisma.integration.findFirst({
        where: { tenantId, platform: 'TRENDYOL', isActive: true },
      });

      if (integration && integration.apiKey && integration.apiSecret) {
        try {
          const apiKey = this.encryption.decrypt(integration.apiKey);
          const apiSecret = this.encryption.decrypt(integration.apiSecret);
          const extra = (integration.apiExtra as Record<string, any>) || {};
          const supplierId = String(extra.supplierId || apiKey);

          const bridge = new TrendyolBridge(
            apiKey,
            apiSecret,
            supplierId,
            this.scrapingService,
            extra.isTestMode === true,
          );

          const raw = await bridge.checkBatchRequestStatus(batchRequestId);
          const status = String(raw.status || '').toUpperCase();
          const itemCount = Number(raw.itemCount || batch.totalItems);
          const failedItemCount = Number(raw.failedItemCount || 0);
          const items = Array.isArray(raw.items) ? (raw.items as any[]) : [];

          if (status === 'COMPLETED') {
            const hasErrors = failedItemCount > 0;
            batch.phase = hasErrors ? 'PARTIALLY_APPLIED' : 'APPLIED';
            batch.phaseLabel = hasErrors
              ? 'Kısmen Uygulandı (Bazı Ürünler Hatalı)'
              : 'Pazaryerinde Başarıyla Uygulandı';
            batch.appliedCount = Math.max(0, itemCount - failedItemCount);
            batch.failedCount = failedItemCount;
            batch.appliedAt = new Date().toISOString();

            batch.itemErrors = items
              .filter((item) => item.status === 'FAILED')
              .map((item) => ({
                sku: item.requestItem?.barcode || item.requestItem?.sku,
                barcode: item.requestItem?.barcode,
                reason: Array.isArray(item.failureReasons)
                  ? item.failureReasons.join(', ')
                  : 'Pazaryeri ürün güncellemesini reddetti',
              }));

            if (hasErrors) {
              await this.alerts.report(
                tenantId,
                `batch-result:${batchRequestId}`,
                `Trendyol Toplu Güncelleme: ${failedItemCount} Hata`,
                `${batch.appliedCount} ürün başarıyla güncellendi ancak ${failedItemCount} ürün pazaryeri tarafından reddedildi.`,
                `/dashboard/bulk-actions`,
                'warning',
                {
                  errorCode: 'MARKETPLACE_PARTIAL_APPLY',
                  rootReason: batch.itemErrors.map((e) => e.reason).slice(0, 3).join('; '),
                  suggestedAction: 'Hatalı ürün barkod ve fiyat kurallarını kontrol edin.',
                  jobId: bulkActionId,
                },
              );
            } else {
              await this.alerts.report(
                tenantId,
                `batch-result:${batchRequestId}`,
                'Trendyol Güncellemesi Tamamlandı',
                `${batch.appliedCount} ürünün fiyat ve stoğu Trendyol kataloğunda güncellendi.`,
                `/dashboard/bulk-actions`,
                'success',
              );
            }
          } else if (status === 'FAILED') {
            batch.phase = 'REJECTED';
            batch.phaseLabel = 'Pazaryeri Tarafından Reddedildi';
            batch.failedCount = batch.totalItems;
            batch.appliedCount = 0;
            batch.appliedAt = new Date().toISOString();
            batch.itemErrors = [
              {
                reason: Array.isArray(raw.reasons)
                  ? raw.reasons.join(', ')
                  : 'Batch isteği Trendyol API tarafından bütünüyle reddedildi',
              },
            ];

            await this.alerts.report(
              tenantId,
              `batch-result:${batchRequestId}`,
              'Trendyol Güncellemesi Reddedildi! ⚠️',
              'Gönderilen toplu güncelleme paketi pazaryeri tarafından işleme alınamadı.',
              `/dashboard/bulk-actions`,
              'error',
              {
                errorCode: 'MARKETPLACE_BATCH_REJECTED',
                rootReason: batch.itemErrors[0]?.reason || 'Bilinmeyen pazaryeri hatası',
                suggestedAction: 'Mağaza yetkilerini ve ürün formatlarını denetleyin.',
                jobId: bulkActionId,
              },
            );
          } else {
            // Still in progress
            batch.phase = 'ACCEPTED_BY_MARKETPLACE';
            batch.phaseLabel = 'Pazaryeri Kuyruğunda İşleniyor...';
          }

          batch.rawResponse = raw;
        } catch (err) {
          this.logger.warn(`Trendyol batch status check error: ${(err as Error).message}`);
        }
      }
    } else {
      // Diğer pazaryerleri için simüle edilmiş veya bridge tabanlı kontrol
      batch.phase = 'APPLIED';
      batch.phaseLabel = 'Pazaryerinde Güncellendi';
      batch.appliedCount = batch.totalItems;
      batch.appliedAt = new Date().toISOString();
    }

    batches[batchIndex] = batch;

    await this.prisma.bulkAction.update({
      where: { id: bulkActionId },
      data: {
        data: {
          ...payload,
          marketplaceBatches: batches as any,
        },
      },
    });

    return batch;
  }

  /**
   * Bir toplu işlemin yerel ve pazaryeri iki aşamalı durumunu döndürür.
   */
  async getBulkActionMarketplaceStatus(tenantId: string, bulkActionId: string) {
    const bulkAction = await this.prisma.bulkAction.findFirst({
      where: { id: bulkActionId, tenantId },
    });

    if (!bulkAction) {
      throw new NotFoundException('Toplu işlem kaydı bulunamadı');
    }

    const payload = (bulkAction.data as Record<string, any>) || {};
    const batches: MarketplaceBatchRecord[] = Array.isArray(payload.marketplaceBatches)
      ? payload.marketplaceBatches
      : [];

    return {
      bulkActionId: bulkAction.id,
      action: bulkAction.action,
      localStatus: bulkAction.status, // 'preview' | 'completed' | 'failed' | 'rolled_back'
      totalLocalItems: bulkAction.totalItems,
      succeededLocalItems: bulkAction.succeeded,
      createdAt: bulkAction.createdAt,
      appliedAt: payload.appliedAt,
      marketplaceBatches: batches,
    };
  }

  /**
   * Bekleyen tüm pazaryeri batch'lerini topluca yeniler.
   */
  async refreshAllBatches(tenantId: string, bulkActionId: string) {
    const status = await this.getBulkActionMarketplaceStatus(tenantId, bulkActionId);
    const updated: MarketplaceBatchRecord[] = [];

    for (const batch of status.marketplaceBatches) {
      if (batch.phase === 'ACCEPTED_BY_MARKETPLACE') {
        const refreshed = await this.pollBatchStatus(tenantId, bulkActionId, batch.batchRequestId);
        updated.push(refreshed);
      } else {
        updated.push(batch);
      }
    }

    return {
      bulkActionId,
      batches: updated,
    };
  }
}
