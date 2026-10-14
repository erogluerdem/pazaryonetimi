import 'server-only';

/** Sunucu tarafı (NextAuth, BFF) için API kök URL — Docker'da iç ağ adresi kullanılır. */
export function getServerApiBaseUrl(): string {
  const candidates = [
    process.env.API_INTERNAL_URL,
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NODE_ENV === 'production' ? 'https://api.pazaryonetimi.com' : 'http://localhost:3001',
  ];

  for (const raw of candidates) {
    const value = (raw || '').trim();
    if (!value) continue;

    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value.replace(/\/$/, '');
    }
    if (value.startsWith('/')) {
      return value.replace(/\/$/, '');
    }
    return `https://${value}`.replace(/\/$/, '');
  }

  return process.env.NODE_ENV === 'production' ? 'https://api.pazaryonetimi.com' : 'http://localhost:3001';
}

/** Nest global prefix + opsiyonel sürüm için olası tam URL'ler. */
export function buildApiUrlCandidates(path: string): string[] {
  const base = getServerApiBaseUrl();
  const root = base.replace(/\/api(?:\/v1)?$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return [
    ...new Set([
      `${root}/api/v1${normalizedPath}`,
      `${base}/api/v1${normalizedPath}`,
      `${root}/api${normalizedPath}`,
      `${base}/api${normalizedPath}`,
      `${root}${normalizedPath}`,
    ]),
  ];
}

export async function fetchFromApi<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null; url?: string }> {
  let lastStatus = 502;

  for (const url of buildApiUrlCandidates(path)) {
    try {
      const res = await fetch(url, init);
      const data = (await res.json().catch(() => null)) as T | null;
      if (res.ok) {
        return { ok: true, status: res.status, data, url };
      }

      lastStatus = res.status;
      if (res.status !== 404) {
        return { ok: false, status: res.status, data, url };
      }
    } catch {
      // A mutation may have committed before the network failed; do not replay it.
      return { ok: false, status: 502, data: null };
    }
  }

  return { ok: false, status: lastStatus, data: null };
}
