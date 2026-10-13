export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { authenticatedBackend } from '@/lib/authenticated-backend';
export async function POST(req: NextRequest) {
  return authenticatedBackend('/marketplace/test-credentials', { method: 'POST', body: await req.json() });
}
