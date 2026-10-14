"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Search,
  Grid3X3,
  List,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';

// Import custom components
import { IntegrationStats, MiniStatsRow } from '@/components/integrations/IntegrationStats';
import { MarketplaceCard } from '@/components/integrations/MarketplaceCard';
import { ConnectionWizard } from '@/components/integrations/ConnectionWizard';
import { RealTimeStatusPanel } from '@/components/integrations/RealTimeStatusPanel';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/api-client';
import {
  resolvePlatformEnum,
} from '@/lib/marketplace-platform';

const CONNECTION_READY_IDS = new Set([
  'trendyol', 'hepsiburada', 'n11', 'ciceksepeti', 'gittigidiyor', 'pttavm', 'morhipo',
  'amazon-tr', 'amazon-us', 'amazon-uk', 'amazon-de', 'amazon-fr',
  'ebay-us', 'ebay-uk', 'ebay-de', 'etsy', 'walmart', 'walmart-us',
  'shopify', 'woocommerce', 'aliexpress', 'alibaba', 'shopee-sg', 'lazada-sg',
  'rakuten-jp', 'zalando', 'allegro', 'bol-com', 'cdiscount', 'otto',
  'mercadolibre-mx', 'mercadolibre-br', 'wayfair', 'coupang',
]);

// Import shared types
import type { MarketplaceConfig } from '@/types/integrations';
import { REGION_NAMES, CATEGORY_NAMES, PLAN_NAMES, PLAN_HIERARCHY } from '@/types/integrations';

