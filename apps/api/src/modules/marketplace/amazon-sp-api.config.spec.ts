import {
  extractSellerIdFromRef,
  hasAmazonSpApiCredentials,
  parseAmazonSpApiCredentials,
} from './amazon-sp-api.config';

describe('amazon-sp-api.config', () => {
  const completeCredentials = {
    apiKey: 'https://www.amazon.com.tr/sp?seller=ABCDEF',
    apiSecret: 'refresh-token',
    apiExtra: {
      marketplaceId: 'amazon-tr',
      refreshToken: 'refresh-token',
      clientId: 'amzn1.application-oa2-client.test',
      clientSecret: 'client-secret',
      awsAccessKeyId: 'AKIA_TEST',
      awsSecretAccessKey: 'secret',
      roleArn: 'arn:aws:iam::123456789012:role/SpApiRole',
    },
  };

  it('extracts seller id from amazon url', () => {
    expect(
      extractSellerIdFromRef('https://www.amazon.com.tr/sp?seller=ABCDEF'),
    ).toBe('ABCDEF');
  });

  it('detects complete SP-API credentials', () => {
    expect(hasAmazonSpApiCredentials(completeCredentials)).toBe(true);
  });

  it('parses marketplace profile for amazon-tr', () => {
    const parsed = parseAmazonSpApiCredentials(completeCredentials);
    expect(parsed?.sellerId).toBe('ABCDEF');
    expect(parsed?.marketplace.spMarketplaceId).toBe('A33AVAJ2PDY3EV');
    expect(parsed?.marketplace.region).toBe('eu');
  });

  it('accepts modern LWA credentials without AWS IAM keys', () => {
    expect(
      hasAmazonSpApiCredentials({
        ...completeCredentials,
        apiExtra: {
          ...completeCredentials.apiExtra,
          roleArn: '', awsAccessKeyId: '', awsSecretAccessKey: '',
        },
      }),
    ).toBe(true);
  });
});
