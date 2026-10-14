import { SafeBulkService } from './safe-bulk.service';
describe('Bulk preview and safe rollback', () => {
  let products: any[]; let operations: any[]; let db: any; let service: SafeBulkService;
  beforeEach(() => {
    products = [{ id: 'p1', tenantId: 'a', sku: 'SKU1', title: 'Ürün', price: 100, stock: 5, updatedAt: new Date('2026-01-01') }]; operations = [];
    db = { $queryRawUnsafe: jest.fn(), user: { findFirst: jest.fn().mockResolvedValue({ id: 'u' }) }, product: {
      findMany: jest.fn(async ({ where }: any) => products.filter(p => p.tenantId === where.tenantId && where.id.in.includes(p.id))),
      updateMany: jest.fn(async ({ where, data }: any) => { const p = products.find(p => p.id === where.id && p.tenantId === where.tenantId && +p.updatedAt === +where.updatedAt && (where.price === undefined || p.price === where.price) && (where.stock === undefined || p.stock === where.stock)); if (!p) return { count: 0 }; Object.assign(p, data); return { count: 1 }; }),
    }, bulkAction: {
      create: jest.fn(async ({ data }: any) => { const row = { ...data, id: 'op'+operations.length }; operations.push(row); return row; }),
      findFirst: jest.fn(async ({ where }: any) => operations.find(p => p.id === where.id && p.tenantId === where.tenantId && (!where.userId || p.userId === where.userId))),
      update: jest.fn(async ({ where, data }: any) => Object.assign(operations.find(p => p.id === where.id), data)),
    }, activityLog: { create: jest.fn() } };
    db.$transaction = jest.fn(async (fn: any) => { const snapshot = products.map(p => ({ ...p })); const ops = operations.map(o => ({ ...o })); try { return await fn(db); } catch (error) { products = snapshot; operations = ops; throw error; } });
    service = new SafeBulkService(db);
  });
  const input = { action: 'price-update', productIds: ['p1'], type: 'percent', value: 10 };
  it('previews without mutating products, then applies and restores only the changed field', async () => {
    const preview = await service.preview('a','u',input); expect(products[0].price).toBe(100);
    expect(preview.changes[0]).toMatchObject({ before: { price: 100 }, after: { price: 110 } });
    await service.execute('a','u',preview.previewId); expect(products[0].price).toBe(110);
    await service.rollback('a',preview.previewId,'u'); expect(products[0]).toMatchObject({ price: 100, stock: 5 });
  });
  it('does not replay an applied preview', async () => { const p = await service.preview('a','u',input); await service.execute('a','u',p.previewId); expect(await service.execute('a','u',p.previewId)).toMatchObject({ repeated: true }); expect(products[0].price).toBe(110); });
  it('rejects a stale preview and preserves a later edit', async () => { const p = await service.preview('a','u',input); products[0].price = 150; products[0].updatedAt = new Date(); await expect(service.execute('a','u',p.previewId)).rejects.toThrow(/önizlemeden/); expect(products[0].price).toBe(150); });
  it('refuses rollback after another edit', async () => { const p = await service.preview('a','u',input); await service.execute('a','u',p.previewId); products[0].stock = 8; products[0].updatedAt = new Date(Date.now()+1000); await expect(service.rollback('a',p.previewId)).rejects.toThrow(/sonra değişti/); expect(products[0]).toMatchObject({ price: 110, stock: 8 }); });
  it('rolls back the transaction if any product conflicts', async () => { products.push({ ...products[0], id: 'p2', sku: 'SKU2' }); const p = await service.preview('a','u',{ ...input, productIds: ['p1','p2'] }); products[1].updatedAt = new Date(); await expect(service.execute('a','u',p.previewId)).rejects.toThrow(); expect(products[0].price).toBe(100); });
  it.each([{action:'stock-update',quantity:-1},{action:'stock-update',quantity:1.5},{action:'price-update',value:'NaN'},{action:'discount',value:101}])('rejects invalid input %j', async extra => await expect(service.preview('a','u',{...input,...extra})).rejects.toThrow());
  it('rejects a product from another tenant', async () => await expect(service.preview('b','u',input)).rejects.toThrow(/bulunamadı/));
  it('rejects applying another user preview', async () => { const p = await service.preview('a','u',input); await expect(service.execute('a','other',p.previewId)).rejects.toThrow(/bulunamadı/); });
});
