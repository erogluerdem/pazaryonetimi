"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Tag,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Download,
    Search,
    Filter,
    Edit3,
    Eye,
    Clock,
    Zap,
    Target,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    ChevronDown,
    Globe,
    Settings,
    Sparkles
} from 'lucide-react';
import { useSession } from "next-auth/react";
import { usePricingAnalysis, PricingItem } from '@/lib/hooks';
import { getPricingRules, togglePricingRule } from '@/app/actions/pricing-rules';

interface PricingRule {
    id: string;
    name: string;
    description: string;
    active: boolean;
    products: number;
}

interface PricingPlatformData {
    price: number;
    buyBox: boolean;
    competitors: number[];
}

interface PricingProduct extends Omit<Partial<PricingItem>, 'id'> {
    id: string | number;
    name: string;
    sku: string;
    cost: number;
    myPrice: number;
    margin: number;
    status: string;
    image: string;
    platforms: Record<string, PricingPlatformData>;
    lastUpdate: string;
}

export default function PricingPage() {
    const { data: session } = useSession();
    const tenantId = (session?.user as any)?.tenantId || "";
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('all');
    const [editingProduct, setEditingProduct] = useState<number | null>(null);
    const [showRules, setShowRules] = useState(false);
    const [activePricingRules, setActivePricingRules] = useState<PricingRule[]>([]);
    const { analysis: apiPricing, loading } = usePricingAnalysis();

    const activeProducts = (Array.isArray(apiPricing) && apiPricing.length > 0) ? apiPricing : [];

    React.useEffect(() => {
        if (tenantId) {
            getPricingRules(tenantId).then(data => {
                setActivePricingRules(data);
            });
        }
    }, [tenantId]);

    const handleRuleToggle = async (ruleId: string, currentState: boolean) => {
        const newState = !currentState;
        // Optimistic UI update
        setActivePricingRules(prev => prev.map(r => r.id === ruleId ? { ...r, active: newState } : r));
        
        if (tenantId) {
            const result = await togglePricingRule(tenantId, ruleId, newState);
            if (!result.success) {
                // Revert if failed
                setActivePricingRules(prev => prev.map(r => r.id === ruleId ? { ...r, active: currentState } : r));
            }
        }
    };

    const filteredProducts = (activeProducts as PricingProduct[]).filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'optimal': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'competitive': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'high': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'undercut': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'optimal': return 'Optimal';
            case 'competitive': return 'Rekabetçi';
            case 'high': return 'Yüksek';
            case 'undercut': return 'Alt Fiyatlı Rakip';
            default: return 'Bilinmiyor';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-slate-500">Fiyat verileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
                            Fiyat Yönetimi
                        </h1>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Akıllı fiyatlama ve rekabet analizi
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowRules(!showRules)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/80 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-xs"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Fiyat Kuralları
                    </button>
                    <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium text-white transition-colors shadow-xs"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Fiyat Önerisi
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 lg:gap-4">
                <div className="bg-card rounded-xl p-3 sm:p-3.5 border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Optimal Fiyat</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">42</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">ürün</div>
                </div>

                <div className="bg-card rounded-xl p-3 sm:p-3.5 border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Buy Box</span>
                        <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">%78</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">kazanım oranı</div>
                </div>

                <div className="bg-card rounded-xl p-3 sm:p-3.5 border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Yüksek Fiyat</span>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">15</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">ürün</div>
                </div>

                <div className="bg-card rounded-xl p-3 sm:p-3.5 border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Alt Fiyatlı</span>
                        <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">8</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">rakip var</div>
                </div>

                <div className="bg-card rounded-xl p-3 sm:p-3.5 border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">Ort. Kâr Marjı</span>
                        <BarChart3 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">%67.4</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">ortalama</div>
                </div>
            </div>

            {/* Pricing Rules Panel */}
            {showRules && (
                <div className="bg-card rounded-xl border border-border/70 p-4 shadow-xs">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Aktif Fiyatlama Kuralları
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activePricingRules.map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/60">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${rule.active ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                                    <div className="min-w-0">
                                        <h3 className="text-xs font-medium text-foreground truncate">{rule.name}</h3>
                                        <p className="text-[11px] text-muted-foreground truncate">{rule.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 shrink-0">
                                    <span className="text-[11px] text-muted-foreground">{rule.products} ürün</span>
                                    <div 
                                        className={`w-8 h-4.5 rounded-full transition-colors p-0.5 cursor-pointer ${rule.active ? 'bg-emerald-600' : 'bg-muted'}`}
                                        onClick={() => handleRuleToggle(rule.id, rule.active)}
                                    >
                                        <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${rule.active ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-card p-3 rounded-xl border border-border/70 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Ürün veya SKU ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-background rounded-lg text-xs text-foreground placeholder:text-muted-foreground border border-border/80 focus:border-emerald-500 focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="px-2.5 py-1.5 bg-background rounded-lg text-xs font-medium text-foreground border border-border/80 focus:border-emerald-500 focus:outline-none"
                    >
                        <option value="all">Tüm Platformlar</option>
                        <option value="trendyol">Trendyol</option>
                        <option value="hepsiburada">Hepsiburada</option>
                        <option value="amazon">Amazon</option>
                        <option value="n11">N11</option>
                    </select>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/80 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-xs">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Fiyat Tara</span>
                    </button>
                </div>
            </div>

            {/* Products Grid */}
            <div className="space-y-3">
                {filteredProducts.map((product) => (
                    <div
                        key={product.id}
                        className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden"
                    >
                        <div className="p-3.5 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="text-3xl shrink-0 p-1.5 rounded-lg bg-muted/40 border border-border/50">{product.image}</div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-foreground truncate">{product.name}</h3>
                                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.sku}</p>
                                        <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
                                            <div className="flex items-center gap-1">
                                                <span className="text-muted-foreground">Maliyet:</span>
                                                <span className="font-medium text-foreground">₺{product.cost}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-muted-foreground">Satış:</span>
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">₺{product.myPrice}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-muted-foreground">Marj:</span>
                                                <span className="font-medium text-purple-600 dark:text-purple-400">%{product.margin}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${getStatusColor(product.status)}`}>
                                        {getStatusText(product.status)}
                                    </span>
                                    <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Platform Prices */}
                            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {Object.entries(product.platforms).map(([platform, data]) => (
                                    <div
                                        key={platform}
                                        className={`p-2.5 rounded-lg border ${data.buyBox ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-muted/30 border-border/60'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-foreground capitalize">{platform}</span>
                                            {data.buyBox && (
                                                <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium rounded">
                                                    Buy Box ✓
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm font-semibold text-foreground tabular-nums">₺{data.price}</div>
                                        <div className="mt-1.5 pt-1.5 border-t border-border/40">
                                            <span className="text-[10px] text-muted-foreground">Rakipler:</span>
                                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                                {data.competitors.map((price: number, i: number) => (
                                                    <span
                                                        key={i}
                                                        className={`text-[10px] px-1 py-0.2 rounded font-medium ${price < data.price
                                                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        ₺{price}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>Son güncelleme: {product.lastUpdate}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium">
                                        <Zap className="w-3 h-3" />
                                        Otomatik Fiyatla
                                    </button>
                                    <button className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium">
                                        <Eye className="w-3 h-3" />
                                        Detay
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
