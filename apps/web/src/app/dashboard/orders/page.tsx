"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    Search,
    Download,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    AlertTriangle,
    Package,
    RefreshCw,
    ChevronDown,
    MapPin,
    Phone,
    User,
    CreditCard,
    Printer,
    ExternalLink
} from 'lucide-react';

import { useOrders, Order } from '@/lib/hooks';
import { OrderPipeline } from '@/components/dashboard/OrderPipeline';
import { useModules } from '@/lib/modules';
import { getPlatformLogoByKey } from '@/lib/marketplace-assets';

interface OrderPagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

const MARKETPLACE_LIST = [
    { name: 'TRENDYOL', label: 'Trendyol' },
    { name: 'HEPSIBURADA', label: 'Hepsiburada' },
    { name: 'N11', label: 'n11' },
    { name: 'AMAZON', label: 'Amazon' },
    { name: 'PAZARAMA', label: 'Pazarama' },
    { name: 'CICEKSEPETI', label: 'ÇiçekSepeti' },
    { name: 'PTTAVM', label: 'PttAVM' },
    { name: 'IDEFIX', label: 'Idefix' },
    { name: 'SHOPIFY', label: 'Shopify' },
    { name: 'WOOCOMMERCE', label: 'WooCommerce' },
    { name: 'OPENCART', label: 'OpenCart' }
];

const statusFilterOptions = [
    { key: 'Tümü', label: 'Tüm Durumlar' },
    { key: 'PENDING', label: 'Bekleyen' },
    { key: 'CONFIRMED', label: 'Hazırlanıyor' },
    { key: 'SHIPPED', label: 'Kargoda' },
    { key: 'DELIVERED', label: 'Teslim Edildi' },
    { key: 'CANCELLED', label: 'İptal' },
    { key: 'RETURNED', label: 'İade' },
];

