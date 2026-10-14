import { XmlJobQueueService } from '../operations/xml-job-queue.service';
import { Optional } from '@nestjs/common';
import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { downloadXml, validateRemoteUrl } from '../../common/remote-resource';
import { parseXmlProducts, buildProductXml, ParsedXmlProduct, XmlFieldMapping } from './xml-product-parser';
export type { ParsedXmlProduct } from './xml-product-parser';

@Injectable()
export class XmlFeedsService {
  private readonly logger = new Logger(XmlFeedsService.name);
  private schedulerRunning = false;
  constructor(private readonly prisma: PrismaService, @Optional() private readonly jobs?: XmlJobQueueService) {}
  private tenant(tenantId: string) { if (!tenantId) throw new ForbiddenException('Oturuma bağlı mağaza bilgisi gerekli'); }

  async getFeeds(tenantId: string) {
    this.tenant(tenantId);
    const rows = await this.prisma.xmlSupplier.findMany({ where: { tenantId }, include: { rules: true }, orderBy: { createdAt: 'desc' } });
    return rows.map(row => ({ id: row.id, name: row.name, supplier: row.name, url: row.url, status: row.status, productCount: row.productsCount, lastSync: row.lastSyncAt?.toISOString(), markup: Number(row.rules[0]?.markupPercent || 0), fixedFee: Number(row.rules[0]?.fixedFee || 0), autoSync: row.rules[0]?.autoSync ?? false, syncInterval: row.rules[0]?.syncInterval ?? 240 }));
  }

  async createFeed(tenantId: string, data: { name: string; url: string; mapping?: XmlFieldMapping; markupPercent?: number; fixedFee?: number; autoSync?: boolean; syncInterval?: number }) {
    this.tenant(tenantId);
    if (!data.name?.trim() || !data.url?.trim()) throw new BadRequestException('Tedarikçi adı ve XML bağlantısı gerekli');
    await validateRemoteUrl(data.url);
    const markup = Number(data.markupPercent ?? 0); const fee = Number(data.fixedFee ?? 0); const interval = Number(data.syncInterval ?? 240);
    if (![markup, fee, interval].every(Number.isFinite) || markup < 0 || markup > 1000 || fee < 0 || !Number.isInteger(interval) || interval < 15) throw new BadRequestException('Fiyat kuralı veya senkronizasyon aralığı geçersiz');
    const mapping = data.mapping ?? {};
    if (typeof mapping !== 'object' || Array.isArray(mapping) || Object.values(mapping).some(value => typeof value !== 'string')) throw new BadRequestException('XML alan eşlemesi geçersiz');
    const row = await this.prisma.$transaction(async tx => {
      const source = await tx.xmlSupplier.create({ data: { tenantId, name: data.name.trim(), url: data.url.trim(), status: 'active', rules: { create: { markupPercent: markup, fixedFee: fee, autoSync: data.autoSync ?? true, syncInterval: interval } } } });
      await tx.activityLog.create({ data: { tenantId, resource: 'xml_feed', resourceId: source.id, action: 'xml.feed.config', details: { mapping } } });
      return source;
    });
    return { ...row, productCount: row.productsCount };
  }

  async deleteFeed(tenantId: string, id: string) {
    this.tenant(tenantId);
    return this.prisma.$transaction(async tx => {
      const result = await tx.xmlSupplier.deleteMany({ where: { id, tenantId, status: { not: 'parsing' } } });
      if (!result.count) throw new NotFoundException('Kaynak bulunamadı veya aktarım devam ediyor');
      await tx.activityLog.deleteMany({ where: { tenantId, resource: 'xml_feed', resourceId: id, action: 'xml.feed.config' } });
      return { success: true };
    });
  }

  async preview(tenantId: string, body: { xml?: string; url?: string; mapping?: XmlFieldMapping }) {
    this.tenant(tenantId);
    const xml = body.xml ?? (body.url ? await downloadXml(body.url) : '');
    const parsed = parseXmlProducts(xml, body.mapping);
    return { total: parsed.total, fields: parsed.fields, products: parsed.products.slice(0, 50) };
  }

