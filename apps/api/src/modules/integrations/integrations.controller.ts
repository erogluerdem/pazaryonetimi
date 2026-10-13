import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import {
  IntegrationsService,
  IntegrationCredentials,
} from './integrations.service';
import type { PlatformRegion, SubscriptionPlan } from './marketplace-registry';

@Controller('integrations')
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}
  private resolveTenantId(
    headerTenantId?: string,
    queryTenantId?: string,
    bodyTenantId?: string,
  ): string {
    return (headerTenantId || queryTenantId || bodyTenantId || '').trim();
  }


  // Tüm pazaryerlerini listele
  @Get('marketplaces')
  async getAllMarketplaces(
    @Headers('x-tenant-id') headerTenantId: string,
    @Query('tenantId') queryTenantId?: string,
    @Query('region') region?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.integrationsService.getAllMarketplaces(tenantId, {
      region: region as PlatformRegion,
      category,
      status,
      search,
    });
  }

  // Pazaryeri detayı
  @Get('marketplaces/:marketplaceId')
  async getMarketplaceDetails(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('marketplaceId') marketplaceId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.integrationsService.getMarketplaceDetails(
      marketplaceId,
      tenantId,
    );
  }

  // Kullanıcının entegrasyonlarını listele
  @Get('user')
  async getUserIntegrations(
    @Headers('x-tenant-id') headerTenantId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.integrationsService.getUserIntegrations(tenantId);
  }

  // Entegrasyon istatistikleri
  @Get('stats')
  async getIntegrationStats(
    @Headers('x-tenant-id') headerTenantId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.integrationsService.getIntegrationStats(tenantId);
  }

  // Pazaryerine bağlan
  @Post('connect')
  async connectMarketplace(
    @Headers('x-tenant-id') headerTenantId: string,
    @Body()
    data: {
      tenantId?: string;
      marketplaceId: string;
      credentials: IntegrationCredentials;
    },
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, undefined, data.tenantId);
    return this.integrationsService.connectMarketplace(
      tenantId,
      data.marketplaceId,
      data.credentials,
    );
  }

  // Bağlantıyı test et
  @Post('test/:integrationId')
  async testConnection(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('integrationId') integrationId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.integrationsService.testConnection(integrationId, tenantId);
  }

  // Pazaryeri bağlantısını kes
  @Put('disconnect/:marketplaceId')
  async disconnectMarketplace(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('marketplaceId') marketplaceId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.integrationsService.disconnectMarketplace(
      tenantId,
      marketplaceId,
    );
  }

  // Entegrasyonu sil
  @Delete(':marketplaceId')
  async deleteIntegration(
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('marketplaceId') marketplaceId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(headerTenantId, queryTenantId);
    return this.integrationsService.deleteIntegration(tenantId, marketplaceId);
  }

  // Entegrasyon senkronunu yeniden dene
  @Post(':integrationId/retry-sync')
  async retryIntegrationSync(
    @Param('integrationId') integrationId: string,
    @Query('tenantId') tenantId: string,
    @Body() body?: { syncType?: 'health-check' | 'order-sync' | 'inventory-sync' | 'all' },
  ) {
    return this.integrationsService.retryIntegrationSync(
      tenantId,
      integrationId,
      body?.syncType || 'all',
    );
  }

  // Senkronizasyon başlat
  @Post('sync/:marketplaceId')
  async syncMarketplace(
    @Param('marketplaceId') marketplaceId: string,
    @Query('tenantId') tenantId: string,
    @Body() data: { syncType: 'products' | 'orders' | 'inventory' | 'all' },
  ) {
    return this.integrationsService.syncMarketplace(
      tenantId,
      marketplaceId,
      data.syncType,
    );
  }

  // Bölgeye göre pazaryerleri
  @Get('by-region/:region')
  async getMarketplacesByRegion(@Param('region') region: string) {
    return this.integrationsService.getMarketplacesByRegion(
      region as PlatformRegion,
    );
  }

  // Plana göre erişilebilir pazaryerleri
  @Get('by-plan/:plan')
  async getAccessibleMarketplaces(@Param('plan') plan: string) {
    return this.integrationsService.getAccessibleMarketplaces(
      plan as SubscriptionPlan,
    );
  }
}
