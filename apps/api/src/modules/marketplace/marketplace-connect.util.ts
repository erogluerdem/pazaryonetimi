import { UnprocessableEntityException } from '@nestjs/common';
import { Platform as PrismaPlatform, Prisma } from '@pazaryonetimi/database';
import { normalizeTestMode } from './credential-metadata';
import { extractSellerIdFromRef } from './amazon-sp-api.config';

export const MARKETPLACE_ID_TO_PLATFORM: Record<string, PrismaPlatform> = {
  trendyol: 'TRENDYOL',
  hepsiburada: 'HEPSIBURADA',
  n11: 'N11',
  ciceksepeti: 'CICEKSEPETI',
  gittigidiyor: 'GITTIGIDIYOR',
  pttavm: 'PTTAVM',
  morhipo: 'MORHIPO',
  'amazon-tr': 'AMAZON',
  'amazon-us': 'AMAZON_US',
  'amazon-uk': 'AMAZON_UK',
  'amazon-de': 'AMAZON_DE',
  'amazon-fr': 'AMAZON_FR',
  'ebay-us': 'EBAY',
  'ebay-uk': 'EBAY',
  'ebay-de': 'EBAY',
  etsy: 'ETSY',
  'walmart-us': 'WALMART',
  walmart: 'WALMART',
  aliexpress: 'ALIEXPRESS',
  alibaba: 'ALIBABA',
  'shopee-sg': 'SHOPEE',
  'lazada-sg': 'LAZADA',
  'rakuten-jp': 'RAKUTEN',
  zalando: 'ZALANDO',
  allegro: 'ALLEGRO',
  'bol-com': 'BOL',
  cdiscount: 'CDISCOUNT',
  otto: 'OTTO',
  'mercadolibre-mx': 'MERCADOLIBRE',
  'mercadolibre-br': 'MERCADOLIBRE',
  wayfair: 'WAYFAIR',
  coupang: 'COUPANG',
  shopify: 'SHOPIFY',
  woocommerce: 'WOOCOMMERCE',
  epttavm: 'PTTAVM',
  'amazon-global': 'AMAZON_US',
  ebay: 'EBAY',
  shopee: 'SHOPEE',
  lazada: 'LAZADA',
  rakuten: 'RAKUTEN',
  mercadolibre: 'MERCADOLIBRE',
};

const OPTIONAL_SECRET_PLATFORMS = new Set<PrismaPlatform>([
  'PTTAVM',
  'GITTIGIDIYOR',
]);

