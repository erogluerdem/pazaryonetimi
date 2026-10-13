export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';

function getApiBaseUrl() {
    const raw = process.env.API_INTERNAL_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return raw.replace(/\/$/, '').replace(/\/api$/, '');
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string; storeId: string }> }
) {
    try {
        const { platform, storeId } = await params;
        const { searchParams } = request.nextUrl;
        const limit = searchParams.get('limit') || '10';

        const base = getApiBaseUrl();
        const query = `?limit=${limit}`;
        const candidates = [
            `${base}/api/marketplace/store/${platform}/${storeId}/products${query}`,
            `${base}/marketplace/store/${platform}/${storeId}/products${query}`,
            `${base}/api/v1/marketplace/store/${platform}/${storeId}/products${query}`,
        ];

        let response: Response | null = null;
        for (const apiUrl of candidates) {
            response = await fetch(apiUrl);
            if (response.ok || response.status !== 404) {
                break;
            }
        }

        if (!response) {
            return NextResponse.json(
                { error: 'Backend API request failed' },
                { status: 502 }
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: `Backend API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Marketplace Products API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
