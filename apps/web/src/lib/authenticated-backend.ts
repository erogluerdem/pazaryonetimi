import 'server-only';
import { auth } from '@/auth';
import { fetchFromApi } from '@/lib/server-api-url';
import { NextResponse } from 'next/server';

export async function authenticatedBackend(path: string, options: { method?: string; body?: Record<string, unknown>; idempotencyKey?: string } = {}) {
  const session = await auth();
  const user = session?.user as { tenantId?: string; accessToken?: string } | undefined;
  if (!user?.tenantId) return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen giriş yapın.' }, { status: 401 });
  if (!user.accessToken) return NextResponse.json({ error: 'API oturumu oluşturulamadı. Sunucu JWT_SECRET yapılandırmasını kontrol edin.' }, { status: 503 });
  const result = await fetchFromApi(path, {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.accessToken}`, 'x-tenant-id': user.tenantId, ...(options.idempotencyKey ? { 'idempotency-key': options.idempotencyKey } : {}) },
    ...(options.body ? { body: JSON.stringify({ ...options.body, tenantId: user.tenantId }) } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(120_000),
  });
  return NextResponse.json(result.data ?? { error: 'API servisine erişilemedi.' }, { status: result.status });
}
