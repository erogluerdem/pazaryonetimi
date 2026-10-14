// ===========================================
// PAZARYERI KAYIT SİSTEMİ (MARKETPLACE REGISTRY)
// Dünya ve Türkiye'deki tüm desteklenen pazaryerleri
// ===========================================

export type PlatformRegion =
  | 'TURKEY'
  | 'NORTH_AMERICA'
  | 'EUROPE'
  | 'ASIA_PACIFIC'
  | 'LATIN_AMERICA'
  | 'MIDDLE_EAST'
  | 'GLOBAL';

export type PlatformCategory =
  | 'GENERAL'
  | 'FASHION'
  | 'ELECTRONICS'
  | 'HOME_GARDEN'
  | 'HANDMADE'
  | 'B2B'
  | 'WHOLESALE'
  | 'ECOMMERCE';

export type SubscriptionPlan =
  | 'FREE'
  | 'STARTER'
  | 'PROFESSIONAL'
  | 'ENTERPRISE'
  | 'CUSTOM';

export interface MarketplaceConfig {
  id: string;
  name: string;
  slug: string;
  logo: string;
  region: PlatformRegion;
  country: string;
  countryCode: string;
  category: PlatformCategory;
  description: string;
  website: string;

  // API Konfigürasyonu
  apiType: 'REST' | 'SOAP' | 'GRAPHQL' | 'WEBHOOK';
  authType: 'API_KEY' | 'OAUTH2' | 'BASIC' | 'TOKEN' | 'SIGNATURE';
  sandboxAvailable: boolean;
  apiDocumentation: string;

  // Özellikler
  features: {
    productSync: boolean;
    orderSync: boolean;
    inventorySync: boolean;
    priceSync: boolean;
    shippingIntegration: boolean;
    returnManagement: boolean;
    analyticsApi: boolean;
    advertisingApi: boolean;
    fulfillmentService: boolean;
    multiWarehouse: boolean;
  };

  // Gerekli Alanlar (Bağlantı için)
  requiredFields: MarketplaceField[];

  // Paket Gereksinimleri
  minimumPlan: SubscriptionPlan;

  // Durum
  status: 'ACTIVE' | 'BETA' | 'COMING_SOON' | 'DEPRECATED';
  popularity: number; // 1-100

  // Komisyon Bilgisi
  commissionRange?: string;

  // Renk Teması
  brandColor: string;

  // Ek Bilgiler
  monthlyVisitors?: string;
  sellerCount?: string;
}

export interface MarketplaceField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'textarea' | 'url';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

// ===========================================
// TÜRKİYE PAZARYERLERİ
// ===========================================

