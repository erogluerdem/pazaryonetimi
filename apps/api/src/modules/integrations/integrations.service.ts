import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import type { Platform, Integration } from '@pazaryonetimi/database';
import {
  ALL_MARKETPLACES,
  MarketplaceConfig,
  getMarketplaceById,
  getMarketplacesByRegion,
  getMarketplacesByPlan,
  canAccessMarketplace,
  getActiveMarketplaces,
  PlatformRegion,
  SubscriptionPlan,
  REGION_NAMES,
  CATEGORY_NAMES,
  PLAN_NAMES,
} from './marketplace-registry';
import { EncryptionService } from '../../common/encryption.service';
import { MarketplaceConnectionService } from '../marketplace/marketplace-connection.service';
import {
  hasAmazonSpApiCredentials,
  parseAmazonSpApiCredentials,
} from '../marketplace/amazon-sp-api.config';
import { AmazonSpApiClient } from '../marketplace/amazon-sp-api.client';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { getHepsiburadaListingApiBase } from '../marketplace/marketplace-sync.constants';

export interface IntegrationCredentials {
  [key: string]: string;
}

export interface UserIntegration {
  id: string;
  tenantId: string;
  marketplaceId: string;
  marketplace: MarketplaceConfig;
  credentials: IntegrationCredentials;
  isActive: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

// Platform enum değerlerine marketplaceId eşleştirmesi
const PLATFORM_MAP: Record<string, Platform> = {
  trendyol: 'TRENDYOL',
  hepsiburada: 'HEPSIBURADA',
  n11: 'N11',
  ciceksepeti: 'CICEKSEPETI',
  gittigidiyor: 'GITTIGIDIYOR',
  pttavm: 'PTTAVM',
  morhipo: 'MORHIPO',
  'amazon-tr': 'AMAZON',
  'amazon-us': 'AMAZON_US',
  'amazon-de': 'AMAZON_DE',
  'amazon-uk': 'AMAZON_UK',
  'amazon-fr': 'AMAZON_FR',
  'ebay-us': 'EBAY',
  'ebay-uk': 'EBAY',
  'ebay-de': 'EBAY',
  aliexpress: 'ALIEXPRESS',
  alibaba: 'ALIBABA',
  'shopee-sg': 'SHOPEE',
  'lazada-sg': 'LAZADA',
  'rakuten-jp': 'RAKUTEN',
  zalando: 'ZALANDO',
  allegro: 'ALLEGRO',
  'bol-com': 'BOL',
  cdiscount: 'CDISCOUNT',
  otto: 'OTTO',
  'mercadolibre-mx': 'MERCADOLIBRE',
  'mercadolibre-br': 'MERCADOLIBRE',
  'walmart-us': 'WALMART',
  walmart: 'WALMART',
  etsy: 'ETSY',
  wayfair: 'WAYFAIR',
  coupang: 'COUPANG',
  shopify: 'SHOPIFY',
  woocommerce: 'WOOCOMMERCE',
};

const SUPPORTED_PLATFORMS = Object.keys(PLATFORM_MAP);

function getPlatformEnum(marketplaceId: string): Platform | null {
  return PLATFORM_MAP[marketplaceId] || null;
}

function getMarketplaceIdFromPlatform(
  platform: Platform,
  apiExtra?: any,
): string {
  // apiExtra içinde marketplaceId varsa kullan
  if (apiExtra && typeof apiExtra === 'object' && 'marketplaceId' in apiExtra) {
    return apiExtra.marketplaceId as string;
  }
  // Varsayılan eşleştirme
  const platformMap: Partial<Record<Platform, string>> = {
    TRENDYOL: 'trendyol',
    HEPSIBURADA: 'hepsiburada',
    AMAZON: 'amazon-tr',
    N11: 'n11',
    CICEKSEPETI: 'ciceksepeti',
    GITTIGIDIYOR: 'gittigidiyor',
    PTTAVM: 'pttavm',
    MORHIPO: 'morhipo',
    AMAZON_US: 'amazon-us',
    AMAZON_UK: 'amazon-uk',
    AMAZON_DE: 'amazon-de',
    AMAZON_FR: 'amazon-fr',
    EBAY: 'ebay',
    ETSY: 'etsy',
    ALIEXPRESS: 'aliexpress',
    SHOPEE: 'shopee',
    LAZADA: 'lazada',
    WALMART: 'walmart',
    SHOPIFY: 'shopify',
    WOOCOMMERCE: 'woocommerce',
    WEBSITE: 'website',
    OTHER: 'other',
  };
  return platformMap[platform] || platform.toLowerCase();
}

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private marketplaceService: MarketplaceService,
    private connections: MarketplaceConnectionService,
    @Optional() @InjectQueue('sync') private readonly syncQueue?: Queue,
  ) {}

  private encrypt(text: string): string {
    return this.encryption.encrypt(text);
  }

  private decrypt(encryptedText: string): string {
    return this.encryption.decrypt(encryptedText);
  }

  // Tüm pazaryerlerini listele
  async getAllMarketplaces(
    tenantId: string,
    filters?: {
      region?: PlatformRegion;
      category?: string;
      status?: string;
      search?: string;
    },
  ): Promise<{
    marketplaces: (MarketplaceConfig & { userIntegration?: UserIntegration })[];
    regions: typeof REGION_NAMES;
    categories: typeof CATEGORY_NAMES;
  }> {
    // Kullanıcının mevcut entegrasyonlarını al
    const userIntegrations = tenantId
      ? await this.prisma.integration.findMany({
          where: { tenantId },
        })
      : [];

    let marketplaces = getActiveMarketplaces();

    // Filtreleme
    if (filters?.region) {
      marketplaces = marketplaces.filter((m) => m.region === filters.region);
    }
    if (filters?.category) {
      marketplaces = marketplaces.filter(
        (m) => m.category === filters.category,
      );
    }
    if (filters?.status) {
      marketplaces = marketplaces.filter((m) => m.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      marketplaces = marketplaces.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.country.toLowerCase().includes(search) ||
          m.description.toLowerCase().includes(search),
      );
    }

    // Kullanıcı entegrasyonlarını eşleştir
    const marketplacesWithIntegration = marketplaces.map((marketplace) => {
      // Platform enum veya marketplaceId ile eşleştir
      const integration = userIntegrations.find((i) => {
        const integrationMarketplaceId = getMarketplaceIdFromPlatform(
          i.platform,
          i.apiExtra,
        );
        return integrationMarketplaceId === marketplace.id;
      });

      if (integration) {
        return {
          ...marketplace,
          userIntegration: {
            id: integration.id,
            tenantId: integration.tenantId,
            marketplaceId: marketplace.id,
            marketplace,
            credentials: {}, // Güvenlik için credentials gizli
            isActive: integration.isActive,
            status: !integration.isActive ? 'disconnected' : (integration.apiExtra as any)?.connectionStatus === 'verified' ? 'connected' : 'pending',
            lastSync: (integration.apiExtra as any)?.lastSuccessfulSyncAt ? new Date((integration.apiExtra as any).lastSuccessfulSyncAt) : undefined,
            createdAt: integration.createdAt,
            updatedAt: integration.updatedAt,
          } as UserIntegration,
        };
      }
      return marketplace;
    });

    // Popülerliğe göre sırala
    marketplacesWithIntegration.sort((a, b) => b.popularity - a.popularity);

    return {
      marketplaces: marketplacesWithIntegration,
      regions: REGION_NAMES,
      categories: CATEGORY_NAMES,
    };
  }

  // Kullanıcının entegrasyonlarını listele
  async getUserIntegrations(tenantId: string): Promise<UserIntegration[]> {
    if (!tenantId) return [];
    const integrations = await this.prisma.integration.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return integrations
      .map((integration) => {
        const marketplaceId = getMarketplaceIdFromPlatform(
          integration.platform,
          integration.apiExtra,
        );
        const marketplace = getMarketplaceById(marketplaceId);
        return {
          id: integration.id,
          tenantId: integration.tenantId,
          marketplaceId,
          marketplace: marketplace!,
          credentials: {}, // Güvenlik için boş
          isActive: integration.isActive,
          status: !integration.isActive ? 'disconnected' : (integration.apiExtra as any)?.connectionStatus === 'verified' ? 'connected' : 'pending',
          lastSync: (integration.apiExtra as any)?.lastSuccessfulSyncAt ? new Date((integration.apiExtra as any).lastSuccessfulSyncAt) : undefined,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt,
        } as UserIntegration;
      })
      .filter((i) => i.marketplace);
  }

  // Pazaryeri detayını getir
  async getMarketplaceDetails(
    marketplaceId: string,
    tenantId?: string,
  ): Promise<MarketplaceConfig & { userIntegration?: UserIntegration }> {
    const marketplace = getMarketplaceById(marketplaceId);
    if (!marketplace) {
      throw new NotFoundException('Pazaryeri bulunamadı');
    }

    if (tenantId) {
      // Platform enum'unu al
      const platformEnum = getPlatformEnum(marketplaceId);
      if (platformEnum) {
        const integration = await this.prisma.integration.findFirst({
          where: { tenantId, platform: platformEnum },
        });

        if (integration) {
          // apiExtra'da doğru marketplaceId var mı kontrol et
          const integrationMarketplaceId = getMarketplaceIdFromPlatform(
            integration.platform,
            integration.apiExtra,
          );
          if (integrationMarketplaceId === marketplaceId) {
            return {
              ...marketplace,
              userIntegration: {
                id: integration.id,
                tenantId: integration.tenantId,
                marketplaceId,
                marketplace,
                credentials: {},
                isActive: integration.isActive,
                status: !integration.isActive ? 'disconnected' : (integration.apiExtra as any)?.connectionStatus === 'verified' ? 'connected' : 'pending',
                lastSync: (integration.apiExtra as any)?.lastSuccessfulSyncAt ? new Date((integration.apiExtra as any).lastSuccessfulSyncAt) : undefined,
                createdAt: integration.createdAt,
                updatedAt: integration.updatedAt,
              } as UserIntegration,
            };
          }
        }
      }
    }

    return marketplace;
  }

  // Entegrasyon oluştur/bağlan
  async connectMarketplace(
    tenantId: string,
    marketplaceId: string,
    credentials: IntegrationCredentials,
  ): Promise<{
    success: boolean;
    integration: UserIntegration;
    message: string;
  }> {
    const marketplace = getMarketplaceById(marketplaceId);
    if (!marketplace) {
      throw new NotFoundException('Pazaryeri bulunamadı');
    }

    // Kullanıcının planını kontrol et (şimdilik PROFESSIONAL varsayıyoruz)
    const userPlan: SubscriptionPlan = 'PROFESSIONAL';
    if (!canAccessMarketplace(marketplace, userPlan)) {
      throw new BadRequestException(
        `Bu pazaryerine erişmek için ${PLAN_NAMES[marketplace.minimumPlan]} planına sahip olmanız gerekiyor.`,
      );
    }

    // Zorunlu alanları kontrol et
    for (const field of marketplace.requiredFields) {
      if (field.required && !credentials[field.key]) {
        throw new BadRequestException(`${field.label} alanı zorunludur`);
      }
    }

    // Platform enum'unu kontrol et
    const platformEnum = getPlatformEnum(marketplaceId);
    if (!platformEnum) {
      throw new BadRequestException(
        `Bu pazaryeri henüz desteklenmiyor: ${marketplace.name}. Yakında eklenecek!`,
      );
    }

    const result = await this.marketplaceService.connectStore(tenantId, platformEnum, credentials, marketplaceId);
    const row = await this.prisma.integration.findFirst({ where: { id: result.integration.id, tenantId } });
    return { success: true, message: result.message, integration: { id: row!.id, tenantId, marketplaceId, marketplace, credentials: {}, isActive: row!.isActive, status: result.connectionStatus === 'verified' ? 'connected' : 'pending', createdAt: row!.createdAt, updatedAt: row!.updatedAt } as UserIntegration };
  }

  // Bağlantıyı test et
  async testConnection(
    integrationId: string,
    tenantId: string,
  ): Promise<ConnectionTestResult> {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, tenantId },
    });

    if (!integration) {
      throw new NotFoundException('Entegrasyon bulunamadı');
    }

    const marketplaceId = getMarketplaceIdFromPlatform(
      integration.platform,
      integration.apiExtra,
    );
    const marketplace = getMarketplaceById(marketplaceId);
    if (!marketplace) {
      return { success: false, message: 'Pazaryeri yapılandırması bulunamadı' };
    }

    const extra = this.encryption.openExtra(integration.apiExtra);
    return this.connections.test(marketplaceId, { ...extra, apiKey: this.decrypt(integration.apiKey), apiSecret: this.decrypt(integration.apiSecret) });
  }

  // Entegrasyonu devre dışı bırak
  async disconnectMarketplace(
    tenantId: string,
    marketplaceId: string,
  ): Promise<{ success: boolean; message: string }> {
    const platformEnum = getPlatformEnum(marketplaceId);
    if (!platformEnum) {
      throw new BadRequestException('Desteklenmeyen pazaryeri');
    }

    const integration = await this.prisma.integration.findFirst({
      where: { tenantId, platform: platformEnum },
    });

    if (!integration) {
      throw new NotFoundException('Entegrasyon bulunamadı');
    }

    await this.prisma.integration.update({
      where: { id: integration.id },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Entegrasyon başarıyla devre dışı bırakıldı',
    };
  }

  // Entegrasyonu tamamen sil
  async deleteIntegration(
    tenantId: string,
    marketplaceId: string,
  ): Promise<{ success: boolean; message: string }> {
    const platformEnum = getPlatformEnum(marketplaceId);
    if (!platformEnum) {
      throw new BadRequestException('Desteklenmeyen pazaryeri');
    }

    const integration = await this.prisma.integration.findFirst({
      where: { tenantId, platform: platformEnum },
    });

    if (!integration) {
      throw new NotFoundException('Entegrasyon bulunamadı');
    }

    await this.prisma.integration.delete({
      where: { id: integration.id },
    });

    return { success: true, message: 'Entegrasyon başarıyla silindi' };
  }

  // Senkronizasyon başlat
  async syncMarketplace(
    tenantId: string,
    marketplaceId: string,
    syncType: 'products' | 'orders' | 'inventory' | 'all',
  ): Promise<{
    success: boolean;
    message: string;
    jobId?: string;
    integrationId?: string;
    result?: unknown;
  }> {
    const platformEnum = getPlatformEnum(marketplaceId);
    if (!platformEnum) {
      throw new BadRequestException('Desteklenmeyen pazaryeri');
    }

    const integration = await this.prisma.integration.findFirst({
      where: { tenantId, platform: platformEnum, isActive: true },
    });

    if (!integration) {
      throw new NotFoundException('Aktif entegrasyon bulunamadı');
    }

    const mappedSyncType =
      syncType === 'inventory' ? 'products' : syncType;

    const result = await this.marketplaceService.syncIntegrationByStoreId(
      tenantId,
      integration.id,
      mappedSyncType,
    );

    return {
      success: true,
      message: `${syncType} senkronizasyonu tamamlandı`,
      integrationId: integration.id,
      result,
    };
  }

  async retryIntegrationSync(
    tenantId: string,
    integrationId: string,
    syncType: 'health-check' | 'order-sync' | 'inventory-sync' | 'all' = 'all',
  ) {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, tenantId, isActive: true },
      select: { id: true, tenantId: true, platform: true },
    });

    if (!integration) {
      throw new NotFoundException('Aktif entegrasyon bulunamadı');
    }

    const jobs: Array<{ name: string; id?: string | number }> = [];
    const basePayload = {
      integrationId: integration.id,
      tenantId: integration.tenantId,
      platform: integration.platform,
      manual: true,
      retry: true,
    };

    const jobTypes =
      syncType === 'all'
        ? (['health-check', 'order-sync', 'inventory-sync'] as const)
        : ([syncType] as const);

    if (this.syncQueue) {
      for (const name of jobTypes) {
        const job = await this.syncQueue.add(name, basePayload, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 50,
          removeOnFail: 25,
        });
        jobs.push({ name, id: job.id });
      }
    }

    let directResult: Record<string, unknown> | null = null;
    if (jobs.length === 0) {
      const mappedType =
        syncType === 'order-sync'
          ? 'orders'
          : syncType === 'inventory-sync'
            ? 'products'
            : 'all';
      directResult = (await this.marketplaceService.syncIntegrationByStoreId(
        tenantId,
        integration.id,
        mappedType,
      )) as Record<string, unknown>;
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
        details: {
          syncType,
          jobs,
          queued: jobs.length > 0,
          direct: directResult !== null,
        },
      },
    });

    return {
      success: true,
      queued: jobs.length > 0,
      message: jobs.length > 0
        ? 'Senkronizasyon kuyruğa eklendi'
        : 'Senkronizasyon doğrudan çalıştırıldı',
      integrationId,
      jobs,
      result: directResult,
    };
  }

  // Bölgeye göre pazaryerlerini getir
  async getMarketplacesByRegion(
    region: PlatformRegion,
  ): Promise<MarketplaceConfig[]> {
    return getMarketplacesByRegion(region);
  }

  // Plana göre erişilebilir pazaryerlerini getir
  async getAccessibleMarketplaces(
    plan: SubscriptionPlan,
  ): Promise<MarketplaceConfig[]> {
    return getMarketplacesByPlan(plan);
  }

  // İstatistikler
  async getIntegrationStats(tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRegion: Record<string, number>;
  }> {
    if (!tenantId) return { total: 0, active: 0, inactive: 0, byRegion: {} };
    const integrations = await this.prisma.integration.findMany({
      where: { tenantId },
    });

    const byRegion: Record<string, number> = {};
    let active = 0;
    let inactive = 0;

    for (const integration of integrations) {
      const marketplace = getMarketplaceById(integration.platform);
      if (marketplace) {
        byRegion[marketplace.region] = (byRegion[marketplace.region] || 0) + 1;
        if (integration.isActive) {
          active++;
        } else {
          inactive++;
        }
      }
    }

    return {
      total: integrations.length,
      active,
      inactive,
      byRegion,
    };
  }
}
