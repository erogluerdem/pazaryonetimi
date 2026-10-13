import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EncryptionService } from '../../common/encryption.service';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { MarketplaceConnectionService } from '../marketplace/marketplace-connection.service';
import { IntegrationCategory } from './enums/integration-category.enum';
import { IntegrationSyncType } from './enums/integration-category.enum';
import {
  getProviderById,
  getProvidersByCategory,
  PROVIDER_CATALOG,
  type ProviderCatalogEntry,
} from './catalog/provider-catalog';
import { IntegrationAdapterRegistry } from './registry/integration-adapter.registry';
import { IntegrationSyncQueueService } from './queue/integration-sync-queue.service';
import { TenantCredentialResolverService } from './credentials/tenant-credential-resolver.service';
import { injectTenantId } from './context/tenant-aware-prisma.helper';
import {
  normalizeMarketplaceCredentials,
  resolvePlatformFromMarketplaceId,
} from '../marketplace/marketplace-connect.util';
import type { Platform } from '@pazaryonetimi/database';
import {
  OMNICHANNEL_CATALOG,
  getOmnichannelByCategory,
  type OmnichannelProviderMeta,
} from './catalog/omnichannel-catalog';
import { IntegrationJobExecutor } from './queue/integration-job.executor';
import { resolveServiceType } from './catalog/provider-service-type.map';

const INTEGRATION_CATEGORIES = new Set<IntegrationCategory>([
  IntegrationCategory.MARKETPLACE,
  IntegrationCategory.ECOMMERCE,
  IntegrationCategory.GLOBAL_MARKETPLACE,
]);

export interface UnifiedCatalogEntry extends OmnichannelProviderMeta {
  connectable: boolean;
  authType?: ProviderCatalogEntry['authType'];
  requiredFields?: ProviderCatalogEntry['requiredFields'];
  features?: ProviderCatalogEntry['features'];
  platform?: string;
}

/**
 * Birleşik entegrasyon hub servisi — connect, test, sync, catalog.
 */
