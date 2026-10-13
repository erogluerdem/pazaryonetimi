import { Injectable, Logger } from '@nestjs/common';
import { providerJson, trendyolBase, trendyolHeaders } from './provider-http';
import { MarketplaceBridge, MarketplaceReview } from './marketplace.service';
import { ScrapingService } from '../scraping/scraping.service';
import {
  MarketplaceAnalysisResponse,
  computeConfidenceFromSources,
} from './analysis.types';
import {
  SYNC_FULL_CATALOG_LIMIT,
  SYNC_MAX_API_PAGES,
  isUnlimitedSync,
  resolveScrapeLimit,
  resolveSyncPageSize,
} from './marketplace-sync.constants';

interface TrendyolStoreData {
  storeId: string;
  storeName: string;
  categoryCount: number;
  totalProducts: number;
  averageRating: number;
  totalReviews: number;
  followersCount: number;
  establishedDate: string;
  responseTimeHours: number | null;
}

interface TrendyolProduct {
  productId: string;
  barcode?: string;
  sku?: string;
  stockCode?: string;
  description?: string;
  brand?: string;
  title: string;
  salePrice: number;
  currencyCode: string;
  listingStatus: string;
  stockCount: number;
  categoryId: string;
  categoryName: string;
  images: string[];
  rating: number;
  reviewCount: number;
  hasFreeCargo: boolean;
}

