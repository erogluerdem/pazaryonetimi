import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { IntegrationsHubService } from './integrations-hub.service';
import { ProviderContractTestService } from './contract-test/provider-contract-test.service';
import { IntegrationCategory } from './enums/integration-category.enum';
import { IntegrationSyncType } from './enums/integration-category.enum';

/**
 * Birleşik entegrasyon REST API'si.
 * Tüm endpoint'ler x-tenant-id (JWT interceptor tarafından set edilir) gerektirir.
 */
@Controller('integrations-hub')
export class IntegrationsHubController {
  constructor(
    private readonly hub: IntegrationsHubService,
    private readonly contractTest: ProviderContractTestService,
  ) {}

  private resolveTenantId(header?: string, query?: string): string {
    return header || query || '';
  }

  /** GET /integrations-hub/catalog?category=MARKETPLACE */
  @Get('catalog')
  getCatalog(@Query('category') category?: IntegrationCategory) {
    return this.hub.getCatalog(category);
  }

  /** GET /integrations-hub/omnichannel — 8 kategori tam platform listesi */
  @Get('omnichannel')
  getOmnichannelCatalog(@Query('category') category?: IntegrationCategory) {
    return this.hub.getOmnichannelCatalog(category);
  }

  /** GET /integrations-hub/queue-status — tenant rate limit & circuit durumu */
  @Get('queue-status')
  getQueueStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Query('providerId') providerId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const resolved = tenantId || queryTenantId || '';
    return this.hub.getQueueStatus(resolved, providerId);
  }

  /** GET /integrations-hub/connections */
  @Get('connections')
  listConnections(
    @Headers('x-tenant-id') tenantId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    return this.hub.listTenantIntegrations(
      this.resolveTenantId(tenantId, queryTenantId),
    );
  }

  /** POST /integrations-hub/connect */
  @Post('connect')
  connect(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      tenantId?: string;
      providerId: string;
      credentials: Record<string, unknown>;
    },
  ) {
    const resolved = this.resolveTenantId(tenantId, body.tenantId);
    return this.hub.connectProvider(
      resolved,
      body.providerId,
      body.credentials,
    );
  }

  /** POST /integrations-hub/:integrationId/test */
  @Post(':integrationId/test')
  test(
    @Headers('x-tenant-id') tenantId: string,
    @Param('integrationId') integrationId: string,
    @Body() body: { providerId: string; tenantId?: string },
  ) {
    return this.hub.testProvider(
      this.resolveTenantId(tenantId, body.tenantId),
      integrationId,
      body.providerId,
    );
  }

  /** POST /integrations-hub/:integrationId/sync */
  @Post(':integrationId/sync')
  sync(
    @Headers('x-tenant-id') tenantId: string,
    @Param('integrationId') integrationId: string,
    @Body()
    body: {
      syncType?: IntegrationSyncType;
      tenantId?: string;
      sku?: string;
      quantity?: number;
      price?: number;
    },
  ) {
    return this.hub.triggerSync(
      this.resolveTenantId(tenantId, body.tenantId),
      integrationId,
      body.syncType ?? IntegrationSyncType.ALL,
      {
        sku: body.sku,
        quantity: body.quantity,
        price: body.price,
      },
    );
  }

  /** GET /integrations-hub/contract-test/gate — Temel pazaryeri doğrulama ve Tier 2 açma kuralı */
  @Get('contract-test/gate')
  getContractGate(
    @Headers('x-tenant-id') tenantId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    return this.contractTest.evaluateCoreGate(this.resolveTenantId(tenantId, queryTenantId));
  }

  /** POST /integrations-hub/contract-test/run — Sağlayıcı sözleşme testi (Auth, Ürün, Sipariş, Stok) */
  @Post('contract-test/run')
  runContractTest(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      providerId?: string;
      integrationId?: string;
      tenantId?: string;
    },
  ) {
    const resolved = this.resolveTenantId(tenantId, body.tenantId);
    if (body.providerId) {
      return this.contractTest.runContractTest(resolved, body.providerId, body.integrationId);
    }
    return this.contractTest.runAllActiveContractTests(resolved);
  }
}
