import { normalizeTestMode } from './credential-metadata';

export function trendyolBase(testMode: unknown): string {
  return normalizeTestMode(testMode) ? 'https://stageapigw.trendyol.com/integration' : 'https://apigw.trendyol.com/integration';
}
export function trendyolHeaders(sellerId: string, apiKey: string, apiSecret: string) {
  return { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`, Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': `${sellerId} - ${process.env.TRENDYOL_INTEGRATOR_NAME || 'PazarYonetimi'}` };
}
export function hepsiburadaHost(service: 'listing' | 'oms', testMode: unknown): string {
  return `https://${service}-external${normalizeTestMode(testMode) ? '-sit' : ''}.hepsiburada.com`;
}
export function hepsiburadaHeaders(username: string, password: string) {
  if (!username || !password) throw new Error('Hepsiburada kullanıcı adı ve servis anahtarı zorunludur');
  return { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`, Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': process.env.HEPSIBURADA_INTEGRATOR_NAME || 'PazarYonetimi' };
}
export async function providerJson(url: string, init: RequestInit = {}): Promise<any> {
  const response = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(25_000) });
  if (!response.ok) {
    const error = new Error(`Pazaryeri API isteği başarısız (HTTP ${response.status})`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function providerPages(url: string, headers: Record<string, string>, size = 100): Promise<any[]> {
  const rows: any[] = [];
  for (let page = 0; page < 2000; page++) {
    const target = new URL(url);
    target.searchParams.set('page', String(page));
    target.searchParams.set('size', String(size));
    const result = await providerJson(target.toString(), { headers });
    if (!Array.isArray(result.content)) throw new Error('Pazaryeri liste yanıtı beklenen biçimde değil');
    rows.push(...result.content);
    if (result.content.length < size || result.last === true || page + 1 >= result.totalPages) return rows;
  }
  throw new Error('Pazaryeri sayfalama sınırı aşıldı; aktarım tamamlanmadı');
}
