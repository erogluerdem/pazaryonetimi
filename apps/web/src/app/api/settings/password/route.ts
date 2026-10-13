export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

function getApiBaseUrl() {
  const raw =
    process.env.API_INTERNAL_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const normalized = raw.trim();
  if (!normalized) return 'http://localhost:3001';
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized.replace(/\/$/, '');
  }
  return `https://${normalized}`.replace(/\/$/, '');
}

/** POST — şifre değiştirme (JWT korumalı Nest /users/me/password) */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const accessToken = (session as { accessToken?: string } | null)?.accessToken;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mevcut ve yeni şifre zorunludur' },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Yeni şifre en az 8 karakter olmalıdır' },
        { status: 400 },
      );
    }

    if (confirmPassword && confirmPassword !== newPassword) {
      return NextResponse.json(
        { error: 'Yeni şifreler eşleşmiyor' },
        { status: 400 },
      );
    }

    const base = getApiBaseUrl();
    const candidates = [
      `${base}/api/users/me/password`,
      `${base}/users/me/password`,
    ];

    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (response.ok) {
          return NextResponse.json(await response.json());
        }

        if (response.status !== 404) {
          const err = await response.json().catch(() => ({}));
          return NextResponse.json(
            { error: (err as { message?: string }).message || 'Şifre değiştirilemedi' },
            { status: response.status },
          );
        }
      } catch {
        // try next
      }
    }

    return NextResponse.json({ error: 'API bağlantı hatası' }, { status: 502 });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
