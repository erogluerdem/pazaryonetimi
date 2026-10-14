import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
  Inject,
  forwardRef,
  Optional,
  Scope,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ScrapingService } from '../scraping/scraping.service';
import { OrdersService } from '../orders/orders.service';
import { TrendyolBridge } from './trendyol.bridge';
import { AmazonBridge } from './amazon.bridge';
import { HepsiburadaBridge } from './hepsiburada.bridge';
import { N11Bridge } from './n11.bridge';
import { CicekSepetiBridge } from './ciceksepeti.bridge';
import { Platform as PrismaPlatform, Prisma } from '@pazaryonetimi/database';
import { EncryptionService } from '../../common/encryption.service';
import { publicCredentialMetadata } from './credential-metadata';
import { MarketplaceConnectionService } from './marketplace-connection.service';
import { EbayBridge } from './ebay.bridge';
import { AlibabaBridge } from './alibaba.bridge';
import { AliexpressBridge } from './aliexpress.bridge';
import { WalmartBridge } from './walmart.bridge';
import { EtsyBridge } from './etsy.bridge';
import { ShopeeBridge } from './shopee.bridge';
import { MercadoLibreBridge } from './mercadolibre.bridge';
import { RakutenBridge } from './rakuten.bridge';
import { WayfairBridge } from './wayfair.bridge';
import { ZalandoBridge } from './zalando.bridge';
import { LazadaBridge } from './lazada.bridge';
import { CoupangBridge } from './coupang.bridge';
import { OttoBridge } from './otto.bridge';
import { AllegroBridge } from './allegro.bridge';
import { CdiscountBridge } from './cdiscount.bridge';
import { BolBridge } from './bol.bridge';
import { ShopifyBridge } from './shopify.bridge';
import { WooCommerceBridge } from './woocommerce.bridge';
import { PttAvmBridge } from './pttavm.bridge';
import { MorhipoBridge } from './morhipo.bridge';
import { GittigidiyorBridge } from './gittigidiyor.bridge';
import {
  MARKETPLACE_ID_TO_PLATFORM,
  normalizeMarketplaceCredentials,
  resolveIntegrationCategoryFromPlatform,
  resolvePlatformFromMarketplaceId,
  resolveProviderIdFromIntegration,
} from './marketplace-connect.util';
import { IntegrationSyncQueueService } from '../integrations-core/queue/integration-sync-queue.service';
import { IntegrationSyncType } from '../integrations-core/enums/integration-category.enum';
import { IntegrationCategory } from '../integrations-core/enums/integration-category.enum';
import {
  MarketplaceAnalysisResponse,
  computeConfidenceFromSources,
} from './analysis.types';
import {
  getOrderSyncSkipMessage,
  supportsOrderSync,
} from './marketplace-capabilities';
import { hasAmazonSpApiCredentials } from './amazon-sp-api.config';
import { Integration } from '@pazaryonetimi/database';

export interface MarketplaceReview {
  externalId: string;
  productId?: string;
  productName: string;
  customerName: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  reviewDate: Date;
  helpful?: number;
  verified?: boolean;
}

export interface MarketplaceBridge {
  syncProducts(): Promise<any>;
  syncOrders(): Promise<any>;
  updateStock(sku: string, stock: number): Promise<any>;
  updatePrice(sku: string, price: number): Promise<any>;
  getReviews?(page?: number, size?: number): Promise<MarketplaceReview[]>;
}

export enum Platform {
  TRENDYOL = 'TRENDYOL',
  AMAZON = 'AMAZON',
  HEPSIBURADA = 'HEPSIBURADA',
  N11 = 'N11',
  CICEKSEPETI = 'CICEKSEPETI',
  EBAY = 'EBAY',
  ALIBABA = 'ALIBABA',
  ALIEXPRESS = 'ALIEXPRESS',
  WALMART = 'WALMART',
  ETSY = 'ETSY',
  SHOPEE = 'SHOPEE',
  MERCADOLIBRE = 'MERCADOLIBRE',
  RAKUTEN = 'RAKUTEN',
  WAYFAIR = 'WAYFAIR',
  ZALANDO = 'ZALANDO',
  LAZADA = 'LAZADA',
  COUPANG = 'COUPANG',
  OTTO = 'OTTO',
  ALLEGRO = 'ALLEGRO',
  CDISCOUNT = 'CDISCOUNT',
  BOL = 'BOL',
  GENERIC = 'GENERIC',
}

