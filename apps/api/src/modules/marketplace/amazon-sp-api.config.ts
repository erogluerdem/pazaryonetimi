export type AmazonSpApiRegion = 'eu' | 'na' | 'fe';

export interface AmazonMarketplaceProfile {
  spMarketplaceId: string;
  region: AmazonSpApiRegion;
  currency: string;
}

export interface AmazonSpApiCredentials {
  sellerId: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  roleArn: string;
  marketplaceSlug: string;
  marketplace: AmazonMarketplaceProfile;
  sellerRef?: string;
}

export const AMAZON_MARKETPLACE_PROFILES: Record<string, AmazonMarketplaceProfile> =
  {
    'amazon-tr': {
      spMarketplaceId: 'A33AVAJ2PDY3EV',
      region: 'eu',
      currency: 'TRY',
    },
    'amazon-us': {
      spMarketplaceId: 'ATVPDKIKX0DER',
      region: 'na',
      currency: 'USD',
    },
    'amazon-uk': {
      spMarketplaceId: 'A1F83G8C2ARO7P',
      region: 'eu',
      currency: 'GBP',
    },
    'amazon-de': {
      spMarketplaceId: 'A1PA6795UKMFR9',
      region: 'eu',
      currency: 'EUR',
    },
    'amazon-fr': {
      spMarketplaceId: 'A13V1IB3VIYZZH',
      region: 'eu',
      currency: 'EUR',
    },
  };

export function resolveAmazonMarketplaceSlug(
  apiExtra?: Record<string, unknown> | null,
): string {
  const slug = String(apiExtra?.marketplaceId || 'amazon-tr').trim();
  return slug || 'amazon-tr';
}

export function extractSellerIdFromRef(sellerRef: string): string {
  const trimmed = sellerRef.trim();
  if (!trimmed) {
    return '';
  }

  const sellerParam = trimmed.match(/[?&]seller=([^&]+)/i);
  if (sellerParam?.[1]) {
    return decodeURIComponent(sellerParam[1]);
  }

  const meParam = trimmed.match(/[?&]me=([^&]+)/i);
  if (meParam?.[1]) {
    return decodeURIComponent(meParam[1]);
  }

  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      const seller = url.searchParams.get('seller') || url.searchParams.get('me');
      if (seller) {
        return seller;
      }
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

export function parseAmazonSpApiCredentials(input: {
  apiKey?: string;
  apiSecret?: string;
  apiExtra?: Record<string, unknown> | null;
}): AmazonSpApiCredentials | null {
  const extra = input.apiExtra ?? {};
  const marketplaceSlug = resolveAmazonMarketplaceSlug(extra);
  const marketplace = AMAZON_MARKETPLACE_PROFILES[marketplaceSlug];

  if (!marketplace) {
    return null;
  }

  const sellerRef = String(
    extra.sellerId || input.apiKey || extra.apiKey || '',
  ).trim();
  const sellerId = extractSellerIdFromRef(sellerRef);
  const refreshToken = String(
    extra.refreshToken || input.apiSecret || extra.apiSecret || '',
  ).trim();
  const clientId = String(extra.clientId || process.env.AMAZON_CLIENT_ID || '').trim();
  const clientSecret = String(extra.clientSecret || process.env.AMAZON_CLIENT_SECRET || '').trim();
  const awsAccessKeyId = String(extra.awsAccessKeyId || '').trim();
  const awsSecretAccessKey = String(extra.awsSecretAccessKey || '').trim();
  const roleArn = String(extra.roleArn || extra.awsSellingPartnerRole || '').trim();

  if (
    !sellerId ||
    !refreshToken ||
    !clientId ||
    !clientSecret
  ) {
    return null;
  }

  return {
    sellerId,
    sellerRef: sellerRef || sellerId,
    refreshToken,
    clientId,
    clientSecret,
    awsAccessKeyId,
    awsSecretAccessKey,
    roleArn,
    marketplaceSlug,
    marketplace,
  };
}

export function hasAmazonSpApiCredentials(input: {
  apiKey?: string;
  apiSecret?: string;
  apiExtra?: Record<string, unknown> | null;
}): boolean {
  return parseAmazonSpApiCredentials(input) !== null;
}