function pickString(
  credentials: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = credentials[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

export function resolvePlatformFromMarketplaceId(
  marketplaceId: string,
): PrismaPlatform | null {
  return MARKETPLACE_ID_TO_PLATFORM[marketplaceId.toLowerCase()] ?? null;
}

const ECOMMERCE_PLATFORMS = new Set<string>(['SHOPIFY', 'WOOCOMMERCE']);

/** Integration kaydından hub providerId çözümler */
export function resolveProviderIdFromIntegration(
  platform: string,
  apiExtra?: Record<string, unknown> | null,
): string {
  const fromExtra = apiExtra?.marketplaceId;
  if (typeof fromExtra === 'string' && fromExtra.trim()) {
    return fromExtra.toLowerCase();
  }
  return platform.toLowerCase();
}

/** Platform → entegrasyon kategorisi */
export function resolveIntegrationCategoryFromPlatform(
  platform: string,
): 'MARKETPLACE' | 'ECOMMERCE' {
  return ECOMMERCE_PLATFORMS.has(platform) ? 'ECOMMERCE' : 'MARKETPLACE';
}

export function normalizeMarketplaceCredentials(
  platform: PrismaPlatform,
  credentials: Record<string, unknown>,
  marketplaceId?: string,
): {
  apiKey: string;
  apiSecret: string;
  apiExtra: Prisma.InputJsonValue;
} {
  const resolvedMarketplaceId =
    marketplaceId ||
    (typeof credentials.marketplaceId === 'string'
      ? credentials.marketplaceId
      : undefined);

  const apiExtra: Record<string, unknown> = {
    ...credentials,
    isTestMode: normalizeTestMode(credentials.isTestMode),
    ...(resolvedMarketplaceId ? { marketplaceId: resolvedMarketplaceId } : {}),
  };

  let apiKey = '';
  let apiSecret = '';

  switch (platform) {
    case 'TRENDYOL': {
      const supplierId = pickString(credentials, ['supplierId']);
      apiKey = pickString(credentials, ['apiKey']);
      apiSecret = pickString(credentials, ['apiSecret']);
      if (!supplierId) {
        throw new UnprocessableEntityException(
          'Trendyol için supplierId zorunludur',
        );
      }
      apiExtra.supplierId = supplierId;
      break;
    }
    case 'HEPSIBURADA': {
      const merchantId = pickString(credentials, ['merchantId']);
      apiKey = pickString(credentials, ['username', 'apiKey']) || merchantId;
      apiSecret = pickString(credentials, ['serviceKey', 'password', 'apiSecret']);
      if (!merchantId) {
        throw new UnprocessableEntityException(
          'Hepsiburada için merchantId zorunludur',
        );
      }
      apiExtra.merchantId = merchantId;
      break;
    }
    case 'SHOPIFY': {
      const shopDomain = pickString(credentials, ['shopDomain', 'shopUrl']);
      const accessToken = pickString(credentials, ['accessToken', 'apiToken']);
      apiKey = shopDomain;
      apiSecret = accessToken;
      apiExtra.shopDomain = shopDomain;
      apiExtra.accessToken = accessToken;
      break;
    }
    case 'WOOCOMMERCE': {
      const siteUrl = pickString(credentials, ['siteUrl', 'storeUrl']);
      apiKey = pickString(credentials, ['consumerKey', 'apiKey']);
      apiSecret = pickString(credentials, ['consumerSecret', 'apiSecret']);
      apiExtra.siteUrl = siteUrl;
      if (!siteUrl) {
        throw new UnprocessableEntityException(
          'WooCommerce için siteUrl zorunludur',
        );
      }
      break;
    }
    case 'PTTAVM': {
      const shopId = pickString(credentials, ['shopId']);
      apiKey = pickString(credentials, ['apiKey']);
      apiSecret = shopId || apiKey;
      apiExtra.shopId = shopId;
      if (!shopId) {
        throw new UnprocessableEntityException('PTT AVM için shopId zorunludur');
      }
      break;
    }
    case 'MORHIPO': {
      const vendorId = pickString(credentials, ['vendorId']);
      apiKey = pickString(credentials, ['apiKey', 'vendorId']);
      apiSecret = pickString(credentials, ['apiSecret', 'apiKey']);
      apiExtra.vendorId = vendorId || apiKey;
      break;
    }
    case 'AMAZON':
    case 'AMAZON_US':
    case 'AMAZON_UK':
    case 'AMAZON_DE':
    case 'AMAZON_FR': {
      apiKey = pickString(credentials, [
        'apiKey',
        'sellerId',
        'sellerURL',
      ]);
      apiSecret = pickString(credentials, [
        'apiSecret',
        'refreshToken',
        'mwsAuthToken',
      ]);
      apiExtra.sellerId = extractSellerIdFromRef(apiKey);
      if (!apiExtra.marketplaceId) {
        apiExtra.marketplaceId =
          resolvedMarketplaceId ||
          (platform === 'AMAZON' ? 'amazon-tr' : platform.toLowerCase().replace('_', '-'));
      }
      break;
    }
    case 'EBAY': {
      apiKey = pickString(credentials, ['apiKey', 'clientId', 'devId']);
      apiSecret = pickString(credentials, [
        'apiSecret',
        'clientSecret',
        'certId',
      ]);
      apiExtra.authToken = pickString(credentials, ['authToken', 'userToken']);
      apiExtra.devId = pickString(credentials, ['devId']);
      break;
    }
    case 'ETSY': {
      apiKey = pickString(credentials, ['apiKey', 'keystring']);
      apiSecret = pickString(credentials, ['apiSecret', 'sharedSecret']);
      apiExtra.accessToken = pickString(credentials, ['accessToken']);
      break;
    }
    default: {
      apiKey = pickString(credentials, [
        'apiKey',
        'supplierId',
        'sellerId',
        'merchantId',
        'shopId',
        'vendorId',
        'clientId',
        'consumerKey',
        'keystring',
      ]);
      apiSecret = pickString(credentials, [
        'apiSecret',
        'refreshToken',
        'secretKey',
        'apiToken',
        'accessToken',
        'consumerSecret',
        'clientSecret',
        'sharedSecret',
      ]);
      break;
    }
  }

  if (!apiKey) {
    throw new UnprocessableEntityException(
      'Bağlantı için en az bir kimlik bilgisi alanı zorunludur',
    );
  }

  if (!apiSecret && ['TRENDYOL', 'N11', 'HEPSIBURADA'].includes(platform)) {
    throw new UnprocessableEntityException('Bu pazaryeri için gizli anahtar/servis anahtarı zorunludur');
  }
  if (!apiSecret && !OPTIONAL_SECRET_PLATFORMS.has(platform)) {
    if (platform === 'CICEKSEPETI') apiSecret = apiKey;
    else throw new UnprocessableEntityException('Bu sağlayıcı için gizli anahtar veya erişim tokenı zorunludur');
  }

  if (!apiSecret) {
    throw new UnprocessableEntityException(
      'Bağlantı için gizli anahtar veya ikincil kimlik alanı zorunludur',
    );
  }

  return {
    apiKey,
    apiSecret,
    apiExtra: apiExtra as Prisma.InputJsonValue,
  };
}
