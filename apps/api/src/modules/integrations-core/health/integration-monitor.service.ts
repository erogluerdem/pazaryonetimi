import {
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { EncryptionService } from '../../../common/encryption.service';
import { INTEGRATION_SYNC_QUEUE } from '../queue/integration-sync-queue.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';

@Injectable()
export class IntegrationMonitorService implements OnModuleInit {
  private readonly logger = new Logger(IntegrationMonitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    @Optional()
    @InjectQueue(INTEGRATION_SYNC_QUEUE)
    private readonly queue?: Queue,
    @Optional()
    private readonly notificationsGateway?: NotificationsGateway,
  ) {}

  onModuleInit() {
    this.logger.log('🛡️ Integration Monitor Service başlatıldı.');
    // Check after brief delay upon boot
    setTimeout(() => {
      this.checkAllHealth().catch((err) => {
        this.logger.error(`Initial integration health check failed: ${err.message}`);
      });
    }, 15000);
  }

  /**
   * Her 15 dakikada bir çalışarak:
   * 1. Süresi dolan veya yaklaşan token'ları denetler.
   * 2. Başarısız senkronizasyonları yöneticiye bildirir.
   * 3. İşlem kuyruğunun durumunu kontrol eder.
   */
  @Cron('0 */15 * * * *', {
    name: 'integration-health-monitor',
  })
  async checkAllHealth(): Promise<{
    tokenAlerts: number;
    failedSyncAlerts: number;
    queueStalled: boolean;
  }> {
    let tokenAlerts = 0;
    let failedSyncAlerts = 0;
    let queueStalled = false;

    try {
      tokenAlerts = await this.checkExpiringTokens();
      failedSyncAlerts = await this.checkFailedSyncs();
      queueStalled = await this.checkQueueStatus();
    } catch (error) {
      this.logger.error(`Integration health check error: ${(error as Error).message}`);
    }

    return { tokenAlerts, failedSyncAlerts, queueStalled };
  }

  /**
   * Süresi dolan / 24 saat içinde dolacak olan token'ları tespit eder ve bildirim üretir.
   */
  async checkExpiringTokens(): Promise<number> {
    let alertCount = 0;
    const integrations = await this.prisma.integration.findMany({
      where: { isActive: true },
      select: {
        id: true,
        tenantId: true,
        platform: true,
        apiExtra: true,
      },
    });

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    for (const integration of integrations) {
      try {
        const extra = this.encryption.openExtra(integration.apiExtra);
        const expiresAtRaw =
          extra.tokenExpiresAt ||
          extra.expiresAt ||
          extra.accessTokenExpiresAt ||
          extra.token_expiry;

        if (!expiresAtRaw) continue;

        const expiresAt = new Date(expiresAtRaw).getTime();
        if (Number.isNaN(expiresAt)) continue;

        const timeRemaining = expiresAt - now;
        const isExpired = timeRemaining <= 0;
        const isExpiringSoon = timeRemaining > 0 && timeRemaining <= twentyFourHours;

        if (isExpired || isExpiringSoon) {
          // Son 12 saat içinde bu mağaza için benzer bir uyarı üretilmiş mi kontrol et
          const twelveHoursAgo = new Date(now - 12 * 60 * 60 * 1000);
          const existingNotif = await this.prisma.notification.findFirst({
            where: {
              tenantId: integration.tenantId,
              type: 'integration',
              createdAt: { gte: twelveHoursAgo },
              data: {
                path: ['integrationId'],
                equals: integration.id,
              },
            },
          });

          if (!existingNotif) {
            const title = isExpired
              ? `Token Süresi Doldu: ${integration.platform}`
              : `Token Süresi Yakında Doluyor: ${integration.platform}`;
            const message = isExpired
              ? `${integration.platform} mağaza bağlantı yetkisi sona erdi. Aktarımların aksamaması için mağazayı yeniden yetkilendirin.`
              : `${integration.platform} mağaza yetki anahtarının süresi 24 saat içinde dolacak. Lütfen anahtarınızı güncelleyin.`;

            await this.prisma.notification.create({
              data: {
                tenantId: integration.tenantId,
                type: 'integration',
                severity: isExpired ? 'error' : 'warning',
                title,
                message,
                actionUrl: '/dashboard/stores',
                data: {
                  integrationId: integration.id,
                  platform: integration.platform,
                  expiresAt: new Date(expiresAt).toISOString(),
                  isExpired,
                },
              },
            });

            this.notificationsGateway?.broadcastToTenant(integration.tenantId, {
              id: `token_warn_${integration.id}_${Date.now()}`,
              title,
              message,
              type: 'integration',
              severity: isExpired ? 'error' : 'warning',
              timestamp: new Date().toISOString(),
              data: { actionUrl: '/dashboard/stores' },
            });

            alertCount++;
          }
        }
      } catch (err) {
        this.logger.warn(`Could not check token for integration ${integration.id}: ${(err as Error).message}`);
      }
    }

    return alertCount;
  }

  /**
   * Son 30 dakikada başarısız olmuş aktarımları tespit eder ve bildirim fırlatır.
   */
  async checkFailedSyncs(): Promise<number> {
    let alertCount = 0;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const recentFails = await this.prisma.integrationSyncLog.findMany({
      where: {
        status: 'FAILED',
        startedAt: { gte: thirtyMinutesAgo },
      },
      include: {
        integration: {
          select: { id: true, tenantId: true, platform: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    for (const log of recentFails) {
      if (!log.integration) continue;

      const { tenantId, platform, id: integrationId } = log.integration;

      // Son 30 dakika içinde bu aktarım hatası için bildirim gönderilmiş mi?
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          tenantId,
          type: 'integration',
          severity: 'error',
          createdAt: { gte: thirtyMinutesAgo },
          data: {
            path: ['integrationId'],
            equals: integrationId,
          },
        },
      });

      if (!alreadyNotified) {
        const title = `Aktarım Başarısız: ${platform}`;
        const message = log.errorMessage || `${platform} ürün veya sipariş aktarımı sırasında hata oluştu.`;

        await this.prisma.notification.create({
          data: {
            tenantId,
            type: 'integration',
            severity: 'error',
            title,
            message,
            actionUrl: '/dashboard/stores',
            data: {
              integrationId,
              platform,
              syncType: log.syncType,
              errorMessage: log.errorMessage,
            },
          },
        });

        this.notificationsGateway?.broadcastToTenant(tenantId, {
          id: `sync_err_${log.id}`,
          title,
          message,
          type: 'integration',
          severity: 'error',
          timestamp: new Date().toISOString(),
          data: { actionUrl: '/dashboard/stores' },
        });

        alertCount++;
      }
    }

    return alertCount;
  }

  /**
   * BullMQ kuyruk durumunu denetler; kuyruk durmuşsa veya kilitlenmişse sistem bildirimi oluşturur.
   */
  async checkQueueStatus(): Promise<boolean> {
    if (!this.queue) return false;

    try {
      const isPaused = await this.queue.isPaused();
      if (isPaused) {
        this.logger.error('⚠️ INTEGRATION_SYNC_QUEUE duraklatılmış (paused) durumda!');

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const existingAlert = await this.prisma.notification.findFirst({
          where: {
            type: 'system',
            severity: 'error',
            createdAt: { gte: oneHourAgo },
            title: { contains: 'Kuyruk' },
          },
        });

        if (!existingAlert) {
          const tenants = await this.prisma.tenant.findMany({
            select: { id: true },
            take: 20,
          });

          for (const t of tenants) {
            await this.prisma.notification.create({
              data: {
                tenantId: t.id,
                type: 'system',
                severity: 'error',
                title: 'Senkronizasyon Kuyruğu Durduruldu',
                message: 'Arka plan aktarım kuyruğu duraklatılmış durumda. Otomatik aktarımlar kuyruk yeniden başlatılana kadar bekletilecektir.',
                actionUrl: '/dashboard/system/queues',
              },
            }).catch(() => undefined);
          }
        }
        return true;
      }
    } catch (err) {
      this.logger.warn(`Queue status check failed: ${(err as Error).message}`);
    }

    return false;
  }
}
