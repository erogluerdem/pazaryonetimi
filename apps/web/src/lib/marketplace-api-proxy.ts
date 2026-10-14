function getApiBaseUrl(): string {
  const raw =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://api.pazaryonetimi.com' : 'http://localhost:3001');
  const normalized = raw.trim();
  if (!normalized) return process.env.NODE_ENV === 'production' ? 'https://api.pazaryonetimi.com' : 'http://localhost:3001';
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://')
  ) {
    return normalized.replace(/\/$/, '');
  }
  if (normalized.startsWith('/')) return normalized.replace(/\/$/, '');
  return `https://${normalized}`.replace(/\/$/, '');
}

function buildApiCandidates(path: string): string[] {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const root = base.replace(/\/api(?:\/v1)?$/, '');

  return [
    ...new Set([
      `${base}${normalizedPath}`,
      `${root}/api${normalizedPath}`,
      `${root}/api/v1${normalizedPath}`,
    ]),
  ];
}

export async function proxyMarketplaceApi(
  path: string,
  options: {
    method?: string;
    tenantId: string;
    accessToken?: string;
    body?: Record<string, unknown>;
  },
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const candidates = buildApiCandidates(path);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': options.tenantId,
  };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: options.method ?? 'POST',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (response.status === 404) continue;

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      return { ok: response.ok, status: response.status, data };
    } catch {
      // try next candidate
    }
  }

  return {
    ok: false,
    status: 502,
    data: { error: 'Marketplace API erisilemiyor' },
  };
}
