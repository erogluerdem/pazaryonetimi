import apiClient, { ApiError } from './api-client';

describe('ApiClient URL Candidate & Direct Fallback', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.pazaryonetimi.com';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it('falls back to direct API candidate when proxy returns 500', async () => {
    const mockResponses: { url: string; status: number }[] = [];

    global.fetch = jest.fn().mockImplementation((url: string) => {
      mockResponses.push({ url, status: url.startsWith('/api') ? 500 : 200 });

      if (url.startsWith('/api')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ message: 'Next.js rewrite failed' }),
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ success: true, data: 'from-direct-api' }),
      });
    });

    const result = await apiClient.request<any>('/analytics/dashboard-stats?period=30d');
    expect(result).toEqual({ success: true, data: 'from-direct-api' });
    expect(mockResponses.length).toBe(2);
    expect(mockResponses[0].url).toContain('/api/v1/analytics/dashboard-stats');
    expect(mockResponses[1].url).toContain('api.pazaryonetimi.com/api/v1/analytics/dashboard-stats');
  });

  it('subsequent requests prefer direct API directly once proxy failure is recorded', async () => {
    const mockUrls: string[] = [];

    global.fetch = jest.fn().mockImplementation((url: string) => {
      mockUrls.push(url);
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ success: true }),
      });
    });

    await apiClient.request<any>('/analytics/recent-orders');
    expect(mockUrls.length).toBe(1);
    expect(mockUrls[0]).toContain('api.pazaryonetimi.com/api/v1/analytics/recent-orders');
  });
});