// Sample Marketplaces - Gerçek logolar kullanılıyor
const MARKETPLACES: MarketplaceConfig[] = [
  {
    id: 'trendyol', name: 'Trendyol', slug: 'trendyol', logo: '/images/pazaryeri/Trendyol.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'GENERAL',
    description: "Türkiye'nin en büyük e-ticaret platformu.", website: 'https://www.trendyol.com',
    apiType: 'REST', authType: 'TOKEN', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: true, fulfillmentService: true, multiWarehouse: true },
    requiredFields: [
      { key: 'supplierId', label: 'Satıcı ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Anahtarı', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 98, commissionRange: '%5 - %25',
    brandColor: '#F27A1A', monthlyVisitors: '200M+', sellerCount: '250K+',
  },
  {
    id: 'hepsiburada', name: 'Hepsiburada', slug: 'hepsiburada', logo: '/images/pazaryeri/Hepsiburada.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'GENERAL',
    description: "Türkiye'nin lider e-ticaret platformlarından biri.", website: 'https://www.hepsiburada.com',
    apiType: 'REST', authType: 'API_KEY', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: true, fulfillmentService: true, multiWarehouse: true },
    requiredFields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { key: 'username', label: 'API kullanıcı adı', type: 'text', required: true },
      { key: 'serviceKey', label: 'Servis anahtarı', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 95, commissionRange: '%4 - %20',
    brandColor: '#FF6000', monthlyVisitors: '150M+', sellerCount: '100K+',
  },
  {
    id: 'n11', name: 'N11', slug: 'n11', logo: '/images/pazaryeri/N11.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'GENERAL',
    description: "Türkiye'nin öncü online alışveriş platformu.", website: 'https://www.n11.com',
    apiType: 'SOAP', authType: 'API_KEY', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: false, advertisingApi: true, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 85, commissionRange: '%3 - %18',
    brandColor: '#7B28C4', monthlyVisitors: '80M+', sellerCount: '50K+',
  },
  {
    id: 'gittigidiyor', name: 'GittiGidiyor', slug: 'gittigidiyor', logo: '/images/pazaryeri/GittiGidiyor.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'GENERAL',
    description: 'eBay TR partneri (platform kapatıldı — sınırlı veri sync).', website: 'https://www.gittigidiyor.com',
    apiType: 'REST', authType: 'TOKEN', sandboxAvailable: false,
    features: { productSync: true, orderSync: false, inventorySync: false, priceSync: false, shippingIntegration: false, returnManagement: false, analyticsApi: false, advertisingApi: false, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER', status: 'DEPRECATED', popularity: 40, commissionRange: '%5 - %15',
    brandColor: '#E31E24', monthlyVisitors: '—', sellerCount: '—',
  },
  {
    id: 'pttavm', name: 'PTT AVM', slug: 'pttavm', logo: '/images/pazaryeri/pttavm.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'GENERAL',
    description: "PTT'nin e-ticaret platformu.", website: 'https://www.pttavm.com',
    apiType: 'REST', authType: 'TOKEN', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: false, advertisingApi: false, fulfillmentService: true, multiWarehouse: false },
    requiredFields: [
      { key: 'shopId', label: 'Mağaza ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Anahtarı', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 60, commissionRange: '%3 - %12',
    brandColor: '#FFD100', monthlyVisitors: '20M+', sellerCount: '10K+',
  },
  {
    id: 'morhipo', name: 'Morhipo', slug: 'morhipo', logo: '/images/pazaryeri/morhipo.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'FASHION',
    description: 'Moda ve yaşam ürünleri platformu.', website: 'https://www.morhipo.com',
    apiType: 'REST', authType: 'API_KEY', sandboxAvailable: false,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: false, advertisingApi: false, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'vendorId', label: 'Vendor ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 55, commissionRange: '%10 - %20',
    brandColor: '#E4002B', monthlyVisitors: '15M+', sellerCount: '5K+',
  },
  {
    id: 'ciceksepeti', name: 'Çiçeksepeti', slug: 'ciceksepeti', logo: '/images/pazaryeri/ciceksepeti.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'SPECIALTY',
    description: "Türkiye'nin lider çiçek ve hediye platformu.", website: 'https://www.ciceksepeti.com',
    apiType: 'REST', authType: 'TOKEN', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER', status: 'ACTIVE', popularity: 75, commissionRange: '%10 - %20',
    brandColor: '#E91E63', monthlyVisitors: '30M+', sellerCount: '5K+',
  },
  {
    id: 'amazon-tr', name: 'Amazon Türkiye', slug: 'amazon-tr', logo: '/images/pazaryeri/Amazon.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'GENERAL',
    description: "Amazon TR — SP-API kimlik bilgileri ile sipariş, stok ve fiyat sync.", website: 'https://www.amazon.com.tr',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: true, fulfillmentService: true, multiWarehouse: true },
    requiredFields: [
      { key: 'apiKey', label: 'Seller URL/ID', type: 'text', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
      { key: 'clientId', label: 'LWA Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'LWA Client Secret', type: 'password', required: true },
                      ],
    minimumPlan: 'STARTER', status: 'ACTIVE', popularity: 90, commissionRange: '%8 - %15',
    brandColor: '#FF9900', monthlyVisitors: '50M+', sellerCount: '20K+',
  },
  {
    id: 'amazon-us', name: 'Amazon US', slug: 'amazon-us', logo: '/images/pazaryeri/Amazon.png',
    region: 'NORTH_AMERICA', country: 'Amerika', countryCode: 'US', category: 'GENERAL',
    description: "Amazon US — mağaza analizi desteklenir; sipariş/stok sync için SP-API entegrasyonu gereklidir.", website: 'https://www.amazon.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: false, inventorySync: false, priceSync: false, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: true, fulfillmentService: true, multiWarehouse: true },
    requiredFields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
    ],
    minimumPlan: 'PROFESSIONAL', status: 'ACTIVE', popularity: 100, commissionRange: '%8 - %20',
    brandColor: '#FF9900', monthlyVisitors: '2.5B+', sellerCount: '2M+',
  },
  {
    id: 'ebay-us', name: 'eBay US', slug: 'ebay-us', logo: '/images/pazaryeri/EBay.png',
    region: 'NORTH_AMERICA', country: 'Amerika', countryCode: 'US', category: 'GENERAL',
    description: "Dünyanın en büyük açık artırma platformu.", website: 'https://www.ebay.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: true, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'authToken', label: 'Kullanıcı OAuth Token', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER', status: 'ACTIVE', popularity: 92, commissionRange: '%10 - %15',
    brandColor: '#E53238', monthlyVisitors: '800M+', sellerCount: '1M+',
  },
  {
    id: 'etsy', name: 'Etsy', slug: 'etsy', logo: '/images/pazaryeri/Etsy.png',
    region: 'GLOBAL', country: 'Global', countryCode: 'US', category: 'HANDMADE',
    description: 'El yapımı ve vintage ürünler için global pazar.', website: 'https://www.etsy.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: false, analyticsApi: true, advertisingApi: true, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'keystring', label: 'Keystring', type: 'text', required: true },
      { key: 'sharedSecret', label: 'Shared Secret', type: 'password', required: true },
      { key: 'shopId', label: 'Shop ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Kullanıcı OAuth Access Token', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER', status: 'ACTIVE', popularity: 85, commissionRange: '%6.5',
    brandColor: '#F1641E', monthlyVisitors: '400M+', sellerCount: '5M+',
  },
  {
    id: 'shopify', name: 'Shopify', slug: 'shopify', logo: '/images/pazaryeri/Shopify.png',
    region: 'GLOBAL', country: 'Global', countryCode: 'US', category: 'ECOMMERCE',
    description: 'Global e-ticaret altyapı platformu.', website: 'https://www.shopify.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: true, multiWarehouse: true },
    requiredFields: [
      { key: 'shopDomain', label: 'Mağaza Domain', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER', status: 'ACTIVE', popularity: 95, commissionRange: '%0 - %2',
    brandColor: '#96BF48', monthlyVisitors: '1B+', sellerCount: '4M+',
  },
  {
    id: 'woocommerce', name: 'WooCommerce', slug: 'woocommerce', logo: '/images/pazaryeri/WooCommerce.png',
    region: 'GLOBAL', country: 'Global', countryCode: 'US', category: 'ECOMMERCE',
    description: 'WordPress tabanlı açık kaynak e-ticaret çözümü.', website: 'https://woocommerce.com',
    apiType: 'REST', authType: 'API_KEY', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: false, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: true },
    requiredFields: [
      { key: 'siteUrl', label: 'Site URL', type: 'text', required: true },
      { key: 'consumerKey', label: 'Consumer Key', type: 'password', required: true },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 90, commissionRange: '%0',
    brandColor: '#96588A', monthlyVisitors: 'N/A', sellerCount: '5M+',
  },
  {
    id: 'walmart', name: 'Walmart', slug: 'walmart', logo: '/images/pazaryeri/walmart.png',
    region: 'NORTH_AMERICA', country: 'Amerika', countryCode: 'US', category: 'GENERAL',
    description: "Amerika'nın en büyük perakende platformu.", website: 'https://www.walmart.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: true, fulfillmentService: true, multiWarehouse: true },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
    minimumPlan: 'PROFESSIONAL', status: 'ACTIVE', popularity: 88, commissionRange: '%6 - %15',
    brandColor: '#0071CE', monthlyVisitors: '500M+', sellerCount: '150K+',
  },
  {
    id: 'tiktok-shop', name: 'TikTok Shop', slug: 'tiktok-shop', logo: '/images/pazaryeri/tiktok-shop.png',
    region: 'GLOBAL', country: 'Global', countryCode: 'US', category: 'SOCIAL',
    description: 'TikTok sosyal ticaret platformu.', website: 'https://shop.tiktok.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: true, fulfillmentService: true, multiWarehouse: false },
    requiredFields: [
      { key: 'appKey', label: 'App Key', type: 'text', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER', status: 'BETA', popularity: 80, commissionRange: '%5 - %8',
    brandColor: '#000000', monthlyVisitors: '1B+', sellerCount: '200K+',
  },
  {
    id: 'facebook-marketplace', name: 'Facebook Marketplace', slug: 'facebook-marketplace', logo: '/images/pazaryeri/facebook-marketplace.png',
    region: 'GLOBAL', country: 'Global', countryCode: 'US', category: 'SOCIAL',
    description: 'Facebook sosyal ticaret platformu.', website: 'https://www.facebook.com/marketplace',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: false,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: false, returnManagement: false, analyticsApi: true, advertisingApi: true, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'pageId', label: 'Page ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER', status: 'ACTIVE', popularity: 75, commissionRange: '%5',
    brandColor: '#1877F2', monthlyVisitors: '1B+', sellerCount: '1M+',
  },
  {
    id: 'instagram', name: 'Instagram Shopping', slug: 'instagram', logo: '/images/pazaryeri/Insta_Logo.webp',
    region: 'GLOBAL', country: 'Global', countryCode: 'US', category: 'SOCIAL',
    description: 'Instagram sosyal ticaret özelliği.', website: 'https://www.instagram.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: false,
    features: { productSync: true, orderSync: false, inventorySync: true, priceSync: true, shippingIntegration: false, returnManagement: false, analyticsApi: true, advertisingApi: true, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'businessId', label: 'Business ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER', status: 'ACTIVE', popularity: 85, commissionRange: '%5',
    brandColor: '#E4405F', monthlyVisitors: '2B+', sellerCount: '500K+',
  },
  {
    id: 'pinterest', name: 'Pinterest Shopping', slug: 'pinterest', logo: '/images/pazaryeri/pinterest.webp',
    region: 'GLOBAL', country: 'Global', countryCode: 'US', category: 'SOCIAL',
    description: 'Pinterest görsel ticaret platformu.', website: 'https://www.pinterest.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: false, inventorySync: true, priceSync: true, shippingIntegration: false, returnManagement: false, analyticsApi: true, advertisingApi: true, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER', status: 'ACTIVE', popularity: 70, commissionRange: '%0',
    brandColor: '#E60023', monthlyVisitors: '450M+', sellerCount: '100K+',
  },
  {
    id: 'magento', name: 'Magento / Adobe Commerce', slug: 'magento', logo: '/images/pazaryeri/magento.png',
    region: 'GLOBAL', country: 'Global', countryCode: 'US', category: 'ECOMMERCE',
    description: 'Kurumsal seviye açık kaynak e-ticaret platformu.', website: 'https://magento.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: true },
    requiredFields: [
      { key: 'baseUrl', label: 'Base URL', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    minimumPlan: 'PROFESSIONAL', status: 'ACTIVE', popularity: 80, commissionRange: '%0',
    brandColor: '#EE672F', monthlyVisitors: 'N/A', sellerCount: '250K+',
  },
  {
    id: 'bigcommerce', name: 'BigCommerce', slug: 'bigcommerce', logo: '/images/pazaryeri/bigcommerce.webp',
    region: 'GLOBAL', country: 'Global', countryCode: 'US', category: 'ECOMMERCE',
    description: 'Kurumsal e-ticaret SaaS platformu.', website: 'https://www.bigcommerce.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: true },
    requiredFields: [
      { key: 'storeHash', label: 'Store Hash', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    minimumPlan: 'STARTER', status: 'ACTIVE', popularity: 75, commissionRange: '%0',
    brandColor: '#121118', monthlyVisitors: 'N/A', sellerCount: '60K+',
  },
  {
    id: 'prestashop', name: 'PrestaShop', slug: 'prestashop', logo: '/images/pazaryeri/prestashop.webp',
    region: 'GLOBAL', country: 'Global', countryCode: 'FR', category: 'ECOMMERCE',
    description: 'Açık kaynak e-ticaret çözümü.', website: 'https://www.prestashop.com',
    apiType: 'REST', authType: 'API_KEY', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: false, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: true },
    requiredFields: [
      { key: 'shopUrl', label: 'Mağaza URL', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 70, commissionRange: '%0',
    brandColor: '#DF0067', monthlyVisitors: 'N/A', sellerCount: '300K+',
  },
  {
    id: 'opencart', name: 'OpenCart', slug: 'opencart', logo: '/images/pazaryeri/opencart.webp',
    region: 'GLOBAL', country: 'Global', countryCode: 'HK', category: 'ECOMMERCE',
    description: 'Ücretsiz açık kaynak alışveriş sepeti çözümü.', website: 'https://www.opencart.com',
    apiType: 'REST', authType: 'API_KEY', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: false, analyticsApi: false, advertisingApi: false, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'storeUrl', label: 'Mağaza URL', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 65, commissionRange: '%0',
    brandColor: '#23A3D5', monthlyVisitors: 'N/A', sellerCount: '400K+',
  },
  {
    id: 'salesforce', name: 'Salesforce Commerce', slug: 'salesforce', logo: '/images/pazaryeri/Salesforce.png',
    region: 'GLOBAL', country: 'Global', countryCode: 'US', category: 'ECOMMERCE',
    description: 'Kurumsal düzey CRM entegreli e-ticaret.', website: 'https://www.salesforce.com/commerce',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: true, fulfillmentService: true, multiWarehouse: true },
    requiredFields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'text', required: true },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
    minimumPlan: 'ENTERPRISE', status: 'ACTIVE', popularity: 85, commissionRange: '%0',
    brandColor: '#00A1E0', monthlyVisitors: 'N/A', sellerCount: '10K+',
  },
  {
    id: 'vtex', name: 'VTEX', slug: 'vtex', logo: '/images/pazaryeri/VTEX_logo.png',
    region: 'GLOBAL', country: 'Global', countryCode: 'BR', category: 'ECOMMERCE',
    description: 'Dijital ticaret platformu.', website: 'https://vtex.com',
    apiType: 'REST', authType: 'API_KEY', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: true, multiWarehouse: true },
    requiredFields: [
      { key: 'accountName', label: 'Account Name', type: 'text', required: true },
      { key: 'appKey', label: 'App Key', type: 'password', required: true },
      { key: 'appToken', label: 'App Token', type: 'password', required: true },
    ],
    minimumPlan: 'PROFESSIONAL', status: 'ACTIVE', popularity: 75, commissionRange: '%0 - %2',
    brandColor: '#F71963', monthlyVisitors: 'N/A', sellerCount: '2K+',
  },
  {
    id: 'ikas', name: 'ikas', slug: 'ikas', logo: '/images/pazaryeri/ikas.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'ECOMMERCE',
    description: 'Türk e-ticaret altyapı çözümü.', website: 'https://ikas.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: true },
    requiredFields: [
      { key: 'storeId', label: 'Store ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 70, commissionRange: '%0 - %1',
    brandColor: '#6366F1', monthlyVisitors: 'N/A', sellerCount: '20K+',
  },
  {
    id: 'ideasoft', name: 'IdeaSoft', slug: 'ideasoft', logo: '/images/pazaryeri/ideasoft-logo.webp',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'ECOMMERCE',
    description: 'Türkiye lider e-ticaret altyapı sağlayıcısı.', website: 'https://www.ideasoft.com.tr',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: true },
    requiredFields: [
      { key: 'storeUrl', label: 'Mağaza URL', type: 'text', required: true },
      { key: 'oauthToken', label: 'OAuth Token', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 80, commissionRange: '%0',
    brandColor: '#FF5722', monthlyVisitors: 'N/A', sellerCount: '30K+',
  },
  {
    id: 'ticimax', name: 'Ticimax', slug: 'ticimax', logo: '/images/pazaryeri/ticimax.webp',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'ECOMMERCE',
    description: 'Türk e-ticaret yazılım çözümü.', website: 'https://www.ticimax.com',
    apiType: 'REST', authType: 'API_KEY', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: true },
    requiredFields: [
      { key: 'siteUrl', label: 'Site URL', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 72, commissionRange: '%0',
    brandColor: '#1A237E', monthlyVisitors: 'N/A', sellerCount: '15K+',
  },
  {
    id: 't-soft', name: 'T-Soft', slug: 't-soft', logo: '/images/pazaryeri/tsoft.webp',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'ECOMMERCE',
    description: 'Türk e-ticaret yazılım platformu.', website: 'https://www.tsoft.com.tr',
    apiType: 'REST', authType: 'API_KEY', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'storeUrl', label: 'Mağaza URL', type: 'text', required: true },
      { key: 'apiToken', label: 'API Token', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 68, commissionRange: '%0',
    brandColor: '#00BCD4', monthlyVisitors: 'N/A', sellerCount: '10K+',
  },
  {
    id: 'faprika', name: 'Faprika', slug: 'faprika', logo: '/images/pazaryeri/faprika.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'ECOMMERCE',
    description: 'Türk e-ticaret SaaS çözümü.', website: 'https://faprika.com',
    apiType: 'REST', authType: 'API_KEY', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: false, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: false },
    requiredFields: [
      { key: 'storeId', label: 'Store ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 60, commissionRange: '%0',
    brandColor: '#FF4081', monthlyVisitors: 'N/A', sellerCount: '5K+',
  },
  {
    id: 'platinmarket', name: 'PlatinMarket', slug: 'platinmarket', logo: '/images/pazaryeri/platinmarketlogo.png',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'ECOMMERCE',
    description: 'Türk e-ticaret altyapı hizmeti.', website: 'https://www.platinmarket.com',
    apiType: 'REST', authType: 'API_KEY', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: false, multiWarehouse: true },
    requiredFields: [
      { key: 'siteUrl', label: 'Site URL', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    minimumPlan: 'FREE', status: 'ACTIVE', popularity: 65, commissionRange: '%0',
    brandColor: '#673AB7', monthlyVisitors: 'N/A', sellerCount: '8K+',
  },
  {
    id: 'akinon', name: 'Akinon', slug: 'akinon', logo: '/images/pazaryeri/akinon.webp',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'ECOMMERCE',
    description: 'Kurumsal seviye e-ticaret çözümü.', website: 'https://akinon.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: true, fulfillmentService: true, multiWarehouse: true },
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
    minimumPlan: 'ENTERPRISE', status: 'ACTIVE', popularity: 78, commissionRange: '%0',
    brandColor: '#2196F3', monthlyVisitors: 'N/A', sellerCount: '500+',
  },
  {
    id: 'inveon', name: 'Inveon', slug: 'inveon', logo: '/images/pazaryeri/inveon.webp',
    region: 'TURKEY', country: 'Türkiye', countryCode: 'TR', category: 'ECOMMERCE',
    description: 'Kurumsal dijital ticaret platformu.', website: 'https://www.inveon.com',
    apiType: 'REST', authType: 'OAUTH2', sandboxAvailable: true,
    features: { productSync: true, orderSync: true, inventorySync: true, priceSync: true, shippingIntegration: true, returnManagement: true, analyticsApi: true, advertisingApi: false, fulfillmentService: true, multiWarehouse: true },
    requiredFields: [
      { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    minimumPlan: 'ENTERPRISE', status: 'ACTIVE', popularity: 72, commissionRange: '%0',
    brandColor: '#3F51B5', monthlyVisitors: 'N/A', sellerCount: '200+',
  },
];

function iStatus(integration: { apiExtra?: unknown }) { return (integration.apiExtra as { connectionStatus?: string } | undefined)?.connectionStatus === 'verified'; }

type ViewType = 'grid' | 'list' | 'status';

const OAUTH_MARKETPLACE_IDS = new Set([
  'amazon-tr',
  'amazon-us',
  'amazon-uk',
  'amazon-de',
]);

function formatSyncResult(result: {
  products?: { created?: number; updated?: number; failed?: number; total?: number };
  orders?: { created?: number; updated?: number; skipped?: boolean; message?: string };
}) {
  const parts: string[] = [];
  if (result.products) {
    parts.push(
      `Ürün: ${result.products.created ?? 0} yeni, ${result.products.updated ?? 0} güncellendi` +
        (result.products.failed ? `, ${result.products.failed} hata` : ''),
    );
  }
  if (result.orders) {
    if (result.orders.skipped) {
      parts.push(`Sipariş: ${result.orders.message ?? 'atlandı'}`);
    } else {
      parts.push(
        `Sipariş: ${result.orders.created ?? 0} yeni, ${result.orders.updated ?? 0} güncellendi`,
      );
    }
  }
  return parts.join('\n');
}

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  const accessToken = (session?.user as any)?.accessToken as string | undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceConfig | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [userPlan] = useState('PROFESSIONAL');
  const [activeIntegrations, setActiveIntegrations] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchActiveIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        if (!data.error) setActiveIntegrations(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSync = async (mp: MarketplaceConfig) => {
    setIsSyncing(true);
    try {
      if (!tenantId) {
        alert('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      const platformEnum = resolvePlatformEnum(mp.id);
      const integration = activeIntegrations.find(
        (i) => i.platform === platformEnum,
      );

      if (!integration) {
        alert(`${mp.name} için aktif bir bağlantı bulunamadı.`);
        return;
      }

      if (accessToken) apiClient.setAccessToken(accessToken);
      apiClient.setTenantId(tenantId);

      const result = await apiClient.syncStore(integration.id, 'all') as {
        products?: { created?: number; updated?: number; failed?: number };
        orders?: { created?: number; updated?: number; skipped?: boolean; message?: string };
      };
      await fetchActiveIntegrations();
      const detail = formatSyncResult(result);
      alert(`${mp.name} senkronize edildi.${detail ? `\n${detail}` : ''}`);
    } catch (error) {
      console.error("Sync error:", error);
      alert(error instanceof Error ? error.message : 'Senkronizasyon hatası oluştu.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchActiveIntegrations();
  }, []);

  const combinedMarketplaces = useMemo(() => {
    return MARKETPLACES.map(mp => {
      // Platform enum matches e.g 'TRENDYOL', 'EBAY_US', etc.
      const platformEnum = resolvePlatformEnum(mp.id);
      const integration = activeIntegrations.find((i) => {
        if (i.platform !== platformEnum) return false;
        const storedMarketplaceId = (i.apiExtra as { marketplaceId?: string } | undefined)?.marketplaceId;
        return !storedMarketplaceId || storedMarketplaceId === mp.id;
      });
      if (integration) {
        return {
          ...mp,
          userIntegration: {
            id: integration.id,
            isActive: integration.isActive,
            status: (iStatus(integration) ? 'connected' : 'pending') as 'connected' | 'disconnected' | 'error' | 'syncing' | 'pending',
            lastSync: (integration.apiExtra as { lastSuccessfulSyncAt?: string } | undefined)?.lastSuccessfulSyncAt,
          }
        };
      }
      return mp;
    });
  }, [activeIntegrations]);

  const filteredMarketplaces = useMemo(() => {
    return combinedMarketplaces.filter((mp) => {
      const matchesSearch = mp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mp.country.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || mp.region === selectedRegion;
      const matchesCategory = selectedCategory === 'all' || mp.category === selectedCategory;
      const matchesPlan = selectedPlan === 'all' ||
        PLAN_HIERARCHY.indexOf(mp.minimumPlan) <= PLAN_HIERARCHY.indexOf(selectedPlan);
      return matchesSearch && matchesRegion && matchesCategory && matchesPlan;
    });
  }, [searchQuery, selectedRegion, selectedCategory, selectedPlan, combinedMarketplaces]);

  const groupedByRegion = useMemo(() => {
    const groups: Record<string, MarketplaceConfig[]> = {};
    filteredMarketplaces.forEach((mp) => {
      if (!groups[mp.region]) groups[mp.region] = [];
      groups[mp.region].push(mp);
    });
    return groups;
  }, [filteredMarketplaces]);

  const isMarketplaceLocked = (mp: MarketplaceConfig) => {
    return PLAN_HIERARCHY.indexOf(mp.minimumPlan) > PLAN_HIERARCHY.indexOf(userPlan);
  };

  const handleConnect = (marketplace: MarketplaceConfig) => {
    if (!CONNECTION_READY_IDS.has(marketplace.id)) {
      alert(
        `${marketplace.name} bağlantısı henüz hazır değil. Desteklenen pazaryerlerinden birini seçin.`,
      );
      return;
    }
    setSelectedMarketplace(marketplace);
    setShowWizard(true);
  };

  const handleOAuth = async (marketplace: MarketplaceConfig) => {
    if (!tenantId) {
      alert('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    try {
      const response = await fetch('/api/marketplace/oauth/'+encodeURIComponent(marketplace.id), { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.authorizationUrl) throw new Error(data.message || data.error || 'Yetkilendirme başlatılamadı');
      window.location.assign(data.authorizationUrl);
    } catch (error) { alert(error instanceof Error ? error.message : 'Yetkilendirme başlatılamadı'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-600" />
                Pazaryeri Entegrasyonları
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {MARKETPLACES.length} pazaryeri arasından seçim yapın
              </p>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
              <button onClick={() => setViewType('grid')} className={`p-2 rounded-lg ${viewType === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 dark:text-gray-400'}`}>
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button onClick={() => setViewType('list')} className={`p-2 rounded-lg ${viewType === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 dark:text-gray-400'}`}>
                <List className="w-5 h-5" />
              </button>
              <button onClick={() => setViewType('status')} className={`p-2 rounded-lg ${viewType === 'status' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 dark:text-gray-400'}`}>
                <Activity className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <IntegrationStats
            totalIntegrations={MARKETPLACES.length}
            activeIntegrations={activeIntegrations.filter(i => i.isActive).length}
            pendingIntegrations={0}
            totalProducts={0}
            totalOrders={0}
            totalRevenue={0}
            syncHealth={0}
          />
        </motion.div>

        {/* Search & Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Pazaryeri ara..." className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-3 rounded-xl border flex items-center gap-2 ${showFilters ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-700'}`}>
              <SlidersHorizontal className="w-5 h-5" />
              Filtreler
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bölge</label>
                    <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <option value="all">Tüm Bölgeler</option>
                      {Object.entries(REGION_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Kategori</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <option value="all">Tüm Kategoriler</option>
                      {Object.entries(CATEGORY_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Paket</label>
                    <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <option value="all">Tüm Paketler</option>
                      {Object.entries(PLAN_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mini Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
          <MiniStatsRow
            activeCount={activeIntegrations.filter(i => i.isActive).length}
            platformCount={MARKETPLACES.length}
          />
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewType === 'status' ? (
            <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RealTimeStatusPanel integrations={[]} onRefresh={() => { }} onViewDetails={() => { }} onToggleNotifications={() => { }} />
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {Object.entries(groupedByRegion).map(([region, mps], groupIndex) => (
                <div key={region} className="mb-8">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: groupIndex * 0.1 }} className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{REGION_NAMES[region]}</h2>
                      <p className="text-sm text-gray-500">{mps.length} pazaryeri</p>
                    </div>
                  </motion.div>
                  <div className={`grid gap-4 ${viewType === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {mps.map((marketplace, index) => (
                      <MarketplaceCard
                        key={marketplace.id}
                        marketplace={marketplace as Parameters<typeof MarketplaceCard>[0]['marketplace']}
                        userPlan={userPlan}
                        isLocked={isMarketplaceLocked(marketplace)}
                        onConnect={(mp) => handleConnect(mp as MarketplaceConfig)}
                        onDisconnect={() => { }}
                        onSync={() => { handleSync(marketplace as MarketplaceConfig); }}
                        onSettings={() => { }}
                        onViewDetails={() => window.open(marketplace.website, '_blank')}
                        onOAuth={
                          OAUTH_MARKETPLACE_IDS.has(marketplace.id)
                            ? (mp) => handleOAuth(mp as MarketplaceConfig)
                            : undefined
                        }
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {filteredMarketplaces.length === 0 && (
                <div className="text-center py-16">
                  <Search className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-semibold mb-2">Sonuç Bulunamadı</h3>
                  <p className="text-slate-500">Filtrelerinizi değiştirin</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard */}
        {selectedMarketplace && (
          <ConnectionWizard
            marketplace={selectedMarketplace as Parameters<typeof ConnectionWizard>[0]['marketplace']}
            isOpen={showWizard}
            onClose={() => { setShowWizard(false); setSelectedMarketplace(null); }}
            onConnect={async (credentials) => {
              try {
                if (!tenantId || !selectedMarketplace) throw new Error('Mağaza oturumu bulunamadı');
                if (accessToken) apiClient.setAccessToken(accessToken);
                apiClient.setTenantId(tenantId);

                const platformEnum = resolvePlatformEnum(selectedMarketplace.id);
                const res = await apiClient.connectStore(
                  platformEnum,
                  credentials,
                  selectedMarketplace.id,
                ) as {
                  initialSyncStarted?: boolean; connectionStatus?: string;
                  message?: string;
                };
                await fetchActiveIntegrations();
                if (res?.initialSyncStarted) {
                  alert(
                    res.message ||
                      'Mağaza bağlandı. İlk senkronizasyon arka planda başlatıldı.',
                  );
                }
                return { success: true, verified: res.connectionStatus === 'verified', message: res.message };
              } catch (e) {
                console.error(e);
                throw e;
              }
            }}
            onTest={async (credentials) => {
              try {
                const res = await fetch('/api/integrations/test', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    platform: selectedMarketplace?.id,
                    credentials
                  })
                });
                const data = await res.json();
                return { success: res.ok && data.success === true, message: data.message || data.error, supported: data.supported };
              } catch (e) {
                console.error(e);
                return { success: false, message: 'Bağlantı hatası' };
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
