import { MarketplaceConnectionService } from './marketplace-connection.service';

describe('Marketplace API verification', () => {
  let fetchMock: jest.SpyInstance;
  const service = new MarketplaceConnectionService();
  const credentials = { supplierId: '123', apiKey: 'key', apiSecret: 'secret' };
  beforeEach(() => { fetchMock = jest.spyOn(global, 'fetch'); });
  afterEach(() => jest.restoreAllMocks());
  const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
  it('accepts an authenticated empty store', async () => {
    fetchMock.mockResolvedValue(response({ content: [] }));
    expect(await service.test('trendyol', credentials)).toMatchObject({ success: true, supported: true });
  });
  it.each([401,403,429,500])('does not turn HTTP %s into success', async status => {
    fetchMock.mockResolvedValue(response({}, status));
    expect(await service.test('trendyol', credentials)).toMatchObject({ success: false, supported: true, message: expect.stringContaining(String(status)) });
  });
  it('rejects network failure', async () => {
    fetchMock.mockRejectedValue(new Error('network unavailable'));
    expect((await service.test('trendyol', credentials)).success).toBe(false);
  });
  it('rejects a 200 response with the wrong payload', async () => {
    fetchMock.mockResolvedValue(response({ message: 'failed' }));
    expect((await service.test('trendyol', credentials)).success).toBe(false);
  });
  it('does not call a provider with missing mandatory secrets', async () => {
    expect((await service.test('n11', { apiKey: 'key' })).success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('treats string false as production, true as sandbox', async () => {
    fetchMock.mockResolvedValue(response({ content: [] }));
    await service.test('trendyol', { ...credentials, isTestMode: 'false' });
    expect(String(fetchMock.mock.calls[0][0])).toContain('https://apigw.trendyol.com/');
    await service.test('trendyol', { ...credentials, isTestMode: true });
    expect(String(fetchMock.mock.calls[1][0])).toContain('https://stageapigw.trendyol.com/');
  });
  it('uses Hepsiburada assigned username/password and listing path', async () => {
    fetchMock.mockResolvedValue(response([]));
    expect((await service.test('hepsiburada', { merchantId: 'merchant', username: 'user', serviceKey: 'password' })).success).toBe(true);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/listings/merchantid/merchant?offset=0&limit=1');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Basic '+Buffer.from('user:password').toString('base64'));
  });
  it('uses GET to read Çiçeksepeti products', async () => {
    fetchMock.mockResolvedValue(response({ products: [] }));
    expect((await service.test('ciceksepeti', { apiKey: 'key' })).success).toBe(true);
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined();
  });
  it('requires Etsy shop and user OAuth token', async () => {
    expect((await service.test('etsy', { keystring: 'key', sharedSecret: 'secret' })).success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('requires eBay user OAuth token', async () => {
    expect((await service.test('ebay-us', { clientId: 'key', clientSecret: 'secret' })).success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('does not claim an unknown provider is verified', async () => {
    expect(await service.test('unknown', credentials)).toMatchObject({ success: false, supported: false });
  });
  it('verifies Amazon marketplace participation without AWS credentials', async () => {
    fetchMock.mockResolvedValueOnce(response({ access_token: 'token' })).mockResolvedValueOnce(response({ payload: [{ marketplace: { id: 'ATVPDKIKX0DER' }, participation: { isParticipating: true } }] }));
    expect((await service.test('amazon-us', { sellerId: 'SELLER', refreshToken: 'refresh', clientId: 'client', clientSecret: 'secret' })).success).toBe(true);
    expect(String(fetchMock.mock.calls[1][0])).toContain('sellingpartnerapi-na.amazon.com');
  });
});
