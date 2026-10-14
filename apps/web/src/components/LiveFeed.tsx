'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShoppingCart, AlertCircle, CheckCircle2, RefreshCcw, Truck, MessageSquare, Boxes, Zap, Loader2, X } from 'lucide-react';
import { useActivityFeed, useAiSummary } from '@/lib/hooks';

interface LiveFeedProps {
    isOpen: boolean;
    onToggle: () => void;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
    order: { icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    sale: { icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    stock: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    shipping: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    review: { icon: MessageSquare, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    campaign: { icon: Boxes, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    system: { icon: RefreshCcw, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export default function LiveFeed({ isOpen, onToggle }: LiveFeedProps) {
    const { data: activities, loading: feedLoading } = useActivityFeed(8);
    const { data: aiSummary, loading: summaryLoading } = useAiSummary();

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMins < 1) return 'Az önce';
        if (diffInMins < 60) return `${diffInMins} dk önce`;
        if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)} sa önce`;
        return date.toLocaleDateString('tr-TR');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ width: 0, opacity: 0, x: 20 }}
                    animate={{ width: 320, opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="border-l border-border bg-card/60 backdrop-blur-md sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden xl:flex flex-col p-4 sm:p-5 z-30"
                >
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2">
                            <Activity size={15} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Canlı Akış</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <button
                                onClick={onToggle}
                                className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                title="Kapat"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

            <div className="space-y-4 flex-1">
                {feedLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2.5 opacity-60">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[11px] font-medium text-muted-foreground">Yükleniyor…</span>
                    </div>
                ) : activities && activities.length > 0 ? (
                    activities.map((activity, idx) => {
                        const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.system;
                        const Icon = config.icon;

                        return (
                            <motion.div
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                key={activity.id}
                                className="relative pl-6 group"
                            >
                                {/* Line */}
                                {idx !== activities.length - 1 && (
                                    <div className="absolute left-[11px] top-5 bottom-[-20px] w-px bg-border group-hover:bg-indigo-500/30 transition-colors" />
                                )}

                                <div className={`absolute left-0 top-0.5 w-5 h-5 rounded-md ${config.bg} flex items-center justify-center border border-border/40`}>
                                    <Icon size={11} className={config.color} />
                                </div>

                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-foreground leading-snug">
                                        {activity.title}
                                        {activity.value && <span className="ml-1 text-indigo-600 dark:text-indigo-400">({activity.value})</span>}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground line-clamp-1">{activity.description}</p>
                                    <span className="text-[10px] font-normal text-muted-foreground/80">{formatTime(activity.time)}</span>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 px-2 border border-dashed border-border/70 rounded-xl bg-muted/20">
                        <Activity className="w-5 h-5 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-xs font-medium text-foreground">Henüz aktivite bulunmuyor</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Yeni sipariş ve işlemler burada listelenir</p>
                    </div>
                )}
            </div>

            <div className="mt-auto pt-6">
                <AnimatePresence mode="wait">
                    {summaryLoading ? (
                        <div className="h-16 bg-muted/40 rounded-xl animate-pulse" />
                    ) : aiSummary?.predictionText && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3"
                        >
                            <div className="flex items-center gap-1.5 mb-1">
                                <Zap className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">AI İçgörüsü</p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                "{aiSummary.predictionText}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )}
</AnimatePresence>
    );
}
