import { MarketplaceConnectionService } from '../../../marketplace/marketplace-connection.service';
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
import { normalizeHepsiburadaOrder } from '../../normalizers/order.normalizer';
import { N11Bridge } from '../../../marketplace/n11.bridge';
import { ScrapingService } from '../../../scraping/scraping.service';

/** N11 pazaryeri adapter'ı */
@Injectable()
export class N11Adapter
  extends BaseIntegrationAdapter
  implements IMarketplaceProvider
{
  readonly providerId = 'n11';
  readonly displayName = 'N11';
  readonly category = IntegrationCategory.MARKETPLACE;

  constructor(private readonly scrapingService: ScrapingService) {
    super();
  }

  private buildBridge(credentials: DecryptedCredentials): N11Bridge {
    return new N11Bridge(
      credentials.apiKey,
      credentials.apiSecret,
      this.scrapingService,
    );
  }

  async testConnection(ctx: TenantIntegrationContext, credentials: DecryptedCredentials) {
    this.assertContext(ctx);
    const result = await new MarketplaceConnectionService().test(this.providerId, { ...credentials.extra, apiKey: credentials.apiKey, apiSecret: credentials.apiSecret });
    return result.success ? this.ok(result.message) : this.fail(result.message);
  }

  async syncProducts(
    ctx: TenantIntegrationContext,
    credentials: DecryptedCredentials,
  ): Promise<SyncResultDto<NormalizedProductDto>> {
    this.assertContext(ctx);
    const started = Date.now();
    const raw = await this.buildBridge(credentials).syncProducts();
    const raws = (raw?.products ?? []) as Record<string, unknown>[];
    const items = raws.map((p) => normalizeGenericProduct(p, 'N11'));

    return {
      success: raw?.success !== false,
      tenantId: ctx.tenantId,
      providerId: this.providerId,
      syncType: IntegrationSyncType.PRODUCTS,
      total: items.length,
      created: items.length,
      updated: 0,
      failed: raw?.success === false ? 1 : 0,
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
    try {
      const raw = await this.buildBridge(credentials).syncOrders();
      const orders = (raw?.orders ?? []) as Record<string, unknown>[];
      const items = orders.map((o) => normalizeHepsiburadaOrder(o));

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
}
