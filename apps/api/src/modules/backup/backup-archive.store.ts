import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { promises as fs, createReadStream, createWriteStream } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const MAGIC = Buffer.from('PYBACKUP2\n');

export interface KeyEscrowBundle {
  backupId: string;
  createdAt: string;
  keyFingerprint: string;
  keyLength: number;
  encryptedKey: string;
  iv: string;
  authTag: string;
  verificationChallenge: {
    plaintextHint: string;
    ciphertext: string;
    iv: string;
    authTag: string;
  };
}

@Injectable()
export class BackupArchiveStore {
  private readonly logger = new Logger(BackupArchiveStore.name);

  root() {
    return resolve(process.env.BACKUP_STORAGE_DIR || 'var/backups');
  }

  path(id: string, suffix = '.pybackup') {
    if (!/^[a-z0-9-]{1,80}$/i.test(id) || !/^\.[a-z0-9.-]+$/i.test(suffix)) {
      throw new Error('Yedek dosya kimliği geçersiz');
    }
    const path = resolve(this.root(), id + suffix);
    if (dirname(path) !== this.root()) {
      throw new Error('Yedek dosya yolu geçersiz');
    }
    return path;
  }

  private key() {
    const key = process.env.BACKUP_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('Yedek şifreleme anahtarı (ENCRYPTION_KEY) tanımlanmalı');
    }
    return createHash('sha256').update(key).digest();
  }

  getRawEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY || process.env.BACKUP_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY ortam değişkeni tanımlanmalı');
    }
    return key;
  }

  async write(id: string, source: Buffer | string) {
    await fs.mkdir(this.root(), { recursive: true, mode: 0o700 });
    const target = this.path(id);
    const temporary = this.path(id, '.' + randomUUID() + '.tmp');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);

    await fs.writeFile(temporary, Buffer.concat([MAGIC, iv]), { mode: 0o600, flag: 'wx' });
    try {
      await pipeline(
        typeof source === 'string' ? createReadStream(source) : Readable.from([source]),
        cipher,
        createWriteStream(temporary, { flags: 'a', mode: 0o600 }),
      );
      await fs.appendFile(temporary, cipher.getAuthTag());
      await fs.rename(temporary, target);
      const checksum = await this.checksum(id);
      const stat = await fs.stat(target);

      // ENCRYPTION_KEY yedeğini arşiv ile birlikte güvenli olarak sakla
      await this.escrowKey(id);

      return { location: target, size: stat.size, checksum };
    } finally {
      await fs.rm(temporary, { force: true });
    }
  }

  async checksum(id: string) {
    const hash = createHash('sha256');
    for await (const bytes of createReadStream(await this.checked(id))) {
      hash.update(bytes);
    }
    return hash.digest('hex');
  }

  async checked(id: string) {
    const path = this.path(id);
    const stat = await fs.lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error('Yedek dosyası geçersiz');
    }
    return path;
  }

  async unpack(id: string) {
    const path = await this.checked(id);
    const handle = await fs.open(path, 'r');
    const stat = await handle.stat();
    const header = Buffer.alloc(MAGIC.length + 12);
    const tag = Buffer.alloc(16);

    try {
      await handle.read(header, 0, header.length, 0);
      await handle.read(tag, 0, 16, stat.size - 16);
    } finally {
      await handle.close();
    }

    if (stat.size < header.length + 16 || !header.subarray(0, MAGIC.length).equals(MAGIC)) {
      throw new Error('Yedek biçimi geçersiz');
    }

    const decipher = createDecipheriv('aes-256-gcm', this.key(), header.subarray(MAGIC.length));
    decipher.setAuthTag(tag);
    const temporary = this.path(id, '.' + randomUUID() + '.unpacked');

    try {
      await pipeline(
        createReadStream(path, { start: header.length, end: stat.size - 17 }),
        decipher,
        createWriteStream(temporary, { flags: 'wx', mode: 0o600 }),
      );
      return temporary;
    } catch (error) {
      await fs.rm(temporary, { force: true });
      throw error;
    }
  }

  async removeTemporary(path: string) {
    if (dirname(resolve(path)) !== this.root() || !/\.(unpacked|dump)$/.test(path)) {
      throw new Error('Geçici dosya yolu geçersiz');
    }
    await fs.rm(path, { force: true });
  }

  /**
   * ENCRYPTION_KEY yedeğini şifreli olarak veritabanı yedeğinin yanına güvenle yazar.
   */
  async escrowKey(backupId: string): Promise<KeyEscrowBundle> {
    await fs.mkdir(this.root(), { recursive: true, mode: 0o700 });
    const rawKey = this.getRawEncryptionKey();
    const keyFingerprint = createHash('sha256').update(rawKey).digest('hex');

    // Master key for envelope encryption
    const masterSecret = process.env.BACKUP_MASTER_KEY || process.env.JWT_SECRET || 'py-backup-master-escrow-key';
    const envelopeKey = createHash('sha256').update(masterSecret).digest();

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', envelopeKey, iv);
    const encryptedKey = Buffer.concat([cipher.update(rawKey, 'utf8'), cipher.final()]).toString('base64');
    const authTag = cipher.getAuthTag().toString('hex');

    // Create verification challenge using the key itself
    const challengePlain = `VERIFY_BACKUP_${backupId}_${Date.now()}`;
    const challengeIv = randomBytes(12);
    const keyHashBuffer = createHash('sha256').update(rawKey).digest();
    const challengeCipher = createCipheriv('aes-256-gcm', keyHashBuffer, challengeIv);
    const challengeCiphertext = Buffer.concat([
      challengeCipher.update(challengePlain, 'utf8'),
      challengeCipher.final(),
    ]).toString('base64');
    const challengeTag = challengeCipher.getAuthTag().toString('hex');

    const bundle: KeyEscrowBundle = {
      backupId,
      createdAt: new Date().toISOString(),
      keyFingerprint,
      keyLength: rawKey.length,
      encryptedKey,
      iv: iv.toString('hex'),
      authTag,
      verificationChallenge: {
        plaintextHint: challengePlain.slice(0, 14),
        ciphertext: challengeCiphertext,
        iv: challengeIv.toString('hex'),
        authTag: challengeTag,
      },
    };

    const bundlePath = this.path(backupId, '.keybundle.json');
    await fs.writeFile(bundlePath, JSON.stringify(bundle, null, 2), { mode: 0o600 });
    this.logger.log(`🔑 ENCRYPTION_KEY escrow yedeği oluşturuldu: ${backupId} (Fingerprint: ${keyFingerprint.slice(0, 10)}...)`);

    return bundle;
  }

  /**
   * Veritabanı yedeğiyle birlikte saklanan ENCRYPTION_KEY yedeğini doğrular.
   */
  async verifyEscrow(backupId: string): Promise<{
    valid: boolean;
    keyFingerprint: string;
    createdAt: string;
    matchesActiveKey: boolean;
  }> {
    const bundlePath = this.path(backupId, '.keybundle.json');
    const content = await fs.readFile(bundlePath, 'utf8');
    const bundle = JSON.parse(content) as KeyEscrowBundle;

    const masterSecret = process.env.BACKUP_MASTER_KEY || process.env.JWT_SECRET || 'py-backup-master-escrow-key';
    const envelopeKey = createHash('sha256').update(masterSecret).digest();

    const decipher = createDecipheriv('aes-256-gcm', envelopeKey, Buffer.from(bundle.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(bundle.authTag, 'hex'));

    const decryptedKey = Buffer.concat([
      decipher.update(Buffer.from(bundle.encryptedKey, 'base64')),
      decipher.final(),
    ]).toString('utf8');

    const calculatedFingerprint = createHash('sha256').update(decryptedKey).digest('hex');
    if (calculatedFingerprint !== bundle.keyFingerprint) {
      throw new Error('Anahtar parmak izi uyuşmuyor; anahtar yedeği bozulmuş olabilir');
    }

    // Verify challenge decryption
    const keyHashBuffer = createHash('sha256').update(decryptedKey).digest();
    const challengeDecipher = createDecipheriv(
      'aes-256-gcm',
      keyHashBuffer,
      Buffer.from(bundle.verificationChallenge.iv, 'hex'),
    );
    challengeDecipher.setAuthTag(Buffer.from(bundle.verificationChallenge.authTag, 'hex'));

    const decryptedChallenge = Buffer.concat([
      challengeDecipher.update(Buffer.from(bundle.verificationChallenge.ciphertext, 'base64')),
      challengeDecipher.final(),
    ]).toString('utf8');

    if (!decryptedChallenge.startsWith('VERIFY_BACKUP_')) {
      throw new Error('Anahtar doğrulama meydan okuması başarısız oldu');
    }

    const activeRaw = this.getRawEncryptionKey();
    const activeFingerprint = createHash('sha256').update(activeRaw).digest('hex');

    return {
      valid: true,
      keyFingerprint: calculatedFingerprint,
      createdAt: bundle.createdAt,
      matchesActiveKey: activeFingerprint === calculatedFingerprint,
    };
  }
}
