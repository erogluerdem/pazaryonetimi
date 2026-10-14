"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { useBulkActions, useProducts } from '@/lib/hooks';
import { ExportButton } from '@/lib/export-utils';
import ImportModal from '@/components/products/ImportModal';
import {
    Layers,
    Check,
    X,
    Upload,
    Download,
    Edit3,
    Trash2,
    Copy,
    Tag,
    Percent,
    Package,
    AlertCircle,
    CheckCircle2,
    Clock,
    Play,
    Pause,
    RotateCcw,
    FileSpreadsheet,
    Image,
    RefreshCw,
    ChevronDown,
    Search
} from 'lucide-react';

const productsData: any[] = [];

const bulkActions = [
    { id: 'price-update', name: 'Fiyat Güncelle', icon: Tag, description: 'Seçili ürünlerin fiyatlarını güncelle' },
    { id: 'stock-update', name: 'Stok Güncelle', icon: Package, description: 'Seçili ürünlerin stok miktarlarını güncelle' },
    { id: 'discount', name: 'İndirim Uygula', icon: Percent, description: 'Seçili ürünlere toplu indirim uygula' },
    { id: 'activate', name: 'Aktifleştir', icon: Play, description: 'Seçili ürünleri aktif hale getir' },
    { id: 'pause', name: 'Pasifleştir', icon: Pause, description: 'Seçili ürünleri geçici olarak pasifleştir' },
    { id: 'duplicate', name: 'Çoğalt', icon: Copy, description: 'Seçili ürünleri kopyala' },
    { id: 'delete', name: 'Sil', icon: Trash2, description: 'Seçili ürünleri kalıcı olarak sil', danger: true }
];

const recentOperations: any[] = [];

