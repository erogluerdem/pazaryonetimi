import { XmlJobQueueService } from './xml-job-queue.service';
import { EncryptionService } from '../../common/encryption.service';
describe('Durable XML queue submission', () => {
  let rows: any[]; let db: any; let queue: XmlJobQueueService;
  beforeEach(() => { rows = []; db = { $queryRawUnsafe: jest.fn(), dataOperation: {
    findUnique: jest.fn(async ({ where }: any) => rows.find(row => row.tenantId === where.tenantId_idempotencyKey.tenantId && row.idempotencyKey === where.tenantId_idempotencyKey.idempotencyKey)),
    findFirst: jest.fn(), create: jest.fn(async ({ data }: any) => { const row = { ...data, id: 'job'+rows.length, status: 'queued' }; rows.push(row); return row; }),
  }, xmlSupplier: { findFirst: jest.fn(), updateMany: jest.fn() } }; db.$transaction = (fn: any) => fn(db); queue = new XmlJobQueueService(db,new EncryptionService()); });
  it('deduplicates a retried network request and hides encrypted payload', async () => { const a = await queue.enqueue('a',{xml:'<root/>'},'request'); const b = await queue.enqueue('a',{xml:'<root/>'},'request'); expect(a.id).toBe(b.id); expect(rows).toHaveLength(1); expect(a).not.toHaveProperty('payloadEncrypted'); });
  it('keeps identical request keys separate between tenants', async () => { await queue.enqueue('a',{xml:'<root/>'},'request'); await queue.enqueue('b',{xml:'<root/>'},'request'); expect(rows).toHaveLength(2); });
  it('does not accept client-provided parsed rows or arbitrary write fields', async () => { await queue.enqueue('a',{xml:'<root/>',products:[{tenantId:'victim'}] as any},'request'); expect(queue.decode(rows[0]).products).toBeUndefined(); });
  it('requires tenant context and a source', async () => { await expect(queue.enqueue('',{xml:'x'})).rejects.toThrow(); await expect(queue.enqueue('a',{})).rejects.toThrow(); });
  it('rejects invalid markups before adding a job', async () => { await expect(queue.enqueue('a',{xml:'x',markupPercent:-1})).rejects.toThrow(); expect(rows).toHaveLength(0); });
  it('never enqueues a supplier owned by another tenant', async () => { db.xmlSupplier.findFirst.mockResolvedValue(null); await expect(queue.enqueue('a',{url:'https://example.com',supplierId:'other'})).rejects.toThrow(); });
});
