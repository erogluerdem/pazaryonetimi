"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Store as StoreIcon,
    Plus,
    Settings,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    XCircle,
    TrendingUp,
    Package,
    ShoppingBag,
    Eye,
    ExternalLink,
    Link as LinkIcon,
    Unlink,
    Clock,
    DollarSign,
    ChevronRight,
    Zap,
    Loader2,
    X,
    ChevronDown,
    ChevronUp,
    Wifi,
    WifiOff,
    PlugZap
} from 'lucide-react';
import { useStores, type Store } from '@/lib/hooks';

// Platform visual config
const platformConfig: Record<string, { color: string; bgColor: string; borderColor: string; textColor: string; logo: string }> = {
    trendyol: {
        color: 'bg-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        textColor: 'text-orange-500',
        logo: '/images/pazaryeri/Trendyol.png',
    },
    amazon: {
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        textColor: 'text-yellow-500',
        logo: '/images/pazaryeri/Amazon.png',
    },
    hepsiburada: {
        color: 'bg-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        textColor: 'text-red-500',
        logo: '/images/pazaryeri/Hepsiburada.png',
    },
    n11: {
        color: 'bg-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        textColor: 'text-purple-500',
        logo: '/images/pazaryeri/N11.png',
    },
    ciceksepeti: {
        color: 'bg-pink-500',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/20',
        textColor: 'text-pink-500',
        logo: '/images/pazaryeri/ciceksepeti.png',
    },
};

const platformDisplayName: Record<string, string> = {
    trendyol: 'Trendyol',
    amazon: 'Amazon',
    hepsiburada: 'Hepsiburada',
    n11: 'N11',
    ciceksepeti: 'Çiçeksepeti',
};

function getPlatformVisuals(platform: string) {
    return platformConfig[platform] ?? {
        color: 'bg-slate-500',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
        textColor: 'text-slate-500',
        logo: '',
    };
}

