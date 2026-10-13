import { Injectable, Logger } from '@nestjs/common';
import { providerPages } from './provider-http';
import { MarketplaceBridge, MarketplaceReview } from './marketplace.service';
import { ScrapingService } from '../scraping/scraping.service';
import {
  MarketplaceAnalysisResponse,
  computeConfidenceFromSources,
} from './analysis.types';

interface N11Product {
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
  storeUrl?: string;
}

@Injectable()
export class N11Bridge implements MarketplaceBridge {
  private readonly logger = new Logger(N11Bridge.name);
  private readonly baseUrl = 'https://api.n11.com/ws';

  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string,
    private readonly scrapingService: ScrapingService,
  ) {}

  async syncProducts(): Promise<any> {
    const raw = await providerPages('https://api.n11.com/ms/product-query', { appKey: this.apiKey, appSecret: this.apiSecret });
    const products = raw.map((p: any) => ({ ...p, productId: String(p.n11ProductId), stockCount: p.quantity, price: p.salePrice, images: p.imageUrls || [], sku: p.stockCode }));
    return { success: true, platform: 'N11', products, count: products.length };
  }

  async syncOrders(): Promise<any> {
    const endDate = Date.now();
    const url = 'https://api.n11.com/rest/delivery/v1/shipmentPackages?startDate=' + (endDate - 14 * 86400000) + '&endDate=' + endDate;
    const raw = await providerPages(url, { appKey: this.apiKey, appSecret: this.apiSecret });
    const orders = raw.map((row: any) => ({ ...row, orderId: String(row.id), status: this.mapN11OrderStatus(String(row.shipmentPackageStatus || '')), totalPrice: row.totalAmount, customerName: row.customerfullName, orderDate: row.orderDate }));
    return { success: true, platform: 'N11', orders, count: orders.length };
  }

  async updateStock(sku: string, stock: number): Promise<any> {
    try {
      const url = `${this.baseUrl}/ProductStockService/`;
      const soapBody = this.buildSoapEnvelope(
        'IncreaseStockByStockSellerCode',
        `
                <stockItems>
                    <stockItem>
                        <sellerStockCode>${this.escapeXml(sku)}</sellerStockCode>
                        <quantity>${stock}</quantity>
                        <version>1</version>
                    </stockItem>
                </stockItems>
            `,
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        body: soapBody,
      });

      if (response.status === 429 || response.status >= 500) {
        throw new Error(`N11 stock update failed: HTTP ${response.status}`);
      }

      return { success: response.ok, sku, stock, platform: 'N11' };
    } catch (error) {
      this.logger.warn(`N11 updateStock error: ${(error as Error).message}`);
      throw error;
    }
  }

  async updatePrice(sku: string, price: number): Promise<any> {
    try {
      const url = `${this.baseUrl}/ProductService/`;
      const soapBody = this.buildSoapEnvelope(
        'UpdateProductPriceBySellerCode',
        `
                <productSellerCode>${this.escapeXml(sku)}</productSellerCode>
                <price>${price}</price>
                <currencyType>1</currencyType>
            `,
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        body: soapBody,
      });

      if (response.status === 429 || response.status >= 500) {
        throw new Error(`N11 price update failed: HTTP ${response.status}`);
      }

      return { success: response.ok, sku, price, platform: 'N11' };
    } catch (error) {
      this.logger.warn(`N11 updatePrice error: ${(error as Error).message}`);
      throw error;
    }
  }

  async getStoreInfo(storeId: string): Promise<any> {
    try {
      const url = `https://www.n11.com/magaza/${storeId}`;
      const scraped = await this.scrapingService.scrapeStore(url, 'N11');
      if (scraped) {
        return {
          storeId,
          storeName: scraped.storeName || storeId,
          totalProducts: scraped.productCount ?? 0,
          averageRating: scraped.rating ?? 0,
          totalReviews: scraped.totalReviews ?? 0,
          followersCount: scraped.followerCount ?? 0,
          platform: 'N11',
        };
      }
    } catch (error) {
      this.logger.warn(
        `N11 getStoreInfo scraping failed: ${(error as Error).message}`,
      );
    }

    return {
      storeId,
      storeName: storeId,
      platform: 'N11',
    };
  }

  async getStoreProducts(
    storeId: string,
    limit: number = 10,
  ): Promise<N11Product[]> {
    try {
      const url = `https://www.n11.com/magaza/${storeId}`;
      const scraped = await this.scrapingService.scrapeStoreProducts(
        url,
        'N11',
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
            storeUrl: item.storeUrl ? String(item.storeUrl) : undefined,
          }),
        );
      }
    } catch (error) {
      this.logger.warn(
        `N11 getStoreProducts scraping failed: ${(error as Error).message}`,
      );
    }

    return [];
  }

  /**
   * N11 mağaza SEO analizi yap
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
        platform: 'N11',
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
              'N11 public source yanit suresi bilgisini acik olarak saglamiyor.',
            monthlyTraffic:
              'Aylik trafik verisi platform public endpointlerinde bulunmuyor.',
            monthlyTurnover:
              'Aylik ciro verisi platform public endpointlerinde bulunmuyor.',
          },
          evidence: {
            adapter: 'n11.bridge',
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
      this.logger.error(`N11 SEO analysis error: ${(error as Error).message}`);
      throw error;
    }
  }

  private calculateSEOScore(storeInfo: any, products: N11Product[]): number {
    let score = 48; // Base score

    // Rating (max +18) - N11 uses 10-scale
    score += (storeInfo.averageRating / 10) * 18;

    // Product count (max +12)
    const productBonus = Math.min(storeInfo.totalProducts / 50, 12);
    score += productBonus;

    // Stock health (max +15)
    const avgStock =
      products.length > 0
        ? products.reduce((sum, p) => sum + (p.stockCount > 0 ? 1 : 0), 0) /
          products.length
        : 0;
    score += avgStock * 15;

    // Followers (max +7)
    const followerBonus = Math.min(storeInfo.followersCount / 1000, 7);
    score += followerBonus;

    return Math.min(Math.round(score), 100);
  }

  private analyzeTitles(products: N11Product[]): number {
    if (!products.length) return 50;
    let validCount = 0;

    products.forEach((p) => {
      const title = p.title || '';
      // N11 title: 20-150 chars ideal
      if (title.length >= 20 && title.length <= 150) validCount++;
    });

    return Math.round((validCount / products.length) * 100);
  }

  private analyzeImages(products: N11Product[]): number {
    if (!products.length) return 50;
    let validCount = 0;
    products.forEach((p) => {
      if (p.images && p.images.length >= 1) validCount++;
    });
    return Math.round((validCount / products.length) * 100);
  }

  private analyzePrices(products: N11Product[]): number {
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
        Math.max(50, (avgPrice > 150 ? 70 : 60) + (25 - normalizedVariance)),
      ),
    );
  }

  private analyzeStock(products: N11Product[]): number {
    if (!products.length) return 50;
    const stockedProducts = products.filter((p) => p.stockCount > 5).length;
    return Math.round((stockedProducts / products.length) * 100);
  }

  private generateRecommendations(
    storeInfo: any,
    products: N11Product[],
  ): string[] {
    const recommendations: string[] = [];

    if (storeInfo.averageRating < 8.0) {
      recommendations.push(
        'N11 mağaza puanını artırmak için kargolama sürelerini kısalt',
      );
    }

    if (storeInfo.totalProducts < 20) {
      recommendations.push(
        'N11 kataloğunu genişlet - minimum 20+ ürün önerilir',
      );
    }

    const lowStockProducts = products.filter((p) => p.stockCount < 10).length;
    if (lowStockProducts > 0) {
      recommendations.push(`${lowStockProducts} ürün kritik stok seviyesinde`);
    }

    if (storeInfo.followersCount < 100) {
      recommendations.push(
        'Mağaza takipçi sayısını artırmak için kampanyalar düzenle',
      );
    }

    return recommendations;
  }

  // SOAP helpers
  private buildSoapEnvelope(action: string, body: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
    <soapenv:Header>
        <sch:Authentication>
            <appKey>${this.escapeXml(this.apiKey)}</appKey>
            <appSecret>${this.escapeXml(this.apiSecret)}</appSecret>
        </sch:Authentication>
    </soapenv:Header>
    <soapenv:Body>
        <sch:${action}Request>
            ${body}
        </sch:${action}Request>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private parseSoapResultError(xml: string): string | null {
    const status = this.getXmlValue(xml, 'status').toLowerCase();
    if (status && status !== 'success') {
      const errorMessage = this.getXmlValue(xml, 'errorMessage');
      const errorCode = this.getXmlValue(xml, 'errorCode');
      return (
        errorMessage ||
        (errorCode ? `N11 API hatası: ${errorCode}` : 'N11 API isteği başarısız')
      );
    }
    return null;
  }

  private parseOrderListResponse(xml: string): Record<string, unknown>[] {
    const orders: Record<string, unknown>[] = [];
    const orderBlocks = xml.match(/<order>([\s\S]*?)<\/order>/g) || [];

    for (const block of orderBlocks) {
      const buyerBlock = this.getXmlBlock(block, 'buyer');
      const shippingBlock =
        this.getXmlBlock(block, 'shippingAddress') ||
        this.getXmlBlock(block, 'shipmentAddress');
      const billingBlock = this.getXmlBlock(block, 'billingAddress');

      const orderNumber =
        this.getXmlValue(block, 'orderNumber') || this.getXmlValue(block, 'id');
      if (!orderNumber) continue;

      const createDate = this.getXmlValue(block, 'createDate');
      const totalAmount = Number(
        this.getXmlValue(block, 'totalAmount') ||
          this.getXmlValue(block, 'dueAmount') ||
          0,
      );

      orders.push({
        orderNumber,
        orderId: this.getXmlValue(block, 'id'),
        status: this.mapN11OrderStatus(this.getXmlValue(block, 'status')),
        customerName: this.getXmlValue(buyerBlock, 'fullName'),
        customerEmail: this.getXmlValue(buyerBlock, 'email'),
        customerPhone: this.getXmlValue(buyerBlock, 'gsm'),
        shippingAddress: this.formatAddressBlock(shippingBlock),
        billingAddress: this.formatAddressBlock(billingBlock),
        totalPrice: totalAmount,
        totalAmount,
        paymentStatus: 'PAID',
        orderDate: this.parseN11Date(createDate),
        trackingNumber: this.getXmlValue(block, 'shipmentCode'),
        currency: 'TRY',
      });
    }

    return orders;
  }

  private mapN11OrderStatus(status: string): string {
    const normalized = status.trim().toLowerCase();
    const numericStatus = Number(normalized);

    if (
      normalized.includes('ship') ||
      normalized.includes('kargo') ||
      numericStatus === 4
    ) {
      return 'SHIPPED';
    }
    if (
      normalized.includes('deliver') ||
      normalized.includes('complete') ||
      normalized.includes('teslim') ||
      numericStatus === 5 ||
      numericStatus === 6
    ) {
      return 'DELIVERED';
    }
    if (
      normalized.includes('cancel') ||
      normalized.includes('reject') ||
      normalized.includes('iptal') ||
      numericStatus === 3
    ) {
      return 'CANCELLED';
    }
    if (
      normalized.includes('approve') ||
      normalized.includes('new') ||
      normalized.includes('onay') ||
      numericStatus === 1 ||
      numericStatus === 2
    ) {
      return 'CONFIRMED';
    }

    return 'PENDING';
  }

  private formatAddressBlock(block: string): string {
    if (!block) return '';
    const parts = [
      this.getXmlValue(block, 'fullAddress'),
      this.getXmlValue(block, 'address'),
      this.getXmlValue(block, 'neighborhood'),
      this.getXmlValue(block, 'district'),
      this.getXmlValue(block, 'city'),
      this.getXmlValue(block, 'postalCode'),
    ].filter(Boolean);
    return parts.join(', ');
  }

  private parseN11Date(value: string): string {
    if (!value) return new Date().toISOString();
    const slashMatch = value.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
    );
    if (slashMatch) {
      const [, day, month, year, hour = '0', minute = '0'] = slashMatch;
      const parsed = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
      );
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString();
  }

  private getXmlValue(block: string, tag: string): string {
    const match = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return match ? match[1].trim() : '';
  }

  private getXmlBlock(block: string, tag: string): string {
    const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return match ? match[1] : '';
  }

  private parseProductListResponse(xml: string): N11Product[] {
    // Simple regex-based XML parsing for product data
    const products: N11Product[] = [];
    const productBlocks = xml.match(/<product>([\s\S]*?)<\/product>/g) || [];

    for (const block of productBlocks.slice(0, 100)) {
      const getValue = (tag: string): string => {
        const match = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1] : '';
      };

      products.push({
        productId: getValue('id') || getValue('productSellerCode'),
        title: getValue('title'),
        price: Number(getValue('displayPrice') || getValue('price') || 0),
        salePrice: Number(getValue('salePrice') || getValue('price') || 0),
        stockCount: Number(getValue('stockAmount') || 0),
        rating: 0,
        reviewCount: 0,
        url: getValue('url'),
        images: [],
      });
    }

    return products;
  }

  private daysAgo(days: number): string {
    const d = new Date(Date.now() - days * 86400000);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  private now(): string {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  /**
   * N11'den ürün yorumlarını SOAP API ile çek
   */
  async getReviews(
    page: number = 0,
    size: number = 100,
  ): Promise<MarketplaceReview[]> {
    if (!this.apiKey || !this.apiSecret) {
      this.logger.warn('N11 getReviews: API kimlik bilgileri eksik');
      return [];
    }
    try {
      const url = `${this.baseUrl}/ProductService/`;
      const soapBody = this.buildSoapEnvelope(
        'GetProductQuestionList',
        `
                <pagingData>
                    <currentPage>${page}</currentPage>
                    <pageSize>${size}</pageSize>
                </pagingData>
            `,
      );
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '' },
        body: soapBody,
      });
      if (!response.ok) return [];
      const xml = await response.text();
      return this.parseReviewsFromXml(xml);
    } catch (error) {
      this.logger.warn(`N11 getReviews hatası: ${(error as Error).message}`);
      return [];
    }
  }

  private parseReviewsFromXml(xml: string): MarketplaceReview[] {
    const reviews: MarketplaceReview[] = [];
    const blocks =
      xml.match(/<review>([\ s\S]*?)<\/review>/g) ||
      xml.match(/<question>([\ s\S]*?)<\/question>/g) ||
      [];
    for (const block of blocks.slice(0, 100)) {
      const getValue = (tag: string): string => {
        const match = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1].trim() : '';
      };
      const id = getValue('id') || getValue('reviewId');
      const comment =
        getValue('review') || getValue('comment') || getValue('question');
      if (!id || !comment) continue;
      reviews.push({
        externalId: id,
        productName: getValue('productName') || 'N11 Ürün',
        customerName: getValue('reviewer') || getValue('userName') || 'Müşteri',
        rating: Number(getValue('rating') || getValue('rate') || 0),
        comment,
        reviewDate: getValue('createDate')
          ? new Date(getValue('createDate'))
          : new Date(),
        verified: getValue('approved') === 'true',
      });
    }
    return reviews;
  }
}
