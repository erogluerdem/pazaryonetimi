import { Injectable, NotFoundException, ConflictException, Logger, Optional } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { XmlJobQueueService } from './xml-job-queue.service';

export interface AlertReportOptions {
  errorCode?: string;
  rootReason?: string;
  suggestedAction?: string;
  jobId?: string;
  integrationId?: string;
  retryUrl?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class OperationsAlertsService {
  private readonly logger = new Logger(OperationsAlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xmlQueue: XmlJobQueueService,
    @Optional()
    private readonly notificationsGateway?: NotificationsGateway,
  ) {}

  async report(
    tenantId: string,
    key: string,
    title: string,
    message: string,
    actionUrl: string,
    severity = 'error',
    options?: AlertReportOptions,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `alert:${tenantId}:${key}`);
      const prior = await tx.notification.findFirst({
        where: {
          tenantId,
          data: { path: ['operationKey'], equals: key },
          createdAt: { gte: new Date(Date.now() - 86400000) },
        },
        orderBy: { createdAt: 'desc' },
      });

      const payloadData: Record<string, any> = {
        operationKey: key,
        errorCode: options?.errorCode || 'OPERATION_FAILED',
        rootReason: options?.rootReason || message,
        suggestedAction: options?.suggestedAction || 'Hatanın detaylarını kontrol edin veya işlemi yeniden deneyin.',
        jobId: options?.jobId,
        integrationId: options?.integrationId,
        retryUrl: options?.retryUrl || (options?.jobId ? `/api/operations/jobs/${options.jobId}/retry` : undefined),
        canRetry: Boolean(options?.jobId || options?.integrationId),
        ...(options?.metadata || {}),
      };

      if (prior && prior.message === message && prior.severity === severity) {
        return prior;
      }

      const data = {
        tenantId,
        type: 'integration',
        title,
        message: message.slice(0, 1000),
        severity,
        actionUrl,
        isRead: false,
        data: payloadData,
      };

      const notification = prior
        ? await tx.notification.update({ where: { id: prior.id }, data })
        : await tx.notification.create({ data });

      // Realtime websocket broadcast if gateway is active
      try {
        if (this.notificationsGateway) {
          const mappedSeverity =
            severity === 'CRITICAL' ? 'error' : severity === 'WARNING' ? 'warning' : 'info';
          this.notificationsGateway.broadcastToTenant(tenantId, {
            id: notification.id,
            type: 'system',
            title,
            message,
            severity: mappedSeverity,
            timestamp: new Date().toISOString(),
            data: { ...payloadData, actionUrl },
            tenantId,
          });
        }
      } catch {
        // Non-blocking notification emission
      }

      return notification;
    });
  }

  async list(tenantId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, OR: [{ userId: null }, { userId }] },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async read(tenantId: string, userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { tenantId, ...(id === 'all' ? {} : { id }), OR: [{ userId: null }, { userId }] },
      data: { isRead: true, readAt: new Date() },
    });
    if (id !== 'all' && !result.count) throw new NotFoundException('Bildirim bulunamadı');
    return { success: true };
  }

  /**
   * Kullanıcı veya yöneticinin başarısız bir işi doğrudan arayüzden yeniden denemesini sağlar.
   */
  async retryJob(tenantId: string, jobId: string) {
    const operation = await this.prisma.dataOperation.findFirst({
      where: { id: jobId, tenantId },
    });

    if (operation) {
      if (operation.kind === 'xml-import') {
        const retried = await this.xmlQueue.retry(tenantId, jobId);
        await this.report(
          tenantId,
          `xml-job:${jobId}`,
          'XML aktarımı yeniden başlatıldı',
          'İşlem kuyruğa tekrar eklendi ve işçi tarafından işlenecektir.',
          '/dashboard/xml-import',
          'info',
        );
        return { success: true, message: 'XML aktarımı yeniden başlatıldı', job: retried };
      }

      // Genel data operation retry
      await this.prisma.dataOperation.updateMany({
        where: { id: jobId, tenantId },
        data: {
          status: 'queued',
          attempts: 0,
          error: null,
          availableAt: new Date(),
          leaseToken: null,
          leaseUntil: null,
        },
      });

      return { success: true, message: 'İşlem yeniden sıraya alındı', jobId };
    }

    // BulkAction kontrolü
    const bulkAction = await this.prisma.bulkAction.findFirst({
      where: { id: jobId, tenantId },
    });

    if (bulkAction) {
      if (bulkAction.status !== 'failed') {
        throw new ConflictException('Yalnızca başarısız toplu işlemler yeniden denenebilir');
      }

      await this.prisma.bulkAction.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      });

      return { success: true, message: 'Toplu işlem yeniden başlatıldı', jobId };
    }

    throw new NotFoundException('Yeniden denenecek işlem bulunamadı');
  }

  /**
   * Başarısız pazaryeri entegrasyonu senkronizasyonunu anında yeniden tetikler.
   */
  async retryIntegrationSync(tenantId: string, integrationId: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, tenantId },
    });

    if (!integration) {
      throw new NotFoundException('Entegrasyon mağazası bulunamadı');
    }

    // Reset failure metadata and flag for immediate sync
    const currentMeta = (integration.apiExtra as Record<string, any>) || {};
    const updatedMeta = {
      ...currentMeta,
      lastSyncStatus: 'queued',
      lastSyncError: null,
      syncRequestedAt: new Date().toISOString(),
    };

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: {
        apiExtra: updatedMeta,
        updatedAt: new Date(),
      },
    });

    await this.report(
      tenantId,
      `integration:${integrationId}`,
      `${integration.platform} senkronizasyonu başlatıldı`,
      'Kullanıcı isteğiyle mağaza senkronizasyonu yeniden kuyruğa alındı.',
      '/dashboard/settings/integrations',
      'info',
    );

    return {
      success: true,
      message: `${integration.platform} senkronizasyonu kuyruğa alındı`,
      platform: integration.platform,
    };
  }

  /**
   * Durmuş kuyrukları, başarısız entegrasyonları ve süresi dolan tokenları periyodik denetler.
   */
  @Interval(60_000)
  async scanIntegrationFailures() {
    try {
      // 1. Başarısız veya doğrulanamayan entegrasyonlar
      const rows = await this.prisma.integration.findMany({
        where: {
          isActive: true,
          OR: [
            { apiExtra: { path: ['lastSyncStatus'], equals: 'failed' } },
            { apiExtra: { path: ['connectionStatus'], equals: 'verification_failed' } },
          ],
        },
        take: 500,
        orderBy: { updatedAt: 'desc' },
      });

      for (const row of rows) {
        const meta = (row.apiExtra as Record<string, any>) || {};
        const isAuthError =
          meta.lastSyncError?.includes('401') ||
          meta.lastSyncError?.includes('token') ||
          meta.connectionStatus === 'verification_failed';

        await this.report(
          row.tenantId,
          `integration:${row.id}`,
          `${row.platform} aktarımı başarısız`,
          String(meta.lastSyncError || meta.lastVerificationError || 'Mağaza yetkisini ve aktarım kayıtlarını kontrol edin'),
          '/dashboard/settings/integrations',
          'error',
          {
            errorCode: isAuthError ? 'INTEGRATION_AUTH_FAILED' : 'SYNC_FAILED',
            rootReason: String(meta.lastSyncError || meta.lastVerificationError || 'API bağlantı hatası'),
            suggestedAction: isAuthError
              ? 'Pazaryeri API anahtarınızı veya süresi dolan tokenınızı yenileyin.'
              : 'Pazaryeri bağlantısını yeniden deneyin veya mağaza durumunu kontrol edin.',
            integrationId: row.id,
            retryUrl: `/api/operations/integrations/${row.id}/retry`,
          },
        );
      }

      // 2. Durmuş (stalled) veya 15 dakikadır ilerlemeyen veri aktarımları
      const stalled = await this.prisma.dataOperation.findMany({
        where: {
          status: { in: ['queued', 'processing'] },
          updatedAt: { lt: new Date(Date.now() - 15 * 60000) },
        },
        take: 200,
      });

      for (const job of stalled) {
        await this.report(
          job.tenantId,
          `xml-job:${job.id}`,
          'XML aktarımı ilerlemiyor (Kuyruk Durdu)',
          'Son 15 dakikada ilerleme kaydedilmedi. Kuyruk ve işçi durumu kontrol ediliyor.',
          '/dashboard/xml-import',
          'warning',
          {
            errorCode: 'QUEUE_STALLED',
            rootReason: 'İşçi işlem kilit süresi doldu veya sistem yükü nedeniyle kuyruk durakladı.',
            suggestedAction: 'İşlemi yeniden deneyebilir veya kuyruğu serbest bırakabilirsiniz.',
            jobId: job.id,
            retryUrl: `/api/operations/jobs/${job.id}/retry`,
          },
        );
      }

      // 3. Süresi yaklaşan / dolmuş tokenlar (son 24 saat ve geçmiş)
      const integrations = await this.prisma.integration.findMany({
        where: { isActive: true },
        select: { id: true, tenantId: true, platform: true, apiExtra: true },
        take: 500,
      });

      const now = Date.now();
      for (const item of integrations) {
        const extra = (item.apiExtra as Record<string, any>) || {};
        const expiry = extra.tokenExpiresAt || extra.expiresAt || extra.token_expiry;
        if (!expiry) continue;

        const expiryTime = new Date(expiry).getTime();
        if (Number.isNaN(expiryTime)) continue;

        if (expiryTime <= now) {
          // Token süresi doldu!
          await this.report(
            item.tenantId,
            `token-expired:${item.id}`,
            `${item.platform} Token Süresi Doldu! ⚠️`,
            `${item.platform} mağaza oturum anahtarının süresi doldu. Sipariş ve stok senkronizasyonu durdurulabilir.`,
            '/dashboard/settings/integrations',
            'error',
            {
              errorCode: 'TOKEN_EXPIRED',
              rootReason: `Oturum anahtarı ${new Date(expiryTime).toLocaleString('tr-TR')} tarihinde sona erdi.`,
              suggestedAction: 'Entegrasyonlar sayfasından mağaza yetkisini yenileyin.',
              integrationId: item.id,
            },
          );
        } else if (expiryTime - now <= 24 * 60 * 60 * 1000) {
          // 24 saatten az kaldı
          const remainingHours = Math.round((expiryTime - now) / 3600000);
          await this.report(
            item.tenantId,
            `token-expiring:${item.id}`,
            `${item.platform} Token Süresi Yaklaşıyor (${remainingHours}s)`,
            `${item.platform} mağaza tokenının süresi ${remainingHours} saat içinde dolacaktır. Kesinti yaşamamak için yenileyin.`,
            '/dashboard/settings/integrations',
            'warning',
            {
              errorCode: 'TOKEN_EXPIRING_SOON',
              rootReason: `Kalan süre: ${remainingHours} saat`,
              suggestedAction: 'Tokenı yenileyerek kesintisiz aktarımı sağlayın.',
              integrationId: item.id,
            },
          );
        }
      }
    } catch (err) {
      this.logger.error(`Operasyon hata denetimi sırasında hata: ${(err as Error).message}`);
    }
  }
}