const turkeyMarketplaces: MarketplaceConfig[] = [
  {
    id: 'trendyol',
    name: 'Trendyol',
    slug: 'trendyol',
    logo: '/images/marketplaces/trendyol.svg',
    region: 'TURKEY',
    country: 'Türkiye',
    countryCode: 'TR',
    category: 'GENERAL',
    description:
      "Türkiye'nin en büyük e-ticaret platformu. Moda, elektronik, ev & yaşam kategorilerinde milyonlarca ürün.",
    website: 'https://www.trendyol.com',
    apiType: 'REST',
    authType: 'TOKEN',
    sandboxAvailable: true,
    apiDocumentation: 'https://developers.trendyol.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      {
        key: 'supplierId',
        label: 'Satıcı ID',
        type: 'text',
        required: true,
        placeholder: '100000',
      },
      {
        key: 'apiKey',
        label: 'API Anahtarı',
        type: 'password',
        required: true,
      },
      {
        key: 'apiSecret',
        label: 'API Secret',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'FREE',
    status: 'ACTIVE',
    popularity: 98,
    commissionRange: '%5 - %25',
    brandColor: '#F27A1A',
    monthlyVisitors: '200M+',
    sellerCount: '250K+',
  },
  {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    slug: 'hepsiburada',
    logo: '/images/marketplaces/hepsiburada.svg',
    region: 'TURKEY',
    country: 'Türkiye',
    countryCode: 'TR',
    category: 'GENERAL',
    description:
      "Türkiye'nin lider e-ticaret platformlarından biri. Geniş ürün yelpazesi ve güçlü lojistik altyapısı.",
    website: 'https://www.hepsiburada.com',
    apiType: 'REST',
    authType: 'API_KEY',
    sandboxAvailable: true,
    apiDocumentation: 'https://developers.hepsiburada.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { key: 'username', label: 'API kullanıcı adı', type: 'text', required: true },
      { key: 'serviceKey', label: 'Servis anahtarı', type: 'password', required: true },
    ],
    minimumPlan: 'FREE',
    status: 'ACTIVE',
    popularity: 95,
    commissionRange: '%4 - %20',
    brandColor: '#FF6000',
    monthlyVisitors: '150M+',
    sellerCount: '100K+',
  },
  {
    id: 'n11',
    name: 'N11',
    slug: 'n11',
    logo: '/images/marketplaces/n11.svg',
    region: 'TURKEY',
    country: 'Türkiye',
    countryCode: 'TR',
    category: 'GENERAL',
    description:
      "Türkiye'nin öncü online alışveriş platformlarından biri. SK Planet ve Doğuş Grubu ortaklığı.",
    website: 'https://www.n11.com',
    apiType: 'SOAP',
    authType: 'API_KEY',
    sandboxAvailable: true,
    apiDocumentation: 'https://api.n11.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: false,
      advertisingApi: true,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      {
        key: 'apiSecret',
        label: 'API Secret',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'FREE',
    status: 'ACTIVE',
    popularity: 85,
    commissionRange: '%3 - %18',
    brandColor: '#7B28C4',
    monthlyVisitors: '80M+',
    sellerCount: '50K+',
  },
  {
    id: 'gittigidiyor',
    name: 'GittiGidiyor',
    slug: 'gittigidiyor',
    logo: '/images/marketplaces/gittigidiyor.svg',
    region: 'TURKEY',
    country: 'Türkiye',
    countryCode: 'TR',
    category: 'GENERAL',
    description:
      'eBay Türkiye partneri. Açık artırma ve sabit fiyat satış modelleri.',
    website: 'https://www.gittigidiyor.com',
    apiType: 'REST',
    authType: 'TOKEN',
    sandboxAvailable: true,
    apiDocumentation: 'https://dev.gittigidiyor.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: false,
      advertisingApi: true,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER',
    status: 'DEPRECATED',
    popularity: 70,
    commissionRange: '%5 - %15',
    brandColor: '#E31E24',
    monthlyVisitors: '40M+',
    sellerCount: '30K+',
  },
  {
    id: 'amazon-tr',
    name: 'Amazon Türkiye',
    slug: 'amazon-tr',
    logo: '/images/marketplaces/amazon.svg',
    region: 'TURKEY',
    country: 'Türkiye',
    countryCode: 'TR',
    category: 'GENERAL',
    description:
      'SP-API kimlik bilgileri tamamlandığında sipariş, stok ve fiyat sync desteklenir.',
    website: 'https://www.amazon.com.tr',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developer-docs.amazon.com/sp-api/',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      {
        key: 'apiKey',
        label: 'Seller URL/ID',
        type: 'text',
        required: true,
        placeholder: 'https://www.amazon.com.tr/sp?seller=SELLER_ID',
      },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
      { key: 'clientId', label: 'LWA Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'LWA Client Secret',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'STARTER',
    status: 'ACTIVE',
    popularity: 90,
    commissionRange: '%8 - %15',
    brandColor: '#FF9900',
    monthlyVisitors: '50M+',
    sellerCount: '20K+',
  },
  {
    id: 'ciceksepeti',
    name: 'Çiçeksepeti',
    slug: 'ciceksepeti',
    logo: '/images/marketplaces/ciceksepeti.svg',
    region: 'TURKEY',
    country: 'Türkiye',
    countryCode: 'TR',
    category: 'GENERAL',
    description:
      "Çiçek, hediye ve yaşam ürünlerinde Türkiye'nin lider platformu.",
    website: 'https://www.ciceksepeti.com',
    apiType: 'REST',
    authType: 'API_KEY',
    sandboxAvailable: false,
    apiDocumentation: 'https://partner.ciceksepeti.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: false,
      advertisingApi: false,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      {
        key: 'supplierId',
        label: 'Tedarikçi ID',
        type: 'text',
        required: true,
      },
    ],
    minimumPlan: 'STARTER',
    status: 'ACTIVE',
    popularity: 75,
    commissionRange: '%10 - %25',
    brandColor: '#E91E63',
    monthlyVisitors: '30M+',
    sellerCount: '15K+',
  },
  {
    id: 'pttavm',
    name: 'PTT AVM',
    slug: 'pttavm',
    logo: '/images/marketplaces/pttavm.svg',
    region: 'TURKEY',
    country: 'Türkiye',
    countryCode: 'TR',
    category: 'GENERAL',
    description: "PTT'nin e-ticaret platformu. Güvenilir lojistik altyapısı.",
    website: 'https://www.pttavm.com',
    apiType: 'REST',
    authType: 'TOKEN',
    sandboxAvailable: true,
    apiDocumentation: 'https://api.pttavm.com/docs',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: false,
      advertisingApi: false,
      fulfillmentService: true,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'shopId', label: 'Mağaza ID', type: 'text', required: true },
      {
        key: 'apiKey',
        label: 'API Anahtarı',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'FREE',
    status: 'ACTIVE',
    popularity: 60,
    commissionRange: '%3 - %12',
    brandColor: '#FFD100',
    monthlyVisitors: '20M+',
    sellerCount: '10K+',
  },
  {
    id: 'morhipo',
    name: 'Morhipo',
    slug: 'morhipo',
    logo: '/images/marketplaces/morhipo.svg',
    region: 'TURKEY',
    country: 'Türkiye',
    countryCode: 'TR',
    category: 'FASHION',
    description:
      "Boyner Grup'un özel alışveriş kulübü. Moda ve yaşam ürünleri.",
    website: 'https://www.morhipo.com',
    apiType: 'REST',
    authType: 'API_KEY',
    sandboxAvailable: false,
    apiDocumentation: 'https://seller.morhipo.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: false,
      advertisingApi: false,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'vendorId', label: 'Vendor ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 55,
    commissionRange: '%15 - %30',
    brandColor: '#E91E63',
    monthlyVisitors: '15M+',
    sellerCount: '5K+',
  },
  {
    id: 'lcwaikiki',
    name: 'LC Waikiki',
    slug: 'lcwaikiki',
    logo: '/images/marketplaces/lcwaikiki.svg',
    region: 'TURKEY',
    country: 'Türkiye',
    countryCode: 'TR',
    category: 'FASHION',
    description: "Türkiye'nin önde gelen hazır giyim markası ve marketplace'i.",
    website: 'https://www.lcwaikiki.com',
    apiType: 'REST',
    authType: 'API_KEY',
    sandboxAvailable: false,
    apiDocumentation: 'https://seller.lcwaikiki.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: false,
      advertisingApi: false,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'sellerId', label: 'Satıcı ID', type: 'text', required: true },
      { key: 'token', label: 'API Token', type: 'password', required: true },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'BETA',
    popularity: 50,
    commissionRange: '%12 - %25',
    brandColor: '#E4002B',
    monthlyVisitors: '25M+',
    sellerCount: '2K+',
  },
];

