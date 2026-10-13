import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';

interface TenantRequest extends Request {
  user?: { tenantId?: string };
}

/**
 * TenantInterceptor - Multi-tenant güvenlik katmanı
 *
 * JWT'den gelen kullanıcının tenantId'sini request'e enjekte eder.
 * Kullanıcının x-tenant-id header'ı göndermesi durumunda,
 * JWT'deki tenantId ile eşleşmesini zorunlu tutar.
 *
 * Bu sayede hiçbir kullanıcı başka bir tenant'ın verilerine erişemez.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;

    if (user?.tenantId) {
      const headerTenantId = request.headers['x-tenant-id'];
      const normalizedHeader = Array.isArray(headerTenantId)
        ? headerTenantId[0]
        : headerTenantId;

      // Eğer header'da farklı bir tenantId varsa, bunu reddet
      if (normalizedHeader && normalizedHeader !== user.tenantId) {
        throw new ForbiddenException(
          "Yetkisiz erişim: Bu tenant'a erişim izniniz yok.",
        );
      }

      // JWT'deki tenantId'yi her zaman enjekte et
      request.headers['x-tenant-id'] = user.tenantId;
      // Controllers accepting tenantId in query/body must use the authenticated tenant too.
      if (request.body && typeof request.body === 'object') request.body.tenantId = user.tenantId;
      Object.defineProperty(request, 'query', { value: { ...request.query, tenantId: user.tenantId }, configurable: true });
    }

    return next.handle();
  }
}
