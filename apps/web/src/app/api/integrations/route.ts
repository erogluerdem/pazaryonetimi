export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { authenticatedBackend } from "@/lib/authenticated-backend";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        const tenantId = (session?.user as any)?.tenantId as string;
        if (!tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const integrations = await prisma.integration.findMany({
            where: {
                tenantId
            }
        });

        // Hide secrets
        const safeIntegrations = integrations.map(int => ({
            id: int.id,
            platform: int.platform,
            apiKey: int.apiKey ? "********" : "",
            apiExtra: Object.fromEntries(Object.entries((int.apiExtra as Record<string, unknown>) || {}).filter(([key]) => ['marketplaceId','externalAccountId','supplierId','merchantId','sellerId','shopId','vendorId','shopDomain','siteUrl','isTestMode','connectionStatus','lastVerifiedAt','lastSuccessfulSyncAt'].includes(key))),
            isActive: int.isActive,
            createdAt: int.createdAt,
            updatedAt: int.updatedAt,
        }));

        return NextResponse.json(safeIntegrations);
    } catch (error) {
        console.error("Error fetching integrations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return authenticatedBackend('/marketplace/connect', { method: 'POST', body: await req.json() });
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        const tenantId = (session?.user as any)?.tenantId as string;
        if (!tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const integrationId = searchParams.get('id');

        if (!integrationId) {
            return NextResponse.json({ error: "id parametresi zorunludur" }, { status: 400 });
        }

        await prisma.integration.updateMany({
            where: { id: integrationId, tenantId },
            data: { isActive: false }
        });

        return NextResponse.json({ success: true, message: "Entegrasyon bağlantısı kesildi" });
    } catch (error: any) {
        console.error("Error deleting integration:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