  async parseXmlContent(xml: string): Promise<ParsedXmlProduct[]> { return parseXmlProducts(xml).products; }

  private async persistProducts(tenantId: string, products: ParsedXmlProduct[], options: { markupPercent?: number; fixedFee?: number; supplierId?: string } = {}) {
    const markup = Number(options.markupPercent ?? 0); const fee = Number(options.fixedFee ?? 0);
    if (!Number.isFinite(markup) || markup < 0 || markup > 1000 || !Number.isFinite(fee) || fee < 0) throw new BadRequestException('Fiyat kuralı geçersiz');
    return this.prisma.$transaction(async tx => {
      const result = await this.persistProductsInTransaction(tx, tenantId, products, options);
      await tx.activityLog.create({ data: { tenantId, resource: 'xml_import', resourceId: options.supplierId || randomUUID(), action: 'xml.imported', details: result } });
      return result;
    }, { maxWait: 30_000, timeout: 120_000 });
  }

  async persistProductsInTransaction(tx: any, tenantId: string, products: ParsedXmlProduct[], options: { markupPercent?: number; fixedFee?: number; supplierId?: string } = {}) {
    const markup = Number(options.markupPercent ?? 0); const fee = Number(options.fixedFee ?? 0);
    if (!Number.isFinite(markup) || markup < 0 || markup > 1000 || !Number.isFinite(fee) || fee < 0) throw new BadRequestException('Fiyat kuralı geçersiz');
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `xml-import:${tenantId}`);
      let created = 0; let updated = 0;
      const processedSkus = new Map<string, string>();
      const processedBarcodes = new Map<string, string>();

