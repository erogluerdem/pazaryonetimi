import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as cron from 'node-cron';
import { PrismaService } from '../../database/prisma.service';
import { MarketIntelligenceService } from '../market-intelligence/market-intelligence.service';
import { CompetitorAnalysisService } from '../marketplace/competitor-analysis.service';
import { Platform } from '../marketplace/marketplace.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue('reports') private reportsQueue: Queue,
    @InjectQueue('sync') private syncQueue: Queue,
    @InjectQueue('emails') private emailsQueue: Queue,
    private prisma: PrismaService,
    private marketIntelligenceService: MarketIntelligenceService,
    private competitorService: CompetitorAnalysisService,
  ) {}

  onModuleInit() {
    this.setupScheduledJobs();
  }

  private setupScheduledJobs() {
    // Her gün saat 09:00'da günlük rapor
    cron.schedule('0 9 * * *', async () => {
      this.logger.log('Günlük rapor görevi başlatılıyor...');
      await this.scheduleDailyReports();
    });

    // Her saat başı stok senkronizasyonu
    cron.schedule('0 * * * *', async () => {
      this.logger.log('Stok senkronizasyonu başlatılıyor...');
      await this.scheduleInventorySync();
    });

    // Her 6 saatte sipariş senkronizasyonu
    cron.schedule('0 */6 * * *', async () => {
      this.logger.log('Sipariş senkronizasyonu başlatılıyor...');
      await this.scheduleOrderSync();
    });

    // Her gün saat 03:00'de pazaryeri ürün senkronizasyonu
    cron.schedule('0 3 * * *', async () => {
      this.logger.log('Pazaryeri ürün senkronizasyonu başlatılıyor...');
      await this.scheduleMarketplaceProductSync();
    });

    // Her gün saat 04:00'de SEO analizi
    cron.schedule('0 4 * * *', async () => {
      this.logger.log('Otomatik SEO analizi başlatılıyor...');
      await this.scheduleSEOAnalysis();
    });

    // Her 3 saatte bir fiyat izleme
    cron.schedule('0 */3 * * *', async () => {
      this.logger.log('Fiyat izleme başlatılıyor...');
      await this.schedulePriceMonitoring();
    });

    // Her gün gece 02:00'de eski log temizliği
    cron.schedule('0 2 * * *', async () => {
      this.logger.log('Log temizliği başlatılıyor...');
      await this.cleanOldLogs();
    });

    // Her Pazartesi saat 08:00'de haftalık rapor
    cron.schedule('0 8 * * 1', async () => {
      this.logger.log('Haftalık rapor görevi başlatılıyor...');
      await this.scheduleWeeklyReports();
    });

    // Her gun 07:30'da rakip snapshot + alarm üretimi
    cron.schedule('30 7 * * *', async () => {
      this.logger.log('Rakip zeka snapshot gorevi baslatiliyor...');
      await this.scheduleCompetitorIntelligence();
    });

    // Her Pazartesi 07:45'te haftalik rakip ozet raporu
    cron.schedule('45 7 * * 1', async () => {
      this.logger.log('Haftalik rakip ozet raporu gorevi baslatiliyor...');
      await this.scheduleCompetitorSummaryReports();
    });

    // Her 30 dakikada bir entegrasyon sağlık kontrolü
    cron.schedule('*/30 * * * *', async () => {
      this.logger.log('Entegrasyon sağlık kontrolü başlatılıyor...');
      await this.scheduleHealthChecks();
    });

    this.logger.log('Zamanlanmış görevler aktifleştirildi');
  }

  async scheduleDailyReports() {
    const tenants = await this.prisma.tenant.findMany({
      where: { plan: { in: ['PRO', 'ENTERPRISE'] } },
      select: { id: true, name: true },
    });

    for (const tenant of tenants) {
      await this.reportsQueue.add(
        'daily-report',
        { tenantId: tenant.id, type: 'daily', period: 'yesterday' },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
      );
    }

    this.logger.log(`${tenants.length} tenant için günlük rapor planlandı`);
  }

  async scheduleWeeklyReports() {
    const tenants = await this.prisma.tenant.findMany({
      where: { plan: { in: ['PRO', 'ENTERPRISE'] } },
      select: { id: true },
    });

    for (const tenant of tenants) {
      await this.reportsQueue.add(
        'weekly-report',
        { tenantId: tenant.id, type: 'weekly', period: 'last-week' },
        { attempts: 3 },
      );
    }
  }

  async scheduleInventorySync() {
    const integrations = await this.prisma.integration.findMany({
      where: { isActive: true },
      select: { id: true, tenantId: true, platform: true },
    });

    for (const integration of integrations) {
      await this.syncQueue.add(
        'inventory-sync',
        {
          integrationId: integration.id,
          tenantId: integration.tenantId,
          platform: integration.platform,
        },
        { attempts: 3, removeOnComplete: 100, removeOnFail: 50 },
      );
    }

    this.logger.log(
      `${integrations.length} entegrasyon için stok senkronizasyonu planlandı`,
    );
  }

  async scheduleOrderSync() {
    const integrations = await this.prisma.integration.findMany({
      where: { isActive: true },
      select: { id: true, tenantId: true, platform: true },
    });

    for (const integration of integrations) {
      await this.syncQueue.add(
        'order-sync',
        {
          integrationId: integration.id,
          tenantId: integration.tenantId,
          platform: integration.platform,
        },
        { attempts: 3 },
      );
    }
  }

  async cleanOldLogs() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const deleted = await this.prisma.activityLog.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo }, NOT: { resource: 'xml_feed', action: 'xml.feed.config' } },
    });

    this.logger.log(`${deleted.count} eski log silindi`);
  }

  async scheduleCompetitorIntelligence() {
    const tenants = await this.prisma.tenant.findMany({
      where: { plan: { in: ['PRO', 'ENTERPRISE'] } },
      select: { id: true },
    });

    for (const tenant of tenants) {
      try {
        await this.marketIntelligenceService.runCompetitorSnapshot(tenant.id, {
          limitPerStore: 10,
        });
        await this.marketIntelligenceService.getCompetitorAlerts(tenant.id, 5);
      } catch (error) {
        this.logger.warn(
          `Rakip zeka gorevi hatasi tenant=${tenant.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `${tenants.length} tenant icin rakip zeka gorevi tamamlandi`,
    );
  }

  async scheduleCompetitorSummaryReports() {
    const tenants = await this.prisma.tenant.findMany({
      where: { plan: { in: ['PRO', 'ENTERPRISE'] } },
      select: { id: true },
    });

    for (const tenant of tenants) {
      try {
        await this.marketIntelligenceService.generateCompetitorSummaryReport(
          tenant.id,
          7,
        );
      } catch (error) {
        this.logger.warn(
          `Rakip ozet raporu hatasi tenant=${tenant.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(`${tenants.length} tenant icin rakip ozet raporu uretildi`);
  }

  // Manuel görev oluşturma API'leri
  async scheduleMarketplaceProductSync() {
    const integrations = await this.prisma.integration.findMany({
      where: { isActive: true },
      select: { id: true, tenantId: true, platform: true },
    });

    for (const integration of integrations) {
      await this.syncQueue.add(
        'marketplace-product-sync',
        {
          integrationId: integration.id,
          tenantId: integration.tenantId,
          platform: integration.platform,
          priority: 'normal',
        },
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      );
    }

    this.logger.log(
      `${integrations.length} pazaryeri için ürün senkronizasyonu planlandı`,
    );
  }

  async scheduleSEOAnalysis() {
    const integrations = await this.prisma.integration.findMany({
      where: { isActive: true },
      select: { id: true, tenantId: true, platform: true, apiExtra: true },
    });

    for (const integration of integrations) {
      await this.syncQueue.add(
        'seo-analysis',
        {
          integrationId: integration.id,
          tenantId: integration.tenantId,
          platform: integration.platform,
          storeId:
            (integration.apiExtra as any)?.supplierId ||
            (integration.apiExtra as any)?.merchantId ||
            null,
        },
        { attempts: 2 },
      );
    }

    this.logger.log(`${integrations.length} mağaza için SEO analizi planlandı`);
  }

  async schedulePriceMonitoring() {
    const tenants = await this.prisma.tenant.findMany({
      where: { plan: { in: ['PRO', 'ENTERPRISE'] } },
      select: { id: true },
    });

    for (const tenant of tenants) {
      await this.syncQueue.add(
        'price-monitoring',
        { tenantId: tenant.id, platforms: Object.values(Platform) },
        { attempts: 2, removeOnComplete: 50 },
      );
    }

    this.logger.log(`${tenants.length} tenant için fiyat izleme planlandı`);
  }

  async runManualCompetitorAnalysis(
    tenantId: string,
    competitorUrls: Array<{ url: string; platform: Platform }>,
  ) {
    try {
      const result = await this.competitorService.analyzeMultipleCompetitors(
        competitorUrls,
        tenantId,
      );

      // Sonuçları kaydet
      await this.prisma.activityLog.create({
        data: {
          tenantId,
          action: 'competitor.analysis.manual',
          resource: 'competitor',
          details: {
            analyzedCount: result.summary.totalCompetitors,
            summary: result.summary,
          } as any,
        },
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Manual competitor analysis failed: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async createReportJob(tenantId: string, type: string, params: any) {
    const job = await this.reportsQueue.add('custom-report', {
      tenantId,
      type,
      ...params,
    });
    return { jobId: job.id, status: 'queued' };
  }

  async createSyncJob(
    tenantId: string,
    platform: string,
    type: 'inventory' | 'orders' | 'products',
  ) {
    const job = await this.syncQueue.add(`${type}-sync`, {
      tenantId,
      platform,
      manual: true,
    });
    return { jobId: job.id, status: 'queued' };
  }

  async enqueueIntegrationRetry(
    integrationId: string,
    tenantId: string,
    syncType: 'health-check' | 'order-sync' | 'inventory-sync' | 'all' = 'all',
  ) {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, tenantId, isActive: true },
      select: { id: true, tenantId: true, platform: true },
    });

    if (!integration) {
      throw new Error('Aktif entegrasyon bulunamadı');
    }

    const jobs: Array<{ name: string; id: string | number | undefined }> = [];
    const basePayload = {
      integrationId: integration.id,
      tenantId: integration.tenantId,
      platform: integration.platform,
      manual: true,
      retry: true,
    };

    const enqueue = async (name: string) => {
      const job = await this.syncQueue.add(name, basePayload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 50,
        removeOnFail: 25,
      });
      jobs.push({ name, id: job.id });
    };

    if (syncType === 'all') {
      await enqueue('health-check');
      await enqueue('order-sync');
      await enqueue('inventory-sync');
    } else {
      await enqueue(syncType);
    }

    await this.prisma.integration.update({
      where: { id: integration.id },
      data: { updatedAt: new Date() },
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        action: 'integration.sync.retry',
        resource: 'integration',
        resourceId: integrationId,
        details: { syncType, jobs },
      },
    });

    return {
      success: true,
      queued: true,
      integrationId,
      jobs,
    };
  }

  async sendScheduledEmail(
    tenantId: string,
    template: string,
    recipients: string[],
    data: any,
  ) {
    const job = await this.emailsQueue.add('send-email', {
      tenantId,
      template,
      recipients,
      data,
    });
    return { jobId: job.id, status: 'queued' };
  }

  async getQueueStats() {
    const [reports, sync, emails] = await Promise.all([
      this.reportsQueue.getJobCounts(),
      this.syncQueue.getJobCounts(),
      this.emailsQueue.getJobCounts(),
    ]);

    return {
      reports: { ...reports, name: 'Raporlar' },
      sync: { ...sync, name: 'Senkronizasyon' },
      emails: { ...emails, name: 'E-postalar' },
    };
  }

  // ==================== HEALTH CHECK ====================
  async scheduleHealthChecks() {
    const integrations = await this.prisma.integration.findMany({
      where: { isActive: true },
      select: {
        id: true,
        tenantId: true,
        platform: true,
        apiKey: true,
      },
    });

    for (const integration of integrations) {
      await this.syncQueue.add(
        'health-check',
        {
          integrationId: integration.id,
          tenantId: integration.tenantId,
          platform: integration.platform,
        },
        {
          attempts: 2,
          backoff: { type: 'fixed', delay: 5000 },
        },
      );
    }

    this.logger.log(
      `${integrations.length} entegrasyon için sağlık kontrolü planlandı`,
    );
  }
}
