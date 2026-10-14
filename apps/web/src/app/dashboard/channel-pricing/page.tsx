"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Tags, Search, CheckCircle, RefreshCw,
    TrendingUp, TrendingDown, Minus, Edit3, Save, X,
    Filter, Zap, BarChart3, Loader2, Package
} from 'lucide-react';
import { useProducts, Product } from '@/lib/hooks';
import { apiClient } from '@/lib/api-client';

const marketplaces = [
    { id: 'TRENDYOL', name: 'Trendyol', textColor: 'text-orange-500' },
    { id: 'HEPSIBURADA', name: 'Hepsiburada', textColor: 'text-red-500' },
    { id: 'AMAZON', name: 'Amazon', textColor: 'text-yellow-500' },
    { id: 'N11', name: 'N11', textColor: 'text-purple-500' },
];

export default function ChannelPricingPage() {
    const { data, loading, refetch } = useProducts();
    const rawList: any[] = Array.isArray(data)
        ? data
        : (Array.isArray((data as any)?.data)
            ? (data as any).data
            : (Array.isArray((data as any)?.products) ? (data as any).products : []));

    const rawProducts: Product[] = rawList.map((p: any) => ({
        ...p,
        name: p.name || p.title || 'İsimsiz Ürün',
        price: Number(p.price) || 0,
    }));

    // Local prices overrides map: productId -> { CHANNEL: price }
    const [priceOverrides, setPriceOverrides] = useState<Record<string, Record<string, number>>>({});
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [editingCell, setEditingCell] = useState<{ productId: string; channel: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkType, setBulkType] = useState<'percent' | 'fixed'>('percent');
    const [bulkValue, setBulkValue] = useState('');
    const [bulkChannel, setBulkChannel] = useState('TRENDYOL');
    const [bulkDirection, setBulkDirection] = useState<'increase' | 'decrease'>('increase');
    const [saving, setSaving] = useState<string | null>(null);

    const products = rawProducts.filter(p =>
        (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(search.toLowerCase())
    );

    const getChannelPrice = (product: Product, channel: string): number => {
        return priceOverrides[product.id]?.[channel] ?? product.price ?? 0;
    };

    const toggle = (id: string) =>
        setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const startEdit = (productId: string, channel: string, value: number) => {
        setEditingCell({ productId, channel });
        setEditValue(String(value));
    };

    const saveEdit = async (productId: string, channel: string) => {
        const newPrice = parseFloat(editValue);
        if (!isNaN(newPrice) && newPrice > 0) {
            setSaving(productId + channel);
            setPriceOverrides(prev => ({
                ...prev,
                [productId]: { ...(prev[productId] || {}), [channel]: newPrice }
            }));
            try {
                await apiClient.updateProduct(productId, { [`price_${channel.toLowerCase()}`]: newPrice });
            } catch { /* Price saved locally at minimum */ }
            setSaving(null);
        }
        setEditingCell(null);
    };

    const applyBulkUpdate = () => {
        const val = parseFloat(bulkValue);
        if (isNaN(val)) return;
        const targetIds = selectedProducts.length > 0 ? selectedProducts : products.map((p: Product) => p.id);
        const newOverrides = { ...priceOverrides };
        for (const pid of targetIds) {
            const product = rawProducts.find(p => p.id === pid);
            if (!product) continue;
            const current = getChannelPrice(product, bulkChannel);
            let newPrice = current;
            if (bulkType === 'percent') {
                newPrice = bulkDirection === 'increase' ? current * (1 + val / 100) : current * (1 - val / 100);
            } else {
                newPrice = bulkDirection === 'increase' ? current + val : current - val;
            }
            newOverrides[pid] = { ...(newOverrides[pid] || {}), [bulkChannel]: Math.max(0, Math.round(newPrice)) };
        }
        setPriceOverrides(newOverrides);
        setShowBulkModal(false);
        setBulkValue('');
    };

    const getPriceDiff = (base: number, channel: number) => {
        if (base === 0) return { diff: 0, higher: false, same: true };
        const diff = ((channel - base) / base) * 100;
        return { diff: Math.round(diff * 10) / 10, higher: channel > base, same: channel === base };
    };

    // Count products with differing channel prices
    const differentPricedCount = rawProducts.filter(p =>
        marketplaces.some(mp => (priceOverrides[p.id]?.[mp.id] ?? p.price) !== p.price)
    ).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <Tags className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Kanal Bazlı Fiyatlar</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-14">Her pazaryeri için özel fiyat belirleyin, rekabeti yönetin</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => refetch()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-bold text-foreground hover:bg-surface/80 transition-all">
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Yenile
                    </button>
                    <button onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-bold text-foreground hover:bg-surface/80 transition-all">
                        <Zap size={15} /> Toplu Güncelle
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Toplam Ürün', value: rawProducts.length.toString(), icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Farklı Fiyatlı', value: differentPricedCount.toString(), icon: Tags, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Aktif Kanal', value: marketplaces.length.toString(), icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Seçili', value: selectedProducts.length.toString(), icon: Filter, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                ].map(s => (
                    <div key={s.label} className="bg-surface rounded-2xl border border-border p-5">
                        <div className={`p-2.5 rounded-xl ${s.bg} w-fit mb-3`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                        <div className="text-2xl font-black text-foreground">{s.value}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ürün ara..."
                    className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder-slate-600 focus:border-emerald-500 outline-none transition-colors" />
            </div>

            {/* Pricing Matrix Table */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-3 px-5 py-4 bg-background/50 border-b border-border">
                    <div className="col-span-1">
                        <input type="checkbox"
                            checked={selectedProducts.length === products.length && products.length > 0}
                            onChange={e => setSelectedProducts(e.target.checked ? products.map((p: Product) => p.id) : [])}
                            className="rounded" />
                    </div>
                    <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Ürün</div>
                    <div className="col-span-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">Taban</div>
                    {marketplaces.map(mp => (
                        <div key={mp.id} className="col-span-1 text-center">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${mp.textColor}`}>{mp.name}</span>
                        </div>
                    ))}
                    <div className="col-span-1 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Stok</div>
                </div>

                {loading && rawProducts.length === 0 && (
                    <div className="py-20 flex items-center justify-center gap-3 text-slate-500">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm font-medium">Ürünler yükleniyor...</span>
                    </div>
                )}

                {!loading && products.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                        <Package size={40} className="text-slate-300" />
                        <div className="text-center">
                            <p className="font-bold text-foreground">Ürün bulunamadı</p>
                            <p className="text-sm mt-1">Fiyat matrisi ürünler eklendikçe dolar.</p>
                        </div>
                    </div>
                )}

                {products.map((product, idx) => (
                    <motion.div key={product.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                        className={`grid grid-cols-12 gap-3 items-center px-5 py-4 border-b border-border last:border-0 hover:bg-white/2 transition-colors ${selectedProducts.includes(product.id) ? 'bg-emerald-500/3' : ''}`}>
                        <div className="col-span-1">
                            <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggle(product.id)} className="rounded" />
                        </div>
                        <div className="col-span-3">
                            <div className="font-bold text-sm text-foreground truncate">{product.name}</div>
                            <div className="text-[10px] text-slate-500">{product.brand} · {product.category}</div>
                        </div>
                        <div className="col-span-1">
                            <div className="text-sm font-black text-foreground">₺{product.price.toLocaleString('tr-TR')}</div>
                            <div className="text-[10px] text-slate-600">Taban</div>
                        </div>
                        {marketplaces.map(mp => {
                            const price = getChannelPrice(product, mp.id);
                            const { diff, higher, same } = getPriceDiff(product.price, price);
                            const isEditing = editingCell?.productId === product.id && editingCell?.channel === mp.id;
                            const isSaving = saving === product.id + mp.id;
                            return (
                                <div key={mp.id} className="col-span-1 text-center">
                                    {isEditing ? (
                                        <div className="flex items-center gap-1">
                                            <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(product.id, mp.id); if (e.key === 'Escape') setEditingCell(null); }}
                                                className="w-full px-2 py-1 bg-background border border-emerald-500 rounded-lg text-xs text-foreground text-center focus:outline-none" />
                                            <button onClick={() => saveEdit(product.id, mp.id)} className="p-1 text-green-500 hover:text-green-400"><Save size={12} /></button>
                                            <button onClick={() => setEditingCell(null)} className="p-1 text-slate-500 hover:text-red-400"><X size={12} /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => startEdit(product.id, mp.id, price)}
                                            className="group flex flex-col items-center w-full hover:bg-white/5 rounded-xl p-1.5 transition-all">
                                            {isSaving ? (
                                                <Loader2 size={16} className="animate-spin text-emerald-500" />
                                            ) : (
                                                <>
                                                    <div className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                                                        ₺{price.toLocaleString('tr-TR')}
                                                    </div>
                                                    {!same && (
                                                        <div className={`flex items-center gap-0.5 text-[9px] font-bold ${higher ? 'text-green-500' : 'text-red-500'}`}>
                                                            {higher ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                                                            {higher ? '+' : ''}{diff}%
                                                        </div>
                                                    )}
                                                    {same && <div className="text-[9px] text-slate-600 flex items-center gap-0.5"><Minus size={8} /> Aynı</div>}
                                                    <Edit3 size={9} className="opacity-0 group-hover:opacity-100 text-slate-500 mt-0.5 transition-opacity" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        <div className="col-span-1 text-center">
                            <span className={`text-sm font-bold ${product.stock < 5 ? 'text-red-500' : 'text-foreground'}`}>{product.stock}</span>
                            {product.stock < 5 && <div className="text-[9px] text-red-500/70">Kritik</div>}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bulk Update Modal */}
            <AnimatePresence>
                {showBulkModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowBulkModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-foreground">Toplu Fiyat Güncelleme</h3>
                                <button onClick={() => setShowBulkModal(false)} className="p-1.5 rounded-lg hover:bg-background text-slate-400"><X size={18} /></button>
                            </div>

                            {selectedProducts.length > 0 ? (
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
                                    {selectedProducts.length} ürün seçili — sadece bunlar güncellenecek
                                </div>
                            ) : (
                                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm text-yellow-400">
                                    Tüm ürünler güncellenecek (filtreli)
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Hedef Kanal</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {marketplaces.map(mp => (
                                            <button key={mp.id} onClick={() => setBulkChannel(mp.id)}
                                                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${bulkChannel === mp.id ? `${mp.textColor} border-current bg-current/10` : 'border-border text-slate-400 hover:text-foreground'}`}>
                                                {mp.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">İşlem Yönü</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[{ id: 'increase', label: 'Artır', icon: TrendingUp }, { id: 'decrease', label: 'Azalt', icon: TrendingDown }].map(d => (
                                            <button key={d.id} onClick={() => setBulkDirection(d.id as any)}
                                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${bulkDirection === d.id ? 'bg-emerald-600 text-white border-transparent' : 'border-border text-slate-400 hover:text-foreground'}`}>
                                                <d.icon size={14} /> {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Güncelleme Tipi</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[{ id: 'percent', label: '% Yüzde' }, { id: 'fixed', label: '₺ Sabit Miktar' }].map(t => (
                                            <button key={t.id} onClick={() => setBulkType(t.id as any)}
                                                className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${bulkType === t.id ? 'bg-emerald-600 text-white border-transparent' : 'border-border text-slate-400 hover:text-foreground'}`}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                        {bulkType === 'percent' ? 'Yüzde Değeri (%)' : 'Miktar (₺)'}
                                    </label>
                                    <input value={bulkValue} onChange={e => setBulkValue(e.target.value)} type="number" placeholder={bulkType === 'percent' ? 'Örn: 10' : 'Örn: 500'}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder-slate-600 focus:border-emerald-500 outline-none transition-colors" />
                                </div>
                                <button onClick={applyBulkUpdate} disabled={!bulkValue}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all disabled:opacity-40">
                                    Fiyatları Güncelle
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
