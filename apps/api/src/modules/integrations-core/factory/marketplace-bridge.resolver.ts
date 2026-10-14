import { Injectable } from '@nestjs/common';
import { Platform } from '@pazaryonetimi/database';
import type { MarketplaceBridge } from '../../marketplace/marketplace.service';
import { ScrapingService } from '../../scraping/scraping.service';
import { TrendyolBridge } from '../../marketplace/trendyol.bridge';
import { AmazonBridge } from '../../marketplace/amazon.bridge';
import { HepsiburadaBridge } from '../../marketplace/hepsiburada.bridge';
import { N11Bridge } from '../../marketplace/n11.bridge';
import { CicekSepetiBridge } from '../../marketplace/ciceksepeti.bridge';
import { EbayBridge } from '../../marketplace/ebay.bridge';
import { EtsyBridge } from '../../marketplace/etsy.bridge';
import { ZalandoBridge } from '../../marketplace/zalando.bridge';
import { ShopifyBridge } from '../../marketplace/shopify.bridge';
import { WooCommerceBridge } from '../../marketplace/woocommerce.bridge';
import { PttAvmBridge } from '../../marketplace/pttavm.bridge';
import { WalmartBridge } from '../../marketplace/walmart.bridge';
import { AliexpressBridge } from '../../marketplace/aliexpress.bridge';
import { AlibabaBridge } from '../../marketplace/alibaba.bridge';
import { ShopeeBridge } from '../../marketplace/shopee.bridge';
import { LazadaBridge } from '../../marketplace/lazada.bridge';
import { MercadoLibreBridge } from '../../marketplace/mercadolibre.bridge';
import { RakutenBridge } from '../../marketplace/rakuten.bridge';
import { WayfairBridge } from '../../marketplace/wayfair.bridge';
import { CoupangBridge } from '../../marketplace/coupang.bridge';
import { OttoBridge } from '../../marketplace/otto.bridge';
import { AllegroBridge } from '../../marketplace/allegro.bridge';
import { CdiscountBridge } from '../../marketplace/cdiscount.bridge';
import { BolBridge } from '../../marketplace/bol.bridge';
import type { DecryptedCredentials } from '../interfaces/integration-context.interface';

/**
 * Marketplace bridge fabrikası — credential'lardan bridge örneği üretir.
 * MarketplaceService.getBridgeForIntegration ile aynı mantık.
 */
@Injectable()
export class MarketplaceBridgeResolver {
  constructor(private readonly scrapingService: ScrapingService) {}

  resolve(platform: Platform, credentials: DecryptedCredentials): MarketplaceBridge | null {
    const apiKey = credentials.apiKey;
    const apiSecret = credentials.apiSecret;
    const extra = credentials.extra;

    try {
      switch (platform) {
        case 'TRENDYOL':
          return new TrendyolBridge(
            apiKey,
            apiSecret,
            String(extra.supplierId ?? ''),
            this.scrapingService,
            extra.isTestMode === true || extra.isTestMode === 'true',
          );
        case 'AMAZON':
        case 'AMAZON_US':
        case 'AMAZON_UK':
        case 'AMAZON_DE':
        case 'AMAZON_FR':
          return new AmazonBridge(apiKey, apiSecret, this.scrapingService, extra);
        case 'HEPSIBURADA':
          return new HepsiburadaBridge(
            apiKey,
            String(extra.merchantId ?? ''),
            this.scrapingService,
            apiSecret, extra,
          );
        case 'N11':
          return new N11Bridge(apiKey, apiSecret, this.scrapingService);
        case 'CICEKSEPETI':
          return new CicekSepetiBridge(apiKey, apiSecret, this.scrapingService, extra.isTestMode === true || extra.isTestMode === 'true');
        case 'EBAY':
          return new EbayBridge(
            apiKey,
            apiSecret,
            String(extra.devId ?? ''),
            String(extra.authToken ?? ''),
            this.scrapingService,
            extra.isTestMode === true || extra.isTestMode === 'true',
          );
        case 'ETSY':
          return new EtsyBridge(
            apiKey,
            apiSecret,
            String(extra.accessToken ?? ''),
            this.scrapingService,
            String(extra.shopId || ''),
          );
        case 'ZALANDO':
          return new ZalandoBridge(apiKey, String(extra.partnerId ?? ''), this.scrapingService);
        case 'SHOPIFY':
          return new ShopifyBridge(
            String(extra.shopDomain ?? apiKey),
            String(extra.accessToken ?? apiSecret),
          );
        case 'WOOCOMMERCE':
          return new WooCommerceBridge(
            String(extra.siteUrl ?? ''),
            apiKey,
            apiSecret,
          );
        case 'PTTAVM':
          return new PttAvmBridge(
            apiKey,
            String(extra.shopId ?? apiSecret),
            this.scrapingService,
          );
        case 'WALMART':
          return new WalmartBridge(apiKey, apiSecret, this.scrapingService, extra.isTestMode === true || extra.isTestMode === 'true');
        case 'ALIEXPRESS':
          return new AliexpressBridge(
            apiKey,
            apiSecret,
            String(extra.accessToken ?? ''),
            this.scrapingService,
          );
        case 'ALIBABA':
          return new AlibabaBridge(
            apiKey,
            apiSecret,
            String(extra.accessToken ?? ''),
            this.scrapingService,
          );
        case 'SHOPEE':
          return new ShopeeBridge(
            apiKey,
            apiSecret,
            String(extra.shopId ?? ''),
            String(extra.accessToken ?? ''),
            this.scrapingService,
            extra.isTestMode === true || extra.isTestMode === 'true',
          );
        case 'LAZADA':
          return new LazadaBridge(
            apiKey,
            apiSecret,
            String(extra.accessToken ?? ''),
            this.scrapingService,
            String(extra.countryCode ?? 'MY'),
          );
        case 'MERCADOLIBRE':
          return new MercadoLibreBridge(
            apiKey,
            apiSecret,
            String(extra.accessToken ?? ''),
            String(extra.siteId ?? 'MLM'),
            this.scrapingService,
          );
        case 'RAKUTEN':
          return new RakutenBridge(
            apiKey,
            apiSecret,
            String(extra.applicationId ?? ''),
            this.scrapingService,
          );
        case 'WAYFAIR':
          return new WayfairBridge(
            apiKey,
            apiSecret,
            String(extra.supplierId ?? ''),
            this.scrapingService,
          );
        case 'COUPANG':
          return new CoupangBridge(
            apiKey,
            apiSecret,
            String(extra.vendorId ?? ''),
            this.scrapingService,
          );
        case 'OTTO':
          return new OttoBridge(
            apiKey,
            apiSecret,
            String(extra.partnerId ?? ''),
            this.scrapingService,
          );
        case 'ALLEGRO':
          return new AllegroBridge(
            apiKey,
            apiSecret,
            String(extra.accessToken ?? ''),
            this.scrapingService,
          );
        case 'CDISCOUNT':
          return new CdiscountBridge(
            apiKey,
            apiSecret,
            String(extra.token ?? ''),
            this.scrapingService,
          );
        case 'BOL':
          return new BolBridge(apiKey, apiSecret, this.scrapingService, extra.isProduction === true);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
}
