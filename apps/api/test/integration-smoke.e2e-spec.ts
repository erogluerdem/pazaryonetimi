import { MarketplaceConnectionService } from '../src/modules/marketplace/marketplace-connection.service';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MarketplaceController } from '../src/modules/marketplace/marketplace.controller';
import { MarketplaceService } from '../src/modules/marketplace/marketplace.service';
import { ReportsController } from '../src/modules/reports/reports.controller';
import { ReportsService } from '../src/modules/reports/reports.service';
import { EmailReportService } from '../src/modules/reports/email-report.service';
import { PrismaService } from '../src/database/prisma.service';

describe('Integration Smoke (e2e)', () => {
  let app: INestApplication;

  const marketplaceServiceMock = {
    syncAllPlatformsForTenant: jest
      .fn()
      .mockResolvedValue([{ platform: 'TRENDYOL', success: true }]),
    getBridgeForTenant: jest.fn().mockResolvedValue({
      syncProducts: jest.fn().mockResolvedValue({ success: true, count: 0 }),
    }),
    analyzeStore: jest.fn().mockResolvedValue({
      platform: 'TRENDYOL',
      storeId: '203786',
      storeName: 'Test Store',
      seoScore: 80,
      dataSources: {
        overall: 'scraped+calculated',
        seoScore: 'calculated',
        products: 'api_or_scraped',
        metrics: {
          rating: 'scraped',
          followers: 'scraped',
          titleOptimization: 'calculated',
          monthlyTraffic: 'not_available',
        },
        reasons: {
          monthlyTraffic: 'Public endpoint traffic bilgisi vermiyor.',
        },
      },
      confidence: {
        score: 78,
        breakdown: {
          total: 4,
          real: 2,
          calculated: 1,
          estimated: 0,
          unavailable: 1,
        },
      },
      metrics: {
        storeName: 'Test Store',
        rating: 4.6,
      },
      products: [],
      recommendations: [],
      timestamp: new Date().toISOString(),
    }),
    getStoreProducts: jest.fn().mockResolvedValue([]),
    getStoreInfo: jest.fn().mockResolvedValue({ storeName: 'Test' }),
    getStores: jest.fn().mockResolvedValue([]),
    getIntegrations: jest.fn().mockResolvedValue([]),
    connectStore: jest.fn().mockResolvedValue({ success: true }),
    disconnectStore: jest.fn().mockResolvedValue({ success: true }),
    syncProductsForTenant: jest.fn().mockResolvedValue({
      success: true,
      platform: 'TRENDYOL',
      total: 2,
      created: 1,
      updated: 1,
      failed: 0,
    }),
    syncAllOrdersForTenant: jest.fn().mockResolvedValue([
      {
        integrationId: 'int-1',
        platform: 'TRENDYOL',
        success: true,
        created: 1,
        updated: 0,
        failed: 0,
      },
    ]),
    syncPlatformOrdersForTenant: jest
      .fn()
      .mockResolvedValue({ success: true, created: 0, updated: 0, failed: 0 }),
    syncIntegrationByStoreId: jest.fn().mockResolvedValue({
      integrationId: 'store-1',
      platform: 'TRENDYOL',
      products: { success: true, total: 1, created: 1, updated: 0, failed: 0 },
      orders: { success: true, created: 1, updated: 0, failed: 0 },
    }),
    updateMarketplaceStock: jest.fn().mockResolvedValue({ success: true }),
    updateMarketplacePrice: jest.fn().mockResolvedValue({ success: true }),
    probeIntegrationContract: jest
      .fn()
      .mockResolvedValue({ success: true, score: 100, checks: [] }),
  };

  const reportsServiceMock = {
    generateReport: jest.fn().mockResolvedValue({
      period: 'monthly',
      startDate: new Date(),
      endDate: new Date(),
      storeName: 'Test Store',
      storeId: 'tenant-1',
      planType: 'professional',
      summary: {
        totalRevenue: 0,
        previousRevenue: 0,
        revenueChange: 0,
        totalOrders: 0,
        previousOrders: 0,
        ordersChange: 0,
        totalProducts: 0,
        activeProducts: 0,
        avgOrderValue: 0,
        previousAvgOrder: 0,
        avgOrderChange: 0,
        conversionRate: 0,
        previousConversion: 0,
        conversionChange: 0,
      },
      marketplaces: [],
      topProducts: [],
      lowPerformers: [],
      inventory: {
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        overstockCount: 0,
        turnoverRate: 0,
        alerts: [],
      },
      categories: [],
      timeline: { labels: [], revenue: [], orders: [] },
      aiRecommendations: [],
      goals: [],
    }),
    getAvailablePeriods: jest.fn().mockReturnValue(['weekly', 'monthly']),
    getPeriodName: jest.fn().mockImplementation((p: string) => p),
  };

  const emailReportServiceMock = {
    sendReportEmail: jest
      .fn()
      .mockResolvedValue({ success: true, messageId: 'msg-1' }),
    generateEmailTemplate: jest.fn().mockReturnValue('<html></html>'),
  };

  const prismaServiceMock = {
    report: {
      create: jest.fn().mockResolvedValue({ id: 'report-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    scheduledReport: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MarketplaceController, ReportsController],
      providers: [
        { provide: MarketplaceService, useValue: marketplaceServiceMock },
        { provide: MarketplaceConnectionService, useValue: { test: jest.fn().mockResolvedValue({ success: false, message: 'Invalid credentials' }) } },
        { provide: ReportsService, useValue: reportsServiceMock },
        { provide: EmailReportService, useValue: emailReportServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /marketplace/integrations smoke', async () => {
    await request(app.getHttpServer())
      .get('/marketplace/integrations?tenantId=tenant-1')
      .expect(200);
  });

  it('POST /marketplace/connect smoke', async () => {
    await request(app.getHttpServer())
      .post('/marketplace/connect')
      .send({
        tenantId: 'tenant-1',
        platform: 'TRENDYOL',
        credentials: { apiKey: 'k', apiSecret: 's' },
      })
      .expect(201);
  });

  it('POST /marketplace/sync-all smoke', async () => {
    const response = await request(app.getHttpServer())
      .post('/marketplace/sync-all')
      .set('x-tenant-id', 'tenant-1')
      .expect(201);

    expect(marketplaceServiceMock.syncAllPlatformsForTenant).toHaveBeenCalled();
    expect(response.body).toBeDefined();
  });

  it('POST /marketplace/sync-all-orders smoke', async () => {
    const response = await request(app.getHttpServer())
      .post('/marketplace/sync-all-orders')
      .set('x-tenant-id', 'tenant-1')
      .expect(201);

    expect(marketplaceServiceMock.syncAllOrdersForTenant).toHaveBeenCalledWith(
      'tenant-1',
    );
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /marketplace/sync-store/:storeId smoke', async () => {
    const response = await request(app.getHttpServer())
      .post('/marketplace/sync-store/store-1')
      .set('x-tenant-id', 'tenant-1')
      .send({ tenantId: 'tenant-1', syncType: 'all' })
      .expect(201);

    expect(marketplaceServiceMock.syncIntegrationByStoreId).toHaveBeenCalledWith(
      'tenant-1',
      'store-1',
      'all',
    );
    expect(response.body).toHaveProperty('products');
    expect(response.body).toHaveProperty('orders');
  });

  it('POST /marketplace/sync/:platform smoke', async () => {
    const response = await request(app.getHttpServer())
      .post('/marketplace/sync/trendyol')
      .set('x-tenant-id', 'tenant-1')
      .expect(201);

    expect(marketplaceServiceMock.syncProductsForTenant).toHaveBeenCalled();
    expect(response.body).toHaveProperty('success', true);
  });

  it('POST /marketplace/disconnect/:storeId smoke', async () => {
    await request(app.getHttpServer())
      .post('/marketplace/disconnect/store-1')
      .send({ tenantId: 'tenant-1' })
      .expect(201);
  });

  it('POST /marketplace/sync-orders/:platform smoke', async () => {
    await request(app.getHttpServer())
      .post('/marketplace/sync-orders/trendyol')
      .set('x-tenant-id', 'tenant-1')
      .expect(201);
  });

  it('POST /marketplace/stock/:platform smoke', async () => {
    await request(app.getHttpServer())
      .post('/marketplace/stock/trendyol')
      .set('x-tenant-id', 'tenant-1')
      .send({ sku: 'SKU-1', stock: 10, requestKey: 'rk-stock-1' })
      .expect(201);
  });

  it('POST /marketplace/price/:platform smoke', async () => {
    await request(app.getHttpServer())
      .post('/marketplace/price/trendyol')
      .set('x-tenant-id', 'tenant-1')
      .send({ sku: 'SKU-1', price: 123.45, requestKey: 'rk-price-1' })
      .expect(201);
  });

  it('GET /reports/:storeId smoke', async () => {
    await request(app.getHttpServer())
      .get('/reports/tenant-1?period=monthly&planType=professional')
      .expect(200);
  });

  it('GET /reports smoke', async () => {
    await request(app.getHttpServer())
      .get('/reports?tenantId=tenant-1')
      .expect(200);
  });

  it('GET /reports/scheduled smoke', async () => {
    await request(app.getHttpServer())
      .get('/reports/scheduled?tenantId=tenant-1')
      .expect(200);
  });

  it('GET /reports/export/:type smoke', async () => {
    await request(app.getHttpServer())
      .get('/reports/export/sales?tenantId=tenant-1&format=csv')
      .expect(200);
  });

  it('GET /marketplace/analyze/:platform/:storeId smoke', async () => {
    const response = await request(app.getHttpServer())
      .get('/marketplace/analyze/trendyol/203786')
      .expect(200);

    expect(response.body).toHaveProperty('dataSources');
    expect(response.body).toHaveProperty('confidence');
    expect(response.body.dataSources).toHaveProperty('metrics');
    expect(response.body.confidence).toHaveProperty('score');
  });

  it('GET /marketplace/store/:platform/:storeId/products smoke', async () => {
    await request(app.getHttpServer())
      .get('/marketplace/store/trendyol/203786/products?limit=5')
      .expect(200);
  });

  it('GET /marketplace/contract-probe/:platform smoke', async () => {
    await request(app.getHttpServer())
      .get(
        '/marketplace/contract-probe/trendyol?includeOrders=true&productLimit=3',
      )
      .set('x-tenant-id', 'tenant-1')
      .expect(200);
  });
});
