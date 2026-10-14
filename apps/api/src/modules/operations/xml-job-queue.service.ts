import { Injectable, BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { EncryptionService } from '../../common/encryption.service';
import type { ParsedXmlProduct, XmlFieldMapping } from '../xml-feeds/xml-product-parser';
export interface XmlJobPayload { xml?: string; url?: string; mapping?: XmlFieldMapping; markupPercent?: number; fixedFee?: number; supplierId?: string; products?: ParsedXmlProduct[]; }
@Injectable()
export class XmlJobQueueService {
  constructor(private readonly prisma: PrismaService, private readonly encryption: EncryptionService) {}
  publicJob(row: any) { const { payloadEncrypted, leaseToken, leaseUntil, ...publicData } = row; return publicData; }
  async enqueue(tenantId: string, payload: XmlJobPayload, key?: string) {
    if (!tenantId) throw new ForbiddenException('Mağaza oturumu gerekli');
    if (key && (typeof key !== 'string' || key.length > 200)) throw new BadRequestException('İstek kimliği geçersiz');
    if (!payload.xml && !payload.url) throw new BadRequestException('XML kaynağı gerekli');
    if (payload.xml && (typeof payload.xml !== 'string' || Buffer.byteLength(payload.xml) > 10 * 1024 * 1024)) throw new BadRequestException('XML dosyası 10 MB sınırını aşıyor');
    const markup = Number(payload.markupPercent ?? 0); const fee = Number(payload.fixedFee ?? 0);
    if (!Number.isFinite(markup) || markup < 0 || markup > 1000 || !Number.isFinite(fee) || fee < 0) throw new BadRequestException('Fiyat kuralı geçersiz');
    // Parsed rows are always produced by the server worker, never accepted from a client body.
    payload = { xml: payload.xml, url: payload.url, mapping: payload.mapping, markupPercent: markup, fixedFee: fee, supplierId: payload.supplierId };
    const idempotencyKey = key || randomUUID();
    return this.prisma.$transaction(async tx => {
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', 'xml-enqueue:' + tenantId + ':' + (payload.supplierId || idempotencyKey));
      if (payload.supplierId) {
        const source = await tx.xmlSupplier.findFirst({ where: { id: payload.supplierId, tenantId } });
        if (!source) throw new NotFoundException('XML kaynağı bulunamadı');
        const active = await tx.dataOperation.findFirst({ where: { tenantId, sourceId: source.id, status: { in: ['queued','processing'] } } });
        if (active) return this.publicJob(active);
      }
      const existing = await tx.dataOperation.findUnique({ where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } } });
      if (existing) return this.publicJob(existing);
      const row = await tx.dataOperation.create({ data: { tenantId, kind: 'xml-import', sourceId: payload.supplierId, idempotencyKey, payloadEncrypted: this.encryption.encrypt(JSON.stringify(payload)), total: 0 } });
      if (payload.supplierId) await tx.xmlSupplier.updateMany({ where: { id: payload.supplierId, tenantId }, data: { status: 'parsing' } });
      return this.publicJob(row);
    });
  }
  async enqueueFeed(tenantId: string, id: string, key?: string) {
    const source = await this.prisma.xmlSupplier.findFirst({ where: { id, tenantId }, include: { rules: true } });
    if (!source) throw new NotFoundException('XML kaynağı bulunamadı');
    const config = await this.prisma.activityLog.findFirst({ where: { tenantId, resource: 'xml_feed', resourceId: id, action: 'xml.feed.config' }, orderBy: { createdAt: 'desc' } });
    const mapping = (config?.details as { mapping?: XmlFieldMapping } | null)?.mapping;
    return this.enqueue(tenantId, { url: source.url, supplierId: id, mapping, markupPercent: Number(source.rules[0]?.markupPercent || 0), fixedFee: Number(source.rules[0]?.fixedFee || 0) }, key);
  }
  async list(tenantId: string) { const rows = await this.prisma.dataOperation.findMany({ where: { tenantId, kind: 'xml-import' }, orderBy: { createdAt: 'desc' }, take: 50 }); return rows.map(row => this.publicJob(row)); }
  async get(tenantId: string, id: string) { const row = await this.prisma.dataOperation.findFirst({ where: { id, tenantId } }); if (!row) throw new NotFoundException('Aktarım işi bulunamadı'); return this.publicJob(row); }
  async retry(tenantId: string, id: string) {
    return this.prisma.$transaction(async tx => {
      const job = await tx.dataOperation.findFirst({ where: { id, tenantId, status: 'failed' } });
      if (!job) throw new ConflictException('Yalnız başarısız iş yeniden denenebilir');
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', 'xml-enqueue:' + tenantId + ':' + (job.sourceId || job.id));
      if (job.sourceId) {
        const newer = await tx.dataOperation.findFirst({ where: { tenantId, sourceId: job.sourceId, id: { not: id }, OR: [{ status: { in: ['queued','processing'] } }, { createdAt: { gt: job.createdAt } }] } });
        if (newer) throw new ConflictException('Bu kaynak için daha yeni bir aktarım var; yeni senkronizasyon başlatın');
      }
      const result = await tx.dataOperation.updateMany({ where: { id, tenantId, status: 'failed' }, data: { status: 'queued', attempts: 0, availableAt: new Date(), completedAt: null, error: null } });
      if (!result.count) throw new ConflictException('İş durumu değişti');
      if (job.sourceId) await tx.xmlSupplier.updateMany({ where: { id: job.sourceId, tenantId }, data: { status: 'parsing' } });
      const row = await tx.dataOperation.findFirst({ where: { id, tenantId } });
      return this.publicJob(row);
    });
  }

  decode(row: { payloadEncrypted: string }): XmlJobPayload { const value = this.encryption.decrypt(row.payloadEncrypted); if (!value) throw new Error('Aktarım verisi çözülemedi'); return JSON.parse(value); }
  encode(payload: XmlJobPayload) { return this.encryption.encrypt(JSON.stringify(payload)); }
}
