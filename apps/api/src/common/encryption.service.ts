import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { publicCredentialMetadata } from '../modules/marketplace/credential-metadata';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    const envKey = process.env.ENCRYPTION_KEY || '';
    if (!envKey && process.env.NODE_ENV === 'production') {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required in production',
      );
    }
    // Derive a proper 32-byte key from the provided key
    this.key = crypto
      .createHash('sha256')
      .update(envKey || 'dev-only-default-key')
      .digest();
  }

  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    // Format: iv:tag:ciphertext
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  sealExtra(value: unknown): Record<string, any> {
    const extra = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return { ...publicCredentialMetadata(extra), _encryptedCredentials: this.encrypt(JSON.stringify(extra)) };
  }

  openExtra(value: unknown): Record<string, any> {
    const extra = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    if (typeof extra._encryptedCredentials !== 'string') return { ...extra }; // Legacy records.
    const plaintext = this.decrypt(extra._encryptedCredentials);
    if (!plaintext) throw new Error('Entegrasyon kimlik bilgileri çözülemedi. Yeniden yetkilendirin.');
    const { _encryptedCredentials, ...metadata } = extra;
    return { ...JSON.parse(plaintext), ...metadata };
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    try {
      const parts = encryptedText.split(':');
      // Support legacy format (iv:ciphertext) from old AES-256-CBC
      if (parts.length === 2) {
        return this.decryptLegacy(encryptedText);
      }
      if (parts.length !== 3) return '';

      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '';
    }
  }

  /** Backward-compatible decryption for old AES-256-CBC format */
  private decryptLegacy(encryptedText: string): string {
    try {
      const legacyKey =
        process.env.ENCRYPTION_KEY || 'default-encryption-key-32chars!';
      const key = Buffer.from(legacyKey.padEnd(32).slice(0, 32));
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '';
    }
  }
}
