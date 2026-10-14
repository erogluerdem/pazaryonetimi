import { XmlFeedsService } from './xml-feeds.service';
import { downloadXml } from '../../common/remote-resource';
jest.mock('../../common/remote-resource', () => ({ downloadXml: jest.fn(), validateRemoteUrl: jest.fn() }));

describe('XML feed persistence and isolation', () => {
  const xml = '<root><item><id>SKU-01</id><title>Çanta</title><price>50</price><costPrice>40</costPrice><stock>3</stock></item></root>';
  let db: any; let service: XmlFeedsService; let rows: any[];
  beforeEach(() => {
    rows = [];
    db = {
      product: {
        findFirst: jest.fn(async ({ where }: any) => rows.find(row => row.tenantId === where.tenantId && where.OR.some((clause: any) => clause.sku === row.sku || clause.barcode && clause.barcode === row.barcode))),
        create: jest.fn(async ({ data }: any) => { const row = { ...data, images: data.images?.create || [], id: 'p-'+rows.length }; rows.push(row); return row; }),
        update: jest.fn(async ({ where, data }: any) => { const row = rows.find(row => row.id === where.id); Object.assign(row, { ...data, ...(data.images ? { images: data.images.create } : {}) }); return row; }),
        findMany: jest.fn(async ({ where }: any) => rows.filter(row => row.tenantId === where.tenantId)),
      },
      xmlSupplier: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      activityLog: { create: jest.fn(), findFirst: jest.fn().mockResolvedValue(null) },
      $queryRawUnsafe: jest.fn(),
      $transaction: jest.fn(async (callback: any) => { const snapshot = rows.map(row => ({ ...row })); try { return await callback(db); } catch (error) { rows = snapshot; throw error; } }),
    };
    service = new XmlFeedsService(db);
    jest.clearAllMocks();
  });
  it('creates actual parsed products, applies price rules, and updates repeated imports', async () => {
    expect(await service.importXml('tenant-a', { xml, markupPercent: 25, fixedFee: 2 })).toMatchObject({ created: 1, updated: 0 });
    expect(rows[0]).toMatchObject({ tenantId: 'tenant-a', sku: 'SKU-01', price: 52, stock: 3 });
    expect(await service.importXml('tenant-a', { xml })).toMatchObject({ created: 0, updated: 1 });
    expect(rows).toHaveLength(1);
    expect(rows[0].price).toBe(50);
  });
  it('keeps the same SKU isolated across tenants', async () => {
    await service.importXml('tenant-a', { xml }); await service.importXml('tenant-b', { xml });
    expect(rows).toHaveLength(2);
    expect(rows.map(row => row.tenantId)).toEqual(['tenant-a','tenant-b']);
  });
  it('rejects malformed XML before any product write', async () => {
    await expect(service.importXml('tenant-a', { xml: '<root>' })).rejects.toThrow();
    expect(db.$transaction).not.toHaveBeenCalled(); expect(rows).toHaveLength(0);
  });
  it('writes audit and products in the same transaction', async () => {
    db.activityLog.create.mockRejectedValue(new Error('audit unavailable'));
    await expect(service.importXml('tenant-a', { xml })).rejects.toThrow('audit unavailable');
    expect(rows).toHaveLength(0);
  });
  it('never substitutes demo data for an unreadable URL', async () => {
    (downloadXml as jest.Mock).mockRejectedValue(new Error('upstream 404'));
    await expect(service.importXml('tenant-a', { url: 'https://feed.example.com/missing.xml' })).rejects.toThrow('upstream 404');
    expect(db.product.create).not.toHaveBeenCalled();
  });
  it('rejects absent tenant context', async () => await expect(service.importXml('', { xml })).rejects.toThrow());
  it('does not read or sync another tenant supplier', async () => {
    db.xmlSupplier.findFirst.mockResolvedValue(null);
    await expect(service.syncFeed('tenant-a', 'other-source')).rejects.toThrow();
    expect(db.xmlSupplier.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'other-source', tenantId: 'tenant-a' } }));
    expect(downloadXml).not.toHaveBeenCalled();
  });
  it('respects a supplier synchronization lease', async () => {
    db.xmlSupplier.findFirst.mockResolvedValue({ id: 'source', tenantId: 'tenant-a', url: 'https://example.com/feed', rules: [] });
    db.xmlSupplier.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.syncFeed('tenant-a', 'source')).rejects.toThrow(/zaten/);
    expect(downloadXml).not.toHaveBeenCalled();
  });
  it('marks an upstream failure as error and preserves last successful time', async () => {
    db.xmlSupplier.findFirst.mockResolvedValue({ id: 'source', tenantId: 'tenant-a', url: 'https://example.com/feed', rules: [] });
    (downloadXml as jest.Mock).mockRejectedValue(new Error('upstream unavailable'));
    await expect(service.syncFeed('tenant-a', 'source')).rejects.toThrow();
    expect(db.xmlSupplier.updateMany).toHaveBeenLastCalledWith({ where: { id: 'source', tenantId: 'tenant-a' }, data: { status: 'error' } });
  });
  it('uses saved custom mappings on manual and scheduled sync', async () => {
    db.xmlSupplier.findFirst.mockResolvedValue({ id: 'source', tenantId: 'tenant-a', url: 'https://example.com/feed', rules: [] });
    db.activityLog.findFirst.mockResolvedValue({ details: { mapping: { sku: 'kod', title: 'ad', price: 'tutar' } } });
    (downloadXml as jest.Mock).mockResolvedValue('<root><item><kod>A</kod><ad>B</ad><tutar>25</tutar></item></root>');
    expect(await service.syncFeed('tenant-a', 'source')).toMatchObject({ importedCount: 1, created: 1 });
    expect(rows[0]).toMatchObject({ tenantId: 'tenant-a', sku: 'A', price: 25 });
  });
  it('exports only the current tenant catalogue', async () => {
    await service.importXml('tenant-a', { xml }); await service.importXml('tenant-b', { xml });
    expect(await service.exportXml('tenant-a')).toMatchObject({ productCount: 1, filename: 'urunler.xml' });
    expect(db.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 'tenant-a' } }));
  });
});