export default function OrdersPage() {
    const { getOrders, updateStatus, loading } = useOrders();
    const { orderPipeline } = useModules();
    const [orders, setOrders] = useState<Order[]>([]);
    const [, setPagination] = useState<OrderPagination | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('Tümü');
    const [selectedPlatform, setSelectedPlatform] = useState('Tümü');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState('today');

    const fetchOrders = async () => {
        const filters: Record<string, string> = {};
        if (searchTerm) filters.search = searchTerm;
        if (selectedStatus !== 'Tümü') filters.status = selectedStatus;
        if (selectedPlatform !== 'Tümü') filters.platform = selectedPlatform;

        const response = await getOrders(filters) as { orders: Order[], pagination: OrderPagination };
        if (response) {
            setOrders(response.orders || []);
            setPagination(response.pagination);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [searchTerm, selectedStatus, selectedPlatform, dateRange]);

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
            PENDING: { label: 'Beklemede', color: 'text-amber-600 dark:text-amber-400', icon: <Clock size={13} />, bgColor: 'bg-amber-500/10 border-amber-500/20' },
            CONFIRMED: { label: 'Hazırlanıyor', color: 'text-blue-600 dark:text-blue-400', icon: <Package size={13} />, bgColor: 'bg-blue-500/10 border-blue-500/20' },
            SHIPPED: { label: 'Kargoda', color: 'text-violet-600 dark:text-violet-400', icon: <Truck size={13} />, bgColor: 'bg-violet-500/10 border-violet-500/20' },
            DELIVERED: { label: 'Teslim Edildi', color: 'text-emerald-600 dark:text-emerald-400', icon: <CheckCircle size={13} />, bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
            CANCELLED: { label: 'İptal', color: 'text-rose-600 dark:text-rose-400', icon: <XCircle size={13} />, bgColor: 'bg-rose-500/10 border-rose-500/20' },
            RETURNED: { label: 'İade', color: 'text-orange-600 dark:text-orange-400', icon: <AlertTriangle size={13} />, bgColor: 'bg-orange-500/10 border-orange-500/20' }
        };
        return configs[status] || configs.PENDING;
    };

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        preparing: orders.filter(o => o.status === 'CONFIRMED').length,
        shipped: orders.filter(o => o.status === 'SHIPPED').length,
        totalRevenue: orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'RETURNED').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const toggleOrderSelect = (orderId: string) => {
        setSelectedOrders(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    const handlePipelineStatus = async (orderId: string, status: string) => {
        await updateStatus(orderId, status);
        fetchOrders();
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20 max-w-full overflow-x-hidden">
            {/* Durum Bazlı Akış Pipeline */}
            <OrderPipeline
                orders={orders}
                counts={orderPipeline}
                loading={loading}
                onStatusChange={handlePipelineStatus}
            />

            {/* Header & Hızlı Aksiyonlar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">Sipariş Yönetimi</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Tüm pazaryerlerinden gelen siparişlerinizi tek ekrandan yönetin</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-card border border-border/70 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:border-indigo-500/50"
                    >
                        <option value="today">Bugün</option>
                        <option value="week">Bu Hafta</option>
                        <option value="month">Bu Ay</option>
                        <option value="custom">Tüm Zamanlar</option>
                    </select>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border/70 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-all shadow-2xs">
                        <Download size={13} /> Rapor İndir
                    </button>
                    <button onClick={fetchOrders} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all shadow-xs">
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Senkronize Et
                    </button>
                </div>
            </div>

            {/* Pazaryeri Şerit Rozetleri */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pazaryerine Göre Filtrele</span>
                    {selectedPlatform !== 'Tümü' && (
                        <button
                            onClick={() => setSelectedPlatform('Tümü')}
                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Filtreyi Temizle (Tümü)
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-11 gap-2">
                    {MARKETPLACE_LIST.map((m) => {
                        const count = orders.filter(o => o.platform?.toUpperCase() === m.name).length;
                        const isActive = selectedPlatform === m.name;
                        const logoUrl = getPlatformLogoByKey(m.name);

                        return (
                            <button
                                key={m.name}
                                type="button"
                                onClick={() => setSelectedPlatform(isActive ? 'Tümü' : m.name)}
                                className={`group p-2 rounded-lg border transition-all text-left flex items-center justify-between gap-1.5 min-w-0 shadow-2xs ${
                                    isActive
                                        ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-xs'
                                        : 'bg-card border-border/70 hover:border-border hover:shadow-xs'
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 p-0.5 border border-border/50 flex items-center justify-center shrink-0">
                                        <img
                                            src={logoUrl}
                                            alt={m.label}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-foreground truncate">{m.label}</span>
                                </div>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full shrink-0 tabular-nums ${
                                    count > 0 ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : 'bg-muted text-muted-foreground'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* KPI İstatistik Kartları */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dash-card p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-500">
                            <ShoppingBag size={16} />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tümü</span>
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-foreground tracking-tight tabular-nums">{stats.total}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-normal">Toplam Sipariş</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="dash-card p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-500">
                            <Clock size={16} />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-amber-500">Onay Bekliyor</span>
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-foreground tracking-tight tabular-nums">{stats.pending}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-normal">Bekleyen Sipariş</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="dash-card p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-500">
                            <Package size={16} />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-blue-500">Paketleniyor</span>
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-foreground tracking-tight tabular-nums">{stats.preparing}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-normal">Hazırlanan Sipariş</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="dash-card p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center text-violet-500">
                            <Truck size={16} />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-violet-500">Yolda</span>
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-foreground tracking-tight tabular-nums">{stats.shipped}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-normal">Kargodaki Sipariş</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="dash-card p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-500">
                            <CreditCard size={16} />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-500">Net Ciro</span>
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-foreground tracking-tight tabular-nums">₺{stats.totalRevenue.toLocaleString('tr-TR')}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-normal">Toplam Ciro</div>
                </motion.div>
            </div>

            {/* Toplu İşlem Çubuğu */}
            {selectedOrders.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/10 border border-primary/20 p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs"
                >
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center">
                            {selectedOrders.length}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-foreground">sipariş seçildi</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs">
                            <Printer size={13} /> Toplu GİB E-Fatura
                        </button>
                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs">
                            <Package size={13} /> Kargo Etiketi
                        </button>
                        <button className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs">
                            <Truck size={13} /> Kargoya Ver
                        </button>
                        <button onClick={() => setSelectedOrders([])} className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-foreground">
                            Vazgeç
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Arama & Durum Filtreleme */}
            <div className="bg-surface p-3.5 sm:p-4 rounded-2xl border border-border space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 relative min-w-0">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Sipariş no (#TY-...), müşteri adı veya adres ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-primary/60 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-border/50">
                    <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1">Durum:</span>
                    {statusFilterOptions.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setSelectedStatus(s.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                                selectedStatus === s.key
                                    ? 'bg-foreground text-background shadow-xs'
                                    : 'bg-background text-slate-600 dark:text-slate-400 hover:bg-surface border border-border/80'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Siparişler Listesi */}
            <div className="space-y-3">
                {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const isExpanded = expandedOrder === order.id;
                    const logoUrl = getPlatformLogoByKey(order.platform);

                    return (
                        <motion.div
                            key={order.id}
                            layout
                            className={`bg-surface border rounded-2xl overflow-hidden transition-all shadow-xs ${
                                isExpanded ? 'border-primary/40 ring-1 ring-primary/20 shadow-sm' : 'border-border hover:border-border/90'
                            }`}
                        >
                            <div
                                className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            >
                                {/* Sol: Checkbox + Platform Logosu + Sipariş No */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.includes(order.id)}
                                        onChange={() => toggleOrderSelect(order.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary shrink-0"
                                    />
                                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 p-0.5 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                                        <img
                                            src={logoUrl}
                                            alt={order.platform}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight tabular-nums block truncate">
                                            #{order.marketplaceOrderId || order.id}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-500">{order.platform}</span>
                                    </div>
                                </div>

                                {/* Orta: Müşteri & Tarih */}
                                <div className="min-w-0 flex-1 md:px-4">
                                    <div className="text-xs sm:text-sm font-bold text-foreground truncate">{order.customerName}</div>
                                    <div className="text-[10px] text-slate-500 font-medium">{formatDate(order.orderDate || (order as any).createdAt)}</div>
                                </div>

                                {/* Sağ: Durum + Tutar + Butonlar */}
                                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${statusConfig.bgColor} ${statusConfig.color}`}>
                                        {statusConfig.icon}
                                        <span>{statusConfig.label}</span>
                                    </div>

                                    <div className="text-right min-w-[80px]">
                                        <div className="text-xs sm:text-sm font-black text-foreground tabular-nums">
                                            ₺{Number(order.totalAmount || 0).toLocaleString('tr-TR')}
                                        </div>
                                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            {order.paymentStatus === 'PAID' ? 'ÖDENDİ' : 'BEKLİYOR'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            title="Fatura Kes"
                                            className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 rounded-lg text-xs font-bold transition-all"
                                        >
                                            <Printer size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            title="Kargo Etiketi"
                                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20 rounded-lg text-xs font-bold transition-all"
                                        >
                                            <Truck size={13} />
                                        </button>
                                    </div>

                                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {/* Açılır Sipariş Detayı */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-border bg-background/50"
                                    >
                                        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                            <div className="lg:col-span-8 space-y-4">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sipariş İçeriği & Kalemleri</h4>
                                                <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-2xs">
                                                    <table className="w-full text-xs sm:text-sm">
                                                        <thead className="bg-background/80 border-b border-border text-[11px] font-bold text-slate-500 uppercase">
                                                            <tr>
                                                                <th className="px-4 py-2.5 text-left">Ürün Adı</th>
                                                                <th className="px-3 py-2.5 text-center">Adet</th>
                                                                <th className="px-3 py-2.5 text-right">Birim Fiyat</th>
                                                                <th className="px-4 py-2.5 text-right">Toplam</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {(order.items || []).map((item, i: number) => (
                                                                <tr key={i} className="hover:bg-surface/50">
                                                                    <td className="px-4 py-2.5 font-semibold text-foreground">{item.title}</td>
                                                                    <td className="px-3 py-2.5 text-center tabular-nums">{item.quantity}</td>
                                                                    <td className="px-3 py-2.5 text-right tabular-nums">₺{Number(item.unitPrice).toLocaleString('tr-TR')}</td>
                                                                    <td className="px-4 py-2.5 text-right font-bold tabular-nums">₺{(item.quantity * Number(item.unitPrice)).toLocaleString('tr-TR')}</td>
                                                                </tr>
                                                            ))}
                                                            {(!order.items || order.items.length === 0) && (
                                                                <tr>
                                                                    <td colSpan={4} className="px-4 py-3 text-center text-slate-400">Ürün detayı bulunamadı</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            <div className="lg:col-span-4 space-y-4">
                                                <div className="bg-surface p-4 rounded-xl border border-border space-y-3 shadow-2xs">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teslimat & Müşteri</h4>
                                                    <div className="space-y-2.5 text-xs">
                                                        <div className="flex items-start gap-2">
                                                            <User size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-foreground">{order.customerName}</div>
                                                                <div className="text-slate-500 truncate">{order.customerEmail}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <Phone size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                                            <div className="text-slate-600 dark:text-slate-300 font-medium">
                                                                {(order as any).customerPhone || '+90 (Bilgi yok)'}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                                            <div className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                                                {(order as any).shippingAddress || 'Adres bilgisi mevcut değil'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary/90 transition-all">
                                                        <Printer size={13} /> Fatura Yazdır
                                                    </button>
                                                    <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-slate-600 hover:text-foreground transition-all">
                                                        <ExternalLink size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}

                {orders.length === 0 && !loading && (
                    <div className="p-12 sm:p-16 text-center bg-surface border border-border border-dashed rounded-3xl">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <ShoppingBag className="text-slate-400" size={28} />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground">Sipariş Bulunamadı</h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs mx-auto mt-1">
                            Seçili filtre kriterlerine uygun herhangi bir sipariş bulunamadı.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
