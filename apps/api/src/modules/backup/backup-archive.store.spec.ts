import { BackupArchiveStore } from './backup-archive.store';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
describe('Real encrypted backup archives',()=>{
  const store=new BackupArchiveStore(); const original={...process.env}; const ids:string[]=[];
  beforeAll(()=>{process.env.BACKUP_STORAGE_DIR=resolve('../../scratch/backup-tests');process.env.BACKUP_ENCRYPTION_KEY='backup-unit-test-secret';});
  afterAll(async()=>{for(const id of ids)await fs.rm(store.path(id),{force:true});process.env={...original};});
  it('writes an authenticated archive and restores the exact bytes',async()=>{const id=randomUUID();ids.push(id);const source=Buffer.from('Gerçek yedek içeriği ğışü');const file=await store.write(id,source);expect(file.size).toBeGreaterThan(source.length);expect((await fs.readFile(file.location)).includes(source)).toBe(false);const temporary=await store.unpack(id);expect(await fs.readFile(temporary)).toEqual(source);await store.removeTemporary(temporary);});
  it('rejects a corrupt archive instead of reporting verified',async()=>{const id=randomUUID();ids.push(id);await store.write(id,Buffer.from('data'));const bytes=await fs.readFile(store.path(id));bytes[bytes.length-1]^=1;await fs.writeFile(store.path(id),bytes);await expect(store.unpack(id)).rejects.toThrow();});
  it('rejects a changed encryption key',async()=>{const id=randomUUID();ids.push(id);await store.write(id,Buffer.from('data'));process.env.BACKUP_ENCRYPTION_KEY='wrong';await expect(store.unpack(id)).rejects.toThrow();process.env.BACKUP_ENCRYPTION_KEY='backup-unit-test-secret';});
  it.each(['../secret','x/y','x\\y',''])('rejects unsafe file identity %s',id=>expect(()=>store.path(id)).toThrow());
});
