import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EncryptionService } from '../../../common/encryption.service';
import { injectTenantId } from '../context/tenant-aware-prisma.helper';
import type { DecryptedCredentials } from '../interfaces/integration-context.interface';
import { resolveServiceType } from '../catalog/provider-service-type.map';
import { getProviderById } from '../catalog/provider-catalog';
import { IntegrationCategory } from '../enums/integration-category.enum';

/**
 * Tenant Credential Servisi — tüm adapter'lar için merkezi kimlik çözümleyici.
 * Integration ve ServiceCredential tablolarından AES-256 şifreli veriyi çözer.
 */
@Injectable()
export class TenantCredentialResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  /** Integration tablosundan tenant-scoped credential çözer */
  async resolveIntegrationCredentials(
    tenantId: string,
    integrationId: string,
  ): Promise<DecryptedCredentials> {
    const integration = await this.prisma.integration.findFirst({
      where: injectTenantId(tenantId, { id: integrationId, isActive: true }),
      select: { apiKey: true, apiSecret: true, apiExtra: true },
    });

    if (!integration) {
      throw new NotFoundException('Entegrasyon bulunamadı veya pasif');
    }

    return {
      apiKey: this.encryption.decrypt(integration.apiKey),
      apiSecret: this.encryption.decrypt(integration.apiSecret),
      extra: this.encryption.openExtra(integration.apiExtra),
    };
  }

  /** ServiceCredential tablosundan credential çözer */
  async resolveServiceCredentials(
    tenantId: string,
    serviceType: string,
    providerKey: string,
  ): Promise<DecryptedCredentials> {
    const row = await this.prisma.serviceCredential.findFirst({
      where: injectTenantId(tenantId, {
        serviceType: serviceType as never,
        isActive: true,
        apiExtra: { path: ['providerId'], equals: providerKey },
      } as never),
      select: { apiKey: true, apiSecret: true, apiExtra: true, apiUrl: true },
    });

    if (!row) {
      throw new NotFoundException(`${providerKey} kimlik bilgisi bulunamadı`);
    }

    const extra = this.encryption.openExtra(row.apiExtra);
    return {
      apiKey: row.apiKey ? this.encryption.decrypt(row.apiKey) : '',
      apiSecret: row.apiSecret ? this.encryption.decrypt(row.apiSecret) : '',
      extra: {
        ...extra,
        apiUrl: row.apiUrl ? this.encryption.decrypt(row.apiUrl) : undefined,
      },
    };
  }

  /** Provider ID ile ServiceCredential arar (serviceType bağımsız) */
  async resolveServiceCredentialByProvider(
    tenantId: string,
    providerId: string,
  ): Promise<DecryptedCredentials> {
    const row = await this.prisma.serviceCredential.findFirst({
      where: injectTenantId(tenantId, {
        isActive: true,
        apiExtra: { path: ['providerId'], equals: providerId },
      } as never),
      select: { apiKey: true, apiSecret: true, apiExtra: true, apiUrl: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!row) {
      throw new NotFoundException(`${providerId} kimlik bilgisi bulunamadı`);
    }

    const extra = this.encryption.openExtra(row.apiExtra);
    return {
      apiKey: row.apiKey ? this.encryption.decrypt(row.apiKey) : '',
      apiSecret: row.apiSecret ? this.encryption.decrypt(row.apiSecret) : '',
      extra: {
        ...extra,
        apiUrl: row.apiUrl ? this.encryption.decrypt(row.apiUrl) : undefined,
      },
    };
  }

  /**
   * Provider ID'ye göre credential çözer — Integration veya ServiceCredential.
   */
  async resolveByProvider(
    tenantId: string,
    providerId: string,
    integrationId?: string,
  ): Promise<DecryptedCredentials> {
    if (integrationId) return this.resolveIntegrationCredentials(tenantId, integrationId);

    const integration = await this.prisma.integration.findFirst({
      where: injectTenantId(tenantId, {
        isActive: true,
        apiExtra: { path: ['marketplaceId'], equals: providerId },
      } as never),
      select: { id: true },
    });

    if (integration) {
      return this.resolveIntegrationCredentials(tenantId, integration.id);
    }

    const catalog = getProviderById(providerId);
    const category = catalog?.category ?? IntegrationCategory.CARGO;
    const serviceType = resolveServiceType(providerId, category);

    try {
      return await this.resolveServiceCredentials(tenantId, serviceType, providerId);
    } catch {
      return this.resolveServiceCredentialByProvider(tenantId, providerId);
    }
  }
}
