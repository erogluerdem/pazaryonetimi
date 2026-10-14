import { buildProductXml, parseXmlProducts, xmlNumber } from './xml-product-parser';

describe('XML product transfer', () => {
  const product = '<Ürün><ÜrünKodu>00123</ÜrünKodu><ÜrünAdı><![CDATA[Çanta & askı]]></ÜrünAdı><Fiyat>1.234,56</Fiyat><Stok>0</Stok><Resimler><Resim>https://example.com/a.jpg</Resim><Resim>https://example.com/b.jpg</Resim></Resimler></Ürün>';
  it('reads Turkish fields, CDATA, leading zeros, zero stock and multiple images', () => {
    expect(parseXmlProducts('<Ürünler>'+product+'</Ürünler>').products[0]).toMatchObject({ sku: '00123', title: 'Çanta & askı', price: 1234.56, stock: 0, images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] });
  });
  it('reads namespaced Google feed fields', () => {
    const result = parseXmlProducts('<rss xmlns:g="http://base.google.com/ns/1.0"><channel><item><g:id>01</g:id><g:title>Ürün</g:title><g:price>19.90 TRY</g:price><g:gtin>00099</g:gtin></item></channel></rss>');
    expect(result.products[0]).toMatchObject({ sku: '01', price: 19.9, barcode: '00099' });
  });
  it('supports custom dotted field mappings', () => {
    const result = parseXmlProducts('<root><item><kod>A</kod><ad>B</ad><tutar><satis>10</satis></tutar></item></root>', { sku: 'kod', title: 'ad', price: 'tutar.satis' });
    expect(result.products[0]).toMatchObject({ sku: 'A', title: 'B', price: 10 });
  });
  it.each(['', '<root>', '<root/>', '<!DOCTYPE x [<!ENTITY a "b">]><root/>'])('rejects empty, malformed, nonproduct and entity XML: %s', xml => expect(() => parseXmlProducts(xml)).toThrow());
  it('rejects duplicate SKUs before any persistence', () => expect(() => parseXmlProducts('<root>'+product+product+'</root>')).toThrow(/SKU/));
  it('requires a valid price instead of silently importing zero', () => expect(() => parseXmlProducts('<root><item><id>A</id><title>B</title></item></root>')).toThrow());
  it('requires integer stock', () => expect(() => parseXmlProducts('<root><item><id>A</id><title>B</title><price>10</price><stock>1.2</stock></item></root>')).toThrow(/tam sayı/));
  it.each([['1.234,56',1234.56],['1,234.56',1234.56],['0',0],['10,50',10.5]])('reads numeric format %s', (raw, result) => expect(xmlNumber(raw as string)).toBe(result));
  it.each(['-1','NaN',''])('rejects invalid numeric value %s', raw => expect(() => xmlNumber(raw)).toThrow());
  it('round trips exported special characters, UTF8, prices and images', () => {
    const source = parseXmlProducts('<Ürünler>'+product+'</Ürünler>').products;
    expect(parseXmlProducts(buildProductXml(source)).products).toEqual(source);
  });
});
