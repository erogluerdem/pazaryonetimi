import { XmlJobWorkerService } from './xml-job-worker.service';
import { EncryptionService } from '../../common/encryption.service';
import { XmlJobQueueService } from '../operations/xml-job-queue.service';
describe('XML checkpoint recovery', () => {
  let job: any; let db: any; let worker: XmlJobWorkerService; let writes: any[]; let feeds: any; let alerts: any;
  beforeEach(() => {
    const products = Array.from({length:300},(_,i)=>({ sku:'S'+i,title:'Ürün',price:10,costPrice:10,stock:1,category:'',brand:'',description:'',images:[] }));
    const encryption = new EncryptionService(); job = { id:'j',tenantId:'a',kind:'xml-import',status:'queued',cursor:0,total:300,created:0,updated:0,attempts:0,payloadEncrypted:encryption.encrypt(JSON.stringify({products})),availableAt:new Date(),startedAt:null };
    writes=[]; db = { dataOperation: {
      findFirst:jest.fn(async ({where}:any)=>where.id?job: ['queued','processing'].includes(job.status)?job:null),
      updateMany:jest.fn(async ({where,data}:any)=>{if(where.leaseToken && where.leaseToken!==job.leaseToken)return{count:0};Object.assign(job,data,{attempts:data.attempts?.increment?job.attempts+data.attempts.increment:data.attempts??job.attempts});return{count:1};}),
      update:jest.fn(async ({data}:any)=>Object.assign(job,data)),
    }, $queryRawUnsafe:jest.fn().mockResolvedValue([{id:'j'}]), activityLog:{create:jest.fn()},xmlSupplier:{updateMany:jest.fn()} };
    db.$transaction=async(fn:any)=>{const snapshot={...job};const size=writes.length;try{return await fn(db);}catch(error){job=snapshot;writes.splice(size);throw error;}};
    feeds={persistProductsInTransaction:jest.fn(async(_tx:any,_tenant:any,rows:any[])=>{writes.push(...rows);return{created:rows.length,updated:0};})};alerts={report:jest.fn()};
    worker=new XmlJobWorkerService(db,new XmlJobQueueService(db,encryption),feeds,alerts);
  });
  it('commits product writes and the cursor together, then continues after a new worker instance', async()=>{
    await worker.processNext();expect(job).toMatchObject({cursor:250,status:'queued',created:250});
    worker=new XmlJobWorkerService(db,new XmlJobQueueService(db,new EncryptionService()),feeds,alerts);
    await worker.processNext();expect(job).toMatchObject({cursor:300,status:'completed',created:300});expect(new Set(writes.map(p=>p.sku)).size).toBe(300);expect(writes).toHaveLength(300);
  });
  it('does not advance the cursor when a batch transaction fails',async()=>{
    feeds.persistProductsInTransaction.mockImplementationOnce(async()=>{writes.push({sku:'partial'});throw new Error('database unavailable');});
    await worker.processNext();expect(job.cursor).toBe(0);expect(writes).toHaveLength(0);expect(job.status).toBe('queued');
    await worker.processNext();expect(job.cursor).toBe(250);expect(writes).toHaveLength(250);
  });
  it('does not write when another worker owns the row lock',async()=>{db.$queryRawUnsafe.mockResolvedValue([]);await worker.processNext();expect(feeds.persistProductsInTransaction).not.toHaveBeenCalled();expect(job.cursor).toBe(0);});
  it('records a terminal failure and notifies after the last retry',async()=>{job.attempts=2;feeds.persistProductsInTransaction.mockRejectedValue(new Error('invalid row'));await worker.processNext();expect(job.status).toBe('failed');expect(alerts.report).toHaveBeenCalledWith('a','xml-job:j','XML aktarımı durdu','invalid row','/dashboard/xml-import');});
});
