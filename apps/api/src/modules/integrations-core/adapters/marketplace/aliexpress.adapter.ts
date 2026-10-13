import { Injectable } from '@nestjs/common';
import { IntegrationCategory } from '../../enums/integration-category.enum';
import { IntegrationSyncType } from '../../enums/integration-category.enum';
import { BaseIntegrationAdapter } from '../../base/base-integration.adapter';
import type { IMarketplaceProvider } from '../../interfaces/integration-provider.interface';
import type {
  DecryptedCredentials,
  TenantIntegrationContext,
} from '../../interfaces/integration-context.interface';
import type { NormalizedProductDto } from '../../dto/normalized-product.dto';
import type { NormalizedOrderDto } from '../../dto/normalized-order.dto';
import type { SyncResultDto } from '../../dto/sync-result.dto';
import { normalizeGenericProduct } from '../../normalizers/product.normalizer';
import { normalizeGenericOrder } from '../../normalizers/order.normalizer';
import { AliexpressBridge } from '../../../marketplace/aliexpress.bridge';
import { ScrapingService } from '../../../scraping/scraping.service';

@Injectable()
export class AliexpressAdapter
  extends BaseIntegrationAdapter
  implements IMarketplaceProvider
{
  readonly providerId = 'aliexpress';
  readonly displayName = 'AliExpress';
  readonly category = IntegrationCategory.MARKETPLACE;

  constructor(private readonly scrapingService: ScrapingService) {
    super();
  }

  private buildBridge(credentials: DecryptedCredentials): AliexpressBridge {
    return new AliexpressBridge(
      credentials.apiKey,
      credentials.apiSecret,
      String(credentials.extra.accessToken ?? ''),
      this.scrapingService,
    );
  }

  async testConnection(
    ctx: TenantIntegrationContext,
    credentials: DecryptedCredentials,
  ) {
    this.assertContext(ctx);
    try {
      const bridge = this.buildBridge(credentials);
      const products = await bridge.syncProducts();
      if (products) {
        return this.ok('AliExpress bağlantısı doğrulandı');
      }
      return this.fail('AliExpress yanıt vermedi');
    } catch (error) {
      return this.fail('AliExpress bağlantı testi başarısız', error);
    }
  }

  async syncProducts(
    ctx: TenantIntegrationContext,
    credentials: DecryptedCredentials,
  ): Promise<SyncResultDto<NormalizedProductDto>> {
    this.assertContext(ctx);
    const started = Date.now();
    const bridge = this.buildBridge(credentials);

    try {
      const raw = await bridge.syncProducts();
      if (raw?.success === false) throw new Error(String(raw.error || raw.message || 'Pazaryeri aktarımı başarısız')); 
      const products = (raw?.products ?? []) as Record<string, unknown>[];
      const items = products.map((p) => normalizeGenericProduct(p, 'ALIEXPRESS'));

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
    const bridge = this.buildBridge(credentials);

    try {
      const raw = await bridge.syncOrders();
      if (raw?.success === false) throw new Error(String(raw.error || raw.message || 'Pazaryeri aktarımı başarısız')); 
      const orders = (raw?.orders ?? []) as Record<string, unknown>[];
      const items = orders.map((o) => normalizeGenericOrder(o, 'ALIEXPRESS'));

      return {
        success: true,
        tenantId: ctx.tenantId,
        providerId: this.providerId,
        syncType: IntegrationSyncType.ORDERS,
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
