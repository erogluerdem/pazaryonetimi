import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Headers,
  Query,
  Body,
} from '@nestjs/common';
import { MarketplaceService, Platform } from './marketplace.service';
import { Public } from '../auth/public.decorator';
import { MarketplaceConnectionService } from './marketplace-connection.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService, private readonly connections: MarketplaceConnectionService) {}

  @Post('test-credentials')
  testCredentials(@Body() body: { platform: string; credentials: Record<string, unknown> }) {
    return this.connections.test(body.platform, body.credentials);
  }

  private resolveTenantId(
    headerTenantId?: string,
    queryTenantId?: string,
    bodyTenantId?: string,
  ): string {
    return headerTenantId || queryTenantId || bodyTenantId || '';
  }

  @Post('sync-all')
  async syncAll(
    @Headers('x-tenant-id') headerTenantId: string,
    @Query('tenantId') queryTenantId?: string,
    @Body() body?: { tenantId?: string },
  ) {
    const tenantId = this.resolveTenantId(
      headerTenantId,
      queryTenantId,
      body?.tenantId,
    );
    return this.marketplaceService.syncAllPlatformsForTenant(tenantId);
  }

  @Post('sync/:platform')
  async syncPlatform(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('platform') platform: string,
    @Query('tenantId') queryTenantId?: string,
    @Body() body?: { tenantId?: string },
  ) {
    const tenantId = this.resolveTenantId(
      headerTenantId,
      queryTenantId,
      body?.tenantId,
    );
    return this.marketplaceService.syncProductsForTenant(
      tenantId,
      platform.toUpperCase() as Platform,
    );
  }

  @Post('sync-all-orders')
  async syncAllOrders(
    @Headers('x-tenant-id') headerTenantId: string,
    @Query('tenantId') queryTenantId?: string,
    @Body() body?: { tenantId?: string },
  ) {
    const tenantId = this.resolveTenantId(
      headerTenantId,
      queryTenantId,
      body?.tenantId,
    );
    return this.marketplaceService.syncAllOrdersForTenant(tenantId);
  }

  @Get('sync-status/:storeId')
  async getSyncStatus(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('storeId') storeId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.marketplaceService.getIntegrationSyncStatus(tenantId, storeId);
  }

  @Post('sync-store/:storeId')
  async syncStore(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('storeId') storeId: string,
    @Query('tenantId') queryTenantId?: string,
    @Body() body?: { tenantId?: string; syncType?: string },
  ) {
    const tenantId = this.resolveTenantId(
      headerTenantId,
      queryTenantId,
      body?.tenantId,
    );
    return this.marketplaceService.syncIntegrationByStoreId(
      tenantId,
      storeId,
      body?.syncType ?? 'all',
    );
  }

  @Post('sync-orders/:platform')
  async syncPlatformOrders(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('platform') platform: string,
    @Query('tenantId') queryTenantId?: string,
    @Body() body?: { tenantId?: string },
  ) {
    const tenantId = this.resolveTenantId(
      headerTenantId,
      queryTenantId,
      body?.tenantId,
    );
    return this.marketplaceService.syncPlatformOrdersForTenant(
      tenantId,
      platform.toUpperCase() as Platform,
    );
  }

  @Post('stock/:platform')
  async updateStock(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('platform') platform: string,
    @Query('tenantId') queryTenantId: string | undefined,
    @Body() body: { sku: string; stock: number; requestKey?: string },
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.marketplaceService.updateMarketplaceStock(
      tenantId,
      platform.toUpperCase() as Platform,
      body.sku,
      body.stock,
      body.requestKey,
    );
  }

  @Post('price/:platform')
  async updatePrice(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('platform') platform: string,
    @Query('tenantId') queryTenantId: string | undefined,
    @Body() body: { sku: string; price: number; requestKey?: string },
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.marketplaceService.updateMarketplacePrice(
      tenantId,
      platform.toUpperCase() as Platform,
      body.sku,
      body.price,
      body.requestKey,
    );
  }

  @Get('contract-probe/:platform')
  async probeContract(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('platform') platform: string,
    @Query('tenantId') queryTenantId: string | undefined,
    @Query('includeOrders') includeOrders?: string,
    @Query('productLimit') productLimit?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.marketplaceService.probeIntegrationContract(
      tenantId,
      platform.toUpperCase() as Platform,
      {
        includeOrders: includeOrders === '1' || includeOrders === 'true',
        productLimit: productLimit ? Number(productLimit) : undefined,
      },
    );
  }

  @Get('contract-probe-all')
  async probeAllContracts(
    @Headers('x-tenant-id') headerTenantId: string,
    @Query('tenantId') queryTenantId: string | undefined,
    @Query('includeOrders') includeOrders?: string,
    @Query('productLimit') productLimit?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.marketplaceService.probeAllIntegrationsForTenant(tenantId, {
      includeOrders: includeOrders === '1' || includeOrders === 'true',
      productLimit: productLimit ? Number(productLimit) : undefined,
    });
  }

  /**
   * Mağaza analizi - Pazaryerinden gerçek veriler çek ve analiz et
   */
  @Public()
  @Get('analyze/:platform/:storeId')
  async analyzeStore(
    @Param('platform') platform: string,
    @Param('storeId') storeId: string,
    @Query('url') url?: string,
  ) {
    const platformUpper = platform.toUpperCase() as Platform;

    // Eğer URL verilmişse, URL'den store ID'sini çıkart
    let actualStoreId = storeId;
    if (url) {
      actualStoreId = this.extractStoreIdFromUrl(url, platformUpper);
    }

    return this.marketplaceService.analyzeStore(platformUpper, actualStoreId);
  }

  /**
   * Mağaza ürünlerini getir
   */
  @Public()
  @Get('store/:platform/:storeId/products')
  async getStoreProducts(
    @Param('platform') platform: string,
    @Param('storeId') storeId: string,
    @Query('limit') limit: number = 10,
  ) {
    const platformUpper = platform.toUpperCase() as Platform;
    return this.marketplaceService.getStoreProducts(
      platformUpper,
      storeId,
      limit,
    );
  }

  /**
   * Mağaza bilgilerini getir
   */
  @Public()
  @Get('store/:platform/:storeId/info')
  async getStoreInfo(
    @Param('platform') platform: string,
    @Param('storeId') storeId: string,
  ) {
    const platformUpper = platform.toUpperCase() as Platform;
    return this.marketplaceService.getStoreInfo(platformUpper, storeId);
  }

  // ==================== STORE MANAGEMENT ====================
  /**
   * Mağazaları listele
   * GET /marketplace/stores
   */
  @Get('stores')
  async getStores(
    @Headers('x-tenant-id') headerTenantId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.marketplaceService.getStores(tenantId);
  }

  /**
   * Entegrasyonları listele
   * GET /marketplace/integrations
   */
  @Get('integrations')
  async getIntegrations(
    @Headers('x-tenant-id') headerTenantId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.marketplaceService.getIntegrations(tenantId);
  }

  /**
   * Mağaza bağla
   * POST /marketplace/connect
   */
  @Post('connect')
  async connectStore(
    @Headers('x-tenant-id') headerTenantId: string,
    @Body()
    data: {
      tenantId?: string;
      platform: string;
      credentials: Record<string, unknown>;
      marketplaceId?: string;
    },
  ) {
    const tenantId = this.resolveTenantId(
      headerTenantId,
      undefined,
      data.tenantId,
    );
    return this.marketplaceService.connectStore(
      tenantId,
      data.platform,
      data.credentials,
      data.marketplaceId,
    );
  }

  /**
   * Mağaza bağlantısını kes
   * POST & DELETE /marketplace/disconnect/:storeId
   */
  @Post('disconnect/:storeId')
  async disconnectStore(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('storeId') storeId: string,
    @Body() data?: { tenantId?: string },
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(
      headerTenantId,
      queryTenantId,
      data?.tenantId,
    );
    return this.marketplaceService.disconnectStore(tenantId, storeId);
  }

  @Delete('disconnect/:storeId')
  async deleteStoreDisconnect(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('storeId') storeId: string,
    @Body() data?: { tenantId?: string },
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(
      headerTenantId,
      queryTenantId,
      data?.tenantId,
    );
    return this.marketplaceService.disconnectStore(tenantId, storeId);
  }

  private extractStoreIdFromUrl(url: string, platform: Platform): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const pathname = urlObj.pathname;

      if (platform === Platform.TRENDYOL) {
        const mid =
          urlObj.searchParams.get('mid') ||
          urlObj.searchParams.get('merchantId');
        if (mid && /^\d+$/.test(mid)) return mid;

        const slugMatch = pathname.match(
          /(?:^|\/)((?:[a-z0-9]+-)*m-\d+)$/i,
        );
        if (slugMatch?.[1]) {
          const id = slugMatch[1].split('-m-').pop();
          if (id && /^\d+$/.test(id)) return id;
        }

        const magazaMatch = pathname.match(/\/magaza\/(?:profil\/)?([^/?]+)/i);
        if (magazaMatch?.[1]) {
          const slug = magazaMatch[1];
          const mPart = slug.match(/-m-(\d+)$/i);
          if (mPart?.[1]) return mPart[1];
          const tail = slug.split('-').pop();
          if (tail && /^\d+$/.test(tail)) return tail;
        }
      }

      if (platform === Platform.HEPSIBURADA) {
        // https://www.hepsiburada.com/magaza/happycomtr
        const match = pathname.match(/\/magaza\/([^/?]+)/);
        return match ? match[1] : 'hepsiburada';
      }

      if (platform === Platform.AMAZON) {
        // https://www.amazon.com.tr/sp?seller=A123456789
        const sellerParam =
          urlObj.searchParams.get('seller') ||
          urlObj.searchParams.get('merchant');
        if (sellerParam) return sellerParam;

        // https://www.amazon.com.tr/s?me=A123456789
        const meParam = urlObj.searchParams.get('me');
        if (meParam) return meParam;
      }

      // Global Fallback: return the last part of the path if no match
      const pathParts = pathname.split('/').filter((p) => p.length > 0);
      return pathParts[pathParts.length - 1] || '203786';
    } catch {
      return '203786'; // Default fallback
    }
  }
}
