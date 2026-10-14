import { Injectable, Logger } from '@nestjs/common';
import { hepsiburadaHost, hepsiburadaHeaders, providerJson } from './provider-http';
import { MarketplaceBridge, MarketplaceReview } from './marketplace.service';
import { ScrapingService } from '../scraping/scraping.service';
import {
  MarketplaceAnalysisResponse,
  computeConfidenceFromSources,
} from './analysis.types';
import {
  SYNC_FULL_CATALOG_LIMIT,
  SYNC_MAX_API_PAGES,
  getHepsiburadaListingApiBase,
  isUnlimitedSync,
  resolveScrapeLimit,
  resolveSyncPageSize,
} from './marketplace-sync.constants';

interface HepsiburadaStoreData {
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

interface HepsiburadaProduct {
  productId: string;
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
  merchantSku: string;
}

@Injectable()
export class HepsiburadaBridge implements MarketplaceBridge {
  private readonly logger = new Logger(HepsiburadaBridge.name);
  private readonly baseUrl: string;
  private readonly requestDelayMs = 300;
  private readonly maxApiPages = 2000;

  constructor(
    private readonly apiKey: string,
    private readonly merchantId: string,
    private readonly scrapingService: ScrapingService,
    private readonly apiSecret: string = '',
    private readonly options: { isTestMode?: unknown; username?: string } = {},
  ) { this.baseUrl = options.isTestMode === undefined ? getHepsiburadaListingApiBase() : hepsiburadaHost('listing', options.isTestMode); }

