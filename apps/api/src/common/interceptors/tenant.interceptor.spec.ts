import { TenantInterceptor } from './tenant.interceptor';
import { of } from 'rxjs';
describe('Authenticated tenant isolation', () => {
  const interceptor = new TenantInterceptor();
  const invoke = (request: any) => interceptor.intercept({ switchToHttp: () => ({ getRequest: () => request }) } as any, { handle: () => of(true) });
  it('rejects a header for another tenant', () => expect(() => invoke({ user: { tenantId: 'a' }, headers: { 'x-tenant-id': 'b' } })).toThrow());
  it('forces signed tenant in body and query', () => {
    const request = { user: { tenantId: 'a' }, headers: {}, body: { tenantId: 'b' }, query: { tenantId: 'b' } };
    invoke(request); expect(request.body.tenantId).toBe('a'); expect(request.query.tenantId).toBe('a');
  });
  it('persists tenant injection with the Express 5 query getter', () => {
    const prototype = { get query() { return { tenantId: 'victim', page: '1' }; } };
    const request = Object.assign(Object.create(prototype), { user: { tenantId: 'a' }, headers: {} });
    invoke(request); expect(request.query).toEqual({ tenantId: 'a', page: '1' });
    expect(request.query.tenantId).toBe('a');
  });
});
