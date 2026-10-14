import { EncryptionService } from './encryption.service';
import { publicCredentialMetadata } from '../modules/marketplace/credential-metadata';
describe('Integration credential storage', () => {
  const encryption = new EncryptionService();
  it('encrypts auxiliary tokens and retains searchable public account metadata', () => {
    const sealed = encryption.sealExtra({ marketplaceId: 'amazon-tr', sellerId: 'SELLER', refreshToken: 'private-refresh', clientSecret: 'private-client' });
    expect(JSON.stringify(sealed)).not.toContain('private-');
    expect(sealed.marketplaceId).toBe('amazon-tr');
    expect(encryption.openExtra(sealed).refreshToken).toBe('private-refresh');
    expect(publicCredentialMetadata(sealed)).toEqual({ marketplaceId: 'amazon-tr', sellerId: 'SELLER' });
  });
  it('reads legacy records for reconnect compatibility', () => expect(encryption.openExtra({ supplierId: '123' })).toEqual({ supplierId: '123' }));
  it('rejects tampered encrypted data', () => expect(() => encryption.openExtra({ _encryptedCredentials: 'invalid' })).toThrow());
});
