import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../../database/database.module';
import { EncryptionModule } from '../../common/encryption.module';
import { ScrapingModule } from '../scraping/scraping.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { IntegrationSyncQueueModule } from './queue/integration-sync-queue.module';
import { TenantContextService } from './context/tenant-context.service';
import { TenantCredentialResolverService } from './credentials/tenant-credential-resolver.service';
import { TrendyolAdapter } from './adapters/marketplace/trendyol.adapter';
import { HepsiburadaAdapter } from './adapters/marketplace/hepsiburada.adapter';
import { N11Adapter } from './adapters/marketplace/n11.adapter';
import { AmazonTrAdapter } from './adapters/marketplace/amazon-tr.adapter';
import { CiceksepetiAdapter } from './adapters/marketplace/ciceksepeti.adapter';
import { PttAvmAdapter } from './adapters/marketplace/pttavm.adapter';
import { EtsyAdapter } from './adapters/marketplace/etsy.adapter';
import { AliexpressAdapter } from './adapters/marketplace/aliexpress.adapter';
import { EbayAdapter } from './adapters/marketplace/ebay.adapter';
import { ShopifyAdapter } from './adapters/ecommerce/shopify.adapter';
import { IkasAdapter } from './adapters/ecommerce/ikas.adapter';
import { YurticiKargoAdapter } from './adapters/shipping/yurtici-kargo.adapter';
import { ArasKargoAdapter } from './adapters/shipping/aras-kargo.adapter';
import { ParasutAdapter } from './adapters/accounting/parasut.adapter';
import { UyumsoftAdapter } from './adapters/invoice/uyumsoft.adapter';
import { LogoAdapter } from './adapters/erp/logo.adapter';
import { GoogleMerchantAdapter } from './adapters/social/google-merchant.adapter';
import { AmazonFbaAdapter } from './adapters/fulfillment/amazon-fba.adapter';
import { IntegrationAdapterRegistry } from './registry/integration-adapter.registry';
import { INTEGRATION_SYNC_QUEUE } from './queue/integration-sync-queue.service';
import { IntegrationSyncProcessor } from './queue/integration-sync.processor';
import { IntegrationsHubService } from './integrations-hub.service';
import { IntegrationsHubController } from './integrations-hub.controller';
import { TenantContextInterceptor } from './context/tenant-context.interceptor';
import { MarketplaceInventoryStrategy } from './strategies/marketplace-inventory.strategy';
import { MarketplaceBridgeResolver } from './factory/marketplace-bridge.resolver';
import { IntegrationAdapterFactory } from './factory/integration-adapter.factory';
import { IntegrationMonitorService } from './health/integration-monitor.service';

const schedulerEnabled = process.env.ENABLE_SCHEDULER === 'true';

@Module({
  imports: [
    DatabaseModule,
    EncryptionModule,
    ScrapingModule,
    MarketplaceModule,
    IntegrationSyncQueueModule,
    ...(schedulerEnabled
      ? [BullModule.registerQueue({ name: INTEGRATION_SYNC_QUEUE })]
      : []),
  ],
  controllers: [IntegrationsHubController],
  providers: [
    TenantContextService,
    TenantCredentialResolverService,
    TrendyolAdapter,
    HepsiburadaAdapter,
    N11Adapter,
    AmazonTrAdapter,
    CiceksepetiAdapter,
    PttAvmAdapter,
    EtsyAdapter,
    AliexpressAdapter,
    EbayAdapter,
    ShopifyAdapter,
    IkasAdapter,
    YurticiKargoAdapter,
    ArasKargoAdapter,
    ParasutAdapter,
    UyumsoftAdapter,
    LogoAdapter,
    GoogleMerchantAdapter,
    AmazonFbaAdapter,
    MarketplaceBridgeResolver,
    IntegrationAdapterFactory,
    IntegrationAdapterRegistry,
    MarketplaceInventoryStrategy,
    IntegrationsHubService,
    IntegrationMonitorService,
    ...(schedulerEnabled ? [IntegrationSyncProcessor] : []),
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
  exports: [
    TenantContextService,
    IntegrationAdapterRegistry,
    IntegrationSyncQueueModule,
    IntegrationsHubService,
    MarketplaceInventoryStrategy,
    IntegrationMonitorService,
  ],
})
export class IntegrationsCoreModule {}
