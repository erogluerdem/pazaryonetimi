import { Controller, Get, Post, Query, Res, Param, Req, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type { Response } from 'express';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { Public } from '../auth/public.decorator';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { AMAZON_MARKETPLACE_PROFILES } from '../marketplace/amazon-sp-api.config';
import { providerJson } from '../marketplace/provider-http';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly prisma: PrismaService, private readonly marketplaceService: MarketplaceService) {}
  private secret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new ServiceUnavailableException('OAuth için JWT_SECRET yapılandırılmalıdır');
    return secret;
  }
  private config() {
    const applicationId = process.env.AMAZON_SP_API_APPLICATION_ID;
    const clientId = process.env.AMAZON_CLIENT_ID;
    const clientSecret = process.env.AMAZON_CLIENT_SECRET;
    const redirectUri = process.env.AMAZON_REDIRECT_URI;
    const webUrl = process.env.WEB_URL || process.env.NEXTAUTH_URL || process.env.AUTH_URL;
    if (!applicationId || !clientId || !clientSecret || !redirectUri || !webUrl) throw new ServiceUnavailableException('Amazon uygulama ID, LWA bilgileri, kayıtlı callback URL ve WEB_URL yapılandırılmalıdır');
    new URL(redirectUri); new URL(webUrl);
    return { applicationId, clientId, clientSecret, redirectUri, webUrl };
  }
  @Post('init/:platform')
  async initiateOAuth(@Param('platform') platform: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Mağaza oturumu gerekli');
    const provider = platform === 'amazon' ? 'amazon-tr' : platform;
    if (!AMAZON_MARKETPLACE_PROFILES[provider]) throw new BadRequestException('Bu sağlayıcı için API bilgileriyle bağlantı kurun');
    const config = this.config();
    const nonce = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 10 * 60_000;
    const payload = Buffer.from(JSON.stringify({ tenantId, provider, nonce, expiresAt })).toString('base64url');
    const signature = createHmac('sha256', this.secret()).update(payload).digest('base64url');
    await this.prisma.activityLog.create({ data: { tenantId, resource: 'oauth_state', resourceId: nonce, action: 'oauth.amazon.pending', details: { provider, expiresAt } } });
    const domain = provider === 'amazon-us' ? 'sellercentral.amazon.com' : provider === 'amazon-tr' ? 'sellercentral.amazon.com.tr' : provider === 'amazon-uk' ? 'sellercentral.amazon.co.uk' : provider === 'amazon-fr' ? 'sellercentral.amazon.fr' : 'sellercentral.amazon.de';
    const params = new URLSearchParams({ application_id: config.applicationId, state: payload + '.' + signature, redirect_uri: config.redirectUri });
    return { authorizationUrl: 'https://' + domain + '/apps/authorize/consent?' + params.toString() };
  }
  private async consumeState(state: string) {
    if (!state || state.length > 2048) throw new BadRequestException('Yetkilendirme durumu geçersiz');
    const [payload, signature, rest] = state.split('.');
    if (!payload || !signature || rest) throw new BadRequestException('Yetkilendirme durumu geçersiz');
    const expected = createHmac('sha256', this.secret()).update(payload).digest();
    const supplied = Buffer.from(signature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new BadRequestException('Yetkilendirme imzası geçersiz');
    let parsed: { tenantId: string; provider: string; nonce: string; expiresAt: number };
    try { parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { throw new BadRequestException('Yetkilendirme durumu geçersiz'); }
    if (!parsed.tenantId || !AMAZON_MARKETPLACE_PROFILES[parsed.provider] || !Number.isFinite(parsed.expiresAt) || parsed.expiresAt < Date.now()) throw new BadRequestException('Yetkilendirme süresi doldu; tekrar başlatın');
    const consumed = await this.prisma.activityLog.deleteMany({ where: { tenantId: parsed.tenantId, resource: 'oauth_state', resourceId: parsed.nonce, action: 'oauth.amazon.pending', createdAt: { gte: new Date(Date.now() - 10 * 60_000) } } });
    if (consumed.count !== 1) throw new BadRequestException('Yetkilendirme daha önce kullanıldı; tekrar başlatın');
    return parsed;
  }
  @Public()
  @Get('amazon/callback')
  async amazonCallback(@Query('state') state: string, @Query('selling_partner_id') sellerId: string, @Query('spapi_oauth_code') code: string, @Query('error') error: string, @Res() res: Response) {
    let destination: URL;
    try { destination = new URL('/dashboard/settings/integrations', this.config().webUrl); } catch { return res.status(503).json({ message: 'Amazon OAuth sunucu yapılandırması eksik' }); }
    try {
      const verified = await this.consumeState(state);
      if (error || !sellerId || !code) throw new BadRequestException('Amazon yetkilendirmesi tamamlanmadı');
      const config = this.config();
      const token = await providerJson('https://api.amazon.com/auth/o2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri }) });
      if (!token.refresh_token) throw new BadRequestException('Amazon yenileme tokenı alınamadı');
      await this.marketplaceService.connectStore(verified.tenantId, '', { sellerId, refreshToken: token.refresh_token, clientId: config.clientId, clientSecret: config.clientSecret }, verified.provider);
      destination.searchParams.set('success', 'amazon_connected');
    } catch (failure) {
      destination.searchParams.set('error', 'amazon_auth_failed');
      destination.searchParams.set('message', failure instanceof Error ? failure.message : 'Amazon bağlantısı kurulamadı');
    }
    return res.redirect(destination.toString());
  }
}
