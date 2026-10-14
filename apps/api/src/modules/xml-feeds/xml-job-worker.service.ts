import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { downloadXml } from '../../common/remote-resource';
import { parseXmlProducts } from './xml-product-parser';
import { XmlFeedsService } from './xml-feeds.service';
import { XmlJobQueueService } from '../operations/xml-job-queue.service';
import { OperationsAlertsService } from '../operations/operations-alerts.service';
@Injectable()
export class XmlJobWorkerService {
  private busy = false;
  private readonly logger = new Logger(XmlJobWorkerService.name);
  constructor(private readonly prisma: PrismaService, private readonly queue: XmlJobQueueService, private readonly feeds: XmlFeedsService, private readonly alerts: OperationsAlertsService) {}
  @Interval(2000)
  async tick() {
    if (this.busy || process.env.DATA_OPERATIONS_WORKER_ENABLED === 'false') return;
    this.busy = true;
    try { await this.processNext(); } catch (error) { this.logger.error(error instanceof Error ? error.message : 'XML işçisi başarısız'); } finally { this.busy = false; }
  }
  async processNext() {
    const now = new Date();
    const candidate = await this.prisma.dataOperation.findFirst({ where: { kind: 'xml-import', OR: [{ status: 'queued', availableAt: { lte: now } }, { status: 'processing', leaseUntil: { lt: now } }] }, orderBy: { availableAt: 'asc' } });
    if (!candidate) return;
    const token = randomUUID();
    const lease = await this.prisma.dataOperation.updateMany({ where: { id: candidate.id, OR: [{ status: 'queued', availableAt: { lte: now } }, { status: 'processing', leaseUntil: { lt: now } }] }, data: { status: 'processing', leaseToken: token, leaseUntil: new Date(Date.now() + 120000), attempts: { increment: 1 }, startedAt: candidate.startedAt || now } });
    if (!lease.count) return;
    const job = await this.prisma.dataOperation.findFirst({ where: { id: candidate.id, leaseToken: token } });
    if (!job) return;
    try {
      const payload = this.queue.decode(job);
      if (!payload.products) {
        payload.products = parseXmlProducts(payload.xml ?? (payload.url ? await downloadXml(payload.url) : ''), payload.mapping).products;
        delete payload.xml;
        await this.prisma.dataOperation.updateMany({ where: { id: job.id, leaseToken: token }, data: { payloadEncrypted: this.queue.encode(payload), total: payload.products.length } });
      }
      const batch = payload.products.slice(job.cursor, job.cursor + 250);
      const result = await this.prisma.$transaction(async tx => {
        const locked = await tx.$queryRawUnsafe<any[]>('SELECT "id" FROM "DataOperation" WHERE "id" = $1 AND "leaseToken" = $2 AND "status" = $3 FOR UPDATE', job.id, token, 'processing');
        if (!locked.length) throw new Error('Aktarım kilidi değişti');
        const counts = await this.feeds.persistProductsInTransaction(tx, job.tenantId, batch, payload);
        const cursor = job.cursor + batch.length;
        const total = payload.products!.length;
        const done = cursor >= total;
        const created = job.created + counts.created;
        const updated = job.updated + counts.updated;

        const priorResult = (job.result as Record<string, any>) || {};
        const priorFailedItems: any[] = Array.isArray(priorResult.failedItems) ? priorResult.failedItems : [];
        const newFailedItems = counts.failedItems || [];
        const combinedFailedItems = [...priorFailedItems, ...newFailedItems].slice(0, 500);
        const failedCount = (priorResult.failedCount || 0) + (counts.failed || 0);
        const percentage = Math.min(100, Math.round((cursor / total) * 100));

        const resultData = {
          created,
          updated,
          failedCount,
          failedItems: combinedFailedItems,
          importedCount: cursor,
          totalCount: total,
          percentage,
        };

        await tx.dataOperation.update({
          where: { id: job.id },
          data: {
            cursor,
            total,
            created,
            updated,
            attempts: 0,
            error: null,
            status: done ? 'completed' : 'queued',
            availableAt: new Date(Date.now() + 50),
            leaseToken: null,
            leaseUntil: null,
            completedAt: done ? new Date() : null,
            result: resultData,
          },
        });

        if (done) {
          await tx.activityLog.create({
            data: {
              tenantId: job.tenantId,
              resource: 'xml_import',
              resourceId: job.id,
              action: 'xml.imported',
              details: resultData,
            },
          });
          if (job.sourceId) {
            await tx.xmlSupplier.updateMany({
              where: { id: job.sourceId, tenantId: job.tenantId },
              data: { status: 'active', productsCount: cursor, lastSyncAt: new Date() },
            });
          }
        }
        return { done, result: resultData };
      }, { timeout: 90000, maxWait: 10000 });

      if (result.done) {
        if (result.result.failedCount > 0) {
          await this.alerts.report(
            job.tenantId,
            'xml-job:' + job.id,
            'XML aktarımı tamamlandı (Hatalı ürünler var)',
            `${result.result.created} ürün eklendi, ${result.result.updated} ürün güncellendi. ${result.result.failedCount} ürün format/veri hatası nedeniyle atlandı.`,
            '/dashboard/xml-import',
            'warning',
            {
              errorCode: 'XML_PARTIAL_SUCCESS',
              rootReason: `${result.result.failedCount} ürün eksik SKU/barkod veya geçersiz fiyat nedeniyle aktarılamadı.`,
              suggestedAction: 'Hatalı ürünler listesini kontrol edin.',
              jobId: job.id,
            },
          );
        } else {
          await this.alerts.report(
            job.tenantId,
            'xml-job:' + job.id,
            'XML aktarımı tamamlandı',
            result.result.created + ' ürün eklendi, ' + result.result.updated + ' ürün güncellendi.',
            '/dashboard/xml-import',
            'success',
          );
        }
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'XML aktarımı başarısız';
      const terminal = job.attempts >= 3;
      const changed = await this.prisma.dataOperation.updateMany({ where: { id: job.id, leaseToken: token }, data: { status: terminal ? 'failed' : 'queued', error: message.slice(0, 1000), availableAt: new Date(Date.now() + 5000 * 2 ** job.attempts), leaseToken: null, leaseUntil: null, completedAt: terminal ? new Date() : null } });
      if (changed.count && terminal) {
        if (job.sourceId) await this.prisma.xmlSupplier.updateMany({ where: { id: job.sourceId, tenantId: job.tenantId }, data: { status: 'error' } });
        await this.alerts.report(job.tenantId, 'xml-job:' + job.id, 'XML aktarımı durdu', message, '/dashboard/xml-import');
      }
    }
  }
}