export default function StoresPage() {
    const router = useRouter();
    const { stores, loading, error, fetchStores, disconnectStore, syncStore } = useStores();

    const [syncingStoreId, setSyncingStoreId] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ type: 'connect' | 'disconnect'; storeId: string; platform: string } | null>(null);
    const [settingsPanelId, setSettingsPanelId] = useState<string | null>(null);

    const displayStores = stores;

    const connectedStores = displayStores.filter(s => s.status === 'connected');
    const totalRevenue = displayStores.reduce((sum, s) => sum + s.revenue, 0);
    const totalProducts = displayStores.reduce((sum, s) => sum + s.totalProducts, 0);
    const totalOrders = displayStores.reduce((sum, s) => sum + s.totalOrders, 0);

    // Sync handler with progress
    const handleSync = useCallback(async (storeId: string) => {
        setSyncingStoreId(storeId);
        try {
            const result = await syncStore(storeId, 'all') as {
                products?: { created?: number; updated?: number; failed?: number };
                orders?: { created?: number; updated?: number; skipped?: boolean; message?: string };
            } | undefined;
            await fetchStores();
            if (result?.products) {
                const { created = 0, updated = 0, failed = 0 } = result.products;
                const msg = `Senkron tamamlandı: ${created} yeni, ${updated} güncellendi${failed ? `, ${failed} hata` : ''} ürün`;
                if (typeof window !== 'undefined') window.alert(msg);
            }
        } catch {
            // error handled by hook
        } finally {
            setSyncingStoreId(null);
        }
    }, [syncStore, fetchStores]);

    // Sync all connected stores
    const handleSyncAll = useCallback(async () => {
        for (const s of connectedStores) {
            await handleSync(s.id);
        }
    }, [connectedStores, handleSync]);

    // Confirm connect
    const handleConfirmConnect = useCallback(async () => {
        if (!confirmDialog || confirmDialog.type !== 'connect') return;
        setConfirmDialog(null);
        router.push('/dashboard/settings/integrations');
    }, [confirmDialog, router]);

    // Confirm disconnect
    const handleConfirmDisconnect = useCallback(async () => {
        if (!confirmDialog || confirmDialog.type !== 'disconnect') return;
        await disconnectStore(confirmDialog.storeId);
        setConfirmDialog(null);
    }, [confirmDialog, disconnectStore]);

    const getStatusBadge = (status: Store['status'], verified?: boolean) => {
        switch (status) {
            case 'connected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                        <CheckCircle size={11} /> {verified ? 'API Doğrulandı' : 'Bağlı'}
                    </span>
                );
            case 'syncing':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse">
                        <Loader2 size={11} className="animate-spin" /> Senkronize Ediliyor
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock size={11} /> Doğrulama Bekliyor
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                        <AlertTriangle size={11} /> Bağlantı / Aktarım Hatası
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
                        <XCircle size={11} /> Bağlı Değil
                    </span>
                );
        }
    };

    // Loading state
    if (loading && stores.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 size={40} className="animate-spin text-primary mx-auto" />
                    <div className="text-lg font-bold text-foreground">Mağazalar yükleniyor...</div>
                    <p className="text-sm text-slate-500">Pazaryeri bağlantıları kontrol ediliyor</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Confirm Dialog */}
            <AnimatePresence>
                {confirmDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setConfirmDialog(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-foreground">
                                    {confirmDialog.type === 'connect' ? 'Pazaryeri Bağla' : 'Bağlantıyı Kes'}
                                </h3>
                                <button onClick={() => setConfirmDialog(null)} className="p-1 rounded-lg hover:bg-background text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-10 h-10 rounded-xl ${getPlatformVisuals(confirmDialog.platform).color} flex items-center justify-center`}>
                                    <span className="text-white font-black">
                                        {(platformDisplayName[confirmDialog.platform] ?? confirmDialog.platform)[0]}
                                    </span>
                                </div>
                                <div>
                                    <div className="font-bold text-foreground">{platformDisplayName[confirmDialog.platform] ?? confirmDialog.platform}</div>
                                    <div className="text-xs text-slate-500">
                                        {confirmDialog.type === 'connect'
                                            ? 'Bu pazaryerine bağlanmak istediğinizden emin misiniz?'
                                            : 'Bu mağazanın bağlantısını kesmek istediğinizden emin misiniz?'}
                                    </div>
                                </div>
                            </div>
                            {confirmDialog.type === 'disconnect' && (
                                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-4 text-xs text-red-500">
                                    <AlertTriangle size={12} className="inline mr-1" />
                                    Bağlantı kesildiğinde senkronizasyon duracak ve bekleyen siparişler etkilenebilir.
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setConfirmDialog(null)}
                                    className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-foreground hover:bg-surface transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={confirmDialog.type === 'connect' ? handleConfirmConnect : handleConfirmDisconnect}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                                        confirmDialog.type === 'connect'
                                            ? 'bg-primary hover:bg-primary/90'
                                            : 'bg-red-500 hover:bg-red-600'
                                    }`}
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : confirmDialog.type === 'connect' ? 'Bağla' : 'Bağlantıyı Kes'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Mağazalarım</h1>
                    <p className="text-slate-500 font-medium">Bağlı pazaryerlerini ve performanslarını yönetin</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSyncAll}
                        disabled={!!syncingStoreId || connectedStores.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-bold text-foreground hover:bg-surface/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={16} className={syncingStoreId ? 'animate-spin' : ''} /> Tümünü Senkronize Et
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/settings/integrations')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={16} /> Pazaryeri Bağla
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-primary/10 to-purple-500/5 p-6 rounded-2xl border border-primary/20"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <StoreIcon size={20} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold text-primary">{connectedStores.length} Aktif</span>
                    </div>
                    <div className="text-2xl font-black text-foreground">{displayStores.length}</div>
                    <div className="text-xs text-slate-500 mt-1">Toplam Mağaza</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-surface p-6 rounded-2xl border border-border"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-green-500/10">
                            <PlugZap size={20} className="text-green-500" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-foreground">{connectedStores.length}</div>
                    <div className="text-xs text-slate-500 mt-1">Aktif Entegrasyon</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-surface p-6 rounded-2xl border border-border"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10">
                            <Package size={20} className="text-blue-500" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-foreground">{totalProducts.toLocaleString('tr-TR')}</div>
                    <div className="text-xs text-slate-500 mt-1">Senkronize Edilen Ürün</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-surface p-6 rounded-2xl border border-border"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-green-500/10">
                            <DollarSign size={20} className="text-green-500" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-green-500">
                            <TrendingUp size={12} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-foreground">₺{(totalRevenue / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-slate-500 mt-1">Toplam Ciro</div>
                </motion.div>
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayStores.map((store, idx) => {
                    const visuals = getPlatformVisuals(store.platform);
                    const isSyncing = syncingStoreId === store.id || store.status === 'syncing';
                    const isSettingsOpen = settingsPanelId === store.id;

                    return (
                        <motion.div
                            key={store.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className={`bg-surface rounded-2xl border ${
                                store.status === 'connected' ? 'border-border' :
                                store.status === 'syncing' ? 'border-blue-500/30' :
                                store.status === 'error' ? 'border-red-500/20' : 'border-dashed border-slate-600'
                            } overflow-hidden`}
                        >
                            {/* Platform Header */}
                            <div className="p-5 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl ${visuals.color} flex items-center justify-center relative overflow-hidden`}>
                                            <span className="text-white text-lg font-black">
                                                {(platformDisplayName[store.platform] ?? store.platform)[0]}
                                            </span>
                                            {isSyncing && (
                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">
                                                {platformDisplayName[store.platform] ?? store.platform}
                                            </div>
                                            <div className="text-xs text-slate-500">{store.storeName}</div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                <Clock size={9} /> {store.lastSync}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(isSyncing ? 'syncing' : store.status, store.verified)}
                                        {(store.status === 'connected' || store.status === 'syncing') && (
                                            <button
                                                onClick={() => handleSync(store.id)}
                                                disabled={isSyncing}
                                                className="p-2 rounded-lg hover:bg-background text-slate-400 hover:text-foreground transition-all disabled:opacity-50"
                                            >
                                                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* Sync progress bar */}
                                {isSyncing && syncingStoreId === store.id && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-[10px] text-blue-500 mb-1">
                                            <span>Senkronize ediliyor...</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full w-1/3 bg-blue-500 rounded-full"
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '100%' }}
                                                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Platform Body */}
                            {store.status === 'connected' || store.status === 'syncing' ? (
                                <div className="p-5">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        <div className="bg-background p-3 rounded-xl">
                                            <div className="text-[10px] text-slate-500 mb-1">Ciro</div>
                                            <div className="text-sm font-black text-foreground">
                                                ₺{store.revenue >= 1000 ? `${(store.revenue / 1000).toFixed(0)}K` : store.revenue}
                                            </div>
                                        </div>
                                        <div className="bg-background p-3 rounded-xl">
                                            <div className="text-[10px] text-slate-500 mb-1">Ürün</div>
                                            <div className="text-sm font-black text-foreground">{store.totalProducts.toLocaleString('tr-TR')}</div>
                                        </div>
                                        <div className="bg-background p-3 rounded-xl">
                                            <div className="text-[10px] text-slate-500 mb-1">Sipariş</div>
                                            <div className="text-sm font-black text-foreground">{store.totalOrders}</div>
                                        </div>
                                    </div>

                                    {/* Telemetry Breakdown: Eklenen / Güncellenen / Hatalı / Sipariş */}
                                    <div className="grid grid-cols-4 gap-2 mb-4 bg-background/50 p-2.5 rounded-xl border border-border/60">
                                        <div className="text-center">
                                            <div className="text-[10px] text-slate-500 font-medium">Eklenen</div>
                                            <div className="text-xs font-black text-green-500">+{store.productsAdded ?? 0}</div>
                                        </div>
                                        <div className="text-center border-l border-border/40">
                                            <div className="text-[10px] text-slate-500 font-medium">Güncellenen</div>
                                            <div className="text-xs font-black text-blue-500">{store.productsUpdated ?? 0}</div>
                                        </div>
                                        <div className="text-center border-l border-border/40">
                                            <div className="text-[10px] text-slate-500 font-medium">Hatalı</div>
                                            <div className={`text-xs font-black ${(store.productsFailed ?? 0) > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                {store.productsFailed ?? 0}
                                            </div>
                                        </div>
                                        <div className="text-center border-l border-border/40">
                                            <div className="text-[10px] text-slate-500 font-medium">Sipariş</div>
                                            <div className="text-xs font-black text-foreground">{store.ordersSynced ?? store.totalOrders ?? 0}</div>
                                        </div>
                                    </div>

                                    {/* Last Sync Error Alert if any */}
                                    {store.lastSyncError && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4 text-xs text-red-400 flex items-start gap-2">
                                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                            <div className="flex-1 break-words">
                                                <span className="font-bold">Son Aktarım Hatası: </span>
                                                {store.lastSyncError}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rating */}
                                    {store.rating > 0 && (
                                        <div className="flex items-center gap-2 mb-4 text-sm">
                                            <span className="text-yellow-500">★</span>
                                            <span className="font-bold text-foreground">{store.rating}</span>
                                            <span className="text-slate-500">puan</span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSettingsPanelId(isSettingsOpen ? null : store.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-xs font-bold text-foreground hover:bg-surface transition-all"
                                        >
                                            <Settings size={14} /> Ayarlar {isSettingsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                        <button
                                            onClick={() => setConfirmDialog({ type: 'disconnect', storeId: store.id, platform: store.platform })}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all"
                                        >
                                            <WifiOff size={14} /> Kes
                                        </button>
                                        <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-xs font-bold text-foreground hover:bg-surface transition-all">
                                            <ExternalLink size={14} />
                                        </button>
                                    </div>

                                    {/* Settings Panel */}
                                    <AnimatePresence>
                                        {isSettingsOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-4 bg-background rounded-xl p-4 space-y-3 border border-border">
                                                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                                                        <Settings size={12} /> Mağaza Ayarları
                                                    </h4>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">Mağaza Adı</span>
                                                            <span className="text-xs font-medium text-foreground">{store.storeName}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">Platform</span>
                                                            <span className="text-xs font-medium text-foreground">{platformDisplayName[store.platform] ?? store.platform}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">Durum</span>
                                                            <span className="text-xs font-medium text-green-500">Aktif</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">Son Senkronizasyon</span>
                                                            <span className="text-xs font-medium text-foreground">{store.lastSync}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">Otomatik Senkronizasyon</span>
                                                            <div className="w-8 h-4 bg-green-500 rounded-full relative cursor-pointer">
                                                                <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleSync(store.id)}
                                                        disabled={isSyncing}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-xs font-bold text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                                                    >
                                                        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} /> Şimdi Senkronize Et
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : store.status === 'error' ? (
                                <div className="p-5">
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-red-500">Bağlantı / Aktarım Hatası</div>
                                                <div className="text-xs text-red-400 mt-1 break-words font-medium">
                                                    {store.lastSyncError || 'Pazaryeri API erişimi onaylamadı veya kimlik bilgileri geçersiz.'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Stats even in error state */}
                                    {store.totalProducts > 0 && (
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-background p-3 rounded-xl">
                                                <div className="text-[10px] text-slate-500 mb-1">Son Bilinen Ürün</div>
                                                <div className="text-sm font-black text-foreground">{store.totalProducts}</div>
                                            </div>
                                            <div className="bg-background p-3 rounded-xl">
                                                <div className="text-[10px] text-slate-500 mb-1">Son Bilinen Ciro</div>
                                                <div className="text-sm font-black text-foreground">₺{(store.revenue / 1000).toFixed(0)}K</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSync(store.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/20 transition-all"
                                        >
                                            <RefreshCw size={14} /> Yeniden Dene
                                        </button>
                                        <button
                                            onClick={() => setConfirmDialog({ type: 'disconnect', storeId: store.id, platform: store.platform })}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-xs font-bold text-foreground hover:bg-surface transition-all"
                                        >
                                            <WifiOff size={14} /> Bağlantıyı Kes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-5">
                                    <div className="text-center py-4">
                                        <div className={`w-12 h-12 rounded-xl ${visuals.bgColor} flex items-center justify-center mx-auto mb-3`}>
                                            <Unlink size={20} className={visuals.textColor} />
                                        </div>
                                        <div className="text-sm text-slate-500 mb-4">Bu pazaryerine henüz bağlı değilsiniz</div>
                                        <button
                                            onClick={() => setConfirmDialog({ type: 'connect', storeId: store.id, platform: store.platform })}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 ${visuals.color} text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all mx-auto`}
                                        >
                                            <LinkIcon size={14} /> Hemen Bağla
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Connect More Platforms */}
            <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl border border-primary/20 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Zap size={24} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Daha Fazla Pazaryeri Bağlayın</h3>
                            <p className="text-sm text-slate-500">Satışlarınızı artırmak için yeni pazaryerlerini entegre edin</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {Object.entries(platformConfig).map(([key, cfg]) => (
                            <div
                                key={key}
                                onClick={() => setConfirmDialog({ type: 'connect', storeId: '', platform: key })}
                                className={`w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center hover:${cfg.borderColor} cursor-pointer transition-all group`}
                            >
                                <span className={`text-slate-500 group-hover:${cfg.textColor} font-bold`}>
                                    {(platformDisplayName[key] ?? key)[0]}
                                </span>
                            </div>
                        ))}
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">
                            Tümünü Gör <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
