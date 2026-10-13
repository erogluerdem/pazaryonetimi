import { BadRequestException } from '@nestjs/common';
import { XMLParser, XMLValidator, XMLBuilder } from 'fast-xml-parser';

export interface ParsedXmlProduct {
  sku: string; title: string; barcode?: string; price: number; costPrice: number;
  stock: number; category: string; brand: string; description: string; images: string[];
}
export type XmlFieldMapping = Partial<Record<keyof ParsedXmlProduct, string>>;
const aliases: Record<keyof ParsedXmlProduct, string[]> = {
  sku: ['sku','urunkodu','stokkodu','stockcode','productcode','code','id'], title: ['urunadi','name','title','baslik','productname'],
  barcode: ['barkod','barcode','ean','gtin'], price: ['fiyat','price','satisfiyati','saleprice','fiyatozel','salesprice'],
  costPrice: ['alisfiyati','costprice','cost','maliyet'], stock: ['stok','stock','quantity','stokadedi','stockquantity'],
  category: ['kategori','category','categoryname','kategoriadi','producttype'], brand: ['marka','brand','brandname'],
  description: ['aciklama','description','detay'], images: ['resim','image','resim1','image_link','imagelink','picture','resimler','images','additional_image_link'],
};
const key = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_]/g,'');
export function xmlNumber(raw: string): number {
  let value = raw.trim().replace(/\s/g, '').replace(/[^\d,.+\-]/g, '');
  if (value.includes(',') && value.includes('.')) value = value.lastIndexOf(',') > value.lastIndexOf('.') ? value.replace(/\./g,'').replace(',','.') : value.replace(/,/g,'');
  else if (value.includes(',')) value = value.replace(',', '.');
  const result = Number(value);
  if (!value || !Number.isFinite(result) || result < 0) throw new BadRequestException('XML içinde geçersiz fiyat veya stok değeri var');
  return result;
}
function text(value: any): string { return value == null ? '' : typeof value === 'object' ? text(value['#text']) : String(value).trim(); }
function fields(row: any): Record<string, any> { return Object.fromEntries(Object.entries(row).map(([k,v]) => [key(k),v])); }
function value(row: any, field: keyof ParsedXmlProduct, mapping: XmlFieldMapping) {
  if (mapping[field]) return mapping[field]!.split('.').reduce((current, part) => current && typeof current === 'object' ? current[part] ?? fields(current)[key(part)] : undefined, row);
  const normalized = fields(row);
  return aliases[field].map(name => normalized[name]).find(v => v !== undefined);
}
function imageUrls(raw: any): string[] {
  if (Array.isArray(raw)) return raw.flatMap(imageUrls);
  if (raw && typeof raw === 'object') return Object.values(raw).flatMap(imageUrls);
  return text(raw).split(/[|;]/).filter(url => /^https?:\/\//i.test(url));
}
export function parseXmlProducts(xml: string, mapping: XmlFieldMapping = {}) {
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping) || Object.values(mapping).some(value => typeof value !== 'string')) throw new BadRequestException('XML alan eşlemesi geçersiz');
  if (typeof xml !== 'string' || !xml.trim()) throw new BadRequestException('XML içeriği boş');
  if (Buffer.byteLength(xml) > 10 * 1024 * 1024) throw new BadRequestException('XML dosyası 10 MB sınırını aşıyor');
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new BadRequestException('DTD ve ENTITY içeren XML desteklenmiyor');
  const valid = XMLValidator.validate(xml);
  if (valid !== true) throw new BadRequestException('XML biçimi geçersiz: ' + valid.err.msg);
  const tree = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', removeNSPrefix: true, parseTagValue: false, parseAttributeValue: false, trimValues: true }).parse(xml);
  const rows: any[] = [];
  function visit(node: any, depth = 0) {
    if (depth > 60) throw new BadRequestException('XML iç içe alan sınırını aşıyor');
    if (!node || typeof node !== 'object') return;
    for (const [name, value] of Object.entries(node)) {
      if (['urun','product','item','entry'].includes(key(name))) rows.push(...(Array.isArray(value) ? value : [value]));
      else if (Array.isArray(value)) value.forEach(v => visit(v, depth + 1));
      else visit(value, depth + 1);
    }
  }
  visit(tree);
  if (!rows.length) throw new BadRequestException('XML içinde Urun, product veya item kaydı bulunamadı');
  if (rows.length > 20_000) throw new BadRequestException('Tek aktarımda en fazla 20.000 ürün destekleniyor');
  const seen = new Set<string>();
  const products = rows.map((row, index): ParsedXmlProduct => {
    const sku = text(value(row,'sku',mapping)); const title = text(value(row,'title',mapping));
    if (!sku || !title) throw new BadRequestException(`${index + 1}. üründe SKU veya ürün adı eksik; alan eşlemesini kontrol edin`);
    if (seen.has(sku)) throw new BadRequestException('XML içinde tekrar eden SKU: ' + sku);
    seen.add(sku);
    const price = xmlNumber(text(value(row,'price',mapping)));
    const cost = text(value(row,'costPrice',mapping)); const stock = text(value(row,'stock',mapping));
    const stockValue = stock ? xmlNumber(stock) : 0;
    if (!Number.isInteger(stockValue)) throw new BadRequestException('Stok değeri tam sayı olmalıdır: ' + sku);
    const normalized = fields(row);
    const images = mapping.images ? imageUrls(value(row,'images',mapping)) : Object.entries(normalized).filter(([name]) => aliases.images.includes(name) || /^resim\d+$/.test(name)).flatMap(([,v]) => imageUrls(v));
    return { sku, title, barcode: text(value(row,'barcode',mapping)) || undefined, price, costPrice: cost ? xmlNumber(cost) : price, stock: stockValue, category: text(value(row,'category',mapping)), brand: text(value(row,'brand',mapping)), description: text(value(row,'description',mapping)), images: [...new Set(images)] };
  });
  return { products, fields: Object.keys(rows[0]), total: products.length };
}
export function buildProductXml(products: any[]): string {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLBuilder({ format: true }).build({ Urunler: { Urun: products.map(p => ({ UrunKodu: p.sku, UrunAdi: p.title, Barkod: p.barcode || '', Fiyat: Number(p.price), AlisFiyati: Number(p.costPrice ?? p.price), Stok: p.stock, Kategori: p.category || '', Marka: p.brand || '', Aciklama: p.description || '', Resimler: { Resim: (p.images || []).map((image: any) => typeof image === 'string' ? image : image.url) } })) } });
}
