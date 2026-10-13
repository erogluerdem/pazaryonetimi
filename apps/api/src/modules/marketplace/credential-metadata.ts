const PUBLIC_FIELDS = new Set([
  'marketplaceId',
  'providerId',
  'externalAccountId',
  'supplierId',
  'merchantId',
  'sellerId',
  'shopId',
  'vendorId',
  'shopDomain',
  'siteUrl',
  'isTestMode',
  'environment',
  'category',
  'connectionStatus',
  'lastVerifiedAt',
  'lastVerificationError',
  'lastSuccessfulSyncAt',
  'lastSyncAttemptAt',
  'lastSyncStatus',
  'lastSyncError',
  'productsAdded',
  'productsUpdated',
  'productsFailed',
  'ordersSynced',
  'region',
  'shopName',
]);

export function publicCredentialMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key]) => PUBLIC_FIELDS.has(key)));
}

export function normalizeTestMode(value: unknown): boolean {
  return value === true || value === 'true';
}