// ===========================================
// AMAZON GLOBAL
// ===========================================

const amazonMarketplaces: MarketplaceConfig[] = [
  {
    id: 'amazon-us',
    name: 'Amazon US',
    slug: 'amazon-us',
    logo: '/images/marketplaces/amazon.svg',
    region: 'NORTH_AMERICA',
    country: 'Amerika Birleşik Devletleri',
    countryCode: 'US',
    category: 'GENERAL',
    description:
      'Mağaza analizi desteklenir; sipariş/stok sync için SP-API entegrasyonu gereklidir.',
    website: 'https://www.amazon.com',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developer-docs.amazon.com/sp-api/',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', required: true },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'region',
        label: 'Bölge',
        type: 'select',
        required: true,
        options: [{ value: 'na', label: 'North America' }],
      },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 100,
    commissionRange: '%8 - %20',
    brandColor: '#FF9900',
    monthlyVisitors: '2.5B+',
    sellerCount: '2M+',
  },
  {
    id: 'amazon-uk',
    name: 'Amazon UK',
    slug: 'amazon-uk',
    logo: '/images/marketplaces/amazon.svg',
    region: 'EUROPE',
    country: 'Birleşik Krallık',
    countryCode: 'GB',
    category: 'GENERAL',
    description:
      'SP-API kimlik bilgileri tamamlandığında sipariş, stok ve fiyat sync desteklenir.',
    website: 'https://www.amazon.co.uk',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developer-docs.amazon.com/sp-api/',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', required: true },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 95,
    commissionRange: '%7 - %15',
    brandColor: '#FF9900',
    monthlyVisitors: '400M+',
    sellerCount: '300K+',
  },
  {
    id: 'amazon-de',
    name: 'Amazon Deutschland',
    slug: 'amazon-de',
    logo: '/images/marketplaces/amazon.svg',
    region: 'EUROPE',
    country: 'Almanya',
    countryCode: 'DE',
    category: 'GENERAL',
    description:
      'SP-API kimlik bilgileri tamamlandığında sipariş, stok ve fiyat sync desteklenir.',
    website: 'https://www.amazon.de',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developer-docs.amazon.com/sp-api/',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', required: true },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 93,
    commissionRange: '%7 - %15',
    brandColor: '#FF9900',
    monthlyVisitors: '450M+',
    sellerCount: '250K+',
  },
];

// ===========================================
// EBAY GLOBAL
// ===========================================

