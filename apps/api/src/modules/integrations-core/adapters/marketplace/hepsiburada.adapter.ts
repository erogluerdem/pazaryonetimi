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
import {
  normalizeHepsiburadaProduct,
  normalizeGenericProduct,
} from '../../normalizers/product.normalizer';
import { normalizeHepsiburadaOrder } from '../../normalizers/order.normalizer';
import { HepsiburadaBridge } from '../../../marketplace/hepsiburada.bridge';
import { ScrapingService } from '../../../scraping/scraping.service';

/**
 * Hepsiburada pazaryeri adapter'ı.
 * HepsiburadaBridge'i sarmalar; ürün/sipariş verisini standart DTO'lara normalize eder.
 */
@Injectable()
export class HepsiburadaAdapter
  extends BaseIntegrationAdapter
  implements IMarketplaceProvider
{
  readonly providerId = 'hepsiburada';
  readonly displayName = 'Hepsiburada';
  readonly category = IntegrationCategory.MARKETPLACE;

  constructor(private readonly scrapingService: ScrapingService) {
    super();
  }

  /** Kimlik bilgilerinden bridge örneği oluşturur */
  private buildBridge(credentials: DecryptedCredentials): HepsiburadaBridge {
    const merchantId = String(
      credentials.extra.merchantId ?? credentials.extra.supplierId ?? '',
    );
    return new HepsiburadaBridge(
      credentials.apiKey,
      merchantId,
      this.scrapingService,
      credentials.apiSecret,
      credentials.extra,
    );
  }

  async testConnection(
    ctx: TenantIntegrationContext,
    credentials: DecryptedCredentials,
  ) {
    this.assertContext(ctx);
    try {
      const bridge = this.buildBridge(credentials);
      const merchantId = String(credentials.extra.merchantId ?? '');
      await bridge.getStoreProducts(merchantId, 1);
      return this.ok('Hepsiburada API bağlantısı doğrulandı');
    } catch (error) {
      return this.fail('Hepsiburada bağlantı testi başarısız', error);
    }
  }

  async syncProducts(
    ctx: TenantIntegrationContext,
    credentials: DecryptedCredentials,
  ): Promise<SyncResultDto<NormalizedProductDto>> {
    this.assertContext(ctx);
    const started = Date.now();
    const bridge = this.buildBridge(credentials);
    const raw = await bridge.syncProducts();

    if (raw?.success === false) {
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
        errors: [String(raw.error ?? 'Sync başarısız')],
        durationMs: Date.now() - started,
      };
    }

    const raws = (raw?.products ?? []) as Record<string, unknown>[];
    const items = raws.map((p) =>
      p.productId
        ? normalizeHepsiburadaProduct(p)
        : normalizeGenericProduct(p, 'HEPSIBURADA'),
    );

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
      const orders = (raw?.orders ?? raw?.content ?? raw?.data ?? []) as Record<
        string,
        unknown
      >[];
      const list = Array.isArray(orders) ? orders : [];
      const items = list.map((o) => normalizeHepsiburadaOrder(o));

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
