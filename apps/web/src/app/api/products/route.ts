export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        let tenantId = (session?.user as any)?.tenantId as string;

        if (!tenantId && session?.user?.id) {
            const dbUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { tenantId: true }
            });
            if (dbUser?.tenantId) {
                tenantId = dbUser.tenantId;
            }
        }

        if (!tenantId) {
            return NextResponse.json({ error: 'Kullanıcı oturumu gerekli' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('q') || '';
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam) : 50;

        const products = await prisma.product.findMany({
            where: {
                tenantId,
                OR: [
                    { title: { contains: search } },
                    { sku: { contains: search } },
                    { barcode: { contains: search } }
                ]
            },
            take: limit,
            orderBy: { updatedAt: 'desc' }
        });

        // Map Prisma DB structure to expected Frontend structure
        // Current UI components expect: id, name, sku, stock, price, status, marketplace
        const mappedProducts = products.map(p => ({
            id: p.id,
            name: p.title,
            sku: p.sku,
            barcode: p.barcode,
            stock: p.stock,
            price: Number(p.price),
            status: p.status, // active, draft, paused
            category: p.category,
            brand: p.brand,
            createdAt: p.createdAt,
            marketplace: "System" // We will map marketplace integrations in a future sprint, currently it's central DB.
        }));

        return NextResponse.json(mappedProducts);

    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
