'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Sparkles, X, Zap, Lock, Crown, ChevronRight, ArrowUpRight } from 'lucide-react';
import { getMobileSections } from '@/lib/navigation.config';
import { filterNavSections } from '@/lib/rbac/nav-access';
import { resolveNavIcon } from '@/lib/navigation-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useModules } from '@/lib/modules';
import { useOrderStats } from '@/lib/hooks';
import { useQuickActions } from '@/providers/quick-actions-provider';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onHaptic?: () => void;
}


export default function MobileSidebar({ isOpen, onClose, onHaptic }: MobileSidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { hasModuleAccess, tenantPlan, panelRole, criticalStockCount } = useModules();
    const mobileSections = filterNavSections(getMobileSections(), panelRole);
    const { data: orderStats } = useOrderStats();
    const { openQuickSale, openAddProduct } = useQuickActions();
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Path değiştiğinde drawer'ı kapat
    useEffect(() => {
        onClose();
    }, [pathname]);

    // Body scroll'u kilitle
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] lg:hidden"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Drawer - sağdan açılan iOS/Android tarzı */}
                    <motion.div
                        ref={sidebarRef}
                        role="navigation"
                        aria-label="Mobil menü"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                        className="fixed inset-y-0 right-0 w-[85vw] max-w-[380px] bg-background z-[201] lg:hidden flex flex-col safe-area-top"
                    >
                        {/* Drawer Handle */}
                        <div className="flex items-center justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-border" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
                                    <span className="text-xs font-semibold text-white">P</span>
                                </div>
                                <div className="leading-tight">
                                    <span className="text-xs font-semibold tracking-tight text-foreground block">Pazar Yönetimi</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">İşletme Menüsü</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    onHaptic?.();
                                    onClose();
                                }}
                                aria-label="Menüyü kapat"
                                className="p-1.5 rounded-lg bg-muted/50 border border-border/70 text-muted-foreground hover:text-foreground active:scale-95 transition-all haptic-tap"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 py-3 border-b border-border/70">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        onHaptic?.();
                                        onClose();
                                        openQuickSale();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-xs active:scale-95 haptic-tap"
                                >
                                    <Zap size={13} /> Hızlı Satış
                                </button>
                                <button
                                    onClick={() => {
                                        onHaptic?.();
                                        onClose();
                                        openAddProduct();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-card hover:bg-muted text-foreground border border-border/70 rounded-lg text-xs font-medium transition-colors active:scale-95 haptic-tap"
                                >
                                    <Package size={13} /> Ürün Ekle
                                </button>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-3 mobile-scroll">
                            {mobileSections.map((section) => (
                                <div key={section.title}>
                                    <div className="px-2 mb-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                        {section.title}
                                    </div>
                                    <div className="space-y-0.5">
                                        {section.items.map((item) => {
                                            const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/dashboard');
                                            const ItemIcon = resolveNavIcon(item.icon);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={onHaptic}
                                                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors active:scale-[0.98] haptic-tap text-xs ${isActive
                                                        ? 'bg-muted text-foreground font-semibold shadow-xs'
                                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                                        }`}
                                                >
                                                    <ItemIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`} />
                                                    <span className="font-medium flex-1 truncate">{item.label}</span>
                                                    {item.label === 'Siparişler' ? (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                            {orderStats?.today?.total || '0'}
                                                        </span>
                                                    ) : item.id === 'inventory' && criticalStockCount > 0 ? (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                            {criticalStockCount}
                                                        </span>
                                                    ) : item.badge && (
                                                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-md ${item.badge === '!'
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    {item.pro && !hasModuleAccess(item.moduleKey || '') && (
                                                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/50 uppercase flex items-center gap-1">
                                                            <Lock size={8} /> Pro
                                                        </span>
                                                    )}
                                                    {item.pro && hasModuleAccess(item.moduleKey || '') && (
                                                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
                                                            <Crown size={8} /> Aktif
                                                        </span>
                                                    )}
                                                    <ChevronRight size={13} className={`flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-muted-foreground/60'}`} />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer - User & Plan */}
                        <div className="border-t border-border/70 p-3 space-y-2.5 safe-area-bottom">
                            {/* Plan */}
                            <div className="bg-card rounded-xl p-2.5 border border-border/70">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles size={11} className="text-indigo-500" />
                                        <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">{tenantPlan} Plan</span>
                                    </div>
                                    <Link href="/dashboard/upgrade" className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                                        Yükselt <ArrowUpRight size={10} />
                                    </Link>
                                </div>
                                <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 w-3/4 h-full rounded-full" />
                                </div>
                            </div>

                            {/* User */}
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/70">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white">
                                    {session?.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'AY'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-foreground truncate">{session?.user?.name || 'Kullanıcı'}</div>
                                    <div className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
