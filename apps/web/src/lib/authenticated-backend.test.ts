/** @jest-environment node */
import { authenticatedBackend } from './authenticated-backend';
import { auth } from '@/auth';
import { fetchFromApi } from './server-api-url';
jest.mock('server-only', () => ({}));
jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('./server-api-url', () => ({ fetchFromApi: jest.fn() }));
describe('Authenticated marketplace/XML proxy', () => {
  beforeEach(() => jest.clearAllMocks());
  it('rejects unsigned access', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    expect((await authenticatedBackend('/xml-feeds')).status).toBe(401);
    expect(fetchFromApi).not.toHaveBeenCalled();
  });
  it('fails visibly when backend session signing is not configured', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { tenantId: 'tenant-a' } });
    expect((await authenticatedBackend('/marketplace/connect')).status).toBe(503);
    expect(fetchFromApi).not.toHaveBeenCalled();
  });
  it('forces the signed-in tenant and preserves upstream failure status', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { tenantId: 'tenant-a', accessToken: 'verified-token' } });
    (fetchFromApi as jest.Mock).mockResolvedValue({ status: 422, data: { message: 'API anahtarı geçersiz' } });
    const response = await authenticatedBackend('/marketplace/connect', { method: 'POST', body: { tenantId: 'victim-tenant', credentials: { apiKey: 'key' } } });
    expect(response.status).toBe(422);
    const options = (fetchFromApi as jest.Mock).mock.calls[0][1];
    expect(JSON.parse(options.body).tenantId).toBe('tenant-a');
    expect(options.headers.Authorization).toBe('Bearer verified-token');
    expect(options.headers['x-tenant-id']).toBe('tenant-a');
  });
});