      for (const product of products) {
        const cleanSku = (product.sku || '').trim();
        const cleanBarcode = product.barcode ? String(product.barcode).trim() : null;
        if (!cleanSku && !cleanBarcode) continue;

        const price = markup || fee ? Math.round((product.costPrice * (1 + markup / 100) + fee) * 100) / 100 : product.price;
        const { images, ...fields } = product;
        const data = { ...fields, sku: cleanSku || undefined, barcode: cleanBarcode, price, status: product.stock > 0 ? 'active' : 'out-of-stock' };

        const targetId = (cleanSku && processedSkus.get(cleanSku)) || (cleanBarcode && processedBarcodes.get(cleanBarcode));
        let existingId = targetId;

        if (!existingId) {
          const existing = await tx.product.findFirst({
            where: {
              tenantId,
              OR: [
                ...(cleanSku ? [{ sku: cleanSku }] : []),
                ...(cleanBarcode ? [{ barcode: cleanBarcode }] : []),
              ],
            },
            select: { id: true, sku: true, barcode: true },
          });
          if (existing) {
            existingId = existing.id;
          }
        }

        if (existingId) {
          await tx.product.update({
            where: { id: existingId },
            data: {
              ...data,
              updatedAt: new Date(),
              ...(images.length ? { images: { deleteMany: {}, create: images.map((url, index) => ({ url, isMain: index === 0 })) } } : {}),
            },
          });
          if (cleanSku) processedSkus.set(cleanSku, existingId);
          if (cleanBarcode) processedBarcodes.set(cleanBarcode, existingId);
          updated++;
        } else {
          const finalSku = cleanSku || `XML-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const createdProduct = await tx.product.create({
            data: {
              ...data,
              sku: finalSku,
              barcode: cleanBarcode,
              tenantId,
              tags: { source: 'xml', supplierId: options.supplierId || null },
              images: { create: images.map((url, index) => ({ url, isMain: index === 0 })) },
            },
          });
          if (cleanSku) processedSkus.set(cleanSku, createdProduct.id);
          if (cleanBarcode) processedBarcodes.set(cleanBarcode, createdProduct.id);
          created++;
        }
      }
      return { created, updated, importedCount: products.length };
  }

  async importXml(tenantId: string, body: { xml?: string; url?: string; mapping?: XmlFieldMapping; markupPercent?: number; fixedFee?: number }) {
    this.tenant(tenantId);
    const parsed = parseXmlProducts(body.xml ?? (body.url ? await downloadXml(body.url) : ''), body.mapping);
    const result = await this.persistProducts(tenantId, parsed.products, body);
    return { success: true, ...result, message: `${result.created} yeni ürün eklendi, ${result.updated} ürün güncellendi.` };
  }

  async syncFeed(tenantId: string, id: string, profitMargin?: number) {
    this.tenant(tenantId);
    const source = await this.prisma.xmlSupplier.findFirst({ where: { id, tenantId }, include: { rules: true } });
    if (!source) throw new NotFoundException('XML kaynağı bulunamadı');
    const lease = await this.prisma.xmlSupplier.updateMany({ where: { id, tenantId, OR: [{ status: { not: 'parsing' } }, { updatedAt: { lt: new Date(Date.now() - 30 * 60_000) } }] }, data: { status: 'parsing' } });
    if (!lease.count) throw new ConflictException('Bu kaynak zaten senkronize ediliyor');
    try {
      const xml = await downloadXml(source.url);
      const config = await this.prisma.activityLog.findFirst({ where: { tenantId, resource: 'xml_feed', resourceId: id, action: 'xml.feed.config' }, orderBy: { createdAt: 'desc' }, select: { details: true } });
      const mapping = (config?.details as { mapping?: XmlFieldMapping } | null)?.mapping;
      const products = parseXmlProducts(xml, mapping).products;
      const rule = source.rules[0];
      const result = await this.persistProducts(tenantId, products, { markupPercent: profitMargin ?? Number(rule?.markupPercent ?? 0), fixedFee: Number(rule?.fixedFee ?? 0), supplierId: id });
      await this.prisma.xmlSupplier.updateMany({ where: { id, tenantId }, data: { status: 'active', productsCount: result.importedCount, lastSyncAt: new Date() } });
      return { success: true, ...result, message: `${result.created} yeni ürün eklendi, ${result.updated} ürün güncellendi.` };
    } catch (error) {
      await this.prisma.xmlSupplier.updateMany({ where: { id, tenantId }, data: { status: 'error' } });
      throw error;
    }
  }

  async exportXml(tenantId: string, productIds?: string[]) {
    this.tenant(tenantId);
    if (productIds && (!Array.isArray(productIds) || productIds.some(id => typeof id !== 'string'))) throw new BadRequestException('Ürün seçimi geçersiz');
    const products = await this.prisma.product.findMany({ where: { tenantId, ...(productIds?.length ? { id: { in: productIds } } : {}) }, include: { images: true }, take: 20_001 });
    if (products.length > 20_000) throw new BadRequestException('Dışa aktarma için en fazla 20.000 ürün seçin');
    if (!products.length) throw new BadRequestException('Dışa aktarılacak ürün bulunamadı');
    return { filename: 'urunler.xml', productCount: products.length, xml: buildProductXml(products) };
  }

  async listProducts(tenantId: string) {
    this.tenant(tenantId);
    return this.prisma.product.findMany({ where: { tenantId }, select: { id: true, sku: true, title: true, price: true, stock: true }, orderBy: { updatedAt: 'desc' }, take: 2000 });
  }

  @Interval(60_000)
  async syncDueFeeds() {
    if (this.schedulerRunning || process.env.XML_AUTO_SYNC_ENABLED === 'false') return;
    this.schedulerRunning = true;
    try {
      const sources = await this.prisma.xmlSupplier.findMany({ where: { rules: { some: { autoSync: true } } }, include: { rules: true }, orderBy: { updatedAt: 'asc' }, take: 100 });
      for (const source of sources) {
        const interval = Number(source.rules[0]?.syncInterval ?? 240) * 60_000;
        const reference = source.status === 'error' ? source.updatedAt : source.lastSyncAt;
        if (reference && Date.now() - reference.getTime() < interval) continue;
        try { if (this.jobs) await this.jobs.enqueueFeed(source.tenantId, source.id, 'scheduled:' + source.id + ':' + Math.floor(Date.now() / interval)); else await this.syncFeed(source.tenantId, source.id); } catch { this.logger.warn(`XML kaynağı senkronize edilemedi: ${source.id}`); }
      }
    } finally { this.schedulerRunning = false; }
  }
}
