import { Injectable, Logger } from '@nestjs/common';
import { MarketplaceBridge, MarketplaceReview } from './marketplace.service';
import { ScrapingService } from '../scraping/scraping.service';

interface EtsyProduct {
  productId: string;
  title: string;
  price: number;
  salePrice: number;
  stockCount: number;
  rating: number;
  reviewCount: number;
  url: string;
  images: string[];
  shopName: string;
  shopUrl: string;
  materials: string[];
  tags: string[];
  processingTime: string;
  shippingFrom: string;
  isCustomizable: boolean;
}

@Injectable()
export class EtsyBridge implements MarketplaceBridge {
  private readonly logger = new Logger(EtsyBridge.name);
  private readonly apiUrl = 'https://openapi.etsy.com/v3';

  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string,
    private readonly accessToken: string,
    private readonly scrapingService: ScrapingService,
    private readonly shopId = '',
  ) {}

  private async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'x-api-key': this.apiKey + ':' + this.apiSecret,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  async syncProducts(): Promise<any> {
    this.logger.log('Syncing products from Etsy');
    try {
      // Get shop listings
      const response = await this.makeAuthenticatedRequest(
        `${this.apiUrl}/application/shops/${encodeURIComponent(this.shopId)}/listings/active`,
      );

      if (!response.ok) {
        this.logger.warn(`Etsy syncProducts failed: ${response.status}`);
        return {
          success: false,
          platform: 'ETSY',
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const listings = data.results || [];

      return {
        success: true,
        platform: 'ETSY',
        count: listings.length,
        products: listings.map(this.mapEtsyProduct),
      };
    } catch (error) {
      this.logger.warn(`Etsy syncProducts error: ${(error as Error).message}`);
      return {
        success: false,
        platform: 'ETSY',
        error: (error as Error).message,
      };
    }
  }

  async syncOrders(): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.apiUrl}/application/shops/${encodeURIComponent(this.shopId)}/receipts`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        platform: 'ETSY',
        orders: data.results || [],
      };
    } catch (error) {
      this.logger.warn(`Etsy syncOrders error: ${(error as Error).message}`);
      return {
        success: false,
        platform: 'ETSY',
        error: (error as Error).message,
      };
    }
  }

  async updateStock(sku: string, stock: number): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.apiUrl}/application/listings/${sku}/inventory`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            products: [
              {
                sku: sku,
                offerings: [
                  {
                    quantity: stock,
                    is_enabled: stock > 0,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Etsy stock update failed: HTTP ${response.status}`);
      }

      return { success: response.ok, sku, stock, platform: 'ETSY' };
    } catch (error) {
      this.logger.warn(`Etsy updateStock error: ${(error as Error).message}`);
      throw error;
    }
  }

  async updatePrice(sku: string, price: number): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.apiUrl}/application/listings/${sku}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price: price,
          }),
        },
      );

      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Etsy price update failed: HTTP ${response.status}`);
      }

      return { success: response.ok, sku, price, platform: 'ETSY' };
    } catch (error) {
      this.logger.warn(`Etsy updatePrice error: ${(error as Error).message}`);
      throw error;
    }
  }

  async getStoreInfo(storeId: string): Promise<any> {
    try {
      // Try API first
      const response = await this.makeAuthenticatedRequest(
        `${this.apiUrl}/application/shops/${storeId}`,
      );

      if (response.ok) {
        const data = await response.json();
        return {
          storeId: data.shop_id?.toString() || storeId,
          storeName: data.shop_name || storeId,
          totalProducts: data.listing_active_count || 0,
          averageRating: data.review_average || 0,
          totalReviews: data.review_count || 0,
          platform: 'ETSY',
          shopUrl: data.url,
          location: data.location_formatted_address || '',
          isVacation: data.is_vacation || false,
        };
      }

      // Fallback to scraping
      const url = `https://www.etsy.com/shop/${storeId}`;
      const scraped = await this.scrapingService.scrapeStore(url, 'ETSY');
      if (scraped) {
        return {
          storeId,
          storeName: scraped.storeName || storeId,
          totalProducts: scraped.productCount ?? 0,
          averageRating: scraped.rating ?? 0,
          totalReviews: scraped.totalReviews ?? 0,
          platform: 'ETSY',
        };
      }

      throw new Error('Etsy shop info could not be retrieved');
    } catch (error) {
      this.logger.error(`Etsy getStoreInfo error: ${(error as Error).message}`);
      throw error;
    }
  }

  async getStoreProducts(
    storeId?: string,
    limit: number = 10,
  ): Promise<EtsyProduct[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.apiUrl}/application/shops/${storeId}/listings/active?limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const listings = data.results || [];

      return listings
        .slice(0, limit)
        .map((item: any, index: number) => this.mapEtsyProduct(item, index));
    } catch (error) {
      this.logger.error(
        `Etsy getStoreProducts error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private mapEtsyProduct(item: any, index: number = 0): EtsyProduct {
    return {
      productId: item.listing_id?.toString() || `ETSY-${index}`,
      title: item.title || 'Unknown',
      price: (Number(item.price?.amount) || 0) / (Number(item.price?.divisor) || 100),
      salePrice: (Number(item.price?.amount) || 0) / (Number(item.price?.divisor) || 100),
      stockCount: item.quantity || 0,
      rating: item.review_average || 0,
      reviewCount: item.num_favorers || 0,
      url: item.url || '',
      images: item.images?.map((img: any) => img.url_570xN) || [],
      shopName: item.shop_name || '',
      shopUrl: item.shop_url || '',
      materials: item.materials || [],
      tags: item.tags || [],
      processingTime: item.processing_min_display_days
        ? `${item.processing_min_display_days}-${item.processing_max_display_days} days`
        : '',
      shippingFrom: item.shipping_profile?.origin_country_iso || '',
      isCustomizable: item.is_customizable || false,
    };
  }
}