@Injectable()
export class IntegrationsHubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly adapterRegistry: IntegrationAdapterRegistry,
    private readonly syncQueue: IntegrationSyncQueueService,
    private readonly credentialResolver: TenantCredentialResolverService,
    private readonly jobExecutor: IntegrationJobExecutor,
    private readonly marketplace: MarketplaceService,
    private readonly connections: MarketplaceConnectionService,
  ) {}

  /** Birleşik katalog — omnichannel + bağlantı detayları */
  getCatalog(category?: IntegrationCategory): UnifiedCatalogEntry[] {
    const omnichannel = category
      ? getOmnichannelByCategory(category)
      : OMNICHANNEL_CATALOG;

    return omnichannel.map((meta) => {
      const detail = getProviderById(meta.id);
      return {
        ...meta,
        hasAdapter: this.adapterRegistry.has(meta.id),
        connectable: Boolean(detail),
        authType: detail?.authType,
        requiredFields: detail?.requiredFields,
        features: detail?.features,
        platform: detail?.platform,
        status: detail?.status ?? meta.status,
      };
    });
  }

  /** Legacy provider catalog (bağlanabilir sağlayıcılar) */
  getConnectableCatalog(category?: IntegrationCategory) {
    if (category) {
      return getProvidersByCategory(category);
    }
    return PROVIDER_CATALOG;
  }

  /** Tenant entegrasyonları — Integration + ServiceCredential */
  async listTenantIntegrations(tenantId: string) {
    if (!tenantId) {
      throw new ForbiddenException('tenantId zorunludur');
    }

    const [integrations, serviceCreds] = await Promise.all([
      this.prisma.integration.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          platform: true,
          isActive: true,
          apiExtra: true,
          updatedAt: true,
        },
      }),
      this.prisma.serviceCredential.findMany({
        where: { tenantId, isActive: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          serviceType: true,
          label: true,
          apiExtra: true,
          updatedAt: true,
        },
      }),
    ]);

    const fromIntegrations = integrations.map((row) => {
      const extra = (row.apiExtra as Record<string, unknown>) ?? {};
      const providerId = String(extra.marketplaceId ?? row.platform.toLowerCase());
      const catalog = getProviderById(providerId);

      return {
        id: row.id,
        tenantId,
        providerId,
        providerName: catalog?.name ?? row.platform,
        category: catalog?.category ?? IntegrationCategory.MARKETPLACE,
        platform: row.platform,
        isActive: row.isActive,
        status: row.isActive ? 'connected' : 'disconnected',
        lastSyncAt: row.updatedAt.toISOString(),
        hasAdapter: this.adapterRegistry.has(providerId),
        connectionType: 'integration' as const,
      };
    });

    const fromServices = serviceCreds
      .map((row) => {
        const extra = (row.apiExtra as Record<string, unknown>) ?? {};
        const providerId = String(extra.providerId ?? '');
        if (!providerId) return null;
        const catalog = getProviderById(providerId);

        return {
          id: row.id,
          tenantId,
          providerId,
          providerName: catalog?.name ?? row.label ?? providerId,
          category: catalog?.category ?? IntegrationCategory.CARGO,
          platform: providerId,
          isActive: true,
          status: 'connected',
          lastSyncAt: row.updatedAt.toISOString(),
          hasAdapter: this.adapterRegistry.has(providerId),
          connectionType: 'service-credential' as const,
        };
      })
      .filter(Boolean);

    return [...fromIntegrations, ...fromServices];
  }

  /** Yeni entegrasyon bağlar */
  async connectProvider(
    tenantId: string,
    providerId: string,
    credentials: Record<string, unknown>,
  ) {
    const catalog = getProviderById(providerId);
    if (!catalog) {
      throw new NotFoundException(`Sağlayıcı bulunamadı: ${providerId}`);
    }

    if (INTEGRATION_CATEGORIES.has(catalog.category)) {
      return this.connectIntegration(tenantId, providerId, catalog, credentials);
    }

    return this.connectServiceCredential(tenantId, providerId, catalog, credentials);
  }

  private async connectIntegration(
    tenantId: string,
    providerId: string,
    catalog: ProviderCatalogEntry,
    credentials: Record<string, unknown>,
  ) {
    const platform =
      (catalog.platform as Platform) ??
      resolvePlatformFromMarketplaceId(providerId);
    if (!platform) {
      throw new BadRequestException(`${providerId} platform eşlemesi yok`);
    }

    const result = await this.marketplace.connectStore(tenantId, platform, credentials, providerId);
    return { ...result, integrationId: result.integration.id, providerId };
  }

  private async connectServiceCredential(
    tenantId: string,
    providerId: string,
    catalog: ProviderCatalogEntry,
    credentials: Record<string, unknown>,
  ) {
    const apiKey = String(credentials.apiKey ?? credentials.username ?? '');
    const apiSecret = String(
      credentials.apiSecret ?? credentials.password ?? credentials.clientSecret ?? '',
    );

    if (!apiKey) {
      throw new BadRequestException('En az bir kimlik bilgisi alanı zorunludur');
    }

    const serviceType = resolveServiceType(providerId, catalog.category);
    const apiExtra = {
      ...credentials,
      providerId,
      category: catalog.category,
    };

    const existing = await this.prisma.serviceCredential.findFirst({
      where: injectTenantId(tenantId, {
        serviceType: serviceType as never,
        isActive: true,
        apiExtra: { path: ['providerId'], equals: providerId },
      } as never),
    });

    const row = existing
      ? await this.prisma.serviceCredential.update({
          where: { id: existing.id },
          data: {
            apiKey: apiKey ? this.encryption.encrypt(apiKey) : null,
            apiSecret: apiSecret ? this.encryption.encrypt(apiSecret) : null,
            apiExtra: this.encryption.sealExtra(apiExtra),
            isActive: true,
          },
        })
      : await this.prisma.serviceCredential.create({
          data: {
            tenantId,
            serviceType: serviceType as never,
            label: catalog.name,
            apiKey: apiKey ? this.encryption.encrypt(apiKey) : null,
            apiSecret: apiSecret ? this.encryption.encrypt(apiSecret) : null,
            apiExtra: this.encryption.sealExtra(apiExtra),
            isActive: true,
          },
        });

    const queueResult = await this.syncQueue.enqueueSync({
      tenantId,
      integrationId: row.id,
      providerId,
      category: catalog.category,
      syncType: IntegrationSyncType.HEALTH_CHECK,
      manual: true,
    });

    return {
      success: true,
      integrationId: row.id,
      providerId,
      message: `${catalog.name} bağlandı`,
      initialSync: queueResult,
    };
  }

  async testProvider(
    tenantId: string,
    integrationId: string,
    providerId: string,
  ) {
    const credentials = await this.credentialResolver.resolveByProvider(
      tenantId,
      providerId,
      integrationId,
    );

    const category = getProviderById(providerId)?.category;
    if (category && INTEGRATION_CATEGORIES.has(category)) {
      return this.connections.test(providerId, { ...credentials.extra, apiKey: credentials.apiKey, apiSecret: credentials.apiSecret });
    }
    if (!this.adapterRegistry.has(providerId)) {
      return {
        success: true,
        message: 'Bağlantı kayıtlı (adapter testi henüz yok)',
      };
    }

    const adapter = this.adapterRegistry.get(providerId);
    return adapter.testConnection(
      {
        tenantId,
        integrationId,
        providerId,
        category: getProviderById(providerId)?.category ?? IntegrationCategory.MARKETPLACE,
      },
      credentials,
    );
  }

  async triggerSync(
    tenantId: string,
    integrationId: string,
    syncType: IntegrationSyncType = IntegrationSyncType.ALL,
    options?: { sku?: string; quantity?: number; price?: number },
  ) {
    const integration = await this.prisma.integration.findFirst({
      where: injectTenantId(tenantId, { id: integrationId, isActive: true }),
    });

    let providerId: string;
    let category: IntegrationCategory;

    if (integration) {
      const extra = (integration.apiExtra as Record<string, unknown>) ?? {};
      providerId = String(extra.marketplaceId ?? integration.platform.toLowerCase());
      category = getProviderById(providerId)?.category ?? IntegrationCategory.MARKETPLACE;
    } else {
      const service = await this.prisma.serviceCredential.findFirst({
        where: injectTenantId(tenantId, { id: integrationId, isActive: true }),
      });
      if (!service) {
        throw new NotFoundException('Entegrasyon bulunamadı');
      }
      const extra = (service.apiExtra as Record<string, unknown>) ?? {};
      providerId = String(extra.providerId ?? '');
      category =
        (extra.category as IntegrationCategory) ??
        getProviderById(providerId)?.category ??
        IntegrationCategory.CARGO;
    }

    return this.syncQueue.enqueueSync({
      tenantId,
      integrationId,
      providerId,
      category,
      syncType,
      platform: getProviderById(providerId)?.platform,
      manual: true,
      sku: options?.sku,
      quantity: options?.quantity,
      price: options?.price,
    });
  }

  getOmnichannelCatalog(category?: IntegrationCategory) {
    return this.getCatalog(category);
  }

  getQueueStatus(tenantId: string, providerId: string) {
    if (!tenantId) {
      throw new ForbiddenException('tenantId zorunludur');
    }
    return {
      tenantId,
      providerId,
      circuitState: this.jobExecutor.getCircuitState(tenantId, providerId),
      remainingQuota: this.jobExecutor.getRemainingQuota(tenantId, providerId),
      registeredAdapters: this.adapterRegistry.listRegistered(),
      adapterCount: this.adapterRegistry.count(),
    };
  }
}
