import { OAuthController } from './oauth.controller';
jest.mock('../marketplace/marketplace.service', () => ({ MarketplaceService: class {} }));

describe('Amazon OAuth state security', () => {
  let controller: OAuthController; let db: any;
  const original = { ...process.env };
  beforeEach(() => {
    Object.assign(process.env, { JWT_SECRET: 'oauth-test-secret', AMAZON_SP_API_APPLICATION_ID: 'amzn1.sp.solution.test', AMAZON_CLIENT_ID: 'lwa-id', AMAZON_CLIENT_SECRET: 'lwa-secret', AMAZON_REDIRECT_URI: 'https://api.example.com/api/v1/oauth/amazon/callback', WEB_URL: 'https://app.example.com' });
    db = { activityLog: { create: jest.fn(), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) } };
    controller = new OAuthController(db, {} as any);
  });
  afterEach(() => { process.env = { ...original }; });
  async function state() {
    const result = await controller.initiateOAuth('amazon-tr', { user: { tenantId: 'tenant-a' } });
    return new URL(result.authorizationUrl).searchParams.get('state')!;
  }
  it('uses SP application ID and selected regional Seller Central', async () => {
    const result = await controller.initiateOAuth('amazon-tr', { user: { tenantId: 'tenant-a' } });
    const url = new URL(result.authorizationUrl);
    expect(url.hostname).toBe('sellercentral.amazon.com.tr');
    expect(url.searchParams.get('application_id')).toBe('amzn1.sp.solution.test');
    expect(url.searchParams.get('state')).not.toBe('tenant-a');
  });
  it('requires an authenticated tenant to start authorization', async () => await expect(controller.initiateOAuth('amazon-tr', {})).rejects.toThrow());
  it('rejects missing application configuration', async () => {
    delete process.env.AMAZON_SP_API_APPLICATION_ID;
    await expect(state()).rejects.toThrow(/yapılandırılmalıdır/);
  });
  it('rejects unsigned tenant IDs and tampered signatures before consuming a nonce', async () => {
    await expect((controller as any).consumeState('tenant-a')).rejects.toThrow();
    const signed = await state();
    await expect((controller as any).consumeState(signed.replace(/.$/, signed.endsWith('A') ? 'B' : 'A'))).rejects.toThrow();
    expect(db.activityLog.deleteMany).not.toHaveBeenCalled();
  });
  it('consumes nonce within the signed tenant and rejects replays', async () => {
    const signed = await state();
    expect(await (controller as any).consumeState(signed)).toMatchObject({ tenantId: 'tenant-a', provider: 'amazon-tr' });
    expect(db.activityLog.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a', resource: 'oauth_state' }) }));
    db.activityLog.deleteMany.mockResolvedValue({ count: 0 });
    await expect((controller as any).consumeState(signed)).rejects.toThrow(/daha önce/);
  });
});
