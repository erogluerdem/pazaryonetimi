/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configurations for different endpoints
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 600,
    message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 30, // 30 attempts per 15 minutes
    message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1200, // 1200 requests per minute (~20 req/sec)
    message: 'API istek limiti aşıldı.',
  },
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 30,
    message: 'Dışa aktarma limiti aşıldı. 1 saat sonra tekrar deneyin.',
  },
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'AI istek limiti aşıldı.',
  },
  webhook: {
    windowMs: 1000, // 1 second
    maxRequests: 300,
    message: 'Webhook istek limiti aşıldı.',
  },
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ip = this.getClientIp(req);
    const path = req.path;
    const tenantId = (req.headers['x-tenant-id'] as string) || 'default';
    const config = this.getConfigForPath(path);
    const key = `${ip}:${tenantId}:${this.getPathGroup(path)}`;

    const now = Date.now();
    let entry = rateLimitStore.get(key);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanupExpiredEntries();
    }

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, config.maxRequests - entry.count),
    );
    res.setHeader('X-RateLimit-Reset', entry.resetTime);

    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: config.message,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  private getPathGroup(path: string): string {
    if (path.startsWith('/auth')) return 'auth';
    if (path.startsWith('/api/ai')) return 'ai';
    if (path.includes('/export')) return 'export';
    if (path.startsWith('/webhooks')) return 'webhook';
    if (path.startsWith('/api')) return 'api';
    return 'default';
  }

  private getConfigForPath(path: string): RateLimitConfig {
    const group = this.getPathGroup(path);
    return rateLimitConfigs[group] || rateLimitConfigs.default;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Rate limit decorator for specific routes
import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

// Rate limit guard for decorator-based limiting
import {
  Injectable as InjectableGuard,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@InjectableGuard()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!options) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const ip = this.getClientIp(request);
    const key = `${ip}:${context.getClass().name}:${context.getHandler().name}`;

    const config: RateLimitConfig = {
      windowMs: options.windowMs || 60000,
      maxRequests: options.maxRequests || 100,
      message: options.message || 'Rate limit exceeded',
    };

    const now = Date.now();
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + config.windowMs };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, config.maxRequests - entry.count),
    );
    response.setHeader('X-RateLimit-Reset', entry.resetTime);

    if (entry.count > config.maxRequests) {
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: config.message },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return (req as any).ip || 'unknown';
  }
}

// Service for programmatic rate limiting
@Injectable()
export class RateLimitService {
  checkLimit(
    identifier: string,
    config: RateLimitConfig,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    let entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + config.windowMs };
      rateLimitStore.set(identifier, entry);
    } else {
      entry.count++;
    }

    return {
      allowed: entry.count <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  resetLimit(identifier: string): void {
    rateLimitStore.delete(identifier);
  }

  getStats(): { totalKeys: number; memoryUsage: number } {
    return {
      totalKeys: rateLimitStore.size,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }
}