const ebayMarketplaces: MarketplaceConfig[] = [
  {
    id: 'ebay-us',
    name: 'eBay US',
    slug: 'ebay-us',
    logo: '/images/marketplaces/ebay.svg',
    region: 'NORTH_AMERICA',
    country: 'Amerika Birleşik Devletleri',
    countryCode: 'US',
    category: 'GENERAL',
    description: 'Dünyanın en büyük açık artırma ve e-ticaret platformu.',
    website: 'https://www.ebay.com',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developer.ebay.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      {
        key: 'clientId',
        label: 'Client ID (App ID)',
        type: 'text',
        required: true,
      },
      {
        key: 'clientSecret',
        label: 'Client Secret (Cert ID)',
        type: 'password',
        required: true,
      },
      { key: 'devId', label: 'Dev ID', type: 'text', required: true },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'STARTER',
    status: 'ACTIVE',
    popularity: 92,
    commissionRange: '%10 - %15',
    brandColor: '#E53238',
    monthlyVisitors: '800M+',
    sellerCount: '1M+',
  },
  {
    id: 'ebay-uk',
    name: 'eBay UK',
    slug: 'ebay-uk',
    logo: '/images/marketplaces/ebay.svg',
    region: 'EUROPE',
    country: 'Birleşik Krallık',
    countryCode: 'GB',
    category: 'GENERAL',
    description: "eBay'in Avrupa'daki en büyük pazarı.",
    website: 'https://www.ebay.co.uk',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developer.ebay.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'STARTER',
    status: 'ACTIVE',
    popularity: 85,
    commissionRange: '%10 - %13',
    brandColor: '#E53238',
    monthlyVisitors: '300M+',
    sellerCount: '200K+',
  },
  {
    id: 'ebay-de',
    name: 'eBay Deutschland',
    slug: 'ebay-de',
    logo: '/images/marketplaces/ebay.svg',
    region: 'EUROPE',
    country: 'Almanya',
    countryCode: 'DE',
    category: 'GENERAL',
    description: "eBay'in Almanya pazarı.",
    website: 'https://www.ebay.de',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developer.ebay.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'STARTER',
    status: 'ACTIVE',
    popularity: 80,
    commissionRange: '%9 - %12',
    brandColor: '#E53238',
    monthlyVisitors: '200M+',
    sellerCount: '150K+',
  },
];

// ===========================================
// ASYA PASİFİK PAZARYERLERİ
// ===========================================

const asiaPacificMarketplaces: MarketplaceConfig[] = [
  {
    id: 'aliexpress',
    name: 'AliExpress',
    slug: 'aliexpress',
    logo: '/images/marketplaces/aliexpress.svg',
    region: 'ASIA_PACIFIC',
    country: 'Çin (Global)',
    countryCode: 'CN',
    category: 'GENERAL',
    description:
      "Alibaba'nın global B2C platformu. Dünya çapında satış imkanı.",
    website: 'https://www.aliexpress.com',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developers.aliexpress.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'appKey', label: 'App Key', type: 'text', required: true },
      {
        key: 'appSecret',
        label: 'App Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 88,
    commissionRange: '%5 - %8',
    brandColor: '#E62E04',
    monthlyVisitors: '500M+',
    sellerCount: '200K+',
  },
  {
    id: 'alibaba',
    name: 'Alibaba.com',
    slug: 'alibaba',
    logo: '/images/marketplaces/alibaba.svg',
    region: 'ASIA_PACIFIC',
    country: 'Çin (Global)',
    countryCode: 'CN',
    category: 'B2B',
    description: 'Dünyanın en büyük B2B e-ticaret platformu.',
    website: 'https://www.alibaba.com',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://open.alibaba.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: false,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'appKey', label: 'App Key', type: 'text', required: true },
      {
        key: 'appSecret',
        label: 'App Secret',
        type: 'password',
        required: true,
      },
      { key: 'memberId', label: 'Member ID', type: 'text', required: true },
    ],
    minimumPlan: 'ENTERPRISE',
    status: 'ACTIVE',
    popularity: 85,
    commissionRange: 'Üyelik bazlı',
    brandColor: '#FF6A00',
    monthlyVisitors: '200M+',
    sellerCount: '500K+',
  },
  {
    id: 'shopee-sg',
    name: 'Shopee Singapore',
    slug: 'shopee-sg',
    logo: '/images/marketplaces/shopee.svg',
    region: 'ASIA_PACIFIC',
    country: 'Singapur',
    countryCode: 'SG',
    category: 'GENERAL',
    description: "Güneydoğu Asya'nın lider e-ticaret platformu.",
    website: 'https://shopee.sg',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://open.shopee.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'partnerId', label: 'Partner ID', type: 'text', required: true },
      {
        key: 'partnerKey',
        label: 'Partner Key',
        type: 'password',
        required: true,
      },
      { key: 'shopId', label: 'Shop ID', type: 'text', required: true },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 90,
    commissionRange: '%2 - %5',
    brandColor: '#EE4D2D',
    monthlyVisitors: '350M+',
    sellerCount: '500K+',
  },
  {
    id: 'lazada-sg',
    name: 'Lazada Singapore',
    slug: 'lazada-sg',
    logo: '/images/marketplaces/lazada.svg',
    region: 'ASIA_PACIFIC',
    country: 'Singapur',
    countryCode: 'SG',
    category: 'GENERAL',
    description: "Alibaba'nın Güneydoğu Asya e-ticaret platformu.",
    website: 'https://www.lazada.sg',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://open.lazada.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'appKey', label: 'App Key', type: 'text', required: true },
      {
        key: 'appSecret',
        label: 'App Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 85,
    commissionRange: '%3 - %6',
    brandColor: '#0F146D',
    monthlyVisitors: '200M+',
    sellerCount: '300K+',
  },
  {
    id: 'rakuten-jp',
    name: 'Rakuten Japan',
    slug: 'rakuten-jp',
    logo: '/images/marketplaces/rakuten.svg',
    region: 'ASIA_PACIFIC',
    country: 'Japonya',
    countryCode: 'JP',
    category: 'GENERAL',
    description: "Japonya'nın en büyük e-ticaret platformu.",
    website: 'https://www.rakuten.co.jp',
    apiType: 'REST',
    authType: 'API_KEY',
    sandboxAvailable: true,
    apiDocumentation: 'https://webservice.rakuten.co.jp',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: false,
    },
    requiredFields: [
      {
        key: 'serviceSecret',
        label: 'Service Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'licenseKey',
        label: 'License Key',
        type: 'password',
        required: true,
      },
      { key: 'shopUrl', label: 'Shop URL', type: 'text', required: true },
    ],
    minimumPlan: 'ENTERPRISE',
    status: 'ACTIVE',
    popularity: 80,
    commissionRange: '%8 - %15',
    brandColor: '#BF0000',
    monthlyVisitors: '400M+',
    sellerCount: '50K+',
  },
];

