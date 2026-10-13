import { Injectable } from '@nestjs/common';
import { normalizeMarketplaceCredentials, resolvePlatformFromMarketplaceId } from './marketplace-connect.util';
import { normalizeTestMode } from './credential-metadata';
import { hepsiburadaHeaders, hepsiburadaHost, providerJson, trendyolBase, trendyolHeaders } from './provider-http';
import { parseAmazonSpApiCredentials } from './amazon-sp-api.config';

@Injectable()
export class MarketplaceConnectionService {
  async test(providerId: string, credentials: Record<string, unknown>) {
    const provider = String(providerId || '').toLowerCase();
    const platform = resolvePlatformFromMarketplaceId(provider);
    if (!platform) return { success: false, supported: false, message: 'Bu pazaryeri için bağlantı doğrulaması desteklenmiyor.' };
    try {
      const normalized = normalizeMarketplaceCredentials(platform, credentials, provider);
      const extra = normalized.apiExtra as Record<string, any>;
      const { apiKey, apiSecret } = normalized;
      const testMode = normalizeTestMode(extra.isTestMode);
      switch (platform) {
        case 'TRENDYOL': {
          const result = await providerJson(`${trendyolBase(testMode)}/product/sellers/${encodeURIComponent(extra.supplierId)}/products/approved?page=0&size=1`, { headers: trendyolHeaders(extra.supplierId, apiKey, apiSecret) });
          if (!Array.isArray(result.content)) throw new Error('Trendyol ürün yanıtı beklenen biçimde değil');
          break;
        }
        case 'HEPSIBURADA':
          await providerJson(`${hepsiburadaHost('listing', testMode)}/listings/merchantid/${encodeURIComponent(extra.merchantId)}?offset=0&limit=1`, { headers: hepsiburadaHeaders(apiKey, apiSecret) });
          break;
        case 'N11': {
          const result = await providerJson('https://api.n11.com/ms/product-query?page=0&size=1', { headers: { appKey: apiKey, appSecret: apiSecret } });
          if (!Array.isArray(result.content)) throw new Error('n11 ürün yanıtı beklenen biçimde değil');
          break;
        }
        case 'CICEKSEPETI':
          await providerJson(`https://${testMode ? 'sandbox-' : ''}apis.ciceksepeti.com/api/v1/Products?Page=1&PageSize=1`, { headers: { 'x-api-key': apiKey } });
          break;
        case 'AMAZON': case 'AMAZON_US': case 'AMAZON_UK': case 'AMAZON_DE': case 'AMAZON_FR': {
          const parsed = parseAmazonSpApiCredentials({ apiKey, apiSecret, apiExtra: extra });
          if (!parsed) throw new Error('Amazon Seller ID, Refresh Token ve LWA uygulama bilgileri gerekli');
          const token = await providerJson('https://api.amazon.com/auth/o2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: parsed.refreshToken, client_id: parsed.clientId, client_secret: parsed.clientSecret }) });
          const host = { eu: 'eu', na: 'na', fe: 'fe' }[parsed.marketplace.region];
          const result = await providerJson(`https://sellingpartnerapi-${host}.amazon.com/sellers/v1/marketplaceParticipations`, { headers: { 'x-amz-access-token': token.access_token } });
          const rows = result.payload;
          if (!Array.isArray(rows) || !rows.some((row: any) => row.marketplace?.id === parsed.marketplace.spMarketplaceId && row.participation?.isParticipating)) throw new Error('Amazon hesabı seçilen pazaryerinde satış yetkisine sahip değil');
          break;
        }
        case 'EBAY':
          if (!extra.authToken && !extra.accessToken) throw new Error('eBay kullanıcı yetkilendirme token’ı gerekli');
          await providerJson(`https://api${testMode ? '.sandbox' : ''}.ebay.com/sell/inventory/v1/inventory_item?limit=1`, { headers: { Authorization: `Bearer ${extra.accessToken || extra.authToken}` } });
          break;
        case 'ETSY':
          if (!extra.accessToken || !extra.shopId) throw new Error('Etsy kullanıcı token’ı ve Mağaza ID gerekli');
          await providerJson(`https://openapi.etsy.com/v3/application/shops/${encodeURIComponent(extra.shopId)}/receipts?limit=1`, { headers: { 'x-api-key': `${apiKey}:${apiSecret}`, Authorization: `Bearer ${extra.accessToken}` } });
          break;
        default:
          return { success: false, supported: false, message: 'Bilgiler kaydedilebilir; bu sağlayıcı için doğrulama henüz desteklenmiyor.' };
      }
      return { success: true, supported: true, message: 'Mağaza API erişimi doğrulandı.', verifiedAt: new Date().toISOString() };
    } catch (error) {
      return { success: false, supported: true, message: error instanceof Error ? error.message : 'Bağlantı doğrulanamadı' };
    }
  }
}
