import { MarketplaceService } from './marketplace.service';
import { EncryptionService } from '../../common/encryption.service';

describe('Store reconnection and synchronization', () => {
  let db: any; let service: MarketplaceService; let connections: any; let rows: any[];
  const encryption = new EncryptionService();
  const creds = { supplierId: '123', apiKey: 'key', apiSecret: 'secret' };
  beforeEach(() => {
    rows = [];
    db = { integration: {
      findMany: jest.fn(async ({ where }: any) => rows.filter(row => row.tenantId === where.tenantId && row.platform === where.platform)),
      findFirst: jest.fn(async ({ where }: any) => rows.find(row => row.id === where.id && row.tenantId === where.tenantId && (where.isActive === undefined || row.isActive === where.isActive))),
      create: jest.fn(async ({ data }: any) => { const row = { ...data, id: 'i-'+rows.length, createdAt: new Date(), updatedAt: new Date() }; rows.push(row); return row; }),
      update: jest.fn(async ({ where, data }: any) => { const row = rows.find(row => row.id === where.id); Object.assign(row, data); return row; }),
    }, $queryRawUnsafe: jest.fn() };
    db.$transaction = jest.fn((callback: any) => callback(db));
    connections = { test: jest.fn().mockResolvedValue({ success: true, supported: true, verifiedAt: new Date().toISOString() }) };
    service = new MarketplaceService(db, {} as any, encryption, {} as any, connections);
    jest.spyOn(service as any, 'runInitialSyncAfterConnect').mockResolvedValue(undefined);
  });
  it('reconnects a legacy account rather than creating a duplicate', async () => {
    rows.push({ id: 'legacy', tenantId: 'a', platform: 'TRENDYOL', apiExtra: { supplierId: '123' }, apiKey: encryption.encrypt('old'), apiSecret: encryption.encrypt('old'), isActive: false, createdAt: new Date(), updatedAt: new Date() });
    const result = await service.connectStore('a', 'TRENDYOL', creds, 'trendyol');
    expect(result.integration.id).toBe('legacy'); expect(rows).toHaveLength(1);
    expect(rows[0].isActive).toBe(true); expect(encryption.decrypt(rows[0].apiKey)).toBe('key');
  });
  it('keeps different accounts and production/sandbox separate', async () => {
    await service.connectStore('a', 'TRENDYOL', creds, 'trendyol');
    await service.connectStore('a', 'TRENDYOL', { ...creds, supplierId: '456' }, 'trendyol');
    await service.connectStore('a', 'TRENDYOL', { ...creds, isTestMode: true }, 'trendyol');
    expect(rows).toHaveLength(3);
    await service.connectStore('a', 'TRENDYOL', { ...creds, isTestMode: 'false' }, 'trendyol');
    expect(rows).toHaveLength(3);
  });
  it('rejects invalid credentials before storing or syncing anything', async () => {
    connections.test.mockResolvedValue({ success: false, supported: true, message: 'HTTP 401' });
    await expect(service.connectStore('a', 'TRENDYOL', creds, 'trendyol')).rejects.toThrow('HTTP 401');
    expect(db.$transaction).not.toHaveBeenCalled();
    expect((service as any).runInitialSyncAfterConnect).not.toHaveBeenCalled();
  });
  it('saves an unsupported provider as inactive and unverified', async () => {
    connections.test.mockResolvedValue({ success: false, supported: false, message: 'not implemented' });
    const result = await service.connectStore('a', 'WOOCOMMERCE', { siteUrl: 'https://example.com', consumerKey: 'key', consumerSecret: 'secret' }, 'woocommerce');
    expect(result).toMatchObject({ connectionStatus: 'verification_pending', initialSyncStarted: false });
    expect(result.integration.isActive).toBe(false);
    expect((service as any).runInitialSyncAfterConnect).not.toHaveBeenCalled();
  });
  it('only syncs orders when orders were requested', async () => {
    await service.connectStore('a', 'TRENDYOL', creds, 'trendyol');
    const products = jest.spyOn(service, 'syncProductsForTenant').mockResolvedValue({ success: true, platform: 'TRENDYOL' as any, total: 0, created: 0, updated: 0, failed: 0 });
    jest.spyOn(service, 'syncPlatformOrdersForTenant').mockResolvedValue({ success: true, platform: 'TRENDYOL' as any, total: 0, created: 0, updated: 0, failed: 0 } as any);
    expect(await service.syncIntegrationByStoreId('a', rows[0].id, 'orders')).toMatchObject({ success: true, products: null });
    expect(products).not.toHaveBeenCalled();
  });
  it('cannot sync an account from another tenant', async () => {
    await service.connectStore('a', 'TRENDYOL', creds, 'trendyol');
    await expect(service.syncIntegrationByStoreId('b', rows[0].id, 'orders')).rejects.toThrow(/bulunamadı/);
  });
});