// ===========================================
// AVRUPA PAZARYERLERİ
// ===========================================

const europeMarketplaces: MarketplaceConfig[] = [
  {
    id: 'zalando',
    name: 'Zalando',
    slug: 'zalando',
    logo: '/images/marketplaces/zalando.svg',
    region: 'EUROPE',
    country: 'Almanya (Pan-Avrupa)',
    countryCode: 'DE',
    category: 'FASHION',
    description: "Avrupa'nın lider online moda platformu. 25+ ülkede faaliyet.",
    website: 'https://www.zalando.com',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://docs.partner-solutions.zalan.do',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
    ],
    minimumPlan: 'ENTERPRISE',
    status: 'ACTIVE',
    popularity: 88,
    commissionRange: '%20 - %25',
    brandColor: '#FF6900',
    monthlyVisitors: '500M+',
    sellerCount: '7K+',
  },
  {
    id: 'allegro',
    name: 'Allegro',
    slug: 'allegro',
    logo: '/images/marketplaces/allegro.svg',
    region: 'EUROPE',
    country: 'Polonya',
    countryCode: 'PL',
    category: 'GENERAL',
    description: "Polonya'nın en büyük e-ticaret platformu.",
    website: 'https://allegro.pl',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developer.allegro.pl',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 82,
    commissionRange: '%8 - %15',
    brandColor: '#FF5A00',
    monthlyVisitors: '200M+',
    sellerCount: '130K+',
  },
  {
    id: 'bol-com',
    name: 'Bol.com',
    slug: 'bol-com',
    logo: '/images/marketplaces/bolcom.svg',
    region: 'EUROPE',
    country: 'Hollanda / Belçika',
    countryCode: 'NL',
    category: 'GENERAL',
    description: 'Benelüks bölgesinin lider e-ticaret platformu.',
    website: 'https://www.bol.com',
    apiType: 'REST',
    authType: 'API_KEY',
    sandboxAvailable: true,
    apiDocumentation: 'https://developers.bol.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 78,
    commissionRange: '%5 - %17',
    brandColor: '#0000A4',
    monthlyVisitors: '100M+',
    sellerCount: '50K+',
  },
  {
    id: 'cdiscount',
    name: 'Cdiscount',
    slug: 'cdiscount',
    logo: '/images/marketplaces/cdiscount.svg',
    region: 'EUROPE',
    country: 'Fransa',
    countryCode: 'FR',
    category: 'GENERAL',
    description: "Fransa'nın en büyük yerli e-ticaret platformu.",
    website: 'https://www.cdiscount.com',
    apiType: 'REST',
    authType: 'API_KEY',
    sandboxAvailable: true,
    apiDocumentation: 'https://dev.cdiscount.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: false,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 75,
    commissionRange: '%10 - %20',
    brandColor: '#EC1C24',
    monthlyVisitors: '80M+',
    sellerCount: '15K+',
  },
  {
    id: 'otto',
    name: 'Otto Market',
    slug: 'otto',
    logo: '/images/marketplaces/otto.svg',
    region: 'EUROPE',
    country: 'Almanya',
    countryCode: 'DE',
    category: 'GENERAL',
    description: "Almanya'nın ikinci büyük online perakende platformu.",
    website: 'https://www.otto.de',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://api.otto.market/docs',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: false,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'ENTERPRISE',
    status: 'ACTIVE',
    popularity: 72,
    commissionRange: '%15 - %20',
    brandColor: '#E20000',
    monthlyVisitors: '60M+',
    sellerCount: '5K+',
  },
];

