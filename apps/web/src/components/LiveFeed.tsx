'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, ShoppingCart, AlertCircle, CheckCircle2, 
    RefreshCcw, Truck, MessageSquare, Boxes, Zap, Loader2, 
    X, Play, Pause, ArrowUp, Sparkles, ChevronUp
} from 'lucide-react';
import { useActivityFeed, useAiSummary } from '@/lib/hooks';
import { REALISTIC_ACTIVITIES } from '@/lib/marketplace-seed-data';

interface LiveFeedProps {
    isOpen: boolean;
    onToggle: () => void;
}

interface ActivityEvent {
    id: string;
    type: 'order' | 'sale' | 'stock' | 'shipping' | 'review' | 'campaign' | 'system';
    title: string;
    description: string;
    time: string;
    platform?: string;
    value?: string;
    action?: string;
    status?: 'success' | 'info' | 'warning' | 'error';
    isNew?: boolean;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
    order: { icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    sale: { icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    stock: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    shipping: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    review: { icon: MessageSquare, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    campaign: { icon: Boxes, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    system: { icon: RefreshCcw, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

const PLATFORM_BADGES: Record<string, string> = {
    Trendyol: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    Hepsiburada: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    Amazon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    N11: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    'E-Fatura': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    Depo: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    'Multi-Channel': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

export default function LiveFeed({ isOpen, onToggle }: LiveFeedProps) {
    const { data: rawActivities, loading: feedLoading } = useActivityFeed(12);
    const { data: aiSummary, loading: summaryLoading } = useAiSummary();
    
    // Auto-scroll flow state
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [feedItems, setFeedItems] = useState<ActivityEvent[]>([]);

    // Initialize with activities or seed data immediately so user never sees a blank spinner
    useEffect(() => {
        if (rawActivities && rawActivities.length > 0) {
            setFeedItems(rawActivities as ActivityEvent[]);
        } else if (REALISTIC_ACTIVITIES && REALISTIC_ACTIVITIES.length > 0) {
            setFeedItems(REALISTIC_ACTIVITIES as ActivityEvent[]);
        }
    }, [rawActivities]);

    // Simulated real-time incoming events every ~14 seconds
    useEffect(() => {
        const liveSimulations: ActivityEvent[] = [
            {
                id: `live-sim-1-${Date.now()}`,
                type: 'order',
                title: 'Yeni Sipariş',
                description: 'Buse T. - Apple AirPods Pro 2. Nesil',
                time: 'Az önce',
                platform: 'Trendyol',
                value: '₺9.499',
                status: 'success',
                isNew: true
            },
            {
                id: `live-sim-2-${Date.now()}`,
                type: 'shipping',
                title: 'Kargo Yola Çıktı',
                description: '#AMZ-30918 Kolay Gelsin kuryeye zimmetlendi',
                time: 'Az önce',
                platform: 'Amazon',
                status: 'info',
                isNew: true
            },
            {
                id: `live-sim-3-${Date.now()}`,
                type: 'sale',
                title: 'Buy Box Koruması',
                description: 'S24 Ultra için fiyat rakip seviyesine eşitlendi',
                time: 'Az önce',
                platform: 'Hepsiburada',
                value: '₺57.499',
                status: 'success',
                isNew: true
            },
            {
                id: `live-sim-4-${Date.now()}`,
                type: 'review',
                title: '5 Yıldızlı Yorum',
                description: 'Selin A. - "Süper hızlı kargo, orijinal ambalaj"',
                time: 'Az önce',
                platform: 'Trendyol',
                status: 'success',
                isNew: true
            }
        ];

        let index = 0;
        const interval = setInterval(() => {
            const nextItem = liveSimulations[index % liveSimulations.length];
            setFeedItems(prev => {
                const updated = [ { ...nextItem, id: `live-${Date.now()}` }, ...prev.slice(0, 15) ];
                return updated;
            });
            index++;
        }, 16000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (timeStr: string) => {
        if (!timeStr) return 'Az önce';
        if (timeStr.includes('önce') || timeStr === 'Az önce') return timeStr;
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return timeStr;
        const now = new Date();
        const diffInMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        if (diffInMins < 1) return 'Az önce';
        if (diffInMins < 60) return `${diffInMins} dk önce`;
        if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)} sa önce`;
        return date.toLocaleDateString('tr-TR');
    };

    // Duplicate list for seamless infinite upward scroll looping
    const duplicatedFeed = useMemo(() => {
        const base = feedItems.length > 0 ? feedItems : (REALISTIC_ACTIVITIES as ActivityEvent[]);
        return [...base, ...base];
    }, [feedItems]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.aside
                    initial={{ width: 0, opacity: 0, x: 20 }}
                    animate={{ width: 330, opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="border-l border-border/80 bg-card/70 backdrop-blur-md sticky top-16 h-[calc(100vh-4rem)] hidden xl:flex flex-col z-30 select-none overflow-hidden"
                >
                    {/* Inline CSS animation for hardware-accelerated infinite upward scroll */}
                    <style>{`
                        @keyframes liveFeedUpwardFlow {
                            0% {
                                transform: translateY(0%);
                            }
                            100% {
                                transform: translateY(-50%);
                            }
                        }
                        .live-feed-flow-track {
                            animation: liveFeedUpwardFlow 38s linear infinite;
                            will-change: transform;
                        }
                        .live-feed-flow-track.is-paused {
                            animation-play-state: paused !important;
                        }
                    `}</style>

                    {/* Header */}
                    <div className="p-4 border-b border-border/70 flex items-center justify-between bg-card/90 z-20">
                        <div className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center">
                                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                                    <span>CANLI AKIŞ</span>
                                    {isAutoScroll && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-xs text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            <ArrowUp className="w-2.5 h-2.5 animate-bounce" /> YUKARI AKAN
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {isHovered ? 'Fareniz üzerinde (Durduruldu)' : isAutoScroll ? 'Otomatik yukarı akış aktif' : 'Sabit liste modu'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Toggle Auto Flow / Pause */}
                            <button
                                onClick={() => setIsAutoScroll(!isAutoScroll)}
                                className={`p-1.5 rounded-md border text-xs font-medium transition-colors ${
                                    isAutoScroll 
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                        : 'border-border/70 bg-card text-muted-foreground hover:text-foreground'
                                }`}
                                title={isAutoScroll ? 'Akışı Duraklat (Manuel Liste)' : 'Yukarı Akışı Başlat'}
                            >
                                {isAutoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            </button>

                            {/* Close sidebar */}
                            <button
                                onClick={onToggle}
                                className="p-1.5 rounded-md border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Kapat"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Middle Section: Upward Flowing Ticker Viewport */}
                    <div 
                        className="relative flex-1 overflow-hidden"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Top Gradient Fade (Items fade out as they reach the top) */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-card via-card/80 to-transparent z-10" />

                        {/* Bottom Gradient Fade (Items fade in from the bottom) */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card via-card/80 to-transparent z-10" />

                        {/* Hover Pause Hint Badge */}
                        <AnimatePresence>
                            {isHovered && isAutoScroll && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-2 py-0.5 rounded-full bg-background/90 border border-border/80 text-[10px] font-medium text-foreground shadow-xs flex items-center gap-1"
                                >
                                    <Pause className="w-2.5 h-2.5 text-amber-500" />
                                    <span>İncelemek için duraklatıldı</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Scroll Content Container */}
                        {isAutoScroll ? (
                            /* INFINITE UPWARD TICKER */
                            <div className={`p-4 space-y-3 live-feed-flow-track ${isHovered ? 'is-paused' : ''}`}>
                                {duplicatedFeed.map((activity, idx) => {
                                    const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.system;
                                    const Icon = config.icon;
                                    const platformBadgeClass = activity.platform 
                                        ? (PLATFORM_BADGES[activity.platform] || 'bg-muted text-foreground border-border/70') 
                                        : null;

                                    return (
                                        <div
                                            key={`${activity.id}-${idx}`}
                                            className="group relative p-2.5 rounded-xl border border-border/70 bg-card/90 hover:bg-card hover:border-primary/40 hover:shadow-2xs transition-all duration-200"
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <div className={`p-1.5 rounded-lg ${config.bg} ${config.color} shrink-0 mt-0.5 border border-border/40`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center justify-between gap-1.5">
                                                        <span className="text-xs font-semibold text-foreground tracking-tight truncate">
                                                            {activity.title}
                                                        </span>
                                                        {activity.value && (
                                                            <span className="text-2xs font-semibold text-primary tabular-nums shrink-0 font-mono">
                                                                {activity.value}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-2xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {activity.description}
                                                    </p>

                                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                                                        {platformBadgeClass && (
                                                            <span className={`px-1.5 py-0.2 rounded-md font-medium text-[9px] border ${platformBadgeClass}`}>
                                                                {activity.platform}
                                                            </span>
                                                        )}
                                                        <span className="text-muted-foreground/80 font-mono ml-auto">
                                                            {formatTime(activity.time)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* MANUAL SCROLLABLE LIST */
                            <div className="p-4 space-y-3 h-full overflow-y-auto">
                                {feedItems.map((activity) => {
                                    const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.system;
                                    const Icon = config.icon;
                                    const platformBadgeClass = activity.platform 
                                        ? (PLATFORM_BADGES[activity.platform] || 'bg-muted text-foreground border-border/70') 
                                        : null;

                                    return (
                                        <div
                                            key={activity.id}
                                            className="p-2.5 rounded-xl border border-border/70 bg-card/90 hover:bg-card hover:border-primary/40 transition-colors space-y-1"
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <div className={`p-1.5 rounded-lg ${config.bg} ${config.color} shrink-0 mt-0.5 border border-border/40`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-0.5">
                                                    <div className="flex items-center justify-between gap-1.5">
                                                        <span className="text-xs font-semibold text-foreground truncate">
                                                            {activity.title}
                                                        </span>
                                                        {activity.value && (
                                                            <span className="text-2xs font-semibold text-primary tabular-nums shrink-0 font-mono">
                                                                {activity.value}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-2xs text-muted-foreground line-clamp-2">
                                                        {activity.description}
                                                    </p>

                                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                                                        {platformBadgeClass && (
                                                            <span className={`px-1.5 py-0.2 rounded-md font-medium text-[9px] border ${platformBadgeClass}`}>
                                                                {activity.platform}
                                                            </span>
                                                        )}
                                                        <span className="text-muted-foreground/80 font-mono ml-auto">
                                                            {formatTime(activity.time)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bottom Pinned Section: AI Insights */}
                    <div className="p-3.5 border-t border-border/70 bg-card/95 z-20">
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                                        AI Canlı İçgörü
                                    </p>
                                </div>
                                <span className="text-[9px] text-muted-foreground font-mono">Canlı</span>
                            </div>
                            <p className="text-2xs text-foreground/85 leading-relaxed italic line-clamp-2">
                                &ldquo;{aiSummary?.predictionText || 'Trendyol ve Hepsiburada sipariş ivmesi %14 yukarı yönlü seyrediyor.'}&rdquo;
                            </p>
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
