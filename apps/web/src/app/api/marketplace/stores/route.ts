export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { authenticatedBackend } from '@/lib/authenticated-backend';
export async function GET(req: NextRequest) {
  return authenticatedBackend('/marketplace/stores' + req.nextUrl.search, {});
}
