import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
describe('Marketplace JWT tenant validation', () => {
  const user = { id: 'user', tenantId: 'tenant-a', email: 'test@example.com', type: 'USER' };
  const auth = { validateUser: jest.fn() };
  const strategy = new JwtStrategy(new ConfigService({ JWT_SECRET: 'test-secret' }), auth as any);
  it('accepts the current database tenant', async () => {
    auth.validateUser.mockResolvedValue(user);
    expect(await strategy.validate({ sub: 'user', tenantId: 'tenant-a' } as any)).toEqual(user);
  });
  it('rejects a signed token after the user changes tenant', async () => {
    auth.validateUser.mockResolvedValue(user);
    await expect(strategy.validate({ sub: 'user', tenantId: 'old-tenant' } as any)).rejects.toThrow();
  });
  it('rejects a user who no longer exists', async () => {
    auth.validateUser.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 'user', tenantId: 'tenant-a' } as any)).rejects.toThrow();
  });
});
