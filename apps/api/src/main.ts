import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { winstonConfig } from './common/logger.config';
import helmet from 'helmet';
import { initSentry } from './common/sentry';

// Initialize Sentry before app creation
initSentry();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: winstonConfig,
  });

  // Security Headers
  app.useBodyParser('json', { limit: '22mb' });
  app.use(helmet());

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Prefix
  app.setGlobalPrefix('api');

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Tenant Isolation Interceptor - JWT tenantId'yi tüm request'lere enjekte eder
  app.useGlobalInterceptors(new TenantInterceptor());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or any pazaryonetimi domain / localhost
      if (!origin || origin === 'null') return callback(null, true);
      if (
        origin === 'https://pazaryonetimi.com' ||
        origin.endsWith('.pazaryonetimi.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-tenant-id',
      'x-api-key',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });

  // Swagger/OpenAPI Dokümantasyonu
  const config = new DocumentBuilder()
    .setTitle('PazarYonetimi API')
    .setDescription(
      `
## E-ticaret Pazar Yeri Yönetim Platformu API

Bu API, çoklu pazar yeri entegrasyonu, stok yönetimi, sipariş işleme, 
AI destekli fiyatlandırma, müşteri segmentasyonu ve daha fazlasını sağlar.

### Özellikler
- **Multi-marketplace Entegrasyonu**: Trendyol, Hepsiburada, Amazon, N11, Çiçeksepeti ve daha fazlası
- **Stok Yönetimi**: Çoklu depo, otomatik senkronizasyon, düşük stok uyarıları
- **Sipariş İşleme**: Otomatik durum güncelleme, kargo entegrasyonu
- **AI Fiyatlandırma**: Rakip analizi, dinamik fiyat optimizasyonu
- **Müşteri Analizi**: RFM segmentasyonu, lifetime value hesaplama
- **Affiliate Sistemi**: Referans programı, komisyon takibi
- **Raporlama**: Zamanlanmış raporlar, PDF/Excel export

### Kimlik Doğrulama
API, Bearer Token kimlik doğrulaması kullanır. Header'a ekleyin:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`
    `,
    )
    .setVersion('1.0')
    .addServer(
      process.env.API_URL || 'https://api.pazaryonetimi.com',
      'Production',
    )
    .addServer('http://localhost:3001', 'Geliştirme')
    .addBearerAuth()
    .addTag('Analytics', 'Dashboard ve analitik verileri')
    .addTag('Orders', 'Sipariş yönetimi')
    .addTag('Products', 'Ürün yönetimi')
    .addTag('Inventory', 'Stok yönetimi')
    .addTag('Warehouse Management', 'Çoklu depo yönetimi')
    .addTag('AI Pricing Optimization', 'AI destekli fiyatlandırma')
    .addTag('Customer Segmentation (RFM)', 'Müşteri segmentasyonu')
    .addTag('Affiliate Program', 'Referans programı')
    .addTag('Two-Factor Authentication', '2FA yönetimi')
    .addTag('Webhooks', 'Webhook yönetimi')
    .addTag('Health', 'Sistem sağlık kontrolü')
    .addTag('Shipping', 'Kargo ve lojistik yönetimi')
    .addTag('Payments', 'Ödeme işlemleri (iyzico)')
    .addTag('E-Invoice', 'E-fatura yönetimi (GİB)')
    .addTag('Currency', 'Döviz kuru ve çoklu para birimi')
    .addTag('Metrics', 'Prometheus metrikleri')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'PazarYonetimi API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // WebSocket adapter - temporarily disabled due to engine.io compatibility issues
  // app.useWebSocketAdapter(new CustomIoAdapter(app));

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api-docs`);
  // console.log(`🔌 WebSocket ready on ws://localhost:${port}/notifications`);
}
void bootstrap();
