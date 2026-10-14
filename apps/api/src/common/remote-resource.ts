import { BadRequestException } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { IncomingMessage } from 'node:http';

export function isPublicAddress(address: string): boolean {
  const ip = address.toLowerCase();
  if (ip.includes(':')) {
    if (ip.startsWith('::ffff:')) {
      const mapped = ip.slice(7);
      if (isIP(mapped) === 4) return isPublicAddress(mapped);
      return false;
    }
    // Global unicast only. Reject loopback, link-local, ULA, multicast and mapped addresses.
    return /^[23][0-9a-f]{3}:/.test(ip) && !ip.startsWith('2001:db8:');
  }
  if (isIP(ip) !== 4) return false;
  const [a, b] = ip.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)));
}

export async function validateRemoteUrl(raw: string): Promise<URL> {
  let url: URL;
  try { url = new URL(raw); } catch { throw new BadRequestException('Geçerli bir HTTP/HTTPS bağlantısı girin'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) throw new BadRequestException('Kaynak bağlantısı HTTP/HTTPS ve standart port kullanmalıdır');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some(row => !isPublicAddress(row.address))) throw new BadRequestException('Yerel veya özel ağ bağlantıları kullanılamaz');
  return url;
}

export async function downloadXml(raw: string, maxBytes = 10 * 1024 * 1024): Promise<string> {
  let next = raw;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const url = await validateRemoteUrl(next);
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await lookup(hostname, { all: true });
    if (!addresses.length || addresses.some(row => !isPublicAddress(row.address))) throw new BadRequestException('Yerel veya özel ağ bağlantıları kullanılamaz');
    // Pin the validated DNS answer to the actual socket, retaining TLS hostname validation.
    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
        agent: false, signal: AbortSignal.timeout(30_000), headers: { Accept: 'application/xml,text/xml,*/*', 'Accept-Encoding': 'identity' },
        lookup: ((_hostname: string, options: any, callback: any) => options.all ? callback(null, addresses) : callback(null, addresses[0].address, addresses[0].family)) as any,
      }, resolve);
      request.on('error', reject); request.end();
    });
    if ([301, 302, 303, 307, 308].includes(response.statusCode || 0)) {
      response.destroy();
      const location = response.headers.location;
      if (!location) throw new BadRequestException('XML yönlendirmesi geçersiz');
      next = new URL(location, url).toString(); continue;
    }
    if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) { response.destroy(); throw new BadRequestException('XML kaynağı okunamadı (HTTP ' + response.statusCode + ')'); }
    if (Number(response.headers['content-length'] || 0) > maxBytes) { response.destroy(); throw new BadRequestException('XML dosyası 10 MB sınırını aşıyor'); }
    const chunks: Buffer[] = []; let length = 0;
    try {
      for await (const chunk of response) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        length += bytes.length;
        if (length > maxBytes) throw new BadRequestException('XML dosyası 10 MB sınırını aşıyor');
        chunks.push(bytes);
      }
    } finally { response.destroy(); }
    const buffer = Buffer.concat(chunks);
    const declaration = buffer.subarray(0, 200).toString('ascii').match(/encoding=["']([^"']+)/i)?.[1];
    try { return new TextDecoder(buffer[0] === 0xff && buffer[1] === 0xfe ? 'utf-16le' : buffer[0] === 0xfe && buffer[1] === 0xff ? 'utf-16be' : declaration || 'utf-8', { fatal: true }).decode(buffer); } catch { throw new BadRequestException('XML karakter kodlaması okunamadı'); }
  }
  throw new BadRequestException('XML kaynağı çok fazla yönlendirme döndürdü');
}