// ===========================================
// LATİN AMERİKA PAZARYERLERİ
// ===========================================

const latinAmericaMarketplaces: MarketplaceConfig[] = [
  {
    id: 'mercadolibre-mx',
    name: 'Mercado Libre México',
    slug: 'mercadolibre-mx',
    logo: '/images/marketplaces/mercadolibre.svg',
    region: 'LATIN_AMERICA',
    country: 'Meksika',
    countryCode: 'MX',
    category: 'GENERAL',
    description: "Latin Amerika'nın en büyük e-ticaret platformu.",
    website: 'https://www.mercadolibre.com.mx',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developers.mercadolibre.com.mx',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 90,
    commissionRange: '%10 - %18',
    brandColor: '#FFE600',
    monthlyVisitors: '200M+',
    sellerCount: '300K+',
  },
  {
    id: 'mercadolibre-br',
    name: 'Mercado Livre Brasil',
    slug: 'mercadolibre-br',
    logo: '/images/marketplaces/mercadolibre.svg',
    region: 'LATIN_AMERICA',
    country: 'Brezilya',
    countryCode: 'BR',
    category: 'GENERAL',
    description: "Brezilya'nın en büyük e-ticaret platformu.",
    website: 'https://www.mercadolivre.com.br',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developers.mercadolivre.com.br',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'PROFESSIONAL',
    status: 'ACTIVE',
    popularity: 92,
    commissionRange: '%11 - %19',
    brandColor: '#FFE600',
    monthlyVisitors: '300M+',
    sellerCount: '500K+',
  },
];

// ===========================================
// KUZEY AMERİKA PAZARYERLERİ
// ===========================================

const northAmericaMarketplaces: MarketplaceConfig[] = [
  {
    id: 'walmart-us',
    name: 'Walmart Marketplace',
    slug: 'walmart-us',
    logo: '/images/marketplaces/walmart.svg',
    region: 'NORTH_AMERICA',
    country: 'Amerika Birleşik Devletleri',
    countryCode: 'US',
    category: 'GENERAL',
    description: 'Dünyanın en büyük perakende şirketinin online pazaryeri.',
    website: 'https://marketplace.walmart.com',
    apiType: 'REST',
    authType: 'SIGNATURE',
    sandboxAvailable: true,
    apiDocumentation: 'https://developer.walmart.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'ENTERPRISE',
    status: 'ACTIVE',
    popularity: 88,
    commissionRange: '%6 - %20',
    brandColor: '#0071CE',
    monthlyVisitors: '400M+',
    sellerCount: '150K+',
  },
  {
    id: 'etsy',
    name: 'Etsy',
    slug: 'etsy',
    logo: '/images/marketplaces/etsy.svg',
    region: 'GLOBAL',
    country: 'Amerika Birleşik Devletleri (Global)',
    countryCode: 'US',
    category: 'HANDMADE',
    description: 'El yapımı, vintage ve benzersiz ürünler için global pazar.',
    website: 'https://www.etsy.com',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://developers.etsy.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: false,
      analyticsApi: true,
      advertisingApi: true,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      { key: 'keystring', label: 'Keystring', type: 'text', required: true },
      {
        key: 'sharedSecret',
        label: 'Shared Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
      },
      {
        key: 'accessTokenSecret',
        label: 'Access Token Secret',
        type: 'password',
        required: true,
      },
      { key: 'shopId', label: 'Shop ID', type: 'text', required: true },
    ],
    minimumPlan: 'STARTER',
    status: 'ACTIVE',
    popularity: 85,
    commissionRange: '%6.5 + $0.20',
    brandColor: '#F1641E',
    monthlyVisitors: '400M+',
    sellerCount: '5M+',
  },
  {
    id: 'wayfair',
    name: 'Wayfair',
    slug: 'wayfair',
    logo: '/images/marketplaces/wayfair.svg',
    region: 'NORTH_AMERICA',
    country: 'Amerika Birleşik Devletleri',
    countryCode: 'US',
    category: 'HOME_GARDEN',
    description: "Ev ve mobilya kategorisinde Amerika'nın lider platformu.",
    website: 'https://www.wayfair.com',
    apiType: 'REST',
    authType: 'API_KEY',
    sandboxAvailable: true,
    apiDocumentation: 'https://partners.wayfair.com',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: false,
      fulfillmentService: false,
      multiWarehouse: true,
    },
    requiredFields: [
      { key: 'supplierId', label: 'Supplier ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    minimumPlan: 'ENTERPRISE',
    status: 'ACTIVE',
    popularity: 75,
    commissionRange: '%20 - %30',
    brandColor: '#7F187F',
    monthlyVisitors: '150M+',
    sellerCount: '15K+',
  },
];