@Injectable({ scope: Scope.REQUEST })
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private scrapingService: ScrapingService,
    private encryption: EncryptionService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    private readonly connections: MarketplaceConnectionService,
    @Optional()
    @Inject(forwardRef(() => IntegrationSyncQueueService))
    private readonly integrationSyncQueue?: IntegrationSyncQueueService,
  ) {}

  async getBridgeForTenant(
    tenantId: string,
    platform: Platform,
    integrationId?: string,
  ): Promise<MarketplaceBridge> {
    const integration = integrationId
      ? await this.prisma.integration.findFirst({
          where: { id: integrationId, tenantId, isActive: true },
        })
      : await this.prisma.integration.findFirst({
          where: { tenantId, platform: platform as any, isActive: true },
        });

    if (!integration) {
      throw new Error(
        `${platform} entegrasyonu bu mağaza için bulunamadı veya pasif.`,
      );
    }

    return this.getBridgeForIntegration(integration);
  }

  private getBridgeForIntegration(integration: Integration): MarketplaceBridge {
    integration = { ...integration, apiExtra: this.encryption.openExtra(integration.apiExtra) };
    const platform = integration.platform as unknown as Platform;
    const apiKey = this.encryption.decrypt(integration.apiKey);
    const apiSecret = this.encryption.decrypt(integration.apiSecret);

    switch (platform) {
      case Platform.TRENDYOL:
        const extra = integration.apiExtra as any;
        return new TrendyolBridge(
          apiKey,
          apiSecret,
          extra?.supplierId || '',
          this.scrapingService,
          extra?.isTestMode === true || extra?.isTestMode === 'true',
        );
      case Platform.AMAZON:
        return new AmazonBridge(
          apiKey,
          apiSecret,
          this.scrapingService,
          (integration.apiExtra as Record<string, unknown>) ?? {},
        );
      case Platform.HEPSIBURADA:
        return new HepsiburadaBridge(
          apiKey,
          (integration.apiExtra as any)?.merchantId || '',
          this.scrapingService,
          apiSecret,
          integration.apiExtra as any,
        );
      case Platform.N11:
        return new N11Bridge(apiKey, apiSecret, this.scrapingService);
      case Platform.CICEKSEPETI:
        return new CicekSepetiBridge(apiKey, apiSecret, this.scrapingService, (integration.apiExtra as any)?.isTestMode === true);
      case Platform.EBAY:
        const ebayExtra = integration.apiExtra as any;
        return new EbayBridge(
          apiKey,
          apiSecret,
          ebayExtra?.devId || '',
          ebayExtra?.authToken || '',
          this.scrapingService,
          ebayExtra?.isTestMode === true || ebayExtra?.isTestMode === 'true',
        );
      case Platform.ALIBABA:
        const alibabaExtra = integration.apiExtra as any;
        return new AlibabaBridge(
          apiKey,
          apiSecret,
          alibabaExtra?.accessToken || '',
          this.scrapingService,
        );
      case Platform.ALIEXPRESS:
        const aliExtra = integration.apiExtra as any;
        return new AliexpressBridge(
          apiKey,
          apiSecret,
          aliExtra?.accessToken || '',
          this.scrapingService,
        );
      case Platform.WALMART:
        const walmartExtra = integration.apiExtra as any;
        return new WalmartBridge(
          apiKey,
          apiSecret,
          this.scrapingService,
          !!walmartExtra?.isSandbox,
        );
      case Platform.ETSY:
        const etsyExtra = integration.apiExtra as any;
        return new EtsyBridge(
          apiKey,
          apiSecret,
          etsyExtra?.accessToken || '',
          this.scrapingService,
        );
      case Platform.SHOPEE:
        const shopeeExtra = integration.apiExtra as any;
        return new ShopeeBridge(
          apiKey,
          apiSecret,
          shopeeExtra?.shopId || '',
          shopeeExtra?.accessToken || '',
          this.scrapingService,
          !!shopeeExtra?.isSandbox,
        );
      case Platform.MERCADOLIBRE:
        const mlExtra = integration.apiExtra as any;
        return new MercadoLibreBridge(
          apiKey,
          apiSecret,
          mlExtra?.accessToken || '',
          mlExtra?.siteId || 'MLM',
          this.scrapingService,
        );
      case Platform.RAKUTEN:
        const rakutenExtra = integration.apiExtra as any;
        return new RakutenBridge(
          apiKey,
          apiSecret,
          rakutenExtra?.applicationId || '',
          this.scrapingService,
        );
      case Platform.WAYFAIR:
        return new WayfairBridge(
          apiKey,
          apiSecret,
          (integration.apiExtra as any)?.supplierId || '',
          this.scrapingService,
        );
      case Platform.ZALANDO:
        return new ZalandoBridge(
          apiKey,
          (integration.apiExtra as any)?.partnerId || '',
          this.scrapingService,
        );
      case Platform.LAZADA:
        const lazadaExtra = integration.apiExtra as any;
        return new LazadaBridge(
          apiKey,
          apiSecret,
          lazadaExtra?.accessToken || '',
          this.scrapingService,
          lazadaExtra?.countryCode || 'MY',
        );
      case Platform.COUPANG:
        return new CoupangBridge(
          apiKey,
          apiSecret,
          (integration.apiExtra as any)?.vendorId || '',
          this.scrapingService,
        );
      case Platform.OTTO:
        return new OttoBridge(
          apiKey,
          apiSecret,
          (integration.apiExtra as any)?.partnerId || '',
          this.scrapingService,
        );
      case Platform.ALLEGRO:
        const allegroExtra = integration.apiExtra as any;
        return new AllegroBridge(
          apiKey,
          apiSecret,
          allegroExtra?.accessToken || '',
          this.scrapingService,
        );
      case Platform.CDISCOUNT:
        const cdiscountExtra = integration.apiExtra as any;
        return new CdiscountBridge(
          apiKey,
          apiSecret,
          cdiscountExtra?.token || '',
          this.scrapingService,
        );
      case Platform.BOL:
        return new BolBridge(
          apiKey,
          apiSecret,
          this.scrapingService,
          (integration.apiExtra as any)?.isProduction || false,
        );
      case 'SHOPIFY' as Platform:
        return new ShopifyBridge(
          (integration.apiExtra as any)?.shopDomain || apiKey,
          (integration.apiExtra as any)?.accessToken || apiSecret,
        );
      case 'WOOCOMMERCE' as Platform:
        return new WooCommerceBridge(
          (integration.apiExtra as any)?.siteUrl || '',
          apiKey,
          apiSecret,
        );
      case 'PTTAVM' as Platform:
        return new PttAvmBridge(
          apiKey,
          (integration.apiExtra as any)?.shopId || apiSecret,
          this.scrapingService,
        );
      case 'MORHIPO' as Platform:
        return new MorhipoBridge(
          (integration.apiExtra as any)?.vendorId || apiKey,
          apiKey,
          this.scrapingService,
        );
      case 'GITTIGIDIYOR' as Platform:
        return new GittigidiyorBridge(
          apiKey,
          apiSecret,
          this.scrapingService,
        );
      case 'AMAZON_US' as Platform:
      case 'AMAZON_UK' as Platform:
      case 'AMAZON_DE' as Platform:
      case 'AMAZON_FR' as Platform:
        return new AmazonBridge(
          apiKey,
          apiSecret,
          this.scrapingService,
          (integration.apiExtra as Record<string, unknown>) ?? {},
        );
      default:
        throw new Error(`Desteklenmeyen platform: ${platform}`);
    }
  }

  async syncAllPlatformsForTenant(tenantId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { tenantId, isActive: true },
    });

    const results: any[] = [];
    for (const integration of integrations) {
      try {
        const res = await this.syncProductsForTenant(
          tenantId,
          integration.platform as unknown as Platform,
        );
        results.push({
          integrationId: integration.id,
          ...res,
        });
      } catch (error) {
        results.push({
          platform: integration.platform,
          integrationId: integration.id,
          success: false,
          error: (error as Error).message,
        });
      }
    }
    return results;
  }

  async syncAllOrdersForTenant(tenantId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { tenantId, isActive: true },
    });

    const results: any[] = [];
    for (const integration of integrations) {
      const platform = integration.platform as unknown as Platform;
      const apiKey = this.encryption.decrypt(integration.apiKey);
      const apiSecret = this.encryption.decrypt(integration.apiSecret);
      const spApiReady =
        String(platform).startsWith('AMAZON')
          ? hasAmazonSpApiCredentials({
              apiKey,
              apiSecret,
              apiExtra: this.encryption.openExtra(integration.apiExtra),
            })
          : undefined;

      if (!supportsOrderSync(platform, { spApiReady })) {
        results.push({
          integrationId: integration.id,
          platform: integration.platform,
          success: true,
          skipped: true,
          message: getOrderSyncSkipMessage(platform),
          total: 0,
          created: 0,
          updated: 0,
          failed: 0,
        });
        continue;
      }

      try {
        const res = await this.syncPlatformOrdersForTenant(
          tenantId,
          platform,
          integration.id,
        );
        results.push({
          integrationId: integration.id,
          ...res,
        });
      } catch (error) {
        results.push({
          platform: integration.platform,
          integrationId: integration.id,
          success: false,
          error: (error as Error).message,
        });
      }
    }
    return results;
  }

  async syncProductsForTenant(
    tenantId: string,
    platform: Platform,
    integrationId?: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId zorunludur');
    }

    const targetIntegration = integrationId
      ? await this.prisma.integration.findFirst({ where: { id: integrationId, tenantId } })
      : await this.prisma.integration.findFirst({ where: { tenantId, platform: platform as unknown as PrismaPlatform, isActive: true } });

    const startedAt = new Date();
    const lastSyncAttemptAt = startedAt.toISOString();

    if (targetIntegration) {
      try {
        const extra = this.encryption.openExtra(targetIntegration.apiExtra);
        extra.lastSyncAttemptAt = lastSyncAttemptAt;
        extra.lastSyncStatus = 'in_progress';
        await this.prisma.integration.update({
          where: { id: targetIntegration.id },
          data: { apiExtra: this.encryption.sealExtra(extra), updatedAt: startedAt },
        });
      } catch {}
    }

    try {
      const bridge = await this.getBridgeForTenant(
        tenantId,
        platform,
        integrationId,
      );
      const raw = await bridge.syncProducts();

      if (raw && raw.success === false) {
        throw new BadRequestException(
          raw.error || `${platform} ürün senkronizasyonu başarısız`,
        );
      }

      const products = this.extractProducts(raw);
      let created = 0;
      let updated = 0;
      let failed = 0;

      for (const source of products) {
        try {
          const normalized = this.normalizeProductForPersistence(
            tenantId,
            platform,
            source,
          );
          const outcome = await this.persistMarketplaceProduct(normalized);
          if (outcome === 'created') {
            created += 1;
          } else {
            updated += 1;
          }
        } catch (error) {
          failed += 1;
          this.logger.warn(
            `Product sync failed for platform=${platform}: ${(error as Error).message}`,
          );
        }
      }

      const completedAt = new Date();

      if (targetIntegration) {
        try {
          const extra = this.encryption.openExtra(targetIntegration.apiExtra);
          extra.lastSyncAttemptAt = lastSyncAttemptAt;
          if (!failed) extra.lastSuccessfulSyncAt = completedAt.toISOString();
          extra.lastSyncStatus = failed ? 'failed' : 'success';
          extra.lastSyncError = failed ? String(failed) + ' ürün aktarılamadı' : null;
          extra.productsAdded = created;
          extra.productsUpdated = updated;
          extra.productsFailed = failed;
          await this.prisma.integration.update({
            where: { id: targetIntegration.id },
            data: { apiExtra: this.encryption.sealExtra(extra), updatedAt: completedAt },
          });

          await this.prisma.integrationSyncLog.create({
            data: {
              integrationId: targetIntegration.id,
              syncType: 'PRODUCT',
              status: 'SUCCESS',
              recordsSynced: created + updated,
              errorMessage: failed > 0 ? `${failed} ürün aktarılamadı` : null,
              startedAt,
              completedAt,
            },
          });
        } catch (logErr) {
          this.logger.warn(`Telemetry update error: ${(logErr as Error).message}`);
        }
      }

      await this.prisma.activityLog.create({
        data: {
          tenantId,
          action: 'marketplace.products.sync',
          resource: 'product',
          details: {
            platform,
            total: products.length,
            created,
            updated,
            failed,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        platform,
        total: products.length,
        created,
        updated,
        failed,
      };
    } catch (syncError) {
      const completedAt = new Date();
      const errorMessage = (syncError as Error).message || `${platform} ürün senkronizasyonu başarısız`;

      if (targetIntegration) {
        try {
          const extra = this.encryption.openExtra(targetIntegration.apiExtra);
          extra.lastSyncAttemptAt = lastSyncAttemptAt;
          extra.lastSyncStatus = 'failed';
          extra.lastSyncError = errorMessage;
          if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.toLowerCase().includes('unauthorized')) {
            extra.connectionStatus = 'verification_failed';
            extra.lastVerificationError = errorMessage;
          }
          await this.prisma.integration.update({
            where: { id: targetIntegration.id },
            data: { apiExtra: this.encryption.sealExtra(extra), updatedAt: completedAt },
          });

          await this.prisma.integrationSyncLog.create({
            data: {
              integrationId: targetIntegration.id,
              syncType: 'PRODUCT',
              status: 'FAILED',
              recordsSynced: 0,
              errorMessage,
              startedAt,
              completedAt,
            },
          });
        } catch {}
      }

      throw syncError;
    }
  }

  async syncIntegrationByStoreId(
    tenantId: string,
    storeId: string,
    syncType: string = 'all',
  ) {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId ve storeId zorunludur');
    }

    const integration = await this.prisma.integration.findFirst({
      where: {
        id: storeId,
        tenantId,
        isActive: true,
      },
    });

    if (!integration) {
      throw new NotFoundException('Aktif mağaza entegrasyonu bulunamadı');
    }

    if (!['all', 'products', 'orders'].includes(syncType)) throw new BadRequestException('Senkronizasyon türü geçersiz');
    const metadata = this.encryption.openExtra(integration.apiExtra);
    if (metadata.connectionStatus !== 'verified') {
      const verified = await this.connections.test(metadata.marketplaceId || integration.platform.toLowerCase(), { ...metadata, apiKey: this.encryption.decrypt(integration.apiKey), apiSecret: this.encryption.decrypt(integration.apiSecret) });
      if (!verified.success) throw new UnprocessableEntityException(verified.message);
      metadata.connectionStatus = 'verified'; metadata.lastVerifiedAt = verified.verifiedAt;
      await this.prisma.integration.update({ where: { id: integration.id }, data: { apiExtra: this.encryption.sealExtra(metadata) } });
    }
    const platform = integration.platform as unknown as Platform;
    const productResult = syncType === 'orders' ? null : await this.syncProductsForTenant(tenantId, platform, integration.id);

    let orderResult: Record<string, unknown> | null = null;
    if (syncType === 'all' || syncType === 'orders') {
      const apiKey = this.encryption.decrypt(integration.apiKey);
      const apiSecret = this.encryption.decrypt(integration.apiSecret);
      const spApiReady =
        String(platform).startsWith('AMAZON')
          ? hasAmazonSpApiCredentials({
              apiKey,
              apiSecret,
              apiExtra: this.encryption.openExtra(integration.apiExtra),
            })
          : undefined;

      if (!supportsOrderSync(platform, { spApiReady })) {
        orderResult = {
          success: true,
          skipped: true,
          message: getOrderSyncSkipMessage(platform),
          total: 0,
          created: 0,
          updated: 0,
          failed: 0,
        };
      } else {
        try {
          orderResult = await this.syncPlatformOrdersForTenant(
            tenantId,
            platform,
            integration.id,
          );
        } catch (error) {
          orderResult = {
            success: false,
            error: (error as Error).message,
          };
        }
      }
    }

    const succeeded = (!productResult || productResult.success && productResult.failed === 0) && (!orderResult || orderResult.success === true && !Number(orderResult.failed || 0));
    {
      // Product sync updates counters; reload to preserve those changes when recording overall completion.
      const latest = await this.prisma.integration.findFirst({ where: { id: integration.id, tenantId }, select: { apiExtra: true } });
      const state = this.encryption.openExtra(latest?.apiExtra || integration.apiExtra);
      if (succeeded) state.lastSuccessfulSyncAt = new Date().toISOString();
      state.lastSyncStatus = succeeded ? 'success' : 'failed';
      state.lastSyncError = succeeded ? null : String(orderResult?.error || ((productResult?.failed || 0) + ' ürün aktarılamadı'));
      state.lastSyncAttemptAt = new Date().toISOString();
      await this.prisma.integration.update({ where: { id: integration.id }, data: { apiExtra: this.encryption.sealExtra(state) } });
    }
    return { success: Boolean(succeeded), integrationId: integration.id, platform: integration.platform, products: productResult, orders: orderResult };
  }

  async getIntegrationSyncStatus(tenantId: string, integrationId: string) {
    if (!tenantId || !integrationId) {
      throw new BadRequestException('tenantId ve integrationId zorunludur');
    }

    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, tenantId },
      select: {
        id: true,
        platform: true,
        isActive: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!integration) {
      throw new NotFoundException('Entegrasyon bulunamadı');
    }

    const [productCount, orderCount, recentLogs] = await Promise.all([
      this.prisma.marketplaceProduct.count({
        where: {
          product: { tenantId },
          platform: integration.platform,
        },
      }),
      this.prisma.order.count({
        where: { tenantId, platform: integration.platform },
      }),
      this.prisma.activityLog.findMany({
        where: {
          tenantId,
          OR: [
            { resource: 'integration', resourceId: integrationId },
            {
              action: {
                in: [
                  'marketplace.products.sync',
                  'integration.initial.sync',
                  'integration.sync.retry',
                  'sync.error',
                  'webhook.order.received',
                ],
              },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          details: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      integrationId: integration.id,
      platform: integration.platform,
      isActive: integration.isActive,
      lastSyncAt: integration.updatedAt.toISOString(),
      connectedAt: integration.createdAt.toISOString(),
      productCount,
      orderCount,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }

  private async runInitialSyncAfterConnect(
    tenantId: string,
    integrationId: string,
  ) {
    await this.prisma.activityLog.create({
      data: {
        tenantId,
        action: 'integration.initial.sync',
        resource: 'integration',
        resourceId: integrationId,
        details: { trigger: 'connect', status: 'started' },
      },
    });

    try {
      const integration = await this.prisma.integration.findFirst({
        where: { id: integrationId, tenantId, isActive: true },
        select: { platform: true, apiExtra: true },
      });

      if (this.integrationSyncQueue && integration) {
        const extra = (integration.apiExtra as Record<string, unknown>) ?? {};
        const providerId = resolveProviderIdFromIntegration(
          String(integration.platform),
          extra,
        );
        const categoryKey = resolveIntegrationCategoryFromPlatform(
          String(integration.platform),
        );
        const category =
          categoryKey === 'ECOMMERCE'
            ? IntegrationCategory.ECOMMERCE
            : IntegrationCategory.MARKETPLACE;

        const queueResult = await this.integrationSyncQueue.enqueueSync({
          tenantId,
          integrationId,
          providerId,
          category,
          syncType: IntegrationSyncType.ALL,
          platform: String(integration.platform),
          manual: false,
        });

        await this.prisma.activityLog.create({
          data: {
            tenantId,
            action: 'integration.initial.sync',
            resource: 'integration',
            resourceId: integrationId,
            details: {
              trigger: 'connect',
              status: queueResult.queued ? 'queued' : 'completed',
              queue: queueResult,
            } as Prisma.InputJsonValue,
          },
        });
        return;
      }

      const result = await this.syncIntegrationByStoreId(
        tenantId,
        integrationId,
        'all',
      );

      await this.prisma.activityLog.create({
        data: {
          tenantId,
          action: 'integration.initial.sync',
          resource: 'integration',
          resourceId: integrationId,
          details: {
            trigger: 'connect',
            status: 'completed',
            products: result.products,
            orders: result.orders,
          } as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      await this.prisma.activityLog.create({
        data: {
          tenantId,
          action: 'sync.error',
          resource: 'integration',
          resourceId: integrationId,
          details: {
            trigger: 'connect',
            error: (error as Error).message,
          },
        },
      });
      throw error;
    }
  }

  async probeAllIntegrationsForTenant(
    tenantId: string,
    options?: { includeOrders?: boolean; productLimit?: number },
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId zorunludur');
    }

    const integrations = await this.prisma.integration.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, platform: true },
    });

    const results: Array<Record<string, unknown>> = [];
    for (const integration of integrations) {
      try {
        const probe = await this.probeIntegrationContract(
          tenantId,
          integration.platform as unknown as Platform,
          options,
        );
        results.push({
          integrationId: integration.id,
          integrationPlatform: integration.platform,
          ...probe,
        });
      } catch (error) {
        results.push({
          integrationId: integration.id,
          platform: integration.platform,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    const successful = results.filter((r) => r.success === true).length;
    return {
      tenantId,
      total: results.length,
      successful,
      failed: results.length - successful,
      results,
    };
  }

  async syncPlatformOrdersForTenant(
    tenantId: string,
    platform: Platform,
    integrationId?: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId zorunludur');
    }

    const integration = integrationId
      ? await this.prisma.integration.findFirst({
          where: { id: integrationId, tenantId, isActive: true },
        })
      : await this.prisma.integration.findFirst({
          where: { tenantId, platform: platform as any, isActive: true },
        });

    if (!integration) {
      throw new NotFoundException('Aktif entegrasyon bulunamadı');
    }

    const apiKey = this.encryption.decrypt(integration.apiKey);
    const apiSecret = this.encryption.decrypt(integration.apiSecret);
    const spApiReady =
      String(platform).startsWith('AMAZON')
        ? hasAmazonSpApiCredentials({
            apiKey,
            apiSecret,
            apiExtra: this.encryption.openExtra(integration.apiExtra),
          })
        : undefined;

    if (!supportsOrderSync(platform, { spApiReady })) {
      return {
        success: true,
        skipped: true,
        platform,
        message: getOrderSyncSkipMessage(platform),
        total: 0,
        created: 0,
        updated: 0,
        failed: 0,
      };
    }

    const bridge = await this.getBridgeForTenant(
      tenantId,
      platform,
      integration.id,
    );
    const raw = await bridge.syncOrders();

    if (raw && raw.success === false) {
      throw new BadRequestException(
        raw.error || `${platform} sipariş senkronizasyonu başarısız`,
      );
    }

    const orders = this.extractOrders(raw);

    let created = 0;
    let updated = 0;
    let failed = 0;

    // Pre-fetch all existing orders for this tenant+platform in a single query
    const marketplaceOrderIds = orders
      .map((source) => {
        try {
          return this.normalizeOrderForPersistence(tenantId, platform, source)
            .marketplaceOrderId;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];

    const existingOrders = await this.prisma.order.findMany({
      where: {
        tenantId,
        platform: platform as unknown as PrismaPlatform,
        marketplaceOrderId: { in: marketplaceOrderIds },
      },
      select: { id: true, marketplaceOrderId: true },
    });
    const existingMap = new Map(
      existingOrders.map((o) => [o.marketplaceOrderId, o.id]),
    );

    for (const source of orders) {
      try {
        const normalized = this.normalizeOrderForPersistence(
          tenantId,
          platform,
          source,
        );
        const existingId = existingMap.get(normalized.marketplaceOrderId);

        if (existingId) {
          await this.prisma.order.update({
            where: { id: existingId },
            data: normalized.orderData,
          });
          updated += 1;
        } else {
          const createdOrder = await this.prisma.order.create({
            data: normalized.orderData,
            include: { items: true },
          });
          created += 1;

          // OTOMASYON: Eğer sipariş kargolanmış şekilde geldiyse fatura kes
          if (createdOrder.status === 'SHIPPED') {
            this.ordersService
              .autoCreateInvoiceForOrder(createdOrder, tenantId)
              .catch((err: Error) => {
                this.logger.error(
                  `Pazaryeri senkronizasyonunda otomatik fatura hatası: ${err.message}`,
                );
              });
          }
        }
      } catch (error) {
        failed += 1;
        this.logger.warn(
          `Order sync failed for platform=${platform}: ${(error as Error).message}`,
        );
      }
    }

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        action: 'marketplace.orders.sync',
        resource: 'order',
        details: {
          platform,
          total: orders.length,
          created,
          updated,
          failed,
        } as Prisma.InputJsonValue,
      },
    });

    if (integration) {
      try {
        const extra = this.encryption.openExtra(integration.apiExtra);
        extra.ordersSynced = (extra.ordersSynced || 0) + created + updated;
        await this.prisma.integration.update({
          where: { id: integration.id },
          data: { apiExtra: this.encryption.sealExtra(extra), updatedAt: new Date() },
        });

        await this.prisma.integrationSyncLog.create({
          data: {
            integrationId: integration.id,
            syncType: 'ORDER',
            status: failed > 0 && created === 0 && updated === 0 ? 'FAILED' : 'SUCCESS',
            recordsSynced: created + updated,
            errorMessage: failed > 0 ? `${failed} sipariş aktarılamadı` : null,
            startedAt: new Date(Date.now() - 5000),
            completedAt: new Date(),
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to update order sync telemetry: ${(err as Error).message}`);
      }
    }

    return {
      success: true,
      platform,
      total: orders.length,
      created,
      updated,
      failed,
    };
  }

  async updateMarketplaceStock(
    tenantId: string,
    platform: Platform,
    sku: string,
    stock: number,
    requestKey?: string,
  ) {
    if (!tenantId || !sku) {
      throw new BadRequestException('tenantId ve sku zorunludur');
    }

    const key = requestKey || `${platform}:stock:${sku}:${stock}`;
    const duplicate = await this.findRecentIdempotentLog(
      tenantId,
      'marketplace.stock.update',
      key,
    );
    if (duplicate) {
      return {
        success: true,
        skipped: true,
        reason: 'idempotent_request',
        requestKey: key,
      };
    }

    const bridge = await this.getBridgeForTenant(tenantId, platform);
    const result = await this.withRetry(
      () => bridge.updateStock(sku, stock),
      3,
      400,
    );

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        action: 'marketplace.stock.update',
        resource: 'product',
        resourceId: sku,
        details: {
          platform,
          stock,
          requestKey: key,
          result,
        } as Prisma.InputJsonValue,
      },
    });

    return { ...result, requestKey: key };
  }

  async updateMarketplacePrice(
    tenantId: string,
    platform: Platform,
    sku: string,
    price: number,
    requestKey?: string,
  ) {
    if (!tenantId || !sku) {
      throw new BadRequestException('tenantId ve sku zorunludur');
    }

    const key = requestKey || `${platform}:price:${sku}:${price}`;
    const duplicate = await this.findRecentIdempotentLog(
      tenantId,
      'marketplace.price.update',
      key,
    );
    if (duplicate) {
      return {
        success: true,
        skipped: true,
        reason: 'idempotent_request',
        requestKey: key,
      };
    }

    const bridge = await this.getBridgeForTenant(tenantId, platform);
    const result = await this.withRetry(
      () => bridge.updatePrice(sku, price),
      3,
      400,
    );

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        action: 'marketplace.price.update',
        resource: 'product',
        resourceId: sku,
        details: {
          platform,
          price,
          requestKey: key,
          result,
        } as Prisma.InputJsonValue,
      },
    });

    return { ...result, requestKey: key };
  }

  async probeIntegrationContract(
    tenantId: string,
    platform: Platform,
    options?: { includeOrders?: boolean; productLimit?: number },
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId zorunludur');
    }

    const includeOrders = options?.includeOrders ?? false;
    const productLimit = Math.max(
      1,
      Math.min(20, Number(options?.productLimit ?? 5)),
    );

    const startedAt = Date.now();
    const bridge = await this.getBridgeForTenant(tenantId, platform);
    const bridgeAny = bridge as unknown as {
      getStoreInfo?: (storeId?: string) => Promise<unknown>;
      getStoreProducts?: (storeId?: string, limit?: number) => Promise<unknown>;
    };

    const checks: Array<{
      name: string;
      passed: boolean;
      detail: string;
      sample?: Prisma.InputJsonValue;
    }> = [];

    try {
      const info = bridgeAny.getStoreInfo
        ? await this.withRetry(() => bridgeAny.getStoreInfo!(), 2, 300)
        : null;
      const infoObj =
        info && typeof info === 'object'
          ? (info as Record<string, unknown>)
          : null;
      const infoPassed = Boolean(infoObj?.storeId && infoObj?.storeName);

      checks.push({
        name: 'storeInfoShape',
        passed: infoPassed,
        detail: infoPassed
          ? 'storeId/storeName alanlari mevcut'
          : 'storeInfo response shape eksik',
        sample: infoObj
          ? ({
              storeId: infoObj.storeId ?? null,
              storeName: infoObj.storeName ?? null,
              totalProducts: infoObj.totalProducts ?? null,
            } as Prisma.InputJsonValue)
          : undefined,
      });
    } catch (error) {
      checks.push({
        name: 'storeInfoShape',
        passed: false,
        detail: `storeInfo hatasi: ${(error as Error).message}`,
      });
    }

    try {
      const productsRaw = bridgeAny.getStoreProducts
        ? await this.withRetry(
            () => bridgeAny.getStoreProducts!(undefined, productLimit),
            2,
            300,
          )
        : [];

      const products = Array.isArray(productsRaw) ? productsRaw : [];
      const first =
        products[0] && typeof products[0] === 'object'
          ? (products[0] as Record<string, unknown>)
          : null;

      const firstHasShape = Boolean(
        first &&
        (first.title || first.name) &&
        (first.productId || first.id || first.sku),
      );
      const productShapeOk =
        Array.isArray(productsRaw) && (products.length === 0 || firstHasShape);

      checks.push({
        name: 'productsShape',
        passed: productShapeOk,
        detail: productShapeOk
          ? `${products.length} urun alindi, liste shape dogrulandi`
          : 'urun listesi bos veya beklenen alanlar eksik',
        sample: first
          ? ({
              productId: first.productId ?? first.id ?? first.sku ?? null,
              title: first.title ?? first.name ?? null,
              salePrice: first.salePrice ?? first.price ?? null,
            } as Prisma.InputJsonValue)
          : undefined,
      });
    } catch (error) {
      checks.push({
        name: 'productsShape',
        passed: false,
        detail: `products hatasi: ${(error as Error).message}`,
      });
    }

    if (includeOrders) {
      try {
        const ordersRaw = await this.withRetry(
          () => bridge.syncOrders(),
          2,
          400,
        );
        const orders = this.extractOrders(ordersRaw);
        const firstOrder = orders[0] || null;
        const orderShapeOk = Boolean(
          !firstOrder ||
          firstOrder.orderNumber ||
          firstOrder.orderId ||
          firstOrder.id ||
          firstOrder.packageNumber,
        );

        checks.push({
          name: 'ordersShape',
          passed: orderShapeOk,
          detail: `orders count: ${orders.length}`,
          sample: firstOrder
            ? ({
                orderNumber: firstOrder.orderNumber ?? null,
                orderId: firstOrder.orderId ?? firstOrder.id ?? null,
                status: firstOrder.status ?? firstOrder.orderStatus ?? null,
              } as Prisma.InputJsonValue)
            : undefined,
        });
      } catch (error) {
        checks.push({
          name: 'ordersShape',
          passed: false,
          detail: `orders hatasi: ${(error as Error).message}`,
        });
      }
    }

    const passedChecks = checks.filter((check) => check.passed).length;
    const success = passedChecks === checks.length && checks.length > 0;
    const durationMs = Date.now() - startedAt;

    const result = {
      success,
      tenantId,
      platform,
      checkedAt: new Date().toISOString(),
      durationMs,
      checks,
      score:
        checks.length > 0
          ? Math.round((passedChecks / checks.length) * 100)
          : 0,
    };

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        action: 'marketplace.contract.probe',
        resource: 'integration',
        details: result as unknown as Prisma.InputJsonValue,
      },
    });

    return result;
  }

  /**
   * Pazaryerinden mağaza analizi yap
   */
  async analyzeStore(
    platform: Platform,
    storeId: string,
  ): Promise<MarketplaceAnalysisResponse> {
    const bridge = (await this.getTempBridge(platform)) as any;

    if (platform === Platform.TRENDYOL) {
      return bridge.analyzeStoreSEO(storeId);
    } else if (platform === Platform.HEPSIBURADA) {
      return bridge.analyzeStoreSEO(storeId);
    }

    // Universal Fallback for ANY other platform or direct URL
    if (storeId.startsWith('http')) {
      const scrapedData = await this.scrapingService.scrapeStore(storeId);
      if (scrapedData) {
        const metricSources = {
          storeName: 'scraped',
          rating: 'scraped',
          followers: 'scraped',
          productCount: 'scraped',
          totalProducts: 'scraped',
          responseTime: 'scraped_or_unknown',
          monthlyTraffic: 'not_available',
          monthlyTurnover: 'not_available',
        } as const;

        return {
          platform: scrapedData.platform || 'GENERIC',
          storeId: storeId,
          storeName: scrapedData.storeName,
          seoScore: Math.round(scrapedData.rating * 10), // Approx conversion
          dataSources: {
            overall: 'scraped+calculated',
            seoScore: 'calculated',
            products: 'not_available',
            metrics: metricSources,
            reasons: {
              monthlyTraffic:
                'Universal scrape akisi aylik trafik degeri saglamiyor.',
              monthlyTurnover:
                'Universal scrape akisi aylik ciro degeri saglamiyor.',
            },
            evidence: {
              adapter: 'marketplace.service.generic',
              inputUrl: storeId,
            },
          },
          confidence: computeConfidenceFromSources(metricSources),
          metrics: {
            storeName: scrapedData.storeName,
            rating: scrapedData.rating,
            followers: scrapedData.followerCount,
            totalProducts: scrapedData.productCount,
            productCount: scrapedData.productCount,
            responseTime: scrapedData.responseTime || 'Bilinmiyor',
          },
          products: [], // Generic scraper might not get full product list yet
          recommendations: ['Global pazar yeri analizi tamamlandı.'],
          timestamp: new Date(),
        };
      }
    }

    throw new Error(
      `${platform} için analiz henüz implementasyon edilmedi ve URL geçerli değil.`,
    );
  }

  /**
   * Mağaza ürünlerini getir
   */
  async getStoreProducts(
    platform: Platform,
    storeId: string,
    limit: number = 10,
  ) {
    const bridge = (await this.getTempBridge(platform)) as any;

    if (platform === Platform.TRENDYOL) {
      return bridge.getStoreProducts(storeId, limit);
    } else if (platform === Platform.HEPSIBURADA) {
      return bridge.getStoreProducts(storeId, limit);
    }

    throw new Error(
      `${platform} için ürün getirme henüz implementasyon edilmedi`,
    );
  }

  /**
   * Pazaryerinde ürün ara (auto-discovery için)
   */
  async searchProducts(
    platform: Platform,
    query: string,
    limit: number = 5,
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const bridge = (await this.getTempBridge(platform)) as any;
      if (typeof bridge.searchProducts === 'function') {
        const results = await bridge.searchProducts(query, limit);
        return Array.isArray(results) ? results : [];
      }
    } catch {
      // Platform may not support search
    }
    return [];
  }

  /**
   * Mağaza bilgilerini getir
   */
  async getStoreInfo(platform: Platform, storeId: string) {
    const bridge = (await this.getTempBridge(platform)) as any;

    if (platform === Platform.TRENDYOL) {
      return bridge.getStoreInfo(storeId);
    } else if (platform === Platform.HEPSIBURADA) {
      return bridge.getStoreInfo(storeId);
    }

    throw new Error(
      `${platform} için mağaza bilgisi henüz implementasyon edilmedi`,
    );
  }

  /**
   * API Key olmadan geçici bridge oluştur (public store analizi için)
   */
  private async getTempBridge(platform: Platform): Promise<MarketplaceBridge> {
    switch (platform) {
      case Platform.TRENDYOL:
        // Trendyol public API'si kullanıyoruz
        return new TrendyolBridge('public', 'public', '', this.scrapingService);
      case Platform.AMAZON:
        return new AmazonBridge('public', 'public', this.scrapingService);
      case Platform.HEPSIBURADA:
        return new HepsiburadaBridge('public', 'public', this.scrapingService);
      case Platform.N11:
        return new N11Bridge('public', 'public', this.scrapingService);
      case Platform.CICEKSEPETI:
        return new CicekSepetiBridge('public', 'public', this.scrapingService);
      default:
        throw new Error(`${platform} köprüsü henüz hazır değil.`);
    }
  }

  // ==================== STORE MANAGEMENT ====================
  async getStores(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId zorunludur');
    }

    try {
      const [integrations, productGroups, orderGroups] = await Promise.all([
        this.prisma.integration.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.marketplaceProduct.groupBy({
          by: ['platform'],
          _count: { _all: true },
          where: {
            product: { tenantId },
          },
        }),
        this.prisma.order.groupBy({
          by: ['platform'],
          _count: { _all: true },
          _sum: { totalAmount: true },
          where: { tenantId },
        }),
      ]);

      const productCountByPlatform = new Map(
        productGroups.map((group) => [group.platform, group._count._all]),
      );
      const orderStatsByPlatform = new Map(
        orderGroups.map((group) => [
          group.platform,
          {
            orderCount: group._count._all,
            revenue: Number(group._sum.totalAmount ?? 0),
          },
        ]),
      );

      return integrations.map((integration) => {
        const orderStats = orderStatsByPlatform.get(integration.platform);
        const meta = publicCredentialMetadata(integration.apiExtra);
        const lastSync = typeof meta.lastSuccessfulSyncAt === 'string' ? meta.lastSuccessfulSyncAt : null;
        const lastSyncAttemptAt = typeof meta.lastSyncAttemptAt === 'string' ? meta.lastSyncAttemptAt : null;
        const lastSyncStatus = typeof meta.lastSyncStatus === 'string' ? meta.lastSyncStatus : (lastSync ? 'success' : 'idle');
        const lastSyncError = typeof meta.lastSyncError === 'string' ? meta.lastSyncError : null;
        const lastVerificationError = typeof meta.lastVerificationError === 'string' ? meta.lastVerificationError : null;
        const productsAdded = typeof meta.productsAdded === 'number' ? meta.productsAdded : 0;
        const productsUpdated = typeof meta.productsUpdated === 'number' ? meta.productsUpdated : 0;
        const productsFailed = typeof meta.productsFailed === 'number' ? meta.productsFailed : 0;
        const ordersSynced = typeof meta.ordersSynced === 'number' ? meta.ordersSynced : 0;

        let status: 'connected' | 'pending' | 'error' | 'disconnected' = 'disconnected';
        if (!integration.isActive) {
          status = 'disconnected';
        } else if (meta.connectionStatus === 'verified') {
          status = 'connected';
        } else if (meta.connectionStatus === 'verification_failed' || (lastSyncStatus === 'failed' && (lastSyncError?.includes('401') || lastSyncError?.includes('403')))) {
          status = 'error';
        } else {
          status = 'pending';
        }

        const hoursSinceUpdate = integration.updatedAt
          ? (Date.now() - integration.updatedAt.getTime()) / (1000 * 60 * 60)
          : Number.POSITIVE_INFINITY;

        const health = status === 'disconnected'
          ? 0
          : status === 'error'
            ? 25
            : hoursSinceUpdate <= 24
              ? 98
              : hoursSinceUpdate <= 24 * 7
                ? 85
                : 70;

        return {
          id: integration.id,
          platform: integration.platform,
          name: `${integration.platform} Mağazası`,
          status,
          verified: meta.connectionStatus === 'verified',
          connectionStatus: meta.connectionStatus || (integration.isActive ? 'verified' : 'disconnected'),
          lastSync,
          lastSyncAttemptAt,
          lastSyncStatus,
          lastSyncError: lastSyncError || lastVerificationError,
          productsAdded,
          productsUpdated,
          productsFailed,
          ordersSynced,
          productCount: productCountByPlatform.get(integration.platform) ?? 0,
          orderCount: orderStats?.orderCount ?? 0,
          revenue: orderStats?.revenue ?? 0,
          health,
          createdAt: integration.createdAt.toISOString(),
        };
      });
    } catch (error) {
      this.logger.error(
        `getStores failed for tenant ${tenantId}`,
        error as Error,
      );
      throw new InternalServerErrorException(
        'Mağaza entegrasyonları alınamadı',
      );
    }
  }

  async getIntegrations(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId zorunludur');
    }

    try {
      const integrations = await this.prisma.integration.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });

      return integrations.map((integration) => ({
        id: integration.id,
        platform: integration.platform,
        isActive: integration.isActive,
        lastSyncAt: publicCredentialMetadata(integration.apiExtra).lastSuccessfulSyncAt || null,
        settings: publicCredentialMetadata(integration.apiExtra),
        createdAt: integration.createdAt.toISOString(),
        status: integration.isActive ? 'active' : 'inactive',
      }));
    } catch (error) {
      this.logger.error(
        `getIntegrations failed for tenant ${tenantId}`,
        error as Error,
      );
      throw new InternalServerErrorException('Entegrasyonlar alınamadı');
    }
  }

  async connectStore(
    tenantId: string,
    platform: string,
    credentials: Record<string, unknown>,
    marketplaceId?: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId zorunludur');
    }
    if (!platform && !marketplaceId) {
      throw new BadRequestException('platform veya marketplaceId zorunludur');
    }

    const resolvedMarketplaceId =
      marketplaceId ||
      (typeof credentials.marketplaceId === 'string'
        ? credentials.marketplaceId
        : undefined);

    let normalizedPlatform = (platform || '').toUpperCase() as PrismaPlatform;
    if (
      resolvedMarketplaceId &&
      MARKETPLACE_ID_TO_PLATFORM[resolvedMarketplaceId.toLowerCase()]
    ) {
      normalizedPlatform =
        MARKETPLACE_ID_TO_PLATFORM[resolvedMarketplaceId.toLowerCase()];
    } else if (!normalizedPlatform && resolvedMarketplaceId) {
      const mapped = resolvePlatformFromMarketplaceId(resolvedMarketplaceId);
      if (mapped) normalizedPlatform = mapped;
    }

    if (!Object.values(PrismaPlatform).includes(normalizedPlatform)) {
      throw new BadRequestException(`Desteklenmeyen platform: ${platform}`);
    }

    const sanitizedCredentials = normalizeMarketplaceCredentials(
      normalizedPlatform,
      credentials,
      resolvedMarketplaceId,
    );
    const providerId = sanitizedCredentials.apiExtra && (sanitizedCredentials.apiExtra as any).marketplaceId || resolvedMarketplaceId || normalizedPlatform.toLowerCase();
    const verification = await this.connections.test(providerId, credentials);
    if (!verification.success && verification.supported) {
      throw new UnprocessableEntityException(verification.message);
    }
    const extra = sanitizedCredentials.apiExtra as Record<string, any>;
    const accountField = ['supplierId', 'merchantId', 'sellerId', 'shopDomain', 'siteUrl', 'shopId', 'vendorId'].find(key => extra[key]);
    const accountId = accountField ? String(extra[accountField]) : createHash('sha256').update(sanitizedCredentials.apiKey).digest('hex');
    extra.marketplaceId = providerId;
    extra.connectionStatus = verification.success ? 'verified' : 'verification_pending';
    if (verification.success) extra.lastVerifiedAt = verification.verifiedAt;

    try {
      extra.externalAccountId = accountId;
      let existing: { id: string } | undefined;
      const integration = await this.prisma.$transaction(async tx => {
        await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', 'marketplace-connect:' + tenantId + ':' + normalizedPlatform);
        const candidates = await tx.integration.findMany({ where: { tenantId, platform: normalizedPlatform }, orderBy: { updatedAt: 'desc' } });
        existing = candidates.find(candidate => {
          const stored = this.encryption.openExtra(candidate.apiExtra);
          const storedProvider = stored.marketplaceId || (normalizedPlatform === 'AMAZON' ? 'amazon-tr' : normalizedPlatform.toLowerCase().replace(/_/g, '-'));
          const storedField = ['supplierId', 'merchantId', 'sellerId', 'shopDomain', 'siteUrl', 'shopId', 'vendorId'].find(key => stored[key]);
          const storedAccount = stored.externalAccountId || (storedField ? String(stored[storedField]) : createHash('sha256').update(this.encryption.decrypt(candidate.apiKey)).digest('hex'));
          return storedProvider === providerId && (stored.isTestMode === true || stored.isTestMode === 'true') === extra.isTestMode && storedAccount === accountId;
        });
        extra.lastVerificationError = verification.success ? null : verification.message;
        const data = { isActive: verification.success === true, apiKey: this.encryption.encrypt(sanitizedCredentials.apiKey), apiSecret: this.encryption.encrypt(sanitizedCredentials.apiSecret), apiExtra: this.encryption.sealExtra(extra) };
        return existing ? tx.integration.update({ where: { id: existing.id }, data }) : tx.integration.create({ data: { ...data, tenantId, platform: normalizedPlatform } });
      });

      if (verification.success) void this.runInitialSyncAfterConnect(tenantId, integration.id).catch(
        (err) => {
          this.logger.error(
            `Initial sync failed for integration ${integration.id}`,
            err as Error,
          );
        },
      );

      return {
        success: true,
        integration: {
          id: integration.id,
          platform: integration.platform,
          isActive: integration.isActive,
          createdAt: integration.createdAt,
        },
        connectionStatus: extra.connectionStatus,
        initialSyncStarted: verification.success,
        message: !verification.success ? 'Bilgiler kaydedildi; mağaza erişimi henüz doğrulanmadı.' : existing
          ? `${normalizedPlatform} mağaza bilgileri güncellendi. Senkronizasyon arka planda başlatıldı.`
          : `${normalizedPlatform} mağazası bağlandı. İlk senkronizasyon arka planda başlatıldı.`,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnprocessableEntityException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `connectStore failed for tenant ${tenantId}`,
        error as Error,
      );
      throw new InternalServerErrorException('Mağaza bağlanamadı');
    }
  }

  async disconnectStore(tenantId: string, storeId: string) {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId ve storeId zorunludur');
    }

    try {
      const integration = await this.prisma.integration.findFirst({
        where: { id: storeId, tenantId },
        select: { id: true, isActive: true },
      });

      if (!integration) {
        throw new NotFoundException('Mağaza bağlantısı bulunamadı');
      }

      if (!integration.isActive) {
        return { success: true, message: 'Mağaza bağlantısı zaten pasif' };
      }

      await this.prisma.integration.update({
        where: { id: integration.id },
        data: { isActive: false },
      });
      return { success: true, message: 'Mağaza bağlantısı kesildi' };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `disconnectStore failed for tenant ${tenantId}`,
        error as Error,
      );
      throw new InternalServerErrorException('Mağaza bağlantısı kesilemedi');
    }
  }

  private extractProducts(raw: any): Record<string, unknown>[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as Record<string, unknown>[];
    if (Array.isArray(raw.products))
      return raw.products as Record<string, unknown>[];
    if (Array.isArray(raw.content))
      return raw.content as Record<string, unknown>[];
    if (Array.isArray(raw.items)) return raw.items as Record<string, unknown>[];
    return [];
  }

  private normalizeProductForPersistence(
    tenantId: string,
    platform: Platform,
    source: Record<string, unknown>,
  ) {
    const marketplaceListingId = String(
      source.productId ??
        source.id ??
        source.productMainId ??
        source.listingId ??
        source.marketplaceListingId ??
        `LIST-${Date.now()}`,
    );

    const sku = String(
      source.stockCode ??
        source.sku ??
        source.sellerStockCode ??
        source.merchantSku ??
        source.barcode ??
        marketplaceListingId,
    );

    const barcode =
      source.barcode !== undefined && source.barcode !== null
        ? String(source.barcode)
        : null;

    const title = String(source.title ?? source.name ?? 'İsimsiz Ürün');
    const price = this.toNumber(
      source.salePrice ?? source.listPrice ?? source.price ?? 0,
    );
    const stock = Math.max(
      0,
      Math.floor(
        this.toNumber(source.stockCount ?? source.quantity ?? source.stock ?? 0),
      ),
    );

    const statusRaw = String(
      source.listingStatus ?? source.status ?? source.approved ?? 'active',
    ).toLowerCase();
    let status = 'active';
    if (
      statusRaw === 'false' ||
      statusRaw === 'draft' ||
      statusRaw === '0' ||
      statusRaw.includes('draft')
    ) {
      status = 'draft';
    } else if (statusRaw.includes('pause') || statusRaw.includes('block')) {
      status = 'paused';
    }

    const marketplaceStatus = String(
      source.listingStatus ??
        source.status ??
        (stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'),
    ).toUpperCase();

    return {
      tenantId,
      platform,
      sku,
      barcode,
      title,
      price,
      stock,
      brand: source.brand ? String(source.brand) : null,
      category: source.categoryName
        ? String(source.categoryName)
        : source.category
          ? String(source.category)
          : null,
      status,
      marketplaceListingId,
      marketplaceStatus,
    };
  }

  private async persistMarketplaceProduct(
    normalized: ReturnType<typeof this.normalizeProductForPersistence>,
  ): Promise<'created' | 'updated'> {
    const {
      tenantId,
      platform,
      sku,
      barcode,
      title,
      price,
      stock,
      brand,
      category,
      status,
      marketplaceListingId,
      marketplaceStatus,
    } = normalized;

    const existingProduct = await this.prisma.product.findFirst({
      where: {
        tenantId,
        OR: [
          { sku },
          ...(barcode ? [{ barcode }] : []),
          ...(marketplaceListingId
            ? [
                {
                  marketplaceLinks: {
                    some: {
                      platform: platform as unknown as PrismaPlatform,
                      marketplaceListingId,
                    },
                  },
                },
              ]
            : []),
        ],
      },
    });

    let productId: string;
    let isNew = false;

    if (existingProduct) {
      const updated = await this.prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          title,
          price,
          stock,
          brand,
          category,
          status,
          ...(barcode ? { barcode } : {}),
          updatedAt: new Date(),
        },
      });
      productId = updated.id;
    } else {
      const created = await this.prisma.product.create({
        data: {
          tenantId,
          title,
          sku,
          barcode,
          price,
          stock,
          brand,
          category,
          status,
        },
      });
      productId = created.id;
      isNew = true;
    }

    const existingLink = await this.prisma.marketplaceProduct.findFirst({
      where: {
        platform: platform as unknown as PrismaPlatform,
        OR: [
          { productId, platform: platform as unknown as PrismaPlatform },
          {
            marketplaceListingId,
            platform: platform as unknown as PrismaPlatform,
          },
        ],
      },
    });

    if (existingLink) {
      await this.prisma.marketplaceProduct.update({
        where: { id: existingLink.id },
        data: {
          productId,
          marketplaceListingId,
          status: marketplaceStatus,
          stock,
          price,
          lastSyncAt: new Date(),
        },
      });
    } else {
      await this.prisma.marketplaceProduct.create({
        data: {
          productId,
          marketplaceListingId,
          platform: platform as unknown as PrismaPlatform,
          status: marketplaceStatus,
          stock,
          price,
          lastSyncAt: new Date(),
        },
      });
    }

    return isNew ? 'created' : 'updated';
  }

  private extractOrders(raw: any): Record<string, unknown>[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as Record<string, unknown>[];
    if (Array.isArray(raw.orders))
      return raw.orders as Record<string, unknown>[];
    if (Array.isArray(raw.content))
      return raw.content as Record<string, unknown>[];
    if (
      raw.data &&
      typeof raw.data === 'object' &&
      Array.isArray((raw.data as { items?: unknown }).items)
    ) {
      return (raw.data as { items: Record<string, unknown>[] }).items;
    }
    return [];
  }

  private normalizeOrderForPersistence(
    tenantId: string,
    platform: Platform,
    source: Record<string, unknown>,
  ) {
    const marketplaceOrderId = String(
      source.orderNumber ??
        source.orderId ??
        source.id ??
        source.packageNumber ??
        `ORD-${Date.now()}`,
    );

    const totalAmount = this.toNumber(
      source.totalAmount ?? source.totalPrice ?? source.amount,
    );
    const taxAmount = this.toNumber(source.taxAmount ?? source.tax ?? 0);

    const statusRaw = String(
      source.status ?? source.orderStatus ?? 'PENDING',
    ).toUpperCase();
    const status = (
      [
        'PENDING',
        'CONFIRMED',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'RETURNED',
      ].includes(statusRaw)
        ? statusRaw
        : 'PENDING'
    ) as
      | 'PENDING'
      | 'CONFIRMED'
      | 'SHIPPED'
      | 'DELIVERED'
      | 'CANCELLED'
      | 'RETURNED';

    const paymentRaw = String(source.paymentStatus ?? 'UNPAID').toUpperCase();
    const paymentStatus = (
      ['UNPAID', 'PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(paymentRaw)
        ? paymentRaw
        : 'UNPAID'
    ) as 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

    const orderDate = source.orderDate
      ? new Date(String(source.orderDate))
      : new Date();

    return {
      platform,
      marketplaceOrderId,
      orderData: {
        tenantId,
        platform: platform as unknown as PrismaPlatform,
        marketplaceOrderId,
        status,
        paymentStatus,
        customerName: source.customerName ? String(source.customerName) : null,
        customerEmail: source.customerEmail
          ? String(source.customerEmail)
          : null,
        customerPhone: source.customerPhone
          ? String(source.customerPhone)
          : null,
        shippingAddress: source.shippingAddress
          ? String(source.shippingAddress)
          : null,
        billingAddress: source.billingAddress
          ? String(source.billingAddress)
          : null,
        totalAmount,
        taxAmount,
        shippingCost: this.toNumber(source.shippingCost ?? 0),
        commissionAmount: this.toNumber(source.commissionAmount ?? 0),
        netProfit: this.toNumber(source.netProfit ?? 0),
        currency: source.currency ? String(source.currency) : 'TRY',
        trackingNumber: source.trackingNumber
          ? String(source.trackingNumber)
          : null,
        shippingProvider: source.shippingProvider
          ? String(source.shippingProvider)
          : null,
        notes: source.notes ? String(source.notes) : null,
        orderDate,
      },
    };
  }

  private toNumber(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  private async findRecentIdempotentLog(
    tenantId: string,
    action: string,
    requestKey: string,
  ) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const logs = await this.prisma.activityLog.findMany({
      where: {
        tenantId,
        action,
        createdAt: { gte: fiveMinutesAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return logs.find((log) => {
      const details = log.details as { requestKey?: string } | null;
      return details?.requestKey === requestKey;
    });
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number,
    delayMs: number,
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayMs * (attempt + 1)),
          );
        }
      }
    }
    throw lastError;
  }

}
