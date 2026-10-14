import 'server-only';
import { prisma } from '@/lib/prisma';
// OAuth signIn can run before the adapter has created a new user.
export async function ensureUserTenant(userId: string, name?: string | null): Promise<string | undefined> {
  return prisma.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', 'auth-user-tenant:' + userId);
    const current = await tx.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    if (!current) return undefined;
    if (current.tenantId) return current.tenantId;
    const tenant = await tx.tenant.create({ data: { name: name || 'Mağazam', plan: 'FREE' } });
    await tx.user.update({ where: { id: userId }, data: { tenantId: tenant.id } });
    return tenant.id;
  });
}
