import { BackupModule } from './modules/backup/backup.module';
import { OperationsModule } from './modules/operations/operations.module';
import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { DiscoveryModule, APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './modules/ai/ai.module';
import { AiModelsModule } from './modules/ai-models/ai-models.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { ProductModule } from './modules/product/product.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiAdvisorModule } from './modules/ai-advisor/ai-advisor.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { IntegrationsCoreModule } from './modules/integrations-core/integrations-core.module';
import { SystemModule } from './modules/system/system.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MarketIntelligenceModule } from './modules/market-intelligence/market-intelligence.module';
import { FinanceModule } from './modules/finance/finance.module';
import { SupportModule } from './modules/support/support.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
// Yeni modüller
import { HealthModule } from './modules/health/health.module';
import { TwoFactorModule } from './modules/2fa/two-factor.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { PricingOptimizationModule } from './modules/pricing-optimization/pricing-optimization.module';
import { CustomerSegmentationModule } from './modules/customer-segmentation/customer-segmentation.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { DemoModule } from './modules/demo/demo.module';
import { SmsModule } from './modules/sms/sms.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { MetricsModule } from './modules/metrics/metrics.module';
import { EncryptionModule } from './common/encryption.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { EInvoiceModule } from './modules/e-invoice/e-invoice.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TenantCredentialsModule } from './modules/tenant-credentials/tenant-credentials.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ImageEditorModule } from './modules/image-editor/image-editor.module';
import { CopilotModule } from './modules/ai/copilot/copilot.module';
import { WorkflowBuilderModule } from './modules/workflow-builder/workflow-builder.module';
import { ScrapingModule } from './modules/scraping/scraping.module';
import { SearchModule } from './modules/search/search.module';
import { CommerceOpsModule } from './modules/commerce-ops/commerce-ops.module';
import { GrowthAiModule } from './modules/growth-ai/growth-ai.module';
import { EmailModule } from './modules/email/email.module';
import { AIAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { TenantServicesModule } from './common/services/tenant-services.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { CleanupService } from './common/services/cleanup.service';
import { CacheService } from './common/cache.service';
import { resolveRedisConnectionConfig } from './common/redis.config';
import { AiBlogGeneratorModule } from './modules/ai-blog-generator/ai-blog-generator.module';
import { XmlFeedsModule } from './modules/xml-feeds/xml-feeds.module';

const schedulerEnabled = process.env.ENABLE_SCHEDULER === 'true';

function getBullConnection() {
  const config = resolveRedisConnectionConfig();
  if (config) return config;

  return {
    host: '127.0.0.1',
    port: 6379,
  };
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DiscoveryModule,
    ConfigModule.forRoot({ isGlobal: true }),
    // Redis Cache
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 dakika default TTL
      max: 1000, // Maksimum 1000 öğe
    }),
    ...(schedulerEnabled
      ? [
          BullModule.forRootAsync({
            useFactory: () => ({
              connection: getBullConnection(),
            }),
          }),
        ]
      : []),
    DatabaseModule,
    RbacModule,
    TenantServicesModule,
    EncryptionModule,
    AiModule,
    AiModelsModule,
    MarketplaceModule,
    TenantModule,
    ProductModule,
    AnalyticsModule,
    AiAdvisorModule,
    AIAssistantModule,
    IntegrationsModule,
    IntegrationsCoreModule,
    SystemModule,
    OrdersModule,
    CustomersModule,
    InventoryModule,
    WebhooksModule,
    PerformanceModule,
    SubscriptionsModule,
    ReportsModule,
    MarketIntelligenceModule,
    FinanceModule,
    SupportModule,
    TestimonialsModule,
    AuditModule,
    NotificationsModule,
    // Yeni modüller
    HealthModule,
    TwoFactorModule,
    ...(schedulerEnabled ? [SchedulerModule] : []),
    WarehouseModule,
    PricingOptimizationModule,
    CustomerSegmentationModule,
    AffiliateModule,
    AdminModule,
    ReturnsModule,
    WhatsappModule,
    DemoModule,
    SmsModule,
    EmailModule,
    AuthModule,
    UsersModule,
    MetricsModule,
    ShippingModule,
    EInvoiceModule,
    CurrencyModule,
    PaymentsModule,
    TenantCredentialsModule,
    ReviewsModule,
    ImageEditorModule,
    CopilotModule,
    WorkflowBuilderModule,
    ScrapingModule,
    SearchModule,
    CommerceOpsModule,
    GrowthAiModule,
    AiBlogGeneratorModule,
    XmlFeedsModule,
    OperationsModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CacheService,
    CleanupService,
    // Global JWT auth guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