@Injectable()
export class TrendyolBridge implements MarketplaceBridge {
  private readonly logger = new Logger(TrendyolBridge.name);
  private readonly productionUrl = trendyolBase(false);
  private readonly stageUrl = trendyolBase(true);
  private readonly baseUrl: string;
  private readonly requestDelayMs = 250;
  private readonly maxApiPages = SYNC_MAX_API_PAGES;

  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string,
    private readonly supplierId: string,
    private readonly scrapingService: ScrapingService,
    private readonly isTestMode: boolean = false,
  ) {
    this.baseUrl = this.isTestMode ? this.stageUrl : this.productionUrl;
  }

  /**
   * Mağaza bilgilerini Trendyol API'sinden çek
   */
  async getStoreInfo(storeId?: string): Promise<TrendyolStoreData> {
    try {
      // Use ScrapingService for real data if available
      const resolvedId = storeId || this.supplierId;
      const url = /^\d+$/.test(String(resolvedId))
        ? `https://www.trendyol.com/sr?mid=${resolvedId}`
        : `https://www.trendyol.com/magaza/${String(resolvedId).toLowerCase()}-m-${resolvedId}`;
      const scrapedData = await this.scrapingService.scrapeStore(
        url,
        'TRENDYOL',
      );

      if (scrapedData) {
        return {
          storeId: storeId || this.supplierId,
          storeName: scrapedData.storeName,
          categoryCount: Math.ceil(scrapedData.productCount / 20), // Estimate categories from product count
          totalProducts: scrapedData.productCount,
          averageRating: scrapedData.rating,
          totalReviews: scrapedData.totalReviews ?? 0,
          followersCount: scrapedData.followerCount,
          establishedDate: scrapedData.establishedDate || '',
          responseTimeHours: null,
        };
      }

      throw new Error('Trendyol mağaza verisi alınamadı');
    } catch (error) {
      this.logger.error(
        `Trendyol store info error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Mağazanın ürünlerini çek
   */
  async getStoreProducts(
    storeId?: string,
    limit: number = 10,
  ): Promise<TrendyolProduct[]> {
    try {
      const resolvedStoreId = storeId || this.supplierId;

      // Prefer official API when credentials are present.
      const apiProducts = await this.getStoreProductsFromApi(
        resolvedStoreId,
        limit,
      );
      if (this.apiKey && this.apiSecret && this.apiKey !== 'public' && this.apiSecret !== 'public') {
        return apiProducts;
      }

      this.logger.warn(
        `Trendyol API ürün çekimi boş döndü, scraping fallback çalışacak. storeId=${resolvedStoreId}`,
      );
      const url = /^\d+$/.test(String(resolvedStoreId))
        ? `https://www.trendyol.com/sr?mid=${resolvedStoreId}`
        : `https://www.trendyol.com/magaza/${resolvedStoreId.toLowerCase()}-m-${resolvedStoreId}`;
      const scrapedProducts = await this.scrapingService.scrapeStoreProducts(
        url,
        'TRENDYOL',
        resolveScrapeLimit(limit),
      );

      return scrapedProducts.map((product, index) => ({
        productId: `TR-${resolvedStoreId}-${index + 1}`,
        title: product.title,
        salePrice: product.price,
        currencyCode: 'TRY',
        listingStatus: product.stockStatus ? 'ACTIVE' : 'OUT_OF_STOCK',
        stockCount: product.stockStatus ? 50 : 0,
        categoryId: 'UNKNOWN',
        categoryName: 'Genel',
        images: product.images,
        rating: product.rating,
        reviewCount: product.reviewCount,
        hasFreeCargo: false,
      }));
    } catch (error) {
      this.logger.error(`Trendyol products error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async getStoreProductsFromApi(
    storeId: string,
    limit: number,
  ): Promise<TrendyolProduct[]> {
    if (
      !this.apiKey ||
      !this.apiSecret ||
      this.apiKey === 'public' ||
      this.apiSecret === 'public'
    ) {
      return [];
    }

    const results: TrendyolProduct[] = [];
    const unlimited = isUnlimitedSync(limit);
    const size = resolveSyncPageSize(limit);

    let cursor = ''; const cursors = new Set<string>();
    for (let page = 0; page < 2000; page++) {
      const query = new URLSearchParams({ size: String(size) });
      if (cursor) query.set('nextPageToken', cursor); else query.set('page', String(page));
      const response = await this.requestTrendyol('/product/sellers/' + encodeURIComponent(storeId) + '/products/approved?' + query.toString());
      if (!response || !Array.isArray(response.content)) throw new Error('Trendyol ürün yanıtı beklenen biçimde değil');
      for (const item of this.extractProductArray(response)) {
        if (!unlimited && results.length >= limit) return results;
        results.push(this.mapApiProduct(item, storeId));
      }
      if (!unlimited && results.length >= limit) return results;
      if (response.content.length < size || response.last === true || (!cursor && page + 1 >= Number(response.totalPages))) return results;
      if ((page + 1) * size >= 10_000 || cursor) {
        const next = String(response.nextPageToken || '');
        if (!next || cursors.has(next)) throw new Error('Trendyol devam tokenı alınamadı; katalog aktarımı tamamlanmadı');
        cursors.add(next); cursor = next;
      }
      await this.delay(this.requestDelayMs);
    }
    throw new Error('Trendyol sayfalaması sınırı aşıldı; aktarım tamamlanmadı');

  }

  private async requestTrendyol(
    endpoint: string,
  ): Promise<Record<string, unknown> | null> {
    return providerJson(this.baseUrl + endpoint, { headers: trendyolHeaders(this.supplierId, this.apiKey, this.apiSecret) });
  }

  private extractProductArray(
    payload: Record<string, unknown>,
  ): Record<string, unknown>[] {
    const content = payload.content;
    if (Array.isArray(content)) return content.flatMap((item: any) => Array.isArray(item.variants) ? item.variants.map((variant: any) => ({ ...item, ...variant, id: variant.variantId || variant.barcode, quantity: variant.stock?.quantity ?? 0, salePrice: variant.price?.salePrice ?? 0, categoryId: item.category?.id, categoryName: item.category?.name, brand: item.brand?.name, approved: true })) : [item]);

    const items = payload.items;
    if (Array.isArray(items)) return items as Record<string, unknown>[];

    return [];
  }

  private mapApiProduct(
    item: Record<string, unknown>,
    storeId: string,
  ): TrendyolProduct {
    const imagesRaw = item.images;
    const images = Array.isArray(imagesRaw)
      ? imagesRaw
          .map((img) => {
            if (typeof img === 'string') return img;
            if (
              img &&
              typeof img === 'object' &&
              'url' in img &&
              typeof img.url === 'string'
            )
              return img.url;
            return '';
          })
          .filter((v): v is string => Boolean(v))
      : [];

    const stock = Number(item.quantity ?? item.stock ?? 0);
    const price = Number(item.salePrice ?? item.listPrice ?? item.price ?? 0);

    return {
      productId: String(item.id ?? item.barcode ?? item.productMainId ?? ''),
      barcode: String(item.barcode || ''), sku: String(item.barcode || item.stockCode || item.id || ''), stockCode: String(item.stockCode || ''),
      description: String(item.description || ''), brand: String(item.brand || ''),
      title: String(item.title ?? item.name ?? 'İsimsiz Ürün'),
      salePrice: Number.isFinite(price) ? price : 0,
      currencyCode: String(item.currencyType ?? item.currencyCode ?? 'TRY'),
      listingStatus: String(
        item.approved ?? item.status ?? (stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'),
      ),
      stockCount: Number.isFinite(stock) ? stock : 0,
      categoryId: String(item.categoryId ?? 'UNKNOWN'),
      categoryName: String(item.categoryName ?? 'Genel'),
      images,
      rating: 0,
      reviewCount: 0,
      hasFreeCargo: Boolean(item.fastDelivery ?? item.freeCargo),
    };
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * SEO ve Performans analizi yap
   */
  async analyzeStoreSEO(
    storeId?: string,
  ): Promise<MarketplaceAnalysisResponse> {
    try {
      const storeInfo = await this.getStoreInfo(storeId);
      const products = await this.getStoreProducts(storeId, 20);

      // SEO Score hesabı
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
        platform: 'TRENDYOL',
        storeId: storeInfo.storeId,
        storeName: storeInfo.storeName,
        seoScore,
        dataSources: {
          overall: 'scraped+calculated',
          seoScore: 'calculated',
          products: 'api_or_scraped',
          metrics: metricSources,
          reasons: {
            responseTime:
              'Trendyol public source yanit suresi bilgisini acik olarak saglamiyor.',
            monthlyTraffic:
              'Aylik trafik verisi platform public endpointlerinde bulunmuyor.',
            monthlyTurnover:
              'Aylik ciro verisi platform public endpointlerinde bulunmuyor.',
          },
          evidence: {
            adapter: 'trendyol.bridge',
            productSampleSize: products.length,
            hasCredentials: Boolean(
              this.apiKey &&
              this.apiKey !== 'public' &&
              this.apiSecret &&
              this.apiSecret !== 'public',
            ),
          },
        },
        confidence: computeConfidenceFromSources(metricSources),
        metrics: {
          storeName: storeInfo.storeName,
          rating: storeInfo.averageRating,
          followers: storeInfo.followersCount,
          totalProducts: storeInfo.totalProducts,
          responseTime:
            storeInfo.responseTimeHours !== null
              ? `${storeInfo.responseTimeHours} saat`
              : undefined,
          titleOptimization: this.analyzeTitles(products),
          imageOptimization: this.analyzeImages(products),
          priceCompetitiveness: this.analyzePrices(products),
          stockHealth: this.analyzeStock(products),
          ratingTrend: storeInfo.averageRating,
          reviewCount: storeInfo.totalReviews,
        },
        products: products.map((p) => ({
          name: p.title,
          price: p.salePrice,
          rating: p.rating,
          reviews: p.reviewCount,
          stock: p.stockCount,
          hasFreeCargo: p.hasFreeCargo,
        })),
        recommendations: this.generateRecommendations(storeInfo, products),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`SEO analysis error: ${error.message}`);
      throw error;
    }
  }

  private calculateSEOScore(
    storeInfo: TrendyolStoreData,
    products: TrendyolProduct[],
  ): number {
    let score = 50; // Base score

    // Rating (max +15)
    score += (storeInfo.averageRating / 5) * 15;

    // Review count (max +10)
    const reviewBonus = Math.min(storeInfo.totalReviews / 1000, 10);
    score += reviewBonus;

    // Followers (max +10)
    const followerBonus = Math.min(storeInfo.followersCount / 5000, 10);
    score += followerBonus;

    // Stock health (max +10)
    const avgStock =
      products.reduce((sum, p) => sum + (p.stockCount > 0 ? 1 : 0), 0) /
      products.length;
    score += avgStock * 10;

    // Response time (max +5)
    if (storeInfo.responseTimeHours !== null) {
      if (storeInfo.responseTimeHours < 4) score += 5;
      else if (storeInfo.responseTimeHours < 12) score += 3;
    }

    return Math.min(Math.round(score), 100);
  }

  private analyzeTitles(products: TrendyolProduct[]): number {
    const score = 0;
    let validCount = 0;

    products.forEach((p) => {
      const title = p.title;
      // Title optimization kuralları
      if (title.length >= 30 && title.length <= 120) validCount++;
      if (title.includes(p.categoryName)) validCount++;
    });

    return Math.round((validCount / (products.length * 2)) * 100);
  }

  private analyzeImages(products: TrendyolProduct[]): number {
    let validCount = 0;
    products.forEach((p) => {
      if (p.images && p.images.length >= 3) validCount++;
    });
    return Math.round((validCount / products.length) * 100);
  }

  private analyzePrices(products: TrendyolProduct[]): number {
    // Fiyat rekabetçiliği analizi
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
        Math.max(50, (avgPrice > 100 ? 75 : 60) + (25 - normalizedVariance)),
      ),
    );
  }

  private analyzeStock(products: TrendyolProduct[]): number {
    const stockedProducts = products.filter((p) => p.stockCount > 10).length;
    return Math.round((stockedProducts / products.length) * 100);
  }

  private generateRecommendations(
    storeInfo: TrendyolStoreData,
    products: TrendyolProduct[],
  ): string[] {
    const recommendations: string[] = [];

    if (storeInfo.averageRating < 4.5) {
      recommendations.push(
        'Müşteri memnuniyeti artırmak için ürün kalitesini gözden geçir',
      );
    }

    if (storeInfo.totalReviews < 1000) {
      recommendations.push('Daha fazla satış yaparak yorum sayısını artır');
    }

    const lowStockProducts = products.filter((p) => p.stockCount < 20).length;
    if (lowStockProducts > 0) {
      recommendations.push(
        `${lowStockProducts} ürünün stok seviyesi düşük, tedarikçi ile iletişime geç`,
      );
    }

    if (
      storeInfo.responseTimeHours !== null &&
      storeInfo.responseTimeHours > 6
    ) {
      recommendations.push(
        'Müşteri sorularına daha hızlı cevap ver (2-4 saat ideal)',
      );
    }

    if (!products.some((p) => p.hasFreeCargo)) {
      recommendations.push(
        'Kargo maliyetlerini düşürerek ücretsiz kargo sunmayı düşün',
      );
    }

    return recommendations;
  }

  async syncProducts(): Promise<any> {
    this.logger.log(
      `Syncing products for Trendyol Supplier: ${this.supplierId}`,
    );
    const products = await this.getStoreProducts(
      this.supplierId,
      SYNC_FULL_CATALOG_LIMIT,
    );
    return {
      success: true,
      platform: 'TRENDYOL',
      count: products.length,
      products,
    };
  }

  async syncOrders(): Promise<any> {
    this.logger.log(`Syncing orders for Trendyol Supplier: ${this.supplierId}`);
    const supplierId = this.supplierId;
    if (
      !this.apiKey ||
      !this.apiSecret ||
      this.apiKey === 'public' ||
      this.apiSecret === 'public'
    ) {
      throw new Error(
        'Trendyol sipariş senkronizasyonu için API kimlik bilgileri zorunludur',
      );
    }

    const orders: Record<string, unknown>[] = [];
    const end = Date.now(); const start = end - 13 * 86400000;
    for (let page = 0; page < 100; page++) {
      const response = await this.requestTrendyol('/order/sellers/' + encodeURIComponent(supplierId) + '/v2/orders?page=' + page + '&size=100&startDate=' + start + '&endDate=' + end);
      if (!response || !Array.isArray(response.content)) throw new Error('Trendyol sipariş yanıtı beklenen biçimde değil');
      const items = this.extractOrdersArray(response); orders.push(...items);
      if (items.length < 100 || page + 1 >= Number(response.totalPages)) return { success: true, platform: 'TRENDYOL', orders, source: 'api' };
      await this.delay(this.requestDelayMs);
    }
    throw new Error('Trendyol sipariş sorgusu 10.000 kayıt sınırını aşıyor; tarih aralığını daraltın');
  }

  async updateStock(sku: string, stock: number): Promise<any> {
    this.logger.log(`Updating Trendyol stock for ${sku}: ${stock}`);
    if (
      !this.apiKey ||
      !this.apiSecret ||
      this.apiKey === 'public' ||
      this.apiSecret === 'public'
    ) {
      throw new Error(
        'Trendyol stok güncelleme için API kimlik bilgileri zorunludur',
      );
    }

    return this.sendPriceInventoryUpdate(
      [{ barcode: sku, quantity: stock }],
      { sku, stock },
      'stock',
    );
  }

  async updatePrice(sku: string, price: number): Promise<any> {
    this.logger.log(`Updating Trendyol price for ${sku}: ${price}`);
    if (
      !this.apiKey ||
      !this.apiSecret ||
      this.apiKey === 'public' ||
      this.apiSecret === 'public'
    ) {
      throw new Error(
        'Trendyol fiyat güncelleme için API kimlik bilgileri zorunludur',
      );
    }

    return this.sendPriceInventoryUpdate(
      [{ barcode: sku, salePrice: price }],
      { sku, price },
      'price',
    );
  }

  private extractOrdersArray(
    payload: Record<string, unknown> | null,
  ): Record<string, unknown>[] {
    if (!payload) return [];
    if (Array.isArray(payload.content)) return payload.content as Record<string, unknown>[];
    if (Array.isArray(payload.items)) return payload.items as Record<string, unknown>[];
    if (payload.data && typeof payload.data === 'object') {
      const data = payload.data as { items?: unknown; content?: unknown };
      if (Array.isArray(data.items)) return data.items as Record<string, unknown>[];
      if (Array.isArray(data.content)) return data.content as Record<string, unknown>[];
    }
    return [];
  }

  private async sendPriceInventoryUpdate(
    items: Array<Record<string, unknown>>,
    responseMeta: { sku: string; stock?: number; price?: number },
    operation: 'stock' | 'price',
  ): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/inventory/sellers/${encodeURIComponent(this.supplierId)}/products/price-and-inventory`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': `${this.supplierId} - ${process.env.TRENDYOL_INTEGRATOR_NAME || 'PazarYonetimi'}`,
        },
        body: JSON.stringify({ items }),
      },
    );

    if (response.status === 429 || response.status >= 500) {
      throw new Error(
        `Trendyol ${operation} transient error: ${response.status}`,
      );
    }

    if (!response.ok) {
      const errorBody = await this.parseApiErrorBody(response);
      this.logger.warn(
        `Trendyol update${operation === 'stock' ? 'Stock' : 'Price'} failed (${response.status}) for sku=${responseMeta.sku}`,
      );
      return {
        success: false,
        ...responseMeta,
        source: 'api',
        status: response.status,
        error: errorBody,
      };
    }

    const resData = (await response.json()) as Record<string, unknown>;
    const batchRequestId = String(resData.batchRequestId || resData.id || '');

    return {
      success: true,
      batchRequestId,
      ...responseMeta,
      source: 'api',
      status: response.status,
    };
  }

  /**
   * Trendyol Toplu Güncelleme (Batch Request) Durumu Sorgulama
   * GET /suppliers/{supplierId}/products/batch-requests/{batchRequestId}
   */
  async checkBatchRequestStatus(batchRequestId: string): Promise<Record<string, unknown>> {
    const endpoint = `/suppliers/${encodeURIComponent(this.supplierId)}/products/batch-requests/${encodeURIComponent(batchRequestId)}`;
    const result = await this.requestTrendyol(endpoint);
    return result || { success: false, message: 'Batch request bilgisi alınamadı' };
  }

  /**
   * Trendyol E-Fatura Bağlantısı Yükleme (Sıkı API kuralı)
   * SEND invoice link for claim/order
   */
  async uploadInvoiceLink(invoiceNumber: string, invoiceUrl: string, shipmentPackageId: number): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/order/sellers/${encodeURIComponent(this.supplierId)}/supplier-invoice-links`;
    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': `${this.supplierId} - SelfIntegration`,
        },
        body: JSON.stringify({
          invoiceNumber,
          invoiceLink: invoiceUrl,
          shipmentPackageId,
        }),
      });

      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Fatura bağlantısı Trendyol\'a başarıyla iletildi' : 'Fatura iletme başarısız',
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async parseApiErrorBody(response: Response): Promise<string | null> {
    try {
      const text = await response.text();
      if (!text) return null;
      return text.length > 500 ? `${text.slice(0, 500)}...` : text;
    } catch {
      return null;
    }
  }

  /**
   * Trendyol'dan ürün yorumlarını çek
   * API: GET /suppliers/{supplierId}/products/reviews?page=0&size=100
   */
  async getReviews(
    page: number = 0,
    size: number = 100,
  ): Promise<MarketplaceReview[]> {
    if (
      !this.apiKey ||
      !this.apiSecret ||
      this.apiKey === 'public' ||
      this.apiSecret === 'public'
    ) {
      this.logger.warn('Trendyol getReviews: API kimlik bilgileri eksik');
      return [];
    }
    try {
      const endpoint = `/suppliers/${encodeURIComponent(this.supplierId)}/products/reviews?page=${page}&size=${size}&orderByField=CreateDate&orderByDirection=Desc`;
      const response = await this.requestTrendyol(endpoint);
      if (!response) return [];

      const content: Record<string, unknown>[] = [];
      if (Array.isArray(response.content))
        content.push(...(response.content as Record<string, unknown>[]));
      else if (Array.isArray((response as any).resultList))
        content.push(...(response as any).resultList);

      return content
        .map((r) => ({
          externalId: String(r.id ?? r.reviewId ?? ''),
          productId: r.productId ? String(r.productId) : undefined,
          productName: String(r.productName ?? r.productComment ?? 'Ürün'),
          customerName: String(
            r.sellerName ?? r.userFullName ?? r.createdBy ?? 'Müşteri',
          ),
          rating: Number(r.rate ?? r.rating ?? r.star ?? 0),
          title: r.summary ? String(r.summary) : undefined,
          comment: String(r.comment ?? r.text ?? r.reviewText ?? ''),
          reviewDate: r.lastModifiedDate
            ? new Date(r.lastModifiedDate as string)
            : new Date(),
          helpful: Number(r.helpfulCount ?? 0),
          verified: Boolean(r.isVerified ?? r.verified ?? false),
        }))
        .filter((r) => r.externalId && r.comment);
    } catch (error) {
      this.logger.error(
        `Trendyol getReviews hatası: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
