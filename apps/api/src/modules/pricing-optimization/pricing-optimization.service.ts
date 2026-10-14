import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface PriceRecommendation {
  productId: string;
  sku: string;
  title: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  changePercent: number;
  reason: string;
  confidence: number;
  competitorPrices: { platform: string; price: number; seller: string }[];
  demandScore: number;
  profitImpact: number;
}

@Injectable()
export class PricingOptimizationService {
  private readonly logger = new Logger(PricingOptimizationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * AI destekli fiyat önerileri
   */
  async getPriceRecommendations(tenantId: string): Promise<{
    recommendations: PriceRecommendation[];
    summary: any;
  }> {
    const products = await this.prisma.product.findMany({
      where: { tenantId },
      include: {
        competitorProducts: {
          include: { competitor: true },
        },
        orderItems: {
          include: { order: true },
          where: {
            order: { orderDate: { gte: new Date(Date.now() - 30 * 86400000) } },
          },
        },
      },
      take: 50,
    });

    const recommendations: PriceRecommendation[] = [];

    for (const product of products) {
      const currentPrice = Number(product.price);
      const competitorPrices = product.competitorProducts.map((cp) => ({
        platform: cp.competitor?.platform || 'Bilinmiyor',
        price: Number(cp.price),
        seller: cp.competitor?.name || 'Bilinmeyen Satıcı',
      }));

      // Rakip fiyat analizi
      const avgCompetitorPrice =
        competitorPrices.length > 0
          ? competitorPrices.reduce((sum, cp) => sum + cp.price, 0) /
            competitorPrices.length
          : currentPrice;
      const minCompetitorPrice =
        competitorPrices.length > 0
          ? Math.min(...competitorPrices.map((cp) => cp.price))
          : currentPrice;

      // Talep skoru (son 30 gün satış bazlı)
      const salesCount = product.orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const demandScore = Math.min(100, salesCount * 5);

      // Stok durumu
      const stockLevel = product.stock;
      const isLowStock = stockLevel < 10;
      const isOverStock = stockLevel > 100;

      // AI fiyat optimizasyonu
      let recommendedPrice = currentPrice;
      let reason = '';
      let confidence = 0.75;

      if (currentPrice > avgCompetitorPrice * 1.15) {
        // Fiyat rakiplerden çok yüksek
        recommendedPrice = avgCompetitorPrice * 1.05;
        reason = 'Rakip fiyatlarına göre yüksek, rekabetçi fiyat önerisi';
        confidence = 0.85;
      } else if (currentPrice < minCompetitorPrice * 0.9 && demandScore > 50) {
        // Talep yüksek ve en düşük fiyattayız
        recommendedPrice = currentPrice * 1.08;
        reason = 'Yüksek talep, fiyat artışı için uygun';
        confidence = 0.82;
      } else if (isOverStock && demandScore < 30) {
        // Fazla stok, düşük talep
        recommendedPrice = currentPrice * 0.92;
        reason = 'Stok eritme indirimi önerisi';
        confidence = 0.78;
      } else if (isLowStock && demandScore > 60) {
        // Az stok, yüksek talep
        recommendedPrice = currentPrice * 1.12;
        reason = 'Kıtlık fiyatlaması, stok azaldı';
        confidence = 0.8;
      } else {
        recommendedPrice = currentPrice;
        reason = 'Fiyat optimum seviyede';
        confidence = 0.9;
      }

      const priceChange = recommendedPrice - currentPrice;
      const changePercent = (priceChange / currentPrice) * 100;

      // Kar etkisi hesaplama (basit model)
      const profitImpact = priceChange * (salesCount || 10);

      if (Math.abs(changePercent) > 1) {
        recommendations.push({
          productId: product.id,
          sku: product.sku,
          title: product.title,
          currentPrice,
          recommendedPrice: Math.round(recommendedPrice * 100) / 100,
          priceChange: Math.round(priceChange * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          reason,
          confidence,
          competitorPrices,
          demandScore,
          profitImpact: Math.round(profitImpact),
        });
      }
    }

    // Özet istatistikler
    const priceIncreases = recommendations.filter((r) => r.priceChange > 0);
    const priceDecreases = recommendations.filter((r) => r.priceChange < 0);
    const totalProfitImpact = recommendations.reduce(
      (sum, r) => sum + r.profitImpact,
      0,
    );

    return {
      recommendations: recommendations.sort(
        (a, b) => Math.abs(b.profitImpact) - Math.abs(a.profitImpact),
      ),
      summary: {
        totalRecommendations: recommendations.length,
        priceIncreases: priceIncreases.length,
        priceDecreases: priceDecreases.length,
        avgConfidence:
          recommendations.length > 0
            ? Math.round(
                (recommendations.reduce((sum, r) => sum + r.confidence, 0) /
                  recommendations.length) *
                  100,
              )
            : 0,
        potentialProfitImpact: totalProfitImpact,
        avgPriceChange:
          recommendations.length > 0
            ? Math.round(
                (recommendations.reduce((sum, r) => sum + r.changePercent, 0) /
                  recommendations.length) *
                  100,
              ) / 100
            : 0,
      },
    };
  }

  /**
   * Fiyat değişikliği uygula
   */
  async applyPriceChange(
    productId: string,
    newPrice: number,
    tenantId: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new Error('Ürün bulunamadı');
    }

    const oldPrice = Number(product.price);

    await this.prisma.product.update({
      where: { id: productId },
      data: { price: newPrice },
    });

    // Fiyat değişikliği logla
    await this.prisma.activityLog.create({
      data: {
        tenantId,
        action: 'price.change',
        resource: 'product',
        resourceId: productId,
        details: {
          sku: product.sku,
          oldPrice,
          newPrice,
          changePercent: (((newPrice - oldPrice) / oldPrice) * 100).toFixed(2),
          source: 'ai_optimization',
        },
      },
    });

    return {
      productId,
      sku: product.sku,
      oldPrice,
      newPrice,
      appliedAt: new Date().toISOString(),
    };
  }

  /**
   * Toplu fiyat değişikliği
   */
  async applyBulkPriceChanges(
    changes: { productId: string; newPrice: number }[],
    tenantId: string,
  ) {
    const results: Array<{
      productId: string;
      status: string;
      sku?: string;
      oldPrice?: number;
      newPrice?: number;
      appliedAt?: string;
      error?: string;
    }> = [];
    let success = 0;
    let failed = 0;

    for (const change of changes) {
      try {
        const result = await this.applyPriceChange(
          change.productId,
          change.newPrice,
          tenantId,
        );
        results.push({ ...result, status: 'success' });
        success++;
      } catch (error: any) {
        results.push({
          productId: change.productId,
          status: 'failed',
          error: error.message,
        });
        failed++;
      }
    }

    return { success, failed, results };
  }

  /**
   * Fiyat geçmişi
   */
  async getPriceHistory(productId: string, tenantId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        tenantId,
        resource: 'product',
        resourceId: productId,
        action: 'price.change',
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return logs.map((log) => ({
      date: log.createdAt,
      oldPrice: (log.details as any)?.oldPrice,
      newPrice: (log.details as any)?.newPrice,
      changePercent: (log.details as any)?.changePercent,
      source: (log.details as any)?.source || 'manual',
    }));
  }

  /**
   * Rekabet analizi
   */
  async getCompetitorAnalysis(tenantId: string) {
    const competitors = await this.prisma.competitor.findMany({
      where: { tenantId },
      include: {
        products: {
          include: { product: true },
        },
      },
    });

    return competitors.map((comp) => {
      const products = comp.products;
      const avgPriceDiff =
        products.length > 0
          ? products.reduce((sum, cp) => {
              const ourPrice = Number(cp.product?.price || 0);
              const theirPrice = Number(cp.price);
              return sum + ((theirPrice - ourPrice) / ourPrice) * 100;
            }, 0) / products.length
          : 0;

      return {
        competitorId: comp.id,
        name: comp.name,
        platform: comp.platform,
        productCount: products.length,
        avgPriceDifference: Math.round(avgPriceDiff * 100) / 100,
        position:
          avgPriceDiff > 5
            ? 'cheaper'
            : avgPriceDiff < -5
              ? 'expensive'
              : 'similar',
        lastUpdated: comp.updatedAt,
      };
    });
  }

  // ─── BUYBOX & OTOPILOT REPRICING ────────────────────────────────────

  /**
   * BuyBox kurallarını getir
   */
  async getBuyBoxRules(tenantId: string) {
    return this.prisma.buyBoxRule.findMany({
      where: { tenantId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
            price: true,
            costPrice: true,
            stock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * BuyBox kuralı ekle veya güncelle
   */
  async saveBuyBoxRule(
    tenantId: string,
    data: {
      productId?: string;
      platform: any;
      minMarginPct?: number;
      maxDropPct?: number;
      competitorFloor?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.buyBoxRule.create({
      data: {
        tenantId,
        productId: data.productId || null,
        platform: data.platform || 'TRENDYOL',
        minMarginPct: data.minMarginPct ?? 10,
        maxDropPct: data.maxDropPct ?? 5,
        competitorFloor: data.competitorFloor ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Otopilot BuyBox & Fiyat Savaşçısı Motorunu Çalıştır
   */
  async runAutoRepricer(tenantId: string) {
    const activeRules = await this.prisma.buyBoxRule.findMany({
      where: { tenantId, isActive: true },
      include: {
        product: {
          include: {
            competitorProducts: {
              include: { competitor: true },
            },
          },
        },
      },
    });

    const executionResults: Array<{
      ruleId: string;
      productId?: string | null;
      sku?: string;
      oldPrice: number;
      newPrice: number;
      floorPrice: number;
      competitorPrice?: number;
      actionTaken: string;
      hasBuyBox: boolean;
    }> = [];

    const defaultCommissionRates: Record<string, number> = {
      TRENDYOL: 0.18,
      HEPSIBURADA: 0.15,
      AMAZON: 0.12,
      N11: 0.15,
      CICEKSEPETI: 0.17,
    };
    const defaultShippingCost = 45; // TL

    for (const rule of activeRules) {
      if (!rule.product) continue;

      const product = rule.product;
      const currentPrice = Number(product.price);
      const costPrice = Number(product.costPrice || currentPrice * 0.6);
      const minMarginPct = Number(rule.minMarginPct) || 10;
      const commissionRate =
        defaultCommissionRates[rule.platform] || 0.15;

      // Unbreakable Floor Price Formula:
      // (Cost + Shipping) * (1 + Margin%) / (1 - Commission)
      const calculatedFloor =
        ((costPrice + defaultShippingCost) * (1 + minMarginPct / 100)) /
        (1 - commissionRate);
      const effectiveFloor = rule.competitorFloor
        ? Math.max(Number(rule.competitorFloor), calculatedFloor)
        : calculatedFloor;

      const competitorPrices = product.competitorProducts
        .filter((cp) => cp.competitor?.platform === rule.platform)
        .map((cp) => Number(cp.price));

      const lowestCompetitorPrice =
        competitorPrices.length > 0 ? Math.min(...competitorPrices) : null;

      let targetPrice = currentPrice;
      let actionTaken = 'NO_CHANGE';
      let hasBuyBox = false;

      if (lowestCompetitorPrice !== null) {
        if (currentPrice > lowestCompetitorPrice) {
          // Rakip bizden ucuz, 1 TL altına in
          const undercutPrice = lowestCompetitorPrice - 1;
          if (undercutPrice >= effectiveFloor) {
            targetPrice = Math.round(undercutPrice * 100) / 100;
            actionTaken = 'UNDERCUT_COMPETITOR';
            hasBuyBox = true;
          } else {
            // Taban fiyata sabitle
            targetPrice = Math.round(effectiveFloor * 100) / 100;
            actionTaken = 'FLOOR_LIMIT_REACHED';
            hasBuyBox = targetPrice <= lowestCompetitorPrice;
          }
        } else {
          // Zaten Buybox bizde
          hasBuyBox = true;
          actionTaken = 'HOLD_BUYBOX';
        }
      } else {
        // Rakip yok, maksimum kâra çık
        hasBuyBox = true;
        actionTaken = 'NO_COMPETITOR_MAX_MARGIN';
      }

      // Fiyat güncelleme
      if (Math.abs(targetPrice - currentPrice) >= 0.5) {
        await this.prisma.product.update({
          where: { id: product.id },
          data: { price: targetPrice },
        });

        await this.prisma.activityLog.create({
          data: {
            tenantId,
            action: 'buybox.repriced',
            resource: 'product',
            resourceId: product.id,
            details: {
              ruleId: rule.id,
              platform: rule.platform,
              oldPrice: currentPrice,
              newPrice: targetPrice,
              floorPrice: effectiveFloor,
              lowestCompetitorPrice,
              actionTaken,
            },
          },
        });
      }

      // Snapshot kaydet
      await this.prisma.buyBoxSnapshot.create({
        data: {
          tenantId,
          productId: product.id,
          platform: rule.platform,
          ourPrice: targetPrice,
          competitorPrice: lowestCompetitorPrice,
          hasBuyBox,
        },
      });

      await this.prisma.buyBoxRule.update({
        where: { id: rule.id },
        data: { lastRunAt: new Date() },
      });

      executionResults.push({
        ruleId: rule.id,
        productId: product.id,
        sku: product.sku,
        oldPrice: currentPrice,
        newPrice: targetPrice,
        floorPrice: Math.round(effectiveFloor * 100) / 100,
        competitorPrice: lowestCompetitorPrice ?? undefined,
        actionTaken,
        hasBuyBox,
      });
    }

    return {
      executedRules: activeRules.length,
      results: executionResults,
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * BuyBox Snapshot Geçmişi
   */
  async getBuyBoxSnapshots(tenantId: string, limit = 50) {
    return this.prisma.buyBoxSnapshot.findMany({
      where: { tenantId },
      include: {
        product: {
          select: { title: true, sku: true },
        },
      },
      orderBy: { capturedAt: 'desc' },
      take: limit,
    });
  }
}