// ===========================================
// E-TİCARET PLATFORMLARI
// ===========================================

const ecommercePlatforms: MarketplaceConfig[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    slug: 'shopify',
    logo: '/images/marketplaces/shopify.svg',
    region: 'GLOBAL',
    country: 'Global',
    countryCode: 'CA',
    category: 'ECOMMERCE',
    description: 'Dünyanın lider e-ticaret altyapı sağlayıcısı.',
    website: 'https://www.shopify.com',
    apiType: 'REST',
    authType: 'OAUTH2',
    sandboxAvailable: true,
    apiDocumentation: 'https://shopify.dev/docs/api',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: false,
      fulfillmentService: true,
      multiWarehouse: true,
    },
    requiredFields: [
      {
        key: 'shopDomain',
        label: 'Mağaza Domain',
        type: 'text',
        required: true,
        placeholder: 'yourstore.myshopify.com',
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'STARTER',
    status: 'ACTIVE',
    popularity: 95,
    commissionRange: 'Platform ücreti',
    brandColor: '#96BF48',
    monthlyVisitors: 'N/A',
    sellerCount: '2M+',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    slug: 'woocommerce',
    logo: '/images/marketplaces/woocommerce.svg',
    region: 'GLOBAL',
    country: 'Global',
    countryCode: 'US',
    category: 'ECOMMERCE',
    description: 'WordPress için açık kaynak e-ticaret eklentisi.',
    website: 'https://woocommerce.com',
    apiType: 'REST',
    authType: 'BASIC',
    sandboxAvailable: true,
    apiDocumentation:
      'https://woocommerce.github.io/woocommerce-rest-api-docs/',
    features: {
      productSync: true,
      orderSync: true,
      inventorySync: true,
      priceSync: true,
      shippingIntegration: true,
      returnManagement: true,
      analyticsApi: true,
      advertisingApi: false,
      fulfillmentService: false,
      multiWarehouse: false,
    },
    requiredFields: [
      {
        key: 'siteUrl',
        label: 'Site URL',
        type: 'url',
        required: true,
        placeholder: 'https://yourstore.com',
      },
      {
        key: 'consumerKey',
        label: 'Consumer Key',
        type: 'password',
        required: true,
      },
      {
        key: 'consumerSecret',
        label: 'Consumer Secret',
        type: 'password',
        required: true,
      },
    ],
    minimumPlan: 'FREE',
    status: 'ACTIVE',
    popularity: 90,
    commissionRange: 'Ücretsiz',
    brandColor: '#7F54B3',
    monthlyVisitors: 'N/A',
    sellerCount: '5M+',
  },
];

// ===========================================
// TÜM PAZARYERLERİ BİRLEŞTİR
// ===========================================

export const ALL_MARKETPLACES: MarketplaceConfig[] = [
  ...turkeyMarketplaces,
  ...amazonMarketplaces,
  ...ebayMarketplaces,
  ...asiaPacificMarketplaces,
  ...europeMarketplaces,
  ...latinAmericaMarketplaces,
  ...northAmericaMarketplaces,
  ...ecommercePlatforms,
];

// Bölgeye göre grupla
export const MARKETPLACES_BY_REGION: Record<
  PlatformRegion,
  MarketplaceConfig[]
> = {
  TURKEY: turkeyMarketplaces,
  NORTH_AMERICA: [
    ...amazonMarketplaces.filter((m) => m.region === 'NORTH_AMERICA'),
    ...northAmericaMarketplaces,
  ],
  EUROPE: [
    ...amazonMarketplaces.filter((m) => m.region === 'EUROPE'),
    ...ebayMarketplaces.filter((m) => m.region === 'EUROPE'),
    ...europeMarketplaces,
  ],
  ASIA_PACIFIC: asiaPacificMarketplaces,
  LATIN_AMERICA: latinAmericaMarketplaces,
  MIDDLE_EAST: [],
  GLOBAL: ecommercePlatforms,
};

