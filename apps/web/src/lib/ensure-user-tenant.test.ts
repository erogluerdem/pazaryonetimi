/** @jest-environment node */
import { ensureUserTenant } from './ensure-user-tenant';
import { prisma } from '@/lib/prisma';
jest.mock('server-only', () => ({}));
jest.mock('@/lib/prisma', () => ({ prisma: { $transaction: jest.fn() } }));
describe('OAuth tenant initialization', () => {
  let tx: any;
  beforeEach(() => {
    tx = { $queryRawUnsafe: jest.fn(), user: { findUnique: jest.fn(), update: jest.fn() }, tenant: { create: jest.fn().mockResolvedValue({ id: 'new-tenant' }) } };
    (prisma.$transaction as jest.Mock).mockImplementation((callback: any) => callback(tx));
  });
  it('does not create an orphan tenant before OAuth adapter user creation', async () => {
    tx.user.findUnique.mockResolvedValue(null);
    expect(await ensureUserTenant('not-created')).toBeUndefined();
    expect(tx.tenant.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });
  it('creates a separate tenant for a saved new user', async () => {
    tx.user.findUnique.mockResolvedValue({ tenantId: null });
    expect(await ensureUserTenant('new-user', 'Mağaza')).toBe('new-tenant');
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'new-user' }, data: { tenantId: 'new-tenant' } });
  });
  it('retains an existing tenant when the user signs in again', async () => {
    tx.user.findUnique.mockResolvedValue({ tenantId: 'existing' });
    expect(await ensureUserTenant('existing-user')).toBe('existing');
    expect(tx.tenant.create).not.toHaveBeenCalled();
  });
});
