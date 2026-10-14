import { Injectable, Logger } from '@nestjs/common';
import { providerJson } from './provider-http';
import { MarketplaceBridge, MarketplaceReview } from './marketplace.service';
import { ScrapingService } from '../scraping/scraping.service';
import {
  MarketplaceAnalysisResponse,
  computeConfidenceFromSources,
} from './analysis.types';

interface CicekSepetiProduct {
  productId: string;
  title: string;
  price: number;
  salePrice: number;
  stockCount: number;
  rating: number;
  reviewCount: number;
  url: string;
  images: string[];
  storeName?: string;
}

@Injectable()
export class CicekSepetiBridge implements MarketplaceBridge {
  private readonly logger = new Logger(CicekSepetiBridge.name);
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string,
    private readonly scrapingService: ScrapingService,
    isTestMode = false,
  ) { this.baseUrl = 'https://' + (isTestMode ? 'sandbox-' : '') + 'apis.ciceksepeti.com/api/v1'; }

  async syncProducts(): Promise<any> {
    const products: any[] = [];
    for (let page = 1; page <= 2000; page++) {
      const data = await providerJson(this.baseUrl + '/Products?PageSize=60&Page=' + page, { headers: { 'x-api-key': this.apiKey } });
      if (!Array.isArray(data.products)) throw new Error('Çiçeksepeti ürün yanıtı beklenen biçimde değil');
      products.push(...data.products);
      if (data.products.length < 60 || products.length >= data.totalCount) return { success: true, platform: 'CICEKSEPETI', products, count: products.length };
    }
    throw new Error('Çiçeksepeti sayfalaması tamamlanamadı');
  }

  async syncOrders(): Promise<any> {
    const orders: any[] = []; const endDate = new Date().toISOString(); const startDate = new Date(Date.now() - 13 * 86400000).toISOString();
    for (let page = 0; page < 2000; page++) {
      const data = await providerJson(this.baseUrl + '/Order/GetOrders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey }, body: JSON.stringify({ startDate, endDate, pageSize: 100, page }) });
      const rows = data.supplierOrderListWithBranch;
      if (!Array.isArray(rows)) throw new Error('Çiçeksepeti sipariş yanıtı beklenen biçimde değil');
      orders.push(...rows.map((row: any) => ({ ...row, orderId: String(row.orderItemId ?? row.orderId), orderNumber: String(row.orderItemId ?? row.orderId), customerName: row.receiverName, shippingAddress: row.receiverAddress, totalAmount: row.totalPrice, taxAmount: row.tax, status: ({ 1: 'PENDING', 2: 'CONFIRMED', 5: 'SHIPPED', 7: 'DELIVERED', 11: 'CONFIRMED' } as Record<number, string>)[row.orderItemStatusId] || 'PENDING' })));
      if (rows.length < 100 || orders.length >= Number(data.orderListCount)) return { success: true, platform: 'CICEKSEPETI', orders };
      await new Promise(resolve => setTimeout(resolve, 5_100));
    }
    throw new Error('Çiçeksepeti sipariş sayfalaması tamamlanamadı');
  }

  async updateStock(sku: string, stock: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/Products/price-and-stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          items: [
            {
              stockCode: sku,
              stockQuantity: stock,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `CicekSepeti stock update failed: HTTP ${response.status}`,
        );
      }

      return { success: response.ok, sku, stock, platform: 'CICEKSEPETI' };
    } catch (error) {
      this.logger.warn(
        `CicekSepeti updateStock error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async updatePrice(sku: string, price: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/Products/price-and-stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          items: [
            {
              stockCode: sku,
              salesPrice: price,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `CicekSepeti price update failed: HTTP ${response.status}`,
        );
      }

      return { success: response.ok, sku, price, platform: 'CICEKSEPETI' };
    } catch (error) {
      this.logger.warn(
        `CicekSepeti updatePrice error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async getStoreInfo(storeId: string): Promise<any> {
    try {
      const url = `https://www.ciceksepeti.com/magaza/${storeId}`;
      const scraped = await this.scrapingService.scrapeStore(
        url,
        'CICEKSEPETI',
      );
      if (scraped) {
        return {
          storeId,
          storeName: scraped.storeName || storeId,
          totalProducts: scraped.productCount ?? 0,
          averageRating: scraped.rating ?? 0,
          totalReviews: scraped.totalReviews ?? 0,
          followersCount: scraped.followerCount ?? 0,
          platform: 'CICEKSEPETI',
        };
      }
    } catch (error) {
      this.logger.warn(
        `CicekSepeti getStoreInfo scraping failed: ${(error as Error).message}`,
      );
    }

    return {
      storeId,
      storeName: storeId,
      platform: 'CICEKSEPETI',
    };
  }

  async getStoreProducts(
    storeId: string,
    limit: number = 10,
  ): Promise<CicekSepetiProduct[]> {
    try {
      const url = `https://www.ciceksepeti.com/magaza/${storeId}`;
      const scraped = await this.scrapingService.scrapeStoreProducts(
        url,
        'CICEKSEPETI',
        limit,
      );
      if (Array.isArray(scraped) && scraped.length > 0) {
        return (scraped as unknown as Array<Record<string, unknown>>).map(
          (item) => ({
            productId: String(item.productId || item.id || ''),
            title: String(item.title || ''),
            price: Number(item.price || 0),
            salePrice: Number(item.salePrice || item.price || 0),
            stockCount: Number(item.stock ?? item.stockCount ?? 0),
            rating: Number(item.rating || 0),
            reviewCount: Number(item.reviewCount || 0),
            url: String(item.url || ''),
            images: Array.isArray(item.images) ? (item.images as string[]) : [],
            storeName: item.storeName ? String(item.storeName) : undefined,
          }),
        );
      }
    } catch (error) {
      this.logger.warn(
        `CicekSepeti getStoreProducts scraping failed: ${(error as Error).message}`,
      );
    }

    return [];
  }

  /**
   * ÇiçekSepeti mağaza SEO analizi yap
   */
  async analyzeStoreSEO(
    storeId?: string,
  ): Promise<MarketplaceAnalysisResponse> {
    try {
      const resolvedStoreId = storeId || 'default';
      const storeInfo = await this.getStoreInfo(resolvedStoreId);
      const products = await this.getStoreProducts(resolvedStoreId, 20);

      const seoScore = this.calculateSEOScore(storeInfo, products);

      const metricSources = {
        storeName: 'scraped',
        rating: 'scraped',
        followers: 'scraped',
        totalProducts: 'scraped',
        responseTime: 'not_available',
        monthlyTraffic: 'not_available',
        monthlyTurnover: 'not_available',
        titleOptimization: 'calculated',
        imageOptimization: 'calculated',
        priceCompetitiveness: 'calculated',
        stockHealth: 'calculated',
        ratingTrend: 'scraped',
        reviewCount: 'scraped',
      } as const;

      return {
        platform: 'CICEKSEPETI',
        storeId: resolvedStoreId,
        storeName: storeInfo.storeName,
        seoScore,
        dataSources: {
          overall: 'scraped+calculated',
          seoScore: 'calculated',
          products: 'scraped',
          metrics: metricSources,
          reasons: {
            responseTime:
              'CicekSepeti public source yanit suresi bilgisini acik olarak saglamiyor.',
            monthlyTraffic:
              'Aylik trafik verisi platform public endpointlerinde bulunmuyor.',
            monthlyTurnover:
              'Aylik ciro verisi platform public endpointlerinde bulunmuyor.',
          },
          evidence: {
            adapter: 'ciceksepeti.bridge',
            productSampleSize: products.length,
            hasCredentials: Boolean(this.apiKey && this.apiKey !== 'public'),
          },
        },
        confidence: computeConfidenceFromSources(metricSources),
        metrics: {
          storeName: storeInfo.storeName,
          rating: storeInfo.averageRating,
          followers: storeInfo.followersCount,
          totalProducts: storeInfo.totalProducts,
          titleOptimization: this.analyzeTitles(products),
          imageOptimization: this.analyzeImages(products),
          priceCompetitiveness: this.analyzePrices(products),
          stockHealth: this.analyzeStock(products),
          ratingTrend: storeInfo.averageRating,
          reviewCount: 0,
        },
        products: products.map((p) => ({
          name: p.title,
          price: p.salePrice,
          rating: p.rating,
          reviews: p.reviewCount,
          stock: p.stockCount,
        })),
        recommendations: this.generateRecommendations(storeInfo, products),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `CicekSepeti SEO analysis error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private calculateSEOScore(
    storeInfo: any,
    products: CicekSepetiProduct[],
  ): number {
    let score = 50; // Base score

    // Rating (max +20) - ÇiçekSepeti uses 10-scale
    score += (storeInfo.averageRating / 10) * 20;

    // Product count (max +10)
    const productBonus = Math.min(storeInfo.totalProducts / 30, 10);
    score += productBonus;

    // Stock health (max +15)
    const avgStock =
      products.length > 0
        ? products.reduce((sum, p) => sum + (p.stockCount > 0 ? 1 : 0), 0) /
          products.length
        : 0;
    score += avgStock * 15;

    // Followers (max +5)
    const followerBonus = Math.min(storeInfo.followersCount / 500, 5);
    score += followerBonus;

    return Math.min(Math.round(score), 100);
  }

  private analyzeTitles(products: CicekSepetiProduct[]): number {
    if (!products.length) return 50;
    let validCount = 0;

    products.forEach((p) => {
      const title = p.title || '';
      if (title.length >= 20 && title.length <= 120) validCount++;
    });

    return Math.round((validCount / products.length) * 100);
  }

  private analyzeImages(products: CicekSepetiProduct[]): number {
    if (!products.length) return 50;
    let validCount = 0;
    products.forEach((p) => {
      if (p.images && p.images.length >= 1) validCount++;
    });
    return Math.round((validCount / products.length) * 100);
  }

  private analyzePrices(products: CicekSepetiProduct[]): number {
    if (!products.length) return 50;
    const avgPrice =
      products.reduce((sum, p) => sum + p.salePrice, 0) / products.length;
    const variance =
      products.reduce((sum, p) => sum + Math.abs(p.salePrice - avgPrice), 0) /
      products.length;
    const normalizedVariance = Math.min(
      25,
      (variance / Math.max(avgPrice, 1)) * 100,
    );
    return Math.round(
      Math.min(
        100,
        Math.max(50, (avgPrice > 100 ? 70 : 60) + (25 - normalizedVariance)),
      ),
    );
  }

  private analyzeStock(products: CicekSepetiProduct[]): number {
    if (!products.length) return 50;
    const stockedProducts = products.filter((p) => p.stockCount > 5).length;
    return Math.round((stockedProducts / products.length) * 100);
  }

  private generateRecommendations(
    storeInfo: any,
    products: CicekSepetiProduct[],
  ): string[] {
    const recommendations: string[] = [];

    if (storeInfo.averageRating < 8.5) {
      recommendations.push(
        'ÇiçekSepeti mağaza puanını artırmak için ürün kalitesini iyileştir',
      );
    }

    if (storeInfo.totalProducts < 15) {
      recommendations.push(
        'ÇiçekSepeti kataloğunu genişlet - minimum 15+ ürün önerilir',
      );
    }

    const lowStockProducts = products.filter((p) => p.stockCount < 10).length;
    if (lowStockProducts > 0) {
      recommendations.push(`${lowStockProducts} ürün kritik stok seviyesinde`);
    }

    return recommendations;
  }

  /**
   * ÇiçekSepeti'nden ürün yorumlarını çek
   * API: GET /api/v1/products/reviews?page=1&pageSize=100
   */
  async getReviews(
    page: number = 1,
    size: number = 100,
  ): Promise<MarketplaceReview[]> {
    if (!this.apiKey) {
      this.logger.warn('CicekSepeti getReviews: API anahtarı eksik');
      return [];
    }
    try {
      const response = await fetch(
        `${this.baseUrl}/Product/GetProductReviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          body: JSON.stringify({ page, pageSize: size }),
        },
      );
      if (!response.ok) return [];
      const data = (await response.json()) as Record<string, unknown>;
      const reviews: Record<string, unknown>[] = Array.isArray(data.data)
        ? (data.data as Record<string, unknown>[])
        : Array.isArray(data.reviews)
          ? (data.reviews as Record<string, unknown>[])
          : [];
      return reviews
        .map((r) => ({
          externalId: String(r.id ?? r.reviewId ?? ''),
          productId: r.productSupplierId
            ? String(r.productSupplierId)
            : undefined,
          productName: String(r.productName ?? 'Ürün'),
          customerName: String(r.customerName ?? r.userName ?? 'Müşteri'),
          rating: Math.round(Number(r.point ?? r.rating ?? 0)),
          title: r.title ? String(r.title) : undefined,
          comment: String(r.comment ?? r.description ?? ''),
          reviewDate: r.createdDate
            ? new Date(r.createdDate as string)
            : new Date(),
          helpful: Number(r.helpfulCount ?? 0),
          verified: Boolean(r.isVerified ?? false),
        }))
        .filter((r) => r.externalId && r.comment);
    } catch (error) {
      this.logger.warn(
        `CicekSepeti getReviews hatası: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
