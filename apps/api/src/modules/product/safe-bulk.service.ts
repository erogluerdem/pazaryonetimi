import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@pazaryonetimi/database';
@Injectable()
export class SafeBulkService {
  constructor(private readonly prisma: PrismaService) {}
  supports(action: string) { return ['price-update','price_update','stock-update','stock_update','discount'].includes(action); }
  private next(row: any, input: any) {
    if (input.action.startsWith('stock')) {
      const stock = Number(input.quantity ?? input.newStock ?? input.stock);
      if (!Number.isInteger(stock) || stock < 0 || stock > 2147483647) throw new BadRequestException('Stok sıfır veya pozitif tam sayı olmalıdır');
      return { stock };
    }
    const raw = input.value ?? input.newPrice ?? input.price;
    if (raw === '' || raw == null || !Number.isFinite(Number(raw))) throw new BadRequestException('Geçerli fiyat veya yüzde girin');
    const value = Number(raw);
    if (input.action === 'discount' && (value < 0 || value > 100)) throw new BadRequestException('İndirim yüzdesi 0–100 aralığında olmalıdır');
    const price = input.action === 'discount' ? Number(row.price) * (1 - value / 100) : input.type === 'percent' ? Number(row.price) * (1 + value / 100) : value;
    if (!Number.isFinite(price) || price < 0 || price > 1e12) throw new BadRequestException('Son fiyat geçersiz');
    return { price: Math.round(price * 100) / 100 };
  }
  async preview(tenantId: string, userId: string, input: any) {
    if (!tenantId || !userId || !this.supports(input.action)) throw new BadRequestException('Fiyat/stok işlemi ve kullanıcı oturumu gerekli');
    const ids: string[] = input.productIds;
    if (!Array.isArray(ids) || !ids.length || ids.length > 2000 || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) throw new BadRequestException('1–2.000 farklı ürün seçin');
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId }, select: { id: true } });
    if (!user) throw new BadRequestException('Kullanıcı mağazaya ait değil');
    const products = await this.prisma.product.findMany({ where: { tenantId, id: { in: ids } }, select: { id: true, sku: true, title: true, price: true, stock: true, updatedAt: true } });
    if (products.length !== ids.length) throw new NotFoundException('Seçilen ürünlerden biri mağazada bulunamadı');
    const changes = products.map(row => { const after = this.next(row, input); return { productId: row.id, sku: row.sku, title: row.title, before: 'stock' in after ? { stock: row.stock } : { price: Number(row.price) }, after, expectedUpdatedAt: row.updatedAt.toISOString() }; });
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();
    const preview = await this.prisma.bulkAction.create({ data: { tenantId, userId, action: input.action, totalItems: changes.length, status: 'preview', data: { version: 2, expiresAt, changes } as unknown as Prisma.InputJsonValue } });
    return { previewId: preview.id, expiresAt, changes, total: changes.length };
  }
  async execute(tenantId: string, userId: string, previewId: string) {
    if (!previewId) throw new BadRequestException('Önce değişiklik önizlemesi oluşturun');
    return this.prisma.$transaction(async tx => {
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', 'bulk:' + tenantId);
      const record = await tx.bulkAction.findFirst({ where: { id: previewId, tenantId, userId } });
      if (!record) throw new NotFoundException('Önizleme bulunamadı');
      if (record.status === 'completed') return { bulkActionId: record.id, success: record.succeeded, failed: 0, canRollback: true, repeated: true };
      if (record.status !== 'preview') throw new ConflictException('Önizleme artık uygulanamaz');
      const payload = record.data as any;
      if (Date.parse(payload.expiresAt) < Date.now()) throw new ConflictException('Önizlemenin süresi doldu; yeniden oluşturun');
      const version = new Date();
      for (const change of payload.changes) {
        const result = await tx.product.updateMany({ where: { id: change.productId, tenantId, ...change.before, updatedAt: new Date(change.expectedUpdatedAt) }, data: { ...change.after, updatedAt: version } });
        if (result.count !== 1) throw new ConflictException('Ürün önizlemeden sonra değişti; yeni önizleme oluşturun');
      }
      await tx.bulkAction.update({ where: { id: record.id }, data: { status: 'completed', processed: payload.changes.length, succeeded: payload.changes.length, failed: 0, startedAt: version, completedAt: version, data: { ...payload, appliedAt: version.toISOString() } } });
      await tx.activityLog.create({ data: { tenantId, userId, action: 'product.bulk.applied', resource: 'bulk_action', resourceId: record.id, details: { count: payload.changes.length, action: record.action } } });
      return { bulkActionId: record.id, success: payload.changes.length, failed: 0, canRollback: true };
    }, { timeout: 120000 });
  }
  async rollback(tenantId: string, id: string, userId?: string) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', 'bulk:' + tenantId);
      const record = await tx.bulkAction.findFirst({ where: { id, tenantId } });
      if (!record) throw new NotFoundException('Toplu işlem bulunamadı');
      const payload = record.data as any;
      if (payload?.version !== 2 || record.status !== 'completed') throw new ConflictException('Bu işlem güvenli geri dönüş için uygun değil');
      const restoredAt = new Date();
      for (const change of payload.changes) {
        const result = await tx.product.updateMany({ where: { id: change.productId, tenantId, updatedAt: new Date(payload.appliedAt), ...change.after }, data: { ...change.before, updatedAt: restoredAt } });
        if (result.count !== 1) throw new ConflictException('Ürün işlemden sonra değişti; sonraki değişikliklerin üzerine yazılmadı');
      }
      await tx.bulkAction.update({ where: { id }, data: { status: 'rolled_back', completedAt: restoredAt } });
      await tx.activityLog.create({ data: { tenantId, userId, action: 'product.bulk_action.rollback', resource: 'bulk_action', resourceId: id, details: { restoredCount: payload.changes.length } } });
      return { success: true, restoredCount: payload.changes.length, failedCount: 0, message: payload.changes.length + ' ürünün bu işlemde değişen alanları geri alındı.' };
    }, { timeout: 120000 });
  }
}