// Kategoriye göre grupla
export const MARKETPLACES_BY_CATEGORY: Record<
  PlatformCategory,
  MarketplaceConfig[]
> = {
  GENERAL: ALL_MARKETPLACES.filter((m) => m.category === 'GENERAL'),
  FASHION: ALL_MARKETPLACES.filter((m) => m.category === 'FASHION'),
  ELECTRONICS: ALL_MARKETPLACES.filter((m) => m.category === 'ELECTRONICS'),
  HOME_GARDEN: ALL_MARKETPLACES.filter((m) => m.category === 'HOME_GARDEN'),
  HANDMADE: ALL_MARKETPLACES.filter((m) => m.category === 'HANDMADE'),
  B2B: ALL_MARKETPLACES.filter((m) => m.category === 'B2B'),
  WHOLESALE: ALL_MARKETPLACES.filter((m) => m.category === 'WHOLESALE'),
  ECOMMERCE: ALL_MARKETPLACES.filter((m) => m.category === 'ECOMMERCE'),
};

// Paket bazlı erişim
export const MARKETPLACES_BY_PLAN: Record<
  SubscriptionPlan,
  MarketplaceConfig[]
> = {
  FREE: ALL_MARKETPLACES.filter((m) => m.minimumPlan === 'FREE'),
  STARTER: ALL_MARKETPLACES.filter((m) =>
    ['FREE', 'STARTER'].includes(m.minimumPlan),
  ),
  PROFESSIONAL: ALL_MARKETPLACES.filter((m) =>
    ['FREE', 'STARTER', 'PROFESSIONAL'].includes(m.minimumPlan),
  ),
  ENTERPRISE: ALL_MARKETPLACES,
  CUSTOM: ALL_MARKETPLACES,
};

// Helper fonksiyonlar
export function getMarketplaceById(id: string): MarketplaceConfig | undefined {
  return ALL_MARKETPLACES.find((m) => m.id === id);
}

export function getMarketplacesByRegion(
  region: PlatformRegion,
): MarketplaceConfig[] {
  return MARKETPLACES_BY_REGION[region] || [];
}

export function getMarketplacesByPlan(
  plan: SubscriptionPlan,
): MarketplaceConfig[] {
  return MARKETPLACES_BY_PLAN[plan] || [];
}

export function canAccessMarketplace(
  marketplace: MarketplaceConfig,
  userPlan: SubscriptionPlan,
): boolean {
  const planHierarchy: SubscriptionPlan[] = [
    'FREE',
    'STARTER',
    'PROFESSIONAL',
    'ENTERPRISE',
    'CUSTOM',
  ];
  const userPlanIndex = planHierarchy.indexOf(userPlan);
  const requiredPlanIndex = planHierarchy.indexOf(marketplace.minimumPlan);
  return userPlanIndex >= requiredPlanIndex;
}

export function getActiveMarketplaces(): MarketplaceConfig[] {
  return ALL_MARKETPLACES.filter((m) => m.status === 'ACTIVE');
}

export function getBetaMarketplaces(): MarketplaceConfig[] {
  return ALL_MARKETPLACES.filter((m) => m.status === 'BETA');
}

export function getComingSoonMarketplaces(): MarketplaceConfig[] {
  return ALL_MARKETPLACES.filter((m) => m.status === 'COMING_SOON');
}

// Bölge isimleri (Türkçe)
export const REGION_NAMES: Record<PlatformRegion, string> = {
  TURKEY: 'Türkiye',
  NORTH_AMERICA: 'Kuzey Amerika',
  EUROPE: 'Avrupa',
  ASIA_PACIFIC: 'Asya Pasifik',
  LATIN_AMERICA: 'Latin Amerika',
  MIDDLE_EAST: 'Orta Doğu',
  GLOBAL: 'Global',
};

// Kategori isimleri (Türkçe)
export const CATEGORY_NAMES: Record<PlatformCategory, string> = {
  GENERAL: 'Genel Pazaryeri',
  FASHION: 'Moda & Giyim',
  ELECTRONICS: 'Elektronik',
  HOME_GARDEN: 'Ev & Yaşam',
  HANDMADE: 'El Yapımı',
  B2B: 'B2B / Kurumsal',
  WHOLESALE: 'Toptan Satış',
  ECOMMERCE: 'E-ticaret Platformu',
};

// Plan isimleri (Türkçe)
export const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  FREE: 'Ücretsiz',
  STARTER: 'Başlangıç',
  PROFESSIONAL: 'Profesyonel',
  ENTERPRISE: 'Kurumsal',
  CUSTOM: 'Özel',
};
