'use client';
import { useEffect, useState } from 'react';
import { FileCode2, Upload, Download, RefreshCw, Trash2, Plus, Loader2 } from 'lucide-react';

type Feed = { id: string; name: string; url: string; status: string; productCount: number; lastSync?: string; markup: number; fixedFee: number; autoSync: boolean; syncInterval: number };
type Product = { id?: string; sku: string; title: string; price: number | string; stock: number };
type Preview = { total: number; fields: string[]; products: Product[] };
const mappingFields = [{ key: 'sku', label: 'SKU / ürün kodu' }, { key: 'title', label: 'Ürün adı' }, { key: 'price', label: 'Satış fiyatı' }, { key: 'costPrice', label: 'Alış fiyatı' }, { key: 'stock', label: 'Stok' }, { key: 'barcode', label: 'Barkod' }];
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch('/api/xml-feeds' + path, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(', ') : result.message || result.error || 'İşlem tamamlanamadı');
  return result;
}
export default function XmlImportWorkspace() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [xml, setXml] = useState('');
  const [filename, setFilename] = useState('');
  const [markup, setMarkup] = useState('0');
  const [fixedFee, setFixedFee] = useState('0');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [source, setSource] = useState<'url' | 'file'>('url');
  const [autoSync, setAutoSync] = useState(true);
  const [interval, setInterval] = useState('240');
  const inputClass = 'w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground';
  async function refresh() {
    const [sources, products] = await Promise.all([request<Feed[]>(''), request<Product[]>('/products')]);
    setFeeds(sources); setCatalog(products);
  }
  useEffect(() => { refresh().catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  async function run(id: string, action: () => Promise<void>) {
    setBusy(id); setError(''); setMessage('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'İşlem tamamlanamadı'); } finally { setBusy(''); }
  }
  function payload() {
    return { ...(source === 'file' ? { xml } : { url }), mapping: Object.fromEntries(Object.entries(mapping).filter(([,v]) => v.trim())), markupPercent: Number(markup), fixedFee: Number(fixedFee) };
  }
  async function readFile(file?: File) {
    if (!file) return;
    setError(''); setPreview(null);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('XML dosyası en fazla 10 MB olabilir');
      const buffer = await file.arrayBuffer();
      const declaration = new TextDecoder('ascii').decode(buffer.slice(0,200)).match(/encoding=["']([^"']+)/i)?.[1];
      setXml(new TextDecoder(declaration || 'utf-8', { fatal: true }).decode(buffer)); setFilename(file.name);
    } catch (e) { setXml(''); setFilename(''); setError(e instanceof Error ? e.message : 'Dosya okunamadı'); }
  }
  async function exportProducts() {
    const result = await request<{ xml: string; filename: string; productCount: number }>('/export', 'POST', { productIds: selected });
    const objectUrl = URL.createObjectURL(new Blob([result.xml], { type: 'application/xml;charset=utf-8' }));
    const link = document.createElement('a'); link.href = objectUrl; link.download = result.filename;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setMessage(`${result.productCount} ürünün XML dosyası hazırlandı.`);
  }
  return <div className="mx-auto max-w-7xl space-y-8 pb-16">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="flex items-center gap-3 text-2xl font-bold"><FileCode2 className="text-primary" /> XML Aktarım Merkezi</h1><p className="mt-2 text-sm text-slate-500">Tedarikçi bağlantısından veya XML dosyasından ürünleri kataloğunuza aktarın.</p></div>
      <button disabled={!!busy || loading} onClick={() => void run('refresh', refresh)} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 disabled:opacity-50"><RefreshCw size={16} /> Yenile</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600">{error}</div>}
    {message && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-600">{message}</div>}
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-bold">XML kaynağı</h2>
      <div className="my-4 flex gap-3">{(['url','file'] as const).map(mode => <button key={mode} onClick={() => { setSource(mode); setPreview(null); }} aria-pressed={source === mode} className={`rounded-xl px-4 py-2 text-sm ${source === mode ? 'bg-primary text-white' : 'border border-border'}`}>{mode === 'url' ? 'XML bağlantısı' : 'XML dosyası yükle'}</button>)}</div>
      {source === 'url' ? <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm">Tedarikçi adı<input aria-label="Tedarikçi adı" value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Tedarikçi adı" /></label><label className="space-y-2 text-sm">XML bağlantısı<input aria-label="XML bağlantısı" type="url" value={url} onChange={e => { setUrl(e.target.value); setPreview(null); }} className={inputClass} placeholder="https://tedarikci.com/urunler.xml" /></label></div> : <label className="block rounded-xl border border-dashed border-border p-6 text-sm"><span className="mb-3 flex items-center gap-2"><Upload size={18} /> {filename || 'XML dosyası seçin — en fazla 10 MB'}</span><input aria-label="XML dosyası" type="file" accept=".xml,text/xml,application/xml" onChange={e => void readFile(e.target.files?.[0])} /></label>}
      <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm">Alış fiyatına eklenecek yüzde<input aria-label="Fiyat artış yüzdesi" type="number" min="0" max="1000" value={markup} onChange={e => setMarkup(e.target.value)} className={inputClass} /></label><label className="space-y-2 text-sm">Sabit fiyat ilavesi (TL)<input aria-label="Sabit fiyat ilavesi" type="number" min="0" step="0.01" value={fixedFee} onChange={e => setFixedFee(e.target.value)} className={inputClass} /></label></div>
      <p className="mt-2 text-xs text-slate-500">Yüzde ve sabit ilave sıfırsa XML’deki satış fiyatı kullanılır. Kural uygulanırsa alış fiyatı esas alınır.</p>
      <details className="mt-5"><summary className="cursor-pointer text-sm font-medium">Özel XML alanlarını eşleştir</summary><p className="my-3 text-xs text-slate-500">Standart alanlar otomatik tanınır. Farklı alanlar için XML etiket adını yazın; örneğin ProductCode veya fiyat.satis.</p><div className="grid gap-3 md:grid-cols-3">{mappingFields.map(field => <label key={field.key} className="space-y-1 text-xs">{field.label}<input value={mapping[field.key] || ''} onChange={e => { setMapping({ ...mapping, [field.key]: e.target.value }); setPreview(null); }} className={inputClass} placeholder="Otomatik" /></label>)}</div></details>
      {source === 'url' && <div className="mt-5 flex flex-wrap items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} /> Otomatik senkronizasyon</label><label className="flex items-center gap-2">Aralık (dakika)<input type="number" min="15" value={interval} onChange={e => setInterval(e.target.value)} className="w-24 rounded-lg border border-border bg-background p-2" /></label></div>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button disabled={!!busy || !(source === 'url' ? url.trim() : xml)} onClick={() => void run('preview', async () => setPreview(await request<Preview>('/preview','POST',payload())))} className="rounded-xl border border-border px-5 py-3 text-sm font-medium disabled:opacity-50">{busy === 'preview' ? 'Okunuyor…' : 'Önizle'}</button>
        <button disabled={!!busy || !preview} onClick={() => void run('import', async () => { const result = await request<{ message: string }>('/import','POST',payload()); setMessage(result.message); await refresh(); })} className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{busy === 'import' ? 'Aktarılıyor…' : 'Kataloğa aktar'}</button>
        {source === 'url' && <button disabled={!!busy || !name.trim() || !url.trim()} onClick={() => void run('save', async () => { await request('','POST',{ name, url, mapping: payload().mapping, markupPercent: Number(markup), fixedFee: Number(fixedFee), autoSync, syncInterval: Number(interval) }); setMessage('XML kaynağı kaydedildi. Senkronizasyon düğmesiyle aktarımı başlatabilirsiniz.'); await refresh(); })} className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm disabled:opacity-50"><Plus size={16} /> Kaynağı kaydet</button>}
      </div>
    </section>
    {preview && <section><h2 className="mb-3 text-lg font-bold">Önizleme — {preview.total} ürün</h2><p className="mb-3 text-xs text-slate-500">İlk {preview.products.length} ürün gösteriliyor. Aktarım tüm ürünleri işler; aynı SKU mevcut ürünü günceller.</p><ProductTable products={preview.products} /></section>}
    <section><h2 className="mb-4 text-lg font-bold">Kayıtlı tedarikçi kaynakları</h2>{loading ? <Loader2 className="animate-spin" /> : !feeds.length ? <p className="text-sm text-slate-500">Henüz kaynak eklenmedi.</p> : <div className="divide-y divide-border">{feeds.map(feed => <div key={feed.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="font-medium">{feed.name}</p><p className="max-w-xl truncate text-xs text-slate-500">{feed.url}</p><p className="mt-1 text-xs text-slate-500">{feed.productCount} ürün · {feed.status === 'parsing' ? 'Aktarılıyor' : feed.status === 'error' ? 'Son aktarım başarısız' : 'Aktif'} · {feed.lastSync ? new Date(feed.lastSync).toLocaleString('tr-TR') : 'Henüz senkronize edilmedi'}{feed.autoSync ? ` · Her ${feed.syncInterval} dakikada bir` : ''}</p></div><div className="flex gap-2"><button disabled={!!busy || feed.status === 'parsing'} onClick={() => void run(feed.id, async () => { const result = await request<{ message: string }>('/'+encodeURIComponent(feed.id)+'/sync','POST',{}); setMessage(result.message); await refresh(); })} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm disabled:opacity-50"><RefreshCw size={16} className={busy === feed.id ? 'animate-spin' : ''} /> Senkronize et</button><button aria-label={feed.name+' kaynağını sil'} disabled={!!busy || feed.status === 'parsing'} onClick={() => { if (window.confirm('XML kaynağı silinsin mi? Katalog ürünleri korunur.')) void run('delete', async () => { await request('/'+encodeURIComponent(feed.id),'DELETE'); await refresh(); }); }} className="rounded-xl border border-border p-3 text-red-500 disabled:opacity-50"><Trash2 size={16} /></button></div></div>)}</div>}</section>
    <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Katalogdan XML dışa aktar</h2><p className="mt-1 text-xs text-slate-500">Son 2.000 ürün listelenir. Seçim yapmazsanız tüm katalog indirilir (en fazla 20.000 ürün). XML dosyasını destekleyen satış kanalınıza yükleyebilirsiniz.</p></div><button disabled={!!busy || !catalog.length} onClick={() => void run('export',exportProducts)} className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm disabled:opacity-50"><Download size={16} /> {selected.length ? `${selected.length} ürünü indir` : 'Tümünü XML indir'}</button></div><ProductTable products={catalog} selected={selected} onSelect={id => setSelected(selected.includes(id) ? selected.filter(p => p !== id) : [...selected,id])} /></section>
  </div>;
}
function ProductTable({ products, selected, onSelect }: { products: Product[]; selected?: string[]; onSelect?: (id: string) => void }) {
  return <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-surface"><tr>{onSelect && <th className="p-3">Seç</th>}<th className="p-3">SKU</th><th className="p-3">Ürün</th><th className="p-3">Fiyat (TL)</th><th className="p-3">Stok</th></tr></thead><tbody>{products.map((product,index) => <tr key={product.id || product.sku || index} className="border-t border-border">{onSelect && <td className="p-3"><input aria-label={product.sku+' ürününü seç'} type="checkbox" checked={selected?.includes(product.id!)} onChange={() => onSelect(product.id!)} /></td>}<td className="p-3">{product.sku}</td><td className="p-3">{product.title}</td><td className="p-3">{Number(product.price).toLocaleString('tr-TR',{ minimumFractionDigits: 2 })}</td><td className="p-3">{product.stock}</td></tr>)}</tbody></table></div>;
}
