import { Injectable } from '@nestjs/common';
import { IntegrationCategory } from '../../enums/integration-category.enum';
import { IntegrationSyncType } from '../../enums/integration-category.enum';
import { BaseIntegrationAdapter } from '../../base/base-integration.adapter';
import type { IMarketplaceProvider } from '../../interfaces/providers/marketplace.provider';
import type {
  DecryptedCredentials,
  TenantIntegrationContext,
} from '../../interfaces/integration-context.interface';
import type { NormalizedProductDto } from '../../dto/normalized-product.dto';
import type { NormalizedOrderDto } from '../../dto/normalized-order.dto';
import type { SyncResultDto } from '../../dto/sync-result.dto';
import { normalizeGenericProduct } from '../../normalizers/product.normalizer';
import { AmazonBridge } from '../../../marketplace/amazon.bridge';
import { ScrapingService } from '../../../scraping/scraping.service';

/**
 * Amazon Türkiye pazaryeri adapter'ı.
 * SP-API veya scraping fallback ile ürün/sipariş/stok senkronizasyonu.
 */
@Injectable()
export class AmazonTrAdapter
  extends BaseIntegrationAdapter
  implements IMarketplaceProvider
{
  readonly providerId = 'amazon-tr';
  readonly displayName = 'Amazon Türkiye';
  readonly category = IntegrationCategory.MARKETPLACE;

  constructor(private readonly scrapingService: ScrapingService) {
    super();
  }

  private buildBridge(credentials: DecryptedCredentials): AmazonBridge {
    const sellerId = String(
      credentials.extra.sellerId ?? credentials.apiKey ?? '',
    );
    const refreshToken = String(
      credentials.extra.refreshToken ?? credentials.apiSecret ?? '',
    );
    return new AmazonBridge(
      sellerId,
      refreshToken,
      this.scrapingService,
      credentials.extra,
    );
  }

  async testConnection(ctx: TenantIntegrationContext, credentials: DecryptedCredentials) {
    this.assertContext(ctx);
    try {
      const bridge = this.buildBridge(credentials);
      if (bridge.hasSpApiEnabled()) {
        return this.ok('Amazon SP-API kimlik bilgileri doğrulandı');
      }
      const sellerId = String(credentials.extra.sellerId ?? credentials.apiKey);
      if (!sellerId) {
        return this.fail('Seller ID zorunludur');
      }
      return this.ok('Amazon TR bağlantı bilgileri kayıtlı');
    } catch (error) {
      return this.fail('Amazon TR bağlantı testi başarısız', error);
    }
  }

  async syncProducts(
    ctx: TenantIntegrationContext,
    credentials: DecryptedCredentials,
  ): Promise<SyncResultDto<NormalizedProductDto>> {
    this.assertContext(ctx);
    const started = Date.now();
    try {
      const bridge = this.buildBridge(credentials);
      const raw = await bridge.syncProducts();
      if (raw?.success === false) throw new Error(String(raw.error || raw.message || 'Pazaryeri aktarımı başarısız')); 
      const raws = (raw?.products ?? []) as Record<string, unknown>[];
      const items = raws.map((p) => normalizeGenericProduct(p, 'AMAZON'));

      return {
        success: true,
        tenantId: ctx.tenantId,
        providerId: this.providerId,
        syncType: IntegrationSyncType.PRODUCTS,
        total: items.length,
        created: items.length,
        updated: 0,
        failed: 0,
        items,
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        success: false,
        tenantId: ctx.tenantId,
        providerId: this.providerId,
        syncType: IntegrationSyncType.PRODUCTS,
        total: 0,
        created: 0,
        updated: 0,
        failed: 1,
        items: [],
        errors: [(error as Error).message],
        durationMs: Date.now() - started,
      };
    }
  }

  async syncOrders(
    ctx: TenantIntegrationContext,
    credentials: DecryptedCredentials,
  ): Promise<SyncResultDto<NormalizedOrderDto>> {
    this.assertContext(ctx);
    const started = Date.now();
    try {
      const bridge = this.buildBridge(credentials);
      const raw = await bridge.syncOrders();
      if (raw?.success === false) throw new Error(String(raw.error || raw.message || 'Pazaryeri aktarımı başarısız')); 
      const orders = (raw?.orders ?? []) as Record<string, unknown>[];

      return {
        success: true,
        tenantId: ctx.tenantId,
        providerId: this.providerId,
        syncType: IntegrationSyncType.ORDERS,
        total: orders.length,
        created: orders.length,
        updated: 0,
        failed: 0,
        items: orders as unknown as NormalizedOrderDto[],
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        success: false,
        tenantId: ctx.tenantId,
        providerId: this.providerId,
        syncType: IntegrationSyncType.ORDERS,
        total: 0,
        created: 0,
        updated: 0,
        failed: 1,
        items: [],
        errors: [(error as Error).message],
        durationMs: Date.now() - started,
      };
    }
  }

  async updateStock(
    ctx: TenantIntegrationContext,
    credentials: DecryptedCredentials,
    sku: string,
    quantity: number,
  ) {
    this.assertContext(ctx);
    try {
      const bridge = this.buildBridge(credentials);
      await bridge.updateStock(sku, quantity);
      return { success: true, message: `Stok güncellendi: ${sku} → ${quantity}` };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async updatePrice(
    ctx: TenantIntegrationContext,
    credentials: DecryptedCredentials,
    sku: string,
    price: number,
  ) {
    this.assertContext(ctx);
    try {
      const bridge = this.buildBridge(credentials);
      await bridge.updatePrice(sku, price);
      return { success: true, message: `Fiyat güncellendi: ${sku} → ${price}` };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  supportedSyncTypes(): IntegrationSyncType[] {
    return [
      IntegrationSyncType.PRODUCTS,
      IntegrationSyncType.ORDERS,
      IntegrationSyncType.INVENTORY,
      IntegrationSyncType.STOCK_UPDATE,
      IntegrationSyncType.PRICE_UPDATE,
    ];
  }
}
