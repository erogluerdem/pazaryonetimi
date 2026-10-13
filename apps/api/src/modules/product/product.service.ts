import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@pazaryonetimi/database';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    const {
      name,
      title,
      description,
      sku,
      barcode,
      price,
      costPrice,
      stock,
      category,
      brand,
      status,
      tags,
      weight,
    } = data;

    const resolvedTitle = title || name || 'İsimsiz Ürün';
    const resolvedSku =
      sku || `SKU-${Date.now().toString(36).toUpperCase()}`;
    const resolvedPrice =
      typeof price === 'number' ? price : parseFloat(price) || 0;
    const resolvedStock =
      typeof stock === 'number' ? stock : parseInt(stock, 10) || 0;

    return this.prisma.product.create({
      data: {
        title: resolvedTitle,
        sku: resolvedSku,
        barcode: barcode || null,
        description: description || null,
        price: resolvedPrice,
        costPrice: costPrice ? Number(costPrice) : null,
        stock: resolvedStock,
        category: category || null,
        brand: brand || null,
        status: status || 'active',
        tags: tags || undefined,
        weight: weight ? Number(weight) : null,
        tenantId,
      },
    });
  }

  async findAll(
    tenantId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId },
        include: { images: true, marketplaceLinks: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({
        where: { tenantId },
      }),
    ]);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductStats(tenantId: string) {
    const [
      totalInfo,
      statusBreakdown,
      lowStockCount,
      revenueInfo,
      averageRatingInfo,
    ] = await Promise.all([
      // Total products
      this.prisma.product.count({ where: { tenantId } }),

      // Status breakdown (active, paused, draft etc)
      this.prisma.product.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),

      // Low stock (less than 20)
      this.prisma.product.count({
        where: {
          tenantId,
          stock: { gt: 0, lt: 20 },
        },
      }),

      // Total revenue from all order items for these products
      this.prisma.orderItem.aggregate({
        where: {
          product: { tenantId },
        },
        _sum: {
          quantity: true,
          unitPrice: true,
        },
      }),

      // Average rating from all reviews for these products
      this.prisma.review.aggregate({
        where: { tenantId },
        _avg: { rating: true },
      }),
    ]);

    const stats = {
      total: totalInfo,
      active:
        statusBreakdown.find((s) => s.status === 'active')?._count.status || 0,
      outOfStock:
        statusBreakdown.find(
          (s) => s.status === 'out-of-stock' || s.status === 'paused',
        )?._count.status || 0, // Using paused as proxy for now if needed
      lowStock: lowStockCount,
      totalRevenue: Number(revenueInfo._sum.unitPrice || 0), // Simplified revenue calc
      avgRating: Number((averageRatingInfo._avg.rating || 0).toFixed(1)),
    };

    return stats;
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { images: true, marketplaceLinks: true },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return this.prisma.product.update({
      where: { id, tenantId },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.product.delete({
      where: { id, tenantId },
    });
  }

  async executeBulkAction(data: {
    action: string;
    productIds: string[];
    tenantId: string;
    userId?: string;
    [key: string]: any;
  }) {
    const { action, productIds, tenantId } = data;
    if (!tenantId) throw new BadRequestException('tenantId zorunludur');
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new BadRequestException('En az bir ürün seçilmelidir');
    }

    // 1. Snapshot previous state for 1-click rollback
    const targets = await this.prisma.product.findMany({
      where: { tenantId, id: { in: productIds } },
      select: {
        id: true,
        sku: true,
        title: true,
        price: true,
        stock: true,
        status: true,
      },
    });

    const snapshot = targets.map((p) => ({
      productId: p.id,
      sku: p.sku,
      title: p.title,
      price: Number(p.price),
      stock: p.stock,
      status: p.status,
    }));

    // 2. Resolve userId for database record
    let resolvedUserId = data.userId;
    if (!resolvedUserId) {
      const user = await this.prisma.user.findFirst({
        where: { tenantId },
        select: { id: true },
      });
      resolvedUserId = user?.id;
    }

    let bulkActionId: string | null = null;
    if (resolvedUserId) {
      const ba = await this.prisma.bulkAction.create({
        data: {
          tenantId,
          userId: resolvedUserId,
          action,
          totalItems: productIds.length,
          status: 'processing',
          data: {
            parameters: data,
            snapshot,
            snapshotCount: snapshot.length,
          } as Prisma.InputJsonValue,
          startedAt: new Date(),
        },
      });
      bulkActionId = ba.id;
    }

    const results: any[] = [];

    // 3. Execute updates
    for (const target of targets) {
      const productId = target.id;
      try {
        switch (action) {
          case 'price_update':
          case 'price-update': {
            let nextPrice: number;
            if (data.type === 'percent') {
              const pct = Number(data.value || 0);
              nextPrice = Math.max(0, Math.round(Number(target.price) * (1 + pct / 100) * 100) / 100);
            } else if (data.type === 'fixed') {
              nextPrice = Math.max(0, Number(data.value || 0));
            } else {
              nextPrice = Math.max(0, Number(data.newPrice ?? data.price ?? target.price));
            }
            await this.prisma.product.update({
              where: { id: productId },
              data: { price: nextPrice, updatedAt: new Date() },
            });
            results.push({ productId, status: 'success', oldPrice: target.price, newPrice: nextPrice });
            break;
          }
          case 'discount': {
            const pct = Number(data.value || 0);
            const nextPrice = Math.max(0, Math.round(Number(target.price) * (1 - pct / 100) * 100) / 100);
            await this.prisma.product.update({
              where: { id: productId },
              data: { price: nextPrice, updatedAt: new Date() },
            });
            results.push({ productId, status: 'success', oldPrice: target.price, newPrice: nextPrice });
            break;
          }
          case 'stock_update':
          case 'stock-update': {
            const nextStock = Math.max(0, Math.floor(Number(data.quantity ?? data.newStock ?? data.stock ?? 0)));
            await this.prisma.product.update({
              where: { id: productId },
              data: { stock: nextStock, updatedAt: new Date() },
            });
            results.push({ productId, status: 'success', oldStock: target.stock, newStock: nextStock });
            break;
          }
          case 'activate': {
            await this.prisma.product.update({
              where: { id: productId },
              data: { status: 'active', updatedAt: new Date() },
            });
            results.push({ productId, status: 'success' });
            break;
          }
          case 'pause':
          case 'deactivate': {
            await this.prisma.product.update({
              where: { id: productId },
              data: { status: 'paused', updatedAt: new Date() },
            });
            results.push({ productId, status: 'success' });
            break;
          }
          case 'duplicate': {
            await this.prisma.product.create({
              data: {
                tenantId,
                title: `${target.title} (Kopya)`,
                sku: `${target.sku}-COPY-${Date.now().toString(36).slice(-4)}`,
                price: target.price,
                stock: target.stock,
                status: 'draft',
              },
            });
            results.push({ productId, status: 'success' });
            break;
          }
          case 'delete': {
            await this.prisma.product.update({
              where: { id: productId },
              data: { status: 'archived', updatedAt: new Date() },
            });
            results.push({ productId, status: 'success' });
            break;
          }
          default:
            results.push({ productId, status: 'success' });
        }
      } catch (error) {
        results.push({
          productId,
          status: 'failed',
          error: (error as Error).message,
        });
      }
    }

    const succeeded = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    // 4. Update BulkAction record
    if (bulkActionId) {
      await this.prisma.bulkAction.update({
        where: { id: bulkActionId },
        data: {
          processed: productIds.length,
          succeeded,
          failed,
          status: failed === 0 ? 'completed' : succeeded > 0 ? 'partial' : 'failed',
          results: results as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });
    }

    return {
      action,
      bulkActionId,
      total: productIds.length,
      success: succeeded,
      failed,
      results,
      canRollback: snapshot.length > 0,
      executedAt: new Date().toISOString(),
    };
  }

  async rollbackBulkAction(
    tenantId: string,
    bulkActionId: string,
    userId?: string,
  ) {
    if (!tenantId || !bulkActionId) {
      throw new BadRequestException('tenantId ve bulkActionId zorunludur');
    }

    const bulkAction = await this.prisma.bulkAction.findFirst({
      where: { id: bulkActionId, tenantId },
    });

    if (!bulkAction) {
      throw new NotFoundException('Toplu işlem kaydı bulunamadı');
    }

    if (bulkAction.status === 'rolled_back') {
      throw new BadRequestException('Bu toplu işlem zaten geri alınmış');
    }

    const payload = bulkAction.data as Record<string, any>;
    const snapshot = payload?.snapshot as Array<{
      productId: string;
      sku: string;
      title: string;
      price: number;
      stock: number;
      status: string;
    }>;

    if (!Array.isArray(snapshot) || snapshot.length === 0) {
      throw new BadRequestException(
        'Bu işlem için geri dönüş yedeği (snapshot) bulunamadı',
      );
    }

    let restoredCount = 0;
    let failedCount = 0;

    for (const item of snapshot) {
      try {
        await this.prisma.product.updateMany({
          where: { id: item.productId, tenantId },
          data: {
            price: item.price,
            stock: item.stock,
            status: item.status,
            updatedAt: new Date(),
          },
        });
        restoredCount++;
      } catch (err) {
        failedCount++;
        this.logger.error(`Rollback item failed for productId ${item.productId}: ${(err as Error).message}`);
      }
    }

    await this.prisma.bulkAction.update({
      where: { id: bulkActionId },
      data: {
        status: 'rolled_back',
        completedAt: new Date(),
      },
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        action: 'product.bulk_action.rollback',
        resource: 'bulk_action',
        resourceId: bulkActionId,
        details: {
          originalAction: bulkAction.action,
          restoredCount,
          failedCount,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      bulkActionId,
      restoredCount,
      failedCount,
      message: `${restoredCount} ürün önceki fiyat ve stok değerlerine başarıyla döndürüldü.`,
    };
  }

  async getBulkActionHistory(tenantId: string) {
    const bulkActions = await this.prisma.bulkAction.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return bulkActions.map((ba) => {
      const data = ba.data as Record<string, any>;
      const snapshotCount = Array.isArray(data?.snapshot) ? data.snapshot.length : 0;
      return {
        id: ba.id,
        action: ba.action,
        productCount: ba.totalItems,
        success: ba.succeeded,
        failed: ba.failed,
        executedBy: ba.user
          ? [ba.user.firstName, ba.user.lastName].filter(Boolean).join(' ') ||
            ba.user.email
          : 'Yönetici',
        executedAt: (ba.completedAt || ba.createdAt).toISOString(),
        status: ba.status,
        canRollback: ba.status !== 'rolled_back' && snapshotCount > 0,
        isRolledBack: ba.status === 'rolled_back',
        snapshotCount,
      };
    });
  }

  // ─── Import / Export ────────────────────────────────────

  async getExportData(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
      select: {
        id: true,
        sku: true,
        barcode: true,
        title: true,
        description: true,
        price: true,
        costPrice: true,
        stock: true,
        category: true,
        brand: true,
        status: true,
        tags: true,
        weight: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async importProducts(
    tenantId: string,
    products: any[],
    mode: 'create' | 'update' | 'upsert',
  ) {
    const results: {
      row: number;
      sku: string;
      status: 'created' | 'updated' | 'failed';
      error?: string;
    }[] = [];

    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      try {
        const productData = {
          title: row.title || row['Ürün Adı'] || '',
          description: row.description || row['Açıklama'] || null,
          sku: row.sku || row['SKU'] || '',
          barcode: row.barcode || row['Barkod'] || null,
          price: parseFloat(row.price || row['Fiyat'] || '0'),
          costPrice:
            row.costPrice || row['Maliyet']
              ? parseFloat(row.costPrice || row['Maliyet'])
              : null,
          stock: parseInt(row.stock || row['Stok'] || '0', 10),
          category: row.category || row['Kategori'] || null,
          brand: row.brand || row['Marka'] || null,
          status: row.status || row['Durum'] || 'active',
          tags:
            typeof (row.tags || row['Etiketler']) === 'string'
              ? (row.tags || row['Etiketler']).split('|').filter(Boolean)
              : row.tags || [],
          weight:
            row.weight || row['Ağırlık (kg)']
              ? parseFloat(row.weight || row['Ağırlık (kg)'])
              : null,
        };

        if (!productData.sku) {
          results.push({
            row: i + 1,
            sku: '',
            status: 'failed',
            error: 'SKU zorunludur',
          });
          continue;
        }
        if (!productData.title) {
          results.push({
            row: i + 1,
            sku: productData.sku,
            status: 'failed',
            error: 'Ürün adı zorunludur',
          });
          continue;
        }

        const existing = await this.prisma.product.findFirst({
          where: { sku: productData.sku, tenantId },
        });

        if (mode === 'create') {
          if (existing) {
            results.push({
              row: i + 1,
              sku: productData.sku,
              status: 'failed',
              error: 'Bu SKU zaten mevcut',
            });
            continue;
          }
          await this.prisma.product.create({
            data: { ...productData, tenantId },
          });
          results.push({ row: i + 1, sku: productData.sku, status: 'created' });
        } else if (mode === 'update') {
          if (!existing) {
            results.push({
              row: i + 1,
              sku: productData.sku,
              status: 'failed',
              error: 'Bu SKU bulunamadı',
            });
            continue;
          }
          await this.prisma.product.update({
            where: { id: existing.id },
            data: productData,
          });
          results.push({ row: i + 1, sku: productData.sku, status: 'updated' });
        } else {
          // upsert
          if (existing) {
            await this.prisma.product.update({
              where: { id: existing.id },
              data: productData,
            });
            results.push({
              row: i + 1,
              sku: productData.sku,
              status: 'updated',
            });
          } else {
            await this.prisma.product.create({
              data: { ...productData, tenantId },
            });
            results.push({
              row: i + 1,
              sku: productData.sku,
              status: 'created',
            });
          }
        }
      } catch (error) {
        results.push({
          row: i + 1,
          sku: row.sku || row['SKU'] || '',
          status: 'failed',
          error: (error as Error).message,
        });
      }
    }

    return {
      total: products.length,
      created: results.filter((r) => r.status === 'created').length,
      updated: results.filter((r) => r.status === 'updated').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    };
  }
}