export default function BulkActionsPage() {
    const { executeBulkAction, rollbackBulkAction, loading: bulkLoading, history } = useBulkActions();
    const { data: apiProducts, loading: productsLoading } = useProducts();
    const [rollingBackId, setRollingBackId] = useState<string | null>(null);
    const [rollbackMessage, setRollbackMessage] = useState<string | null>(null);
    const [selectedBatchAction, setSelectedBatchAction] = useState<any | null>(null);
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [batchDetails, setBatchDetails] = useState<any | null>(null);
    const [batchLoading, setBatchLoading] = useState(false);

    const openBatchModal = async (item: any) => {
        setSelectedBatchAction(item);
        setBatchModalOpen(true);
        setBatchLoading(true);
        try {
            const res = await fetch(`/api/products/bulk-action/${item.id}/marketplace-status`);
            const data = await res.json();
            setBatchDetails(data);
        } catch (err) {
            console.error('Batch status error:', err);
        } finally {
            setBatchLoading(false);
        }
    };

    const refreshBatchStatus = async (bulkActionId: string) => {
        setBatchLoading(true);
        try {
            const res = await fetch(`/api/products/bulk-action/${bulkActionId}/marketplace-status/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
            });
            const data = await res.json();
            // Re-fetch
            const fullRes = await fetch(`/api/products/bulk-action/${bulkActionId}/marketplace-status`);
            setBatchDetails(await fullRes.json());
        } catch (err) {
            console.error('Batch refresh error:', err);
        } finally {
            setBatchLoading(false);
        }
    };

    const handleRollback = async (id: string) => {
        if (!confirm('Bu toplu işlemi geri alarak ürünlerin fiyat ve stoklarını önceki değerlerine döndürmek istediğinize emin misiniz?')) {
            return;
        }
        setRollingBackId(id);
        try {
            const res = (await rollbackBulkAction(id)) as { message?: string } | undefined;
            setRollbackMessage(res?.message || 'İşlem başarıyla geri alındı');
            setTimeout(() => setRollbackMessage(null), 5000);
        } catch (err: any) {
            alert(err?.message || 'Geri alma sırasında hata oluştu');
        } finally {
            setRollingBackId(null);
        }
    };

    const products = (Array.isArray(apiProducts) && apiProducts.length > 0)
        ? apiProducts.map((p, i) => ({
            id: p.id ?? i + 1,
            name: p.name,
            sku: p.sku ?? '',
            price: p.price ?? 0,
            stock: (p as any).stock ?? 0,
            status: (p as any).status ?? 'active',
            platforms: (p as any).platforms ?? [],
        }))
        : productsData;

    const isLoading = bulkLoading || productsLoading;

    const [selectedProducts, setSelectedProducts] = useState<(string | number)[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [actionValue, setActionValue] = useState('');
    const [actionType, setActionType] = useState<'fixed' | 'percent'>('percent');

    const toggleProduct = (id: string | number) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedProducts.length === products.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.map((p: any) => p.id));
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [preview, setPreview] = useState<{ previewId: string; changes: { productId: string; title: string; before: { price?: number; stock?: number }; after: { price?: number; stock?: number } }[]; total: number } | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [operationError, setOperationError] = useState('');
    useEffect(() => { setPreview(null); setOperationError(''); }, [selectedAction, actionValue, actionType, selectedProducts]);
    const executeAction = async () => {
        if (!selectedAction) return;
        try {
            if (['price-update','stock-update','discount'].includes(selectedAction) && !actionValue.trim()) throw new Error('İşlem değeri gerekli');
            const productIds = selectedProducts.map(id => String(id));
            const actionData: Record<string, any> = {};

            if (selectedAction === 'price-update' || selectedAction === 'discount') {
                actionData.type = actionType;
                actionData.value = Number(actionValue);
            } else if (selectedAction === 'stock-update') {
                actionData.quantity = Number(actionValue);
            }

            if (['price-update','stock-update','discount'].includes(selectedAction)) {
                if (!preview) {
                    setPreviewing(true);
                    const result = await apiClient.request<{ previewId: string; changes: any[]; total: number }>('/products/bulk-action/preview', { method: 'POST', body: JSON.stringify({ action: selectedAction, productIds, ...actionData }) });
                    setPreview(result); return;
                }
                actionData.previewId = preview.previewId;
            }
            await executeBulkAction(selectedAction, productIds, actionData);
            setShowActionModal(false); setSelectedAction(null); setSelectedProducts([]); setActionValue('');
        } catch (err) {
            setOperationError(err instanceof Error ? err.message : 'Toplu işlem başarısız');
        } finally { setPreviewing(false); }

    };

    return (
        <div className={`space-y-8 animate-in fade-in duration-500 pb-20 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Layers className="w-8 h-8 text-indigo-500" />
                            Toplu İşlemler
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Ürünlerinizi toplu olarak yönetin
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Excel İçe Aktar
                        </motion.button>
                        <ExportButton
                            data={products.map(p => ({
                                'SKU': p.sku,
                                'Ürün Adı': p.name,
                                'Fiyat': p.price,
                                'Stok': p.stock,
                                'Durum': p.status === 'active' ? 'Aktif' : p.status === 'paused' ? 'Pasif' : 'Taslak',
                                'Platformlar': p.platforms.join(', '),
                            }))}
                            filename="urunler"
                            title="Ürün Listesi"
                            subtitle={`Toplam ${products.length} ürün`}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl p-5 border border-border"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                            <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Toplam Ürün</div>
                            <div className="text-xl font-black text-foreground">{products.length}</div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-surface rounded-2xl p-5 border border-border"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Seçili Ürün</div>
                            <div className="text-xl font-black text-foreground">{selectedProducts.length}</div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-surface rounded-2xl p-5 border border-border"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Başarılı İşlem</div>
                            <div className="text-xl font-black text-foreground">331</div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-surface rounded-2xl p-5 border border-border"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Başarısız</div>
                            <div className="text-xl font-black text-foreground">52</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Actions Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1 space-y-4"
                >
                    <div className="bg-surface rounded-2xl p-4 border border-border">
                        <h3 className="text-lg font-bold text-foreground mb-4">Toplu İşlemler</h3>
                        <div className="space-y-2">
                            {bulkActions.map((action) => (
                                <motion.button
                                    key={action.id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => {
                                        if (selectedProducts.length > 0) {
                                            setSelectedAction(action.id);
                                            setShowActionModal(true);
                                        }
                                    }}
                                    disabled={selectedProducts.length === 0}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                                        selectedProducts.length === 0
                                            ? 'bg-background/50 text-slate-400 cursor-not-allowed border border-border'
                                            : action.danger
                                            ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-500/30'
                                            : 'bg-background text-slate-600 dark:text-slate-300 hover:bg-background/80 hover:text-foreground border border-border'
                                    }`}
                                >
                                    <action.icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{action.name}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Recent Operations */}
                    <div className="bg-surface rounded-2xl p-4 border border-border">
                        <h3 className="text-lg font-bold text-foreground mb-4">Son İşlemler</h3>
                        <div className="space-y-3">
                            {recentOperations.map((op) => (
                                <div key={op.id} className="p-3 bg-background rounded-xl border border-border">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-foreground">{op.action}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            op.status === 'completed'
                                                ? 'bg-green-500/20 text-green-400'
                                                : op.status === 'processing'
                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {op.status === 'completed' ? 'Tamamlandı' : op.status === 'processing' ? 'İşleniyor' : 'Başarısız'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {op.products} ürün • {op.date}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs">
                                        <span className="text-green-400">✓ {op.success}</span>
                                        {op.failed > 0 && <span className="text-red-400">✗ {op.failed}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Products Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-3 bg-surface rounded-2xl border border-border overflow-hidden"
                >
                    {/* Search and Filters */}
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Ürün ara (isim veya SKU)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-background rounded-xl text-foreground placeholder-slate-500 border border-border focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors">
                                <RefreshCw className="w-4 h-4" />
                                Yenile
                            </button>
                        </div>
                    </div>

                    {/* Selection Bar */}
                    {selectedProducts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/30"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-indigo-600 dark:text-indigo-300">
                                    <strong>{selectedProducts.length}</strong> ürün seçildi
                                </span>
                                <button
                                    onClick={() => setSelectedProducts([])}
                                    className="text-sm text-indigo-400 hover:text-indigo-300"
                                >
                                    Seçimi Temizle
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-200 dark:bg-slate-800/50">
                                <tr>
                                    <th className="w-12 p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.length === products.length}
                                            onChange={toggleAll}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="text-left p-4 text-slate-500 text-sm font-bold">Ürün</th>
                                    <th className="text-left p-4 text-slate-500 text-sm font-bold">SKU</th>
                                    <th className="text-right p-4 text-slate-500 text-sm font-bold">Fiyat</th>
                                    <th className="text-right p-4 text-slate-500 text-sm font-bold">Stok</th>
                                    <th className="text-center p-4 text-slate-500 text-sm font-bold">Durum</th>
                                    <th className="text-center p-4 text-slate-500 text-sm font-bold">Platformlar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className={`hover:bg-background/50 transition-colors ${
                                            selectedProducts.includes(product.id) ? 'bg-indigo-500/10' : ''
                                        }`}
                                    >
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => toggleProduct(product.id)}
                                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <span className="text-foreground font-medium">{product.name}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-500 text-sm font-mono">{product.sku}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-foreground">₺{product.price.toFixed(2)}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`${product.stock < 100 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                                product.status === 'active'
                                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                                                    : product.status === 'paused'
                                                    ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                                                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                                            }`}>
                                                {product.status === 'active' ? 'Aktif' : product.status === 'paused' ? 'Pasif' : 'Taslak'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1">
                                                {product.platforms.map((platform: string) => (
                                                    <span
                                                        key={platform}
                                                        className="px-2 py-0.5 bg-background rounded text-xs text-slate-500 capitalize border border-border"
                                                    >
                                                        {platform.charAt(0).toUpperCase()}
                                                    </span>
                                                ))}
                                                {product.platforms.length === 0 && (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {rollbackMessage && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{rollbackMessage}</span>
                </div>
            )}

            {/* Bulk Action History & Rollback */}
            <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-indigo-500" />
                            İşlem Geçmişi & Geri Alma (Rollback)
                        </h2>
                        <p className="text-slate-500 text-xs mt-1">
                            Yapılan toplu işlemler kaydedilir; fiyat ve stok değişikliklerinden 1 tıkla geri dönülebilir.
                        </p>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                    {history.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            Henüz kaydedilmiş toplu işlem bulunmuyor.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-background/50 text-left text-xs font-bold text-slate-500">
                                        <th className="p-4">İşlem</th>
                                        <th className="p-4">Etkilenen Ürün</th>
                                        <th className="p-4">Durum</th>
                                        <th className="p-4">Pazaryeri İki Aşamalı Takip</th>
                                        <th className="p-4">Yedek (Snapshot)</th>
                                        <th className="p-4">Tarih</th>
                                        <th className="p-4">Yapan</th>
                                        <th className="p-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-sm">
                                    {history.map((item) => (
                                        <tr key={item.id} className="hover:bg-background/40 transition-colors">
                                            <td className="p-4 font-medium text-foreground capitalize">
                                                {item.action.replace(/[-_]/g, ' ')}
                                            </td>
                                            <td className="p-4 font-mono text-xs">
                                                {item.productCount ?? item.affectedCount ?? item.totalCount ?? 0} ürün
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                                    item.status === 'completed'
                                                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                        : item.status === 'rolled_back'
                                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                        : item.status === 'failed'
                                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                    {item.status === 'completed'
                                                        ? 'Tamamlandı'
                                                        : item.status === 'rolled_back'
                                                        ? 'Geri Alındı'
                                                        : item.status === 'failed'
                                                        ? 'Hatalı'
                                                        : item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-slate-400">
                                                {item.snapshotCount ? `${item.snapshotCount} ürün yedeklendi` : 'Yedek mevcut'}
                                            </td>
                                            <td className="p-4 text-xs text-slate-400">
                                                {item.executedAt ? new Date(item.executedAt).toLocaleString('tr-TR') : item.startedAt ? new Date(item.startedAt).toLocaleString('tr-TR') : '-'}
                                            </td>
                                            <td className="p-4 text-xs text-slate-400">
                                                {item.executedBy ?? item.user ?? 'Yönetici'}
                                            </td>
                                            <td className="p-4 text-right">
                                                {item.status === 'rolled_back' ? (
                                                    <span className="text-xs text-slate-500 font-medium">Geri Alındı</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRollback(item.id)}
                                                        disabled={rollingBackId === item.id}
                                                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                                                    >
                                                        <RotateCcw className={`w-3.5 h-3.5 ${rollingBackId === item.id ? 'animate-spin' : ''}`} />
                                                        {rollingBackId === item.id ? 'Geri Alınıyor...' : 'Geri Al'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Modal */}
            {showActionModal && selectedAction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border"
                    >
                        <h3 className="text-xl font-bold text-foreground mb-4">
                            {bulkActions.find(a => a.id === selectedAction)?.name}
                        </h3>
                        <p className="text-slate-500 text-sm mb-6">
                            {selectedProducts.length} ürün için işlem uygulanacak.
                        </p>

                        {(selectedAction === 'price-update' || selectedAction === 'discount') && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActionType('percent')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            actionType === 'percent'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-background text-slate-500 border border-border'
                                        }`}
                                    >
                                        Yüzde (%)
                                    </button>
                                    <button
                                        onClick={() => setActionType('fixed')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            actionType === 'fixed'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-background text-slate-500 border border-border'
                                        }`}
                                    >
                                        Sabit Tutar (₺)
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={actionValue}
                                        onChange={(e) => setActionValue(e.target.value)}
                                        placeholder={actionType === 'percent' ? 'Örn: 10' : 'Örn: 25.00'}
                                        className="w-full px-4 py-3 bg-background rounded-xl text-foreground placeholder-slate-500 border border-border focus:border-indigo-500 focus:outline-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        {actionType === 'percent' ? '%' : '₺'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {selectedAction === 'stock-update' && (
                            <div className="relative">
                                <input
                                    type="number"
                                    value={actionValue}
                                    onChange={(e) => setActionValue(e.target.value)}
                                    placeholder="Yeni stok miktarı"
                                    className="w-full px-4 py-3 bg-background rounded-xl text-foreground placeholder-slate-500 border border-border focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        )}

                        {(selectedAction === 'activate' || selectedAction === 'pause' || selectedAction === 'duplicate' || selectedAction === 'delete') && (
                            <div className="p-4 bg-background rounded-xl border border-border">
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {selectedAction === 'activate' && 'Seçili ürünler aktif hale getirilecek ve tüm platformlarda görünür olacak.'}
                                    {selectedAction === 'pause' && 'Seçili ürünler geçici olarak pasifleştirilecek. Satışlar duracak.'}
                                    {selectedAction === 'duplicate' && 'Seçili ürünlerin kopyaları oluşturulacak. Yeni ürünler taslak olarak kaydedilecek.'}
                                    {selectedAction === 'delete' && '⚠️ Seçili ürünler kalıcı olarak silinecek. Bu işlem geri alınamaz!'}
                                </p>
                            </div>
                        )}

                        {operationError && <p role="alert" className="mt-4 text-sm text-red-600">{operationError}</p>}
                        {preview && <div className="mt-4 max-h-60 overflow-auto rounded-lg border border-border p-3"><p className="mb-2 text-sm font-medium">{preview.total} ürünün önizlemesi · Fiyat/stok kataloğa uygulanır.</p>{preview.changes.map(change => <div key={change.productId} className="flex justify-between gap-3 border-t border-border py-2 text-sm"><span>{change.title}</span><span>{change.before.price ?? change.before.stock} → {change.after.price ?? change.after.stock}</span></div>)}</div>}
                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => setShowActionModal(false)}
                                className="flex-1 py-2 bg-background rounded-lg text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors border border-border"
                            >
                                İptal
                            </button>
                            <button
                                onClick={executeAction}
                                disabled={bulkLoading || previewing}
                                className={`flex-1 py-2 rounded-lg text-white transition-colors ${
                                    selectedAction === 'delete'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                } ${bulkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {bulkLoading || previewing ? 'İşleniyor…' : ['price-update','stock-update','discount'].includes(selectedAction || '') ? preview ? 'Önizlemeyi uygula' : 'Değişiklikleri önizle' : 'Uygula'}
                            </button>
                        </div>
                    
            {/* Marketplace Batch Tracking Modal */}
            {batchModalOpen && selectedBatchAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Tag className="text-indigo-400" size={18} />
                                    Pazaryeri İki Aşamalı Doğrulama & Uygulama Durumu
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Toplu İşlem: <span className="font-mono text-slate-300">{selectedBatchAction.id}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setBatchModalOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                            {/* Explanatory banner */}
                            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                                <span className="font-semibold text-white">İki Aşamalı Güvenlik: </span>
                                Pazaryerinin kuyruğa kabul ettiği (Aşama 1: Accepted) güncelleme paketi ile mağaza kataloğuna fiilen uyguladığı (Aşama 2: Applied) sonuçlar ayrı ayrı doğrulanır.
                            </div>

                            {batchLoading ? (
                                <div className="p-12 text-center text-slate-400 space-y-3">
                                    <RefreshCw className="animate-spin mx-auto text-indigo-400" size={24} />
                                    <p className="text-sm">Pazaryeri durumları sorgulanıyor...</p>
                                </div>
                            ) : !batchDetails?.marketplaceBatches?.length ? (
                                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                                    <Package className="mx-auto text-slate-600 mb-2" size={28} />
                                    <p className="text-sm font-medium">Bu işlem için pazaryeri gönderim kaydı bulunamadı.</p>
                                    <p className="text-xs text-slate-500 mt-1">İşlem yalnızca yerel ürün veritabanında çalıştırılmış olabilir.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {batchDetails.marketplaceBatches.map((b: any, idx: number) => {
                                        const isApplied = b.phase === 'APPLIED';
                                        const isPartial = b.phase === 'PARTIALLY_APPLIED';
                                        const isAccepted = b.phase === 'ACCEPTED_BY_MARKETPLACE';
                                        const isRejected = b.phase === 'REJECTED';

                                        return (
                                            <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-white">{b.platform}</span>
                                                        <span className="text-[10px] font-mono text-slate-500">ID: {b.batchRequestId}</span>
                                                    </div>
                                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                                        isApplied
                                                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                                            : isPartial
                                                            ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                                                            : isRejected
                                                            ? 'border-red-500/30 text-red-400 bg-red-500/10'
                                                            : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                                                    }`}>
                                                        {b.phaseLabel || b.phase}
                                                    </span>
                                                </div>

                                                {/* Phase flow steps */}
                                                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                                                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Aşama 1: Pazaryeri Kabulü</p>
                                                        <p className="mt-1 font-bold text-emerald-400 flex items-center gap-1">
                                                            <CheckCircle2 size={12} /> Kabul Edildi (Kuyrukta)
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(b.acceptedAt).toLocaleString('tr-TR')}</p>
                                                    </div>

                                                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Aşama 2: Fiili Uygulama</p>
                                                        <p className={`mt-1 font-bold flex items-center gap-1 ${
                                                            isApplied ? 'text-emerald-400' : isPartial ? 'text-amber-400' : isRejected ? 'text-red-400' : 'text-blue-400'
                                                        }`}>
                                                            {isApplied ? 'Katalogda Güncellendi' : isPartial ? `Kısmen (${b.appliedCount}/${b.totalItems})` : isRejected ? 'Reddedildi' : 'Kuyrukta İşleniyor'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                                            {b.appliedAt ? new Date(b.appliedAt).toLocaleString('tr-TR') : 'API yanıtı bekleniyor'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Item errors */}
                                                {Boolean(b.itemErrors?.length) && (
                                                    <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-1.5">
                                                        <p className="text-xs font-bold text-red-300">Pazaryerinin Uygulayamadığı Ürünler ({b.itemErrors.length}):</p>
                                                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                                            {b.itemErrors.map((err: any, eIdx: number) => (
                                                                <div key={eIdx} className="text-[11px] text-red-200/90 flex items-start gap-1">
                                                                    <span className="font-mono text-red-400 shrink-0">{err.sku || err.barcode || '#'}:</span>
                                                                    <span>{err.reason}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                            <button
                                onClick={() => refreshBatchStatus(selectedBatchAction.id)}
                                disabled={batchLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all disabled:opacity-50"
                            >
                                <RefreshCw size={13} className={batchLoading ? 'animate-spin' : ''} />
                                Pazaryerinden Durumu Güncelle
                            </button>
                            <button
                                onClick={() => setBatchModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

</motion.div>
                </div>
            )}

            {/* Import Modal */}
            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportComplete={() => {
                    // Refresh products after import
                    window.location.reload();
                }}
            />
        </div>
    );
}
