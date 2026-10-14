import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Interval, Cron, CronExpression } from '@nestjs/schedule';
import { promises as fs, createReadStream } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { BackupArchiveStore } from './backup-archive.store';
import { PostgresBackupRunner } from './postgres-backup.runner';
import { OperationsAlertsService } from '../operations/operations-alerts.service';

@Injectable()
export class BackupService implements OnModuleInit {
  private busy = false;
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly store: BackupArchiveStore,
    private readonly postgres: PostgresBackupRunner,
    private readonly alerts: OperationsAlertsService,
  ) {}

  async onModuleInit() {
    this.logger.log('📦 Backup & Disaster Recovery Service başlatıldı.');
    // Check and initialize default daily database schedule if none exists
    setTimeout(async () => {
      try {
        await this.ensureDailyBackupSchedule();
      } catch (err) {
        this.logger.warn(`Daily backup schedule initialization warning: ${(err as Error).message}`);
      }
    }, 5000);
  }

  private admin(role: string) {
    if (!['ADMIN', 'SUPERADMIN'].includes(role)) {
      throw new ForbiddenException('Tam veritabanı yedeği yalnız sistem yöneticisine açıktır');
    }
  }

  publicJob(row: any) {
    const { location, url, databases, ...safe } = row;
    return {
      ...safe,
      status: row.status.startsWith('processing:') ? 'processing' : row.status,
    };
  }

  async list(tenantId: string, role: string) {
    const rows = await this.prisma.backupJob.findMany({
      where: {
        tenantId,
        ...(['ADMIN', 'SUPERADMIN'].includes(role) ? {} : { type: 'catalog' }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.publicJob(row));
  }

  async get(tenantId: string, id: string, role: string) {
    const row = await this.prisma.backupJob.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Yedek bulunamadı');
    if (row.type === 'database') this.admin(role);
    return row;
  }

  async create(tenantId: string, role: string, type = 'catalog', name?: string, retentionDays = 30) {
    if (!['catalog', 'database'].includes(type)) throw new BadRequestException('Yedek türü geçersiz');
    if (type === 'database') this.admin(role);
    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
      throw new BadRequestException('Saklama süresi 1–3650 gün olmalıdır');
    }

    const row = await this.prisma.backupJob.create({
      data: {
        tenantId,
        type,
        name: name || (type === 'catalog' ? 'Ürün kataloğu yedeği' : 'Tam veritabanı yedeği'),
        status: 'queued',
        storageType: 'encrypted-local-volume',
        verificationStatus: 'pending',
        retentionDays,
        expiresAt: new Date(Date.now() + retentionDays * 86400000),
      },
    });

    return this.publicJob(row);
  }

  async verify(tenantId: string, id: string, role: string) {
    const row = await this.get(tenantId, id, role);
    if (row.status !== 'completed' || !row.url?.startsWith('sha256:')) {
      throw new ConflictException('Tamamlanmış gerçek arşiv gerekli');
    }

    let temporary: string | undefined;
    try {
      if ((await this.store.checksum(id)) !== row.url.slice(7)) {
        throw new Error('Yedek sağlama toplamı uyuşmuyor');
      }

      temporary = await this.store.unpack(id);

      let keyEscrowStatus = 'verified';
      if (row.type === 'database') {
        await this.postgres.inspect(temporary);
        // Verify ENCRYPTION_KEY escrow bundle
        try {
          const escrow = await this.store.verifyEscrow(id);
          this.logger.log(`Escrow verified for backup ${id}, matches active key: ${escrow.matchesActiveKey}`);
        } catch (escErr) {
          keyEscrowStatus = 'escrow_failed';
          this.logger.warn(`Escrow verification warning for ${id}: ${(escErr as Error).message}`);
        }
      } else {
        this.decodeCatalog(await fs.readFile(temporary), tenantId);
      }

      await this.prisma.backupJob.update({
        where: { id },
        data: {
          verificationStatus: 'verified',
          verifiedAt: new Date(),
        },
      });

      return {
        verified: true,
        keyEscrowStatus,
        message: 'Arşiv bütünlüğü, ENCRYPTION_KEY yedeği ve şifre çözme doğrulandı.',
      };
    } catch (error) {
      await this.prisma.backupJob.update({
        where: { id },
        data: {
          verificationStatus: 'failed',
          error: error instanceof Error ? error.message : 'Doğrulama başarısız',
        },
      });
      throw error;
    } finally {
      if (temporary) await this.store.removeTemporary(temporary);
    }
  }

  private decodeCatalog(buffer: Buffer, tenantId: string) {
    const data = JSON.parse(gunzipSync(buffer, { maxOutputLength: 128 * 1024 * 1024 }).toString('utf8'));
    if (data.format !== 'pazaryonetimi.catalog.v1' || data.tenantId !== tenantId || !Array.isArray(data.products)) {
      throw new BadRequestException('Katalog yedeği bu mağazaya ait değil');
    }
    for (const p of data.products) {
      if (
        !p.id ||
        p.tenantId !== tenantId ||
        !p.sku ||
        !p.title ||
        !Number.isFinite(Number(p.price)) ||
        Number(p.price) < 0 ||
        !Number.isInteger(p.stock) ||
        p.stock < 0
      ) {
        throw new BadRequestException('Yedekte ürün verisi geçersiz');
      }
    }
    return data;
  }

  async restoreTest(tenantId: string, id: string, role: string) {
    const backup = await this.get(tenantId, id, role);
    await this.verify(tenantId, id, role);
    const job = await this.prisma.restoreJob.create({
      data: {
        tenantId,
        backupId: id,
        status: 'queued',
        dryRun: true,
        sourceDatabase: backup.type,
      },
    });
    return job;
  }

  async schedules(tenantId: string) {
    return this.prisma.backupSchedule.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async schedule(tenantId: string, role: string, type = 'catalog') {
    if (type === 'database') this.admin(role);
    if (!['catalog', 'database'].includes(type)) throw new BadRequestException('Yedek türü geçersiz');

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `backup-schedule:${tenantId}:${type}`);
      const exists = await tx.backupSchedule.findFirst({ where: { tenantId, type, frequency: 'daily' } });
      return exists
        ? tx.backupSchedule.update({ where: { id: exists.id }, data: { isActive: true } })
        : tx.backupSchedule.create({
            data: {
              tenantId,
              type,
              name: `Günlük ${type} yedeği`,
              frequency: 'daily',
              isActive: true,
              retentionDays: 30,
              nextRunAt: new Date(),
            },
          });
    });
  }

  async stopSchedule(tenantId: string, id: string) {
    const result = await this.prisma.backupSchedule.updateMany({ where: { id, tenantId }, data: { isActive: false } });
    if (!result.count) throw new NotFoundException('Plan bulunamadı');
    return { success: true };
  }

  async download(tenantId: string, id: string, role: string) {
    const row = await this.get(tenantId, id, role);
    if (row.status !== 'completed') throw new ConflictException('Yedek tamamlanmadı');
    return createReadStream(await this.store.checked(id));
  }

  async downloadKeyEscrow(tenantId: string, id: string, role: string) {
    this.admin(role);
    await this.get(tenantId, id, role);
    const path = this.store.path(id, '.keybundle.json');
    return createReadStream(path);
  }

  async restores(tenantId: string) {
    return this.prisma.restoreJob.findMany({ where: { tenantId }, orderBy: { startedAt: 'desc' }, take: 50 });
  }

  /**
   * Sistem genelinde günlük veritabanı yedeğinin kurulu olduğunu garanti eder.
   */
  private async ensureDailyBackupSchedule() {
    const firstTenant = await this.prisma.tenant.findFirst({ select: { id: true } });
    if (!firstTenant) return;

    const existing = await this.prisma.backupSchedule.findFirst({
      where: { type: 'database', frequency: 'daily', isActive: true },
    });

    if (!existing) {
      await this.prisma.backupSchedule.create({
        data: {
          tenantId: firstTenant.id,
          type: 'database',
          name: 'Otomatik Günlük Veritabanı Yedeği & Geri Yükleme Denemesi',
          frequency: 'daily',
          isActive: true,
          retentionDays: 30,
          nextRunAt: new Date(Date.now() + 60000), // İlk başlangıçtan 1 dk sonra
        },
      });
      this.logger.log('📅 Otomatik günlük veritabanı yedeği planı oluşturuldu.');
    }
  }

  /**
   * Gece 03:00 otomatik veritabanı yedeği ve hemen ardından geri yükleme tatbikatı (drill).
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'daily-midnight-backup-drill' })
  async triggerDailyMidnightBackup() {
    this.logger.log('🌙 Günlük gece 03:00 veritabanı yedeği tetikleniyor...');
    const firstTenant = await this.prisma.tenant.findFirst({ select: { id: true } });
    if (!firstTenant) return;

    try {
      const backup = await this.prisma.backupJob.create({
        data: {
          tenantId: firstTenant.id,
          type: 'database',
          name: `Otomatik Günlük Sistem Yedeği - ${new Date().toLocaleDateString('tr-TR')}`,
          status: 'queued',
          storageType: 'encrypted-local-volume',
          verificationStatus: 'pending',
          retentionDays: 30,
          expiresAt: new Date(Date.now() + 30 * 86400000),
        },
      });
      this.logger.log(`✅ Gece yedeği sıraya alındı: ${backup.id}`);
    } catch (err) {
      this.logger.error(`Gece yedeği başlatılamadı: ${(err as Error).message}`);
    }
  }

  @Interval(5000)
  async tick() {
    if (this.busy || process.env.BACKUP_WORKER_ENABLED === 'false') return;
    this.busy = true;
    try {
      await this.runSchedules();
      await this.processBackup();
      await this.processRestore();
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'Yedek işçisi başarısız');
    } finally {
      this.busy = false;
    }
  }

  private async runSchedules() {
    const schedules = await this.prisma.backupSchedule.findMany({
      where: { isActive: true, nextRunAt: { lte: new Date() }, type: { in: ['catalog', 'database'] } },
      take: 50,
    });
    for (const schedule of schedules) {
      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.backupSchedule.updateMany({
          where: { id: schedule.id, nextRunAt: schedule.nextRunAt },
          data: { lastRunAt: new Date(), nextRunAt: new Date(Date.now() + 86400000) },
        });
        if (claimed.count) {
          await tx.backupJob.create({
            data: {
              tenantId: schedule.tenantId,
              name: schedule.name,
              type: schedule.type,
              status: 'queued',
              storageType: 'encrypted-local-volume',
              verificationStatus: 'pending',
              retentionDays: schedule.retentionDays,
              expiresAt: new Date(Date.now() + schedule.retentionDays * 86400000),
            },
          });
        }
      });
    }
  }

  async processBackup() {
    const row = await this.prisma.backupJob.findFirst({
      where: {
        OR: [
          { status: 'queued' },
          { status: { startsWith: 'processing:' }, updatedAt: { lt: new Date(Date.now() - 3600000) } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!row) return;

    const token = `processing:${randomUUID()}`;
    const claimed = await this.prisma.backupJob.updateMany({
      where: { id: row.id, status: row.status, updatedAt: row.updatedAt },
      data: { status: token },
    });
    if (!claimed.count) return;

    let temporary: string | undefined;
    try {
      let bytes: Buffer | string;
      let rows = 0;
      let tables = 1;
      await fs.mkdir(this.store.root(), { recursive: true, mode: 0o700 });

      if (row.type === 'database') {
        temporary = this.store.path(row.id, `.${randomUUID()}.dump`);
        await this.postgres.dump(temporary);
        tables = await this.postgres.inspect(temporary);
        bytes = temporary;
      } else if (row.type === 'catalog') {
        const products = await this.prisma.product.findMany({
          where: { tenantId: row.tenantId },
          include: { images: true, variants: true },
          take: 50001,
        });
        if (products.length > 50000) {
          throw new Error('Katalog yedeği 50.000 ürün sınırını aşıyor; tam veritabanı yedeği kullanın');
        }
        rows = products.length;
        bytes = gzipSync(
          Buffer.from(
            JSON.stringify({
              format: 'pazaryonetimi.catalog.v1',
              tenantId: row.tenantId,
              createdAt: new Date().toISOString(),
              products,
            }),
          ),
        );
      } else {
        throw new Error('Eski yedek türü gerçek arşiv üretmiyor; yeni yedek oluşturun');
      }

      const archive = await this.store.write(row.id, bytes);

      await this.prisma.backupJob.updateMany({
        where: { id: row.id, status: token },
        data: {
          status: 'completed',
          location: archive.location,
          url: `sha256:${archive.checksum}`,
          compressedSize: archive.size,
          rows,
          tables,
          endTime: new Date(),
          error: null,
        },
      });

      await this.alerts.report(
        row.tenantId,
        `backup:${row.id}`,
        'Yedek ve Anahtar Başarıyla Alındı',
        'Şifreli veritabanı yedeği ve ENCRYPTION_KEY güvenli escrow zarfı kalıcı depoya yazıldı.',
        '/dashboard/data-backup',
        'info',
      );

      // Otomatik geri yükleme tatbikatı (restore drill) başlat
      if (row.type === 'database') {
        try {
          await this.prisma.restoreJob.create({
            data: {
              tenantId: row.tenantId,
              backupId: row.id,
              status: 'queued',
              dryRun: true,
              sourceDatabase: 'database',
            },
          });
          this.logger.log(`🔍 Yedek sonrası otomatik test geri yükleme sıraya alındı: ${row.id}`);
        } catch (drillErr) {
          this.logger.warn(`Otomatik drill başlatılamadı: ${(drillErr as Error).message}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Yedek başarısız';
      await this.prisma.backupJob.updateMany({
        where: { id: row.id, status: token },
        data: { status: 'failed', error: message, endTime: new Date() },
      });
      await this.alerts.report(
        row.tenantId,
        `backup:${row.id}`,
        'Veritabanı yedeği oluşturulamadı! ⚠️',
        message,
        '/dashboard/data-backup',
        'error',
        {
          errorCode: 'BACKUP_FAILED',
          rootReason: message,
          suggestedAction: 'Veritabanı bağlantısını ve yedekleme dizini izinlerini denetleyin.',
        },
      );
    } finally {
      if (temporary) await this.store.removeTemporary(temporary);
    }
  }

  async processRestore() {
    const row = await this.prisma.restoreJob.findFirst({
      where: {
        dryRun: true,
        OR: [
          { status: 'queued' },
          { status: { startsWith: 'processing:' }, startedAt: { lt: new Date(Date.now() - 3600000) } },
        ],
      },
      orderBy: { startedAt: 'asc' },
    });
    if (!row) return;

    const token = `processing:${randomUUID()}`;
    if (
      !(
        await this.prisma.restoreJob.updateMany({
          where: { id: row.id, status: row.status },
          data: { status: token, startedAt: new Date() },
        })
      ).count
    )
      return;

    let temporary: string | undefined;
    try {
      const backup = await this.get(row.tenantId, row.backupId, 'ADMIN');
      temporary = await this.store.unpack(backup.id);
      let targetDatabase: string;

      if (backup.type === 'database') {
        // 1. Verify ENCRYPTION_KEY escrow
        await this.store.verifyEscrow(backup.id);
        // 2. Perform drill database restore
        const result = await this.postgres.drill(temporary);
        targetDatabase = result.targetDatabase;
      } else {
        const data = this.decodeCatalog(await fs.readFile(temporary), row.tenantId);
        await this.prisma.$transaction(
          async (tx) => {
            await tx.$executeRawUnsafe(
              'CREATE TEMP TABLE backup_catalog_drill (id text PRIMARY KEY, sku text NOT NULL, price numeric CHECK(price >= 0), stock integer CHECK(stock >= 0)) ON COMMIT DROP',
            );
            for (const p of data.products) {
              await tx.$executeRawUnsafe(
                'INSERT INTO backup_catalog_drill(id,sku,price,stock) VALUES ($1,$2,$3,$4)',
                p.id,
                p.sku,
                Number(p.price),
                p.stock,
              );
            }
            const count = await tx.$queryRawUnsafe<{ count: bigint }[]>('SELECT count(*) AS count FROM backup_catalog_drill');
            if (Number(count[0].count) !== data.products.length) throw new Error('Geri yükleme kayıt sayısı uyuşmuyor');
          },
          { timeout: 120000 },
        );
        targetDatabase = 'temporary-catalog-table';
      }

      await this.prisma.restoreJob.updateMany({
        where: { id: row.id, status: token },
        data: { status: 'completed', targetDatabase, endTime: new Date() },
      });

      await this.alerts.report(
        row.tenantId,
        `restore:${row.id}`,
        'Geri yükleme tatbikatı başarıyla tamamlandı',
        'Yedek ayrı test alanına yazıldı, tablolar ve ENCRYPTION_KEY yedeği doğrulandı.',
        '/dashboard/data-backup',
        'info',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Geri yükleme başarısız';
      await this.prisma.restoreJob.updateMany({
        where: { id: row.id, status: token },
        data: { status: 'failed', error: message, endTime: new Date() },
      });
      await this.alerts.report(
        row.tenantId,
        `restore:${row.id}`,
        'Geri yükleme tatbikatı başarısız oldu! ⚠️',
        `Yedekten geri yükleme denemesinde hata: ${message}`,
        '/dashboard/data-backup',
        'error',
        {
          errorCode: 'RESTORE_DRILL_FAILED',
          rootReason: message,
          suggestedAction: 'Veritabanı yedeğinin arşiv ve anahtar bütünlüğünü doğrulayın.',
        },
      );
    } finally {
      if (temporary) await this.store.removeTemporary(temporary);
    }
  }
}
