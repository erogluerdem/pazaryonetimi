import {
  Inject,
  Injectable,
  Logger,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { IntegrationSyncType } from '../enums/integration-category.enum';
import type { IntegrationCategory } from '../enums/integration-category.enum';
import type { IntegrationSyncJobPayload } from '../dto/integration-sync-job.dto';
import { IntegrationJobExecutor } from './integration-job.executor';
import { MarketplaceService } from '../../marketplace/marketplace.service';

export const INTEGRATION_SYNC_QUEUE = 'integration-sync';

/**
 * Multi-tenant senkronizasyon kuyruğu.
 * Job payload'ına tenant_id zorunlu eklenir; fair-queue ile önceliklendirilir.
 */
@Injectable()
export class IntegrationSyncQueueService {
  private readonly logger = new Logger(IntegrationSyncQueueService.name);

  constructor(
    private readonly jobExecutor: IntegrationJobExecutor,
    @Optional()
    @InjectQueue(INTEGRATION_SYNC_QUEUE)
    private readonly queue?: Queue,
    @Optional()
    @Inject(forwardRef(() => MarketplaceService))
    private readonly marketplaceService?: MarketplaceService,
  ) {}

  /** Sync işini kuyruğa ekler veya doğrudan çalıştırır (fallback) */
  async enqueueSync(params: {
    tenantId: string;
    integrationId: string;
    providerId: string;
    category: IntegrationCategory;
    syncType: IntegrationSyncType;
    platform?: string;
    manual?: boolean;
    sku?: string;
    quantity?: number;
    price?: number;
  }): Promise<{ queued: boolean; jobId?: string | number; message: string }> {
    const payload: IntegrationSyncJobPayload = {
      tenantId: params.tenantId,
      integrationId: params.integrationId,
      providerId: params.providerId,
      category: params.category,
      syncType: params.syncType,
      platform: params.platform,
      manual: params.manual ?? false,
      enqueuedAt: new Date().toISOString(),
      priority: this.jobExecutor.resolvePriority(params.tenantId),
      sku: params.sku,
      quantity: params.quantity,
      price: params.price,
    };

    const gate = this.jobExecutor.canExecute(payload);
    if (!gate.success && gate.reason === 'rate-limit') {
      this.logger.warn(`Rate limit: ${params.tenantId}/${params.providerId}`);
    }

    if (this.queue) {
      const job = await this.queue.add(
        `sync-${params.syncType}`,
        payload,
        {
          priority: payload.priority,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
          jobId: `${params.tenantId}:${params.integrationId}:${params.syncType}:${Date.now()}`,
        },
      );

      return {
        queued: true,
        jobId: job.id,
        message: 'Senkronizasyon kuyruğa eklendi',
      };
    }

    // Kuyruk kapalı veya tenant limiti — doğrudan çalıştır
    if (!gate.success) throw new Error('Senkronizasyon bekletildi: ' + gate.reason);
    if (this.marketplaceService) {
      const result = await this.marketplaceService.syncIntegrationByStoreId(
        params.tenantId,
        params.integrationId,
        params.syncType === IntegrationSyncType.ORDERS ? 'orders' : params.syncType === IntegrationSyncType.PRODUCTS ? 'products' : 'all',
      );
      return {
        queued: false,
        message: 'Senkronizasyon doğrudan çalıştırıldı',
      };
    }

    throw new Error('Senkronizasyon servisi kullanılamıyor');
  }
}