  /**
   * Mağaza bilgilerini Hepsiburada API'sinden çek
   */
  async getStoreInfo(storeId?: string): Promise<HepsiburadaStoreData> {
    try {
      // Use ScrapingService
      const url = `https://www.hepsiburada.com/magaza/${(storeId || this.merchantId).toLowerCase()}`;
      const scrapedData = await this.scrapingService.scrapeStore(
        url,
        'HEPSIBURADA',
      );

      if (scrapedData) {
        return {
          storeId: storeId || this.merchantId,
          storeName: scrapedData.storeName,
          categoryCount: Math.ceil(scrapedData.productCount / 15),
          totalProducts: scrapedData.productCount,
          averageRating: scrapedData.rating,
          totalReviews: scrapedData.totalReviews ?? 0,
          followersCount: scrapedData.followerCount,
          establishedDate: scrapedData.establishedDate || '',
          responseTimeHours: null,
        };
      }

      throw new Error('Hepsiburada mağaza verisi alınamadı');
    } catch (error) {
      this.logger.error(
        `Hepsiburada store info error: ${(error as Error).message}`,
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
  ): Promise<HepsiburadaProduct[]> {
    try {
      const resolvedStoreId = storeId || this.merchantId;

      // Prefer official API when credentials exist.
      const apiProducts = await this.getStoreProductsFromApi(
        resolvedStoreId,
        limit,
      );
      if (this.apiKey && this.apiKey !== 'public') {
        return apiProducts;
      }

      this.logger.warn(
        `Hepsiburada API ürün çekimi boş döndü, scraping fallback çalışacak. storeId=${resolvedStoreId}`,
      );
      const url = `https://www.hepsiburada.com/magaza/${resolvedStoreId.toLowerCase()}`;
      const scrapedProducts = await this.scrapingService.scrapeStoreProducts(
        url,
        'HEPSIBURADA',
        resolveScrapeLimit(limit),
      );

      return scrapedProducts.map((product, index) => ({
        productId: `HB-${resolvedStoreId}-${index + 1}`,
        title: product.title,
        salePrice: product.price,
        currencyCode: 'TRY',
        listingStatus: product.stockStatus ? 'ACTIVE' : 'OUT_OF_STOCK',
        stockCount: product.stockStatus ? 40 : 0,
        categoryId: 'UNKNOWN',
        categoryName: 'Genel',
        images: product.images,
        rating: product.rating,
        reviewCount: product.reviewCount,
        hasFreeCargo: false,
        merchantSku: `HB-SKU-${index + 1}`,
      }));
    } catch (error) {
      this.logger.error(
        `Hepsiburada products error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private async getStoreProductsFromApi(
    storeId: string,
    limit: number,
  ): Promise<HepsiburadaProduct[]> {
    if (!this.apiKey || this.apiKey === 'public') {
      return [];
    }

    const unlimited = isUnlimitedSync(limit);
    const pageSize = resolveSyncPageSize(limit);
    const results: HepsiburadaProduct[] = [];

    for (
      let page = 0;
      page < this.maxApiPages && (unlimited || results.length < limit);
      page++
    ) {
      const payload = await this.requestHepsiburada(storeId, page, pageSize);
      if (!payload) break;

      const items = this.extractProductArray(payload);
      if (!items.length) break;

      for (const item of items) {
        if (!unlimited && results.length >= limit) break;
        results.push(this.mapApiProduct(item, storeId));
      }

      if (items.length < pageSize) {
        break;
      }

      await this.delay(this.requestDelayMs);
    }

    if (unlimited && results.length >= this.maxApiPages * pageSize) throw new Error('Hepsiburada katalog sayfalaması tamamlanamadı');
    return results;
  }

  private async requestHepsiburada(
    storeId: string,
    page: number,
    size: number,
  ): Promise<Record<string, unknown> | null> {
    return providerJson(this.baseUrl + '/listings/merchantid/' + encodeURIComponent(storeId) + '?offset=' + page * size + '&limit=' + size, { headers: hepsiburadaHeaders(this.options.username || this.apiKey, this.apiSecret) });
  }

  private extractProductArray(
    payload: Record<string, unknown>,
  ): Record<string, unknown>[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.listings)) return payload.listings as Record<string, unknown>[];
    const data = payload.data;
    if (Array.isArray(data)) return data as Record<string, unknown>[];

    if (data && typeof data === 'object') {
      const listings = (data as { listings?: unknown }).listings;
      if (Array.isArray(listings)) return listings as Record<string, unknown>[];
    }

    const items = payload.items;
    if (Array.isArray(items)) return items as Record<string, unknown>[];

    throw new Error('Hepsiburada liste yanıtı beklenen biçimde değil');
  }

  private mapApiProduct(
    item: Record<string, unknown>,
    storeId: string,
  ): HepsiburadaProduct {
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

    const stock = Number(item.availableStock ?? item.stock ?? 0);
    const price = Number(item.price ?? item.salePrice ?? 0);

    return {
      productId: String(
        item.listingId ?? item.hepsiburadaSku ?? item.id ?? item.merchantSku ?? '',
      ),
      title: String(item.title ?? item.productName ?? 'İsimsiz Ürün'),
      salePrice: Number.isFinite(price) ? price : 0,
      currencyCode: String(item.currency ?? 'TRY'),
      listingStatus: String(
        item.status ?? (stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'),
      ),
      stockCount: Number.isFinite(stock) ? stock : 0,
      categoryId: String(item.categoryId ?? 'UNKNOWN'),
      categoryName: String(item.categoryName ?? 'Genel'),
      images,
      rating: 0,
      reviewCount: 0,
      hasFreeCargo: Boolean(item.freeShipping),
      merchantSku: String(
        item.merchantSku ??
          item.stockCode ??
          item.sku ??
          `HB-SKU-${Date.now()}`,
      ),
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
        platform: 'HEPSIBURADA',
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
              'Hepsiburada public source yanit suresi bilgisini acik olarak saglamiyor.',
            monthlyTraffic:
              'Aylik trafik verisi platform public endpointlerinde bulunmuyor.',
            monthlyTurnover:
              'Aylik ciro verisi platform public endpointlerinde bulunmuyor.',
          },
          evidence: {
            adapter: 'hepsiburada.bridge',
            productSampleSize: products.length,
            hasCredentials: Boolean(this.apiKey && this.apiKey !== 'public'),
          },
        },
        confidence: computeConfidenceFromSources(metricSources),
        metrics: {
          storeName: storeInfo.storeName,
          rating: storeInfo.averageRating / 2, // Convert 10-scale to 5-scale for frontend
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
          ratingTrend: storeInfo.averageRating / 2,
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
      this.logger.error(`SEO analysis error: ${(error as Error).message}`);
      throw error;
    }
  }

  private calculateSEOScore(
    storeInfo: HepsiburadaStoreData,
    products: HepsiburadaProduct[],
  ): number {
    let score = 50; // Base score

    // Rating (max +15) - normalized from 10
    score += (storeInfo.averageRating / 10) * 15;

    // Review count (max +10)
    const reviewBonus = Math.min(storeInfo.totalReviews / 1000, 10);
    score += reviewBonus;

    // Followers (max +10)
    const followerBonus = Math.min(storeInfo.followersCount / 2000, 10);
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

  private analyzeTitles(products: HepsiburadaProduct[]): number {
    const score = 0;
    let validCount = 0;

    products.forEach((p) => {
      const title = p.title;
      // Hepsiburada specific simple checks
      if (title.length >= 20 && title.length <= 150) validCount++;
      if (title.includes(p.categoryName)) validCount++;
    });

    return Math.round((validCount / (products.length * 2)) * 100);
  }

  private analyzeImages(products: HepsiburadaProduct[]): number {
    let validCount = 0;
    products.forEach((p) => {
      if (p.images && p.images.length >= 2) validCount++;
    });
    return Math.round((validCount / products.length) * 100);
  }

  private analyzePrices(products: HepsiburadaProduct[]): number {
    if (!products.length) return 50;
    const avgPrice =
      products.reduce((sum, p) => sum + p.salePrice, 0) / products.length;
    const variance =
      products.reduce((sum, p) => sum + Math.abs(p.salePrice - avgPrice), 0) /
      products.length;
    const normalizedVariance = Math.min(
      20,
      (variance / Math.max(avgPrice, 1)) * 100,
    );
    return Math.round(
      Math.min(
        100,
        Math.max(50, (avgPrice > 200 ? 72 : 62) + (20 - normalizedVariance)),
      ),
    );
  }

  private analyzeStock(products: HepsiburadaProduct[]): number {
    const stockedProducts = products.filter((p) => p.stockCount > 5).length;
    return Math.round((stockedProducts / products.length) * 100);
  }

  private generateRecommendations(
    storeInfo: HepsiburadaStoreData,
    products: HepsiburadaProduct[],
  ): string[] {
    const recommendations: string[] = [];

    if (storeInfo.averageRating < 8.5) {
      recommendations.push(
        'Satıcı puanını artırmak için kargolama hızına dikkat et',
      );
    }

    if (storeInfo.totalReviews < 500) {
      recommendations.push(
        'Yorum sayısını artırmak için müşteri notları kullan',
      );
    }

    const lowStockProducts = products.filter((p) => p.stockCount < 10).length;
    if (lowStockProducts > 0) {
      recommendations.push(`${lowStockProducts} ürün kritik stok seviyesinde`);
    }

    if (
      storeInfo.responseTimeHours !== null &&
      storeInfo.responseTimeHours > 4
    ) {
      recommendations.push(
        'Müşteri sorularına yanıt süresini düşür (hedef < 4 saat)',
      );
    }

    return recommendations;
  }

  async syncProducts(): Promise<any> {
    this.logger.log(
      `Syncing products for Hepsiburada Merchant: ${this.merchantId}`,
    );
    const products = await this.getStoreProducts(
      this.merchantId,
      SYNC_FULL_CATALOG_LIMIT,
    );
    return {
      success: true,
      platform: 'HEPSIBURADA',
      count: products.length,
      products,
    };
  }

  async syncOrders(): Promise<any> {
    this.logger.log(
      `Syncing orders for Hepsiburada Merchant: ${this.merchantId}`,
    );
    if (!this.apiKey || this.apiKey === 'public') {
      throw new Error(
        'Hepsiburada sipariş senkronizasyonu için API kimlik bilgileri zorunludur',
      );
    }

    const orders: any[] = [];
    for (let offset = 0; offset < 200_000; offset += 50) {
      const result = await providerJson(hepsiburadaHost('oms', this.options.isTestMode) + '/orders/merchantid/' + encodeURIComponent(this.merchantId) + '?offset=' + offset + '&limit=50', { headers: hepsiburadaHeaders(this.options.username || this.apiKey, this.apiSecret) });
      const page = Array.isArray(result) ? result : result.items || result.orders;
      if (!Array.isArray(page)) throw new Error('Hepsiburada sipariş yanıtı beklenen biçimde değil');
      orders.push(...page);
      if (page.length < 50) return { success: true, platform: 'HEPSIBURADA', orders };
    }
    throw new Error('Hepsiburada sipariş sayfalaması tamamlanamadı');
  }

  async updateStock(sku: string, stock: number): Promise<any> {
    this.logger.log(`Updating Hepsiburada stock for ${sku}: ${stock}`);
    if (!this.apiKey || this.apiKey === 'public') {
      throw new Error(
        'Hepsiburada stok güncelleme için API kimlik bilgileri zorunludur',
      );
    }

    return this.sendListingMutation(
      '/ListingExternalService/v1/Listings/stock-uploads',
      [{ merchantSku: sku, availableStock: stock }],
      { sku, stock },
      'stock',
    );
  }

  async updatePrice(sku: string, price: number): Promise<any> {
    this.logger.log(`Updating Hepsiburada price for ${sku}: ${price}`);
    if (!this.apiKey || this.apiKey === 'public') {
      throw new Error(
        'Hepsiburada fiyat güncelleme için API kimlik bilgileri zorunludur',
      );
    }

    return this.sendListingMutation(
      '/ListingExternalService/v1/Listings/price-uploads',
      [{ merchantSku: sku, price }],
      { sku, price },
      'price',
    );
  }

  private extractOrderArray(payload: Record<string, unknown>): unknown[] {
    if (Array.isArray(payload.data)) return payload.data;

    if (payload.data && typeof payload.data === 'object') {
      const data = payload.data as {
        items?: unknown;
        orders?: unknown;
        content?: unknown;
      };
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.orders)) return data.orders;
      if (Array.isArray(data.content)) return data.content;
    }

    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.orders)) return payload.orders;
    return [];
  }

  private async sendListingMutation(
    endpoint: string,
    items: Array<Record<string, unknown>>,
    responseMeta: { sku: string; stock?: number; price?: number },
    operation: 'stock' | 'price',
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: hepsiburadaHeaders(this.options.username || this.apiKey, this.apiSecret).Authorization,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': process.env.HEPSIBURADA_INTEGRATOR_NAME || 'PazarYonetimi',
      },
      body: JSON.stringify({
        merchantId: this.merchantId,
        items,
      }),
    });

    if (response.status === 429 || response.status >= 500) {
      throw new Error(
        `Hepsiburada ${operation} transient error: ${response.status}`,
      );
    }

    if (!response.ok) {
      const errorBody = await this.parseApiErrorBody(response);
      this.logger.warn(
        `Hepsiburada update${operation === 'stock' ? 'Stock' : 'Price'} failed (${response.status}) for sku=${responseMeta.sku}`,
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
    const ticketId = String(resData.id || resData.ticketId || '');

    return {
      success: true,
      ticketId,
      ...responseMeta,
      source: 'api',
      status: response.status,
    };
  }

  /**
   * Hepsiburada E-Fatura Bağlantısı Gönderme
   * POST /OrderService/v1/orders/merchantid/{merchantId}/invoice-link
   */
  async uploadInvoiceLink(orderId: string, invoiceUrl: string, invoiceNumber: string): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/OrderService/v1/orders/merchantid/${encodeURIComponent(this.merchantId)}/invoice-link`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: hepsiburadaHeaders(this.options.username || this.apiKey, this.apiSecret).Authorization,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': `${this.merchantId} - SelfIntegration`,
        },
        body: JSON.stringify({
          orderId,
          invoiceUrl,
          invoiceNumber,
        }),
      });

      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Fatura bağlantısı Hepsiburada\'ya aktarıldı' : 'Aktarım başarısız',
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
   * Hepsiburada'dan ürün yorumlarını çek
   * API: GET /ReviewService/v1/reviews?merchantId={id}&page=1&pageSize=100
   */
  async getReviews(
    page: number = 1,
    size: number = 100,
  ): Promise<MarketplaceReview[]> {
    if (!this.apiKey || this.apiKey === 'public') {
      this.logger.warn('Hepsiburada getReviews: API anahtarı eksik');
      return [];
    }
    const endpoints = [
      `${this.baseUrl}/ReviewService/v1/reviews?merchantId=${encodeURIComponent(this.merchantId)}&page=${page}&pageSize=${size}`,
      `${this.baseUrl}/ReviewService/v1/reviews/merchantid/${encodeURIComponent(this.merchantId)}?page=${page}&pageSize=${size}`,
    ];
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: hepsiburadaHeaders(this.options.username || this.apiKey, this.apiSecret).Authorization,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': process.env.HEPSIBURADA_INTEGRATOR_NAME || 'PazarYonetimi',
          },
        });
        if (!response.ok) continue;
        const data = (await response.json()) as Record<string, unknown>;
        const reviews: Record<string, unknown>[] = Array.isArray(data.data)
          ? (data.data as Record<string, unknown>[])
          : Array.isArray(data.reviews)
            ? (data.reviews as Record<string, unknown>[])
            : Array.isArray(data.items)
              ? (data.items as Record<string, unknown>[])
              : [];
        return reviews
          .map((r) => ({
            externalId: String(r.id ?? r.reviewId ?? ''),
            productId: r.productId ? String(r.productId) : undefined,
            productName: String(r.productName ?? r.sku ?? 'Ürün'),
            customerName: String(
              r.userName ?? r.customerName ?? r.user ?? 'Müşteri',
            ),
            rating: Math.round(Number(r.rating ?? r.rate ?? r.score ?? 0)),
            title: r.title ? String(r.title) : undefined,
            comment: String(r.comment ?? r.description ?? r.text ?? ''),
            reviewDate: r.reviewDate
              ? new Date(r.reviewDate as string)
              : new Date(),
            helpful: Number(r.helpfulCount ?? 0),
            verified: Boolean(r.isVerified ?? false),
          }))
          .filter((r) => r.externalId && r.comment);
      } catch (error) {
        this.logger.warn(
          `Hepsiburada getReviews ${url} hatası: ${(error as Error).message}`,
        );
      }
    }
    return [];
  }
}
