import { isPublicAddress, validateRemoteUrl, downloadXml } from './remote-resource';
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { Readable } from 'node:stream';
jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));
jest.mock('node:https', () => ({ request: jest.fn() }));
describe('XML URL safety', () => {
  it.each(['127.0.0.1','10.0.0.1','172.16.0.1','192.168.0.1','169.254.169.254','100.64.0.1','0.0.0.0','::1','fe80::1','fc00::1','::ffff:127.0.0.1','2001:db8::1'])('rejects private address %s', ip => expect(isPublicAddress(ip)).toBe(false));
  it.each(['1.1.1.1','8.8.8.8','2606:4700:4700::1111'])('accepts public address %s', ip => expect(isPublicAddress(ip)).toBe(true));
  it.each(['file:///etc/passwd','http://user:pass@example.com/feed','http://127.0.0.1/feed','https://example.com:8080/feed'])('rejects unsafe URL %s', async url => await expect(validateRemoteUrl(url)).rejects.toThrow());
  it('rejects a hostname with any private DNS answer', async () => {
    (lookup as unknown as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }]);
    await expect(validateRemoteUrl('https://feed.example.com')).rejects.toThrow();
  });
  it('pins validated DNS to the actual request and decodes XML bytes', async () => {
    (lookup as unknown as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
    (request as unknown as jest.Mock).mockImplementation((_url, options, callback) => {
      const pinned = jest.fn(); options.lookup('feed.example.com', {}, pinned);
      expect(pinned).toHaveBeenCalledWith(null, '8.8.8.8', 4);
      const response = Readable.from([Buffer.from('<root>Çanta</root>')]);
      Object.assign(response, { statusCode: 200, headers: {} }); callback(response);
      return { on: jest.fn(), end: jest.fn() };
    });
    expect(await downloadXml('https://feed.example.com')).toBe('<root>Çanta</root>');
  });
  it('rejects a redirect to a private network before sending the second request', async () => {
    (lookup as unknown as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
    (request as unknown as jest.Mock).mockClear().mockImplementation((_url, _options, callback) => {
      const response = Readable.from([]); Object.assign(response, { statusCode: 302, headers: { location: 'http://169.254.169.254/latest/meta-data/' } }); callback(response);
      return { on: jest.fn(), end: jest.fn() };
    });
    await expect(downloadXml('https://feed.example.com')).rejects.toThrow(/özel ağ/);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('decodes UTF16 XML feeds without losing Turkish characters', async () => {
    (lookup as unknown as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
    const xml = '<?xml version="1.0" encoding="utf-16"?><root>Çanta</root>';
    (request as unknown as jest.Mock).mockImplementation((_url, _options, callback) => {
      const response = Readable.from([Buffer.concat([Buffer.from([0xff,0xfe]), Buffer.from(xml, 'utf16le')])]);
      Object.assign(response, { statusCode: 200, headers: {} }); callback(response);
      return { on: jest.fn(), end: jest.fn() };
    });
    expect(await downloadXml('https://feed.example.com')).toBe(xml);
  });
  it('rejects oversized XML while streaming', async () => {
    (lookup as unknown as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
    (request as unknown as jest.Mock).mockImplementation((_url, _options, callback) => {
      const response = Readable.from([Buffer.alloc(20)]); Object.assign(response, { statusCode: 200, headers: {} }); callback(response);
      return { on: jest.fn(), end: jest.fn() };
    });
    await expect(downloadXml('https://feed.example.com', 10)).rejects.toThrow(/sınır/);
  });
});
