import { IntegrationCategory } from '../enums/integration-category.enum';
import { buildGeneratedCatalogEntries } from './connectable-catalog.builder';

export interface ProviderCatalogEntry {
  id: string;
  name: string;
  category: IntegrationCategory;
  platform?: string;
  country: string;
  authType: 'API_KEY' | 'OAUTH2' | 'TOKEN' | 'BASIC';
  requiredFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    required: boolean;
  }>;
  features: {
    productSync: boolean;
    orderSync: boolean;
    inventorySync: boolean;
    invoiceSync?: boolean;
    shipmentCreate?: boolean;
  };
  status: 'ACTIVE' | 'BETA' | 'DEPRECATED';
}

/** 8 kategori için bağlanabilir sağlayıcı kataloğu (requiredFields ile) */
export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  // — Pazaryerleri —
  {
    id: 'trendyol',
    name: 'Trendyol',
    category: IntegrationCategory.MARKETPLACE,
    platform: 'TRENDYOL',
    country: 'TR',
    authType: 'TOKEN',
    requiredFields: [
      { key: 'supplierId', label: 'Satıcı ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'ACTIVE',
  },
  {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    category: IntegrationCategory.MARKETPLACE,
    platform: 'HEPSIBURADA',
    country: 'TR',
    authType: 'API_KEY',
    requiredFields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { key: 'username', label: 'API kullanıcı adı', type: 'text', required: true },
      { key: 'serviceKey', label: 'Servis anahtarı', type: 'password', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'ACTIVE',
  },
  {
    id: 'amazon-tr',
    name: 'Amazon TR',
    category: IntegrationCategory.MARKETPLACE,
    platform: 'AMAZON',
    country: 'TR',
    authType: 'OAUTH2',
    requiredFields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
      { key: 'clientId', label: 'LWA Client ID', type: 'text', required: false },
      { key: 'clientSecret', label: 'LWA Client Secret', type: 'password', required: false },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'ACTIVE',
  },
  {
    id: 'n11',
    name: 'N11',
    category: IntegrationCategory.MARKETPLACE,
    platform: 'N11',
    country: 'TR',
    authType: 'API_KEY',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'ACTIVE',
  },
  {
    id: 'ciceksepeti',
    name: 'Çiçeksepeti',
    category: IntegrationCategory.MARKETPLACE,
    platform: 'CICEKSEPETI',
    country: 'TR',
    authType: 'TOKEN',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'ACTIVE',
  },
  {
    id: 'pttavm',
    name: 'PTT AVM',
    category: IntegrationCategory.MARKETPLACE,
    platform: 'PTTAVM',
    country: 'TR',
    authType: 'TOKEN',
    requiredFields: [
      { key: 'shopId', label: 'Mağaza ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: false },
    status: 'ACTIVE',
  },
  // — E-Ticaret —
  {
    id: 'shopify',
    name: 'Shopify',
    category: IntegrationCategory.ECOMMERCE,
    platform: 'SHOPIFY',
    country: 'GLOBAL',
    authType: 'OAUTH2',
    requiredFields: [
      { key: 'shopDomain', label: 'Mağaza Domain', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'ACTIVE',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: IntegrationCategory.ECOMMERCE,
    platform: 'WOOCOMMERCE',
    country: 'GLOBAL',
    authType: 'BASIC',
    requiredFields: [
      { key: 'siteUrl', label: 'Site URL', type: 'url', required: true },
      { key: 'consumerKey', label: 'Consumer Key', type: 'password', required: true },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'ACTIVE',
  },
  {
    id: 'ticimax',
    name: 'Ticimax',
    category: IntegrationCategory.ECOMMERCE,
    country: 'TR',
    authType: 'API_KEY',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'siteUrl', label: 'Site URL', type: 'url', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'BETA',
  },
  {
    id: 'ideasoft',
    name: 'Ideasoft',
    category: IntegrationCategory.ECOMMERCE,
    country: 'TR',
    authType: 'API_KEY',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'siteUrl', label: 'Site URL', type: 'url', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'BETA',
  },
  // — Kargo —
  {
    id: 'yurtici-kargo',
    name: 'Yurtiçi Kargo',
    category: IntegrationCategory.CARGO,
    country: 'TR',
    authType: 'API_KEY',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'customerCode', label: 'Müşteri Kodu', type: 'text', required: true },
    ],
    features: { productSync: false, orderSync: false, inventorySync: false, shipmentCreate: true },
    status: 'ACTIVE',
  },
  {
    id: 'aras-kargo',
    name: 'Aras Kargo',
    category: IntegrationCategory.CARGO,
    country: 'TR',
    authType: 'API_KEY',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'customerCode', label: 'Müşteri Kodu', type: 'text', required: true },
    ],
    features: { productSync: false, orderSync: false, inventorySync: false, shipmentCreate: true },
    status: 'ACTIVE',
  },
  {
    id: 'mng-kargo',
    name: 'MNG Kargo',
    category: IntegrationCategory.CARGO,
    country: 'TR',
    authType: 'API_KEY',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'customerCode', label: 'Müşteri Kodu', type: 'text', required: true },
    ],
    features: { productSync: false, orderSync: false, inventorySync: false, shipmentCreate: true },
    status: 'ACTIVE',
  },
  {
    id: 'sendeo',
    name: 'Sendeo',
    category: IntegrationCategory.CARGO,
    country: 'TR',
    authType: 'API_KEY',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    features: { productSync: false, orderSync: false, inventorySync: false, shipmentCreate: true },
    status: 'BETA',
  },
  // — E-Fatura / Muhasebe —
  {
    id: 'parasut',
    name: 'Paraşüt',
    category: IntegrationCategory.INVOICE,
    country: 'TR',
    authType: 'OAUTH2',
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
    features: { productSync: false, orderSync: false, inventorySync: false, invoiceSync: true },
    status: 'ACTIVE',
  },
  {
    id: 'uyumsoft',
    name: 'Uyumsoft',
    category: IntegrationCategory.INVOICE,
    country: 'TR',
    authType: 'BASIC',
    requiredFields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
    ],
    features: { productSync: false, orderSync: false, inventorySync: false, invoiceSync: true },
    status: 'ACTIVE',
  },
  {
    id: 'qnb-efinans',
    name: 'QNB eFinans',
    category: IntegrationCategory.INVOICE,
    country: 'TR',
    authType: 'BASIC',
    requiredFields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
    ],
    features: { productSync: false, orderSync: false, inventorySync: false, invoiceSync: true },
    status: 'ACTIVE',
  },
  {
    id: 'bizimhesap',
    name: 'BizimHesap',
    category: IntegrationCategory.INVOICE,
    country: 'TR',
    authType: 'API_KEY',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    features: { productSync: false, orderSync: false, inventorySync: false, invoiceSync: true },
    status: 'BETA',
  },
  // — ERP —
  {
    id: 'logo',
    name: 'Logo ERP',
    category: IntegrationCategory.ERP,
    country: 'TR',
    authType: 'BASIC',
    requiredFields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'apiUrl', label: 'API URL', type: 'url', required: false },
      { key: 'companyCode', label: 'Firma Kodu', type: 'text', required: false },
    ],
    features: { productSync: false, orderSync: false, inventorySync: true, invoiceSync: true },
    status: 'ACTIVE',
  },
  {
    id: 'parasut-erp',
    name: 'Paraşüt ERP',
    category: IntegrationCategory.ERP,
    country: 'TR',
    authType: 'OAUTH2',
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
    features: { productSync: false, orderSync: false, inventorySync: false, invoiceSync: true },
    status: 'BETA',
  },
  // — E-Ticaret (ek) —
  {
    id: 'ikas',
    name: 'İkas',
    category: IntegrationCategory.ECOMMERCE,
    country: 'TR',
    authType: 'TOKEN',
    requiredFields: [
      { key: 'storeUrl', label: 'Mağaza URL', type: 'url', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'BETA',
  },
  // — Sosyal Feed —
  {
    id: 'google-merchant',
    name: 'Google Merchant',
    category: IntegrationCategory.SOCIAL_FEED,
    country: 'GLOBAL',
    authType: 'OAUTH2',
    requiredFields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    features: { productSync: true, orderSync: false, inventorySync: false },
    status: 'BETA',
  },
  // — Global Pazaryeri —
  {
    id: 'amazon-global',
    name: 'Amazon Yurtdışı',
    category: IntegrationCategory.GLOBAL_MARKETPLACE,
    platform: 'AMAZON_US',
    country: 'GLOBAL',
    authType: 'OAUTH2',
    requiredFields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
    ],
    features: { productSync: true, orderSync: true, inventorySync: true },
    status: 'BETA',
  },
  // — Fulfillment —
  {
    id: 'amazon-fba',
    name: 'Amazon FBA',
    category: IntegrationCategory.FULFILLMENT,
    country: 'GLOBAL',
    authType: 'OAUTH2',
    requiredFields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
    ],
    features: { productSync: false, orderSync: false, inventorySync: true },
    status: 'BETA',
  },
];

/** Manuel + otomatik üretilmiş tam bağlanabilir katalog */
export const FULL_PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  ...PROVIDER_CATALOG,
  ...buildGeneratedCatalogEntries(new Set(PROVIDER_CATALOG.map((p) => p.id))),
];

export function getProvidersByCategory(
  category: IntegrationCategory,
): ProviderCatalogEntry[] {
  return FULL_PROVIDER_CATALOG.filter((p) => p.category === category);
}

export function getProviderById(id: string): ProviderCatalogEntry | undefined {
  return FULL_PROVIDER_CATALOG.find((p) => p.id === id);
}
