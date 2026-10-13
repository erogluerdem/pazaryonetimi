export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { authenticatedBackend } from '@/lib/authenticated-backend';
export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return authenticatedBackend('/marketplace/disconnect/' + encodeURIComponent(storeId) + '', { method: 'POST', body: {} });
}
