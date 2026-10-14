import { Injectable } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
const execute = promisify(execFile);
@Injectable()
export class PostgresBackupRunner {
  env(raw: string, database?: string) {
    const url = new URL(raw); if (!['postgres:','postgresql:'].includes(url.protocol)) throw new Error('PostgreSQL bağlantısı gerekli');
    return { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: database || decodeURIComponent(url.pathname.slice(1)), ...(url.searchParams.get('sslmode') ? { PGSSLMODE: url.searchParams.get('sslmode')! } : {}) };
  }
  async dump(path: string) {
    if (!process.env.DATABASE_URL) throw new Error('Veritabanı bağlantısı eksik');
    try { await execute(process.env.PG_DUMP_BINARY || 'pg_dump', ['--format=custom','--no-owner','--no-acl','--file', path], { env: this.env(process.env.DATABASE_URL), timeout: 900000, maxBuffer: 1024 * 1024 }); } catch { throw new Error('pg_dump başarısız; PostgreSQL araç sürümünü ve erişim yetkisini kontrol edin'); }
  }
  async inspect(path: string) { try { const result = await execute(process.env.PG_RESTORE_BINARY || 'pg_restore', ['--list', path], { timeout: 60000, maxBuffer: 8 * 1024 * 1024 }); return result.stdout.split('\n').filter(line => line.includes(' TABLE DATA ')).length; } catch { throw new Error('Veritabanı yedek arşivi okunamadı'); } }
  async drill(path: string) {
    const adminUrl = process.env.RESTORE_DRILL_ADMIN_URL;
    if (!adminUrl) throw new Error('Geri yükleme denemesi için RESTORE_DRILL_ADMIN_URL gerekli');
    const name = 'pazaryonetimi_restore_drill_' + randomUUID().replace(/-/g, '');
    if (!/^pazaryonetimi_restore_drill_[a-f0-9]{32}$/.test(name)) throw new Error('Test veritabanı adı geçersiz');
    const source = new URL(process.env.DATABASE_URL || '');
    if (name === decodeURIComponent(source.pathname.slice(1))) throw new Error('Üretim veritabanı test hedefi olamaz');
    const admin = new Client({ connectionString: adminUrl }); let created = false; let restored: Client | undefined;
    await admin.connect();
    try {
      await admin.query('CREATE DATABASE "' + name + '" TEMPLATE template0'); created = true;
      await execute(process.env.PG_RESTORE_BINARY || 'pg_restore', ['--exit-on-error','--no-owner','--no-acl','--dbname', name, path], { env: this.env(adminUrl, name), timeout: 900000, maxBuffer: 1024 * 1024 });
      const url = new URL(adminUrl); url.pathname = '/' + name;
      restored = new Client({ connectionString: url.toString() }); await restored.connect();
      const rows = await restored.query("SELECT count(*)::int AS tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
      if (!rows.rows[0]?.tables) throw new Error('Geri yükleme tablosu bulunamadı');
      return { tables: rows.rows[0].tables, targetDatabase: name, restored: true };
    } catch { throw new Error('Geri yükleme denemesi başarısız; yalnız geçici test veritabanı kullanıldı'); }
    finally {
      if (restored) await restored.end();
      if (created) await admin.query('DROP DATABASE "' + name + '"');
      await admin.end();
    }
  }
}
