"use client";
import { NotificationProvider } from '@/providers/notification-provider';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Package, Sparkles, ChevronRight, Zap, ChevronDown, Lock, Crown } from 'lucide-react';
import { getSidebarSections, getPageTitle } from '@/lib/navigation.config';
import { filterNavSections } from '@/lib/rbac/nav-access';
import { resolveNavIcon } from '@/lib/navigation-icons';
import { DashboardRouteGuard } from '@/components/dashboard/DashboardRouteGuard';
import LiveFeed from '@/components/LiveFeed';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ModuleProvider, useModules, useAnnouncements } from '@/lib/modules';
import { useOrderStats } from '@/lib/hooks';
import { AnnouncementBanner } from '@/components/announcements/AnnouncementComponents';
import { DashboardHeaderBar } from '@/components/dashboard/DashboardHeaderBar';
import { useTheme } from '@/providers/theme-provider';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '@/components/dashboard/KeyboardShortcuts';
import { WebSocketProvider } from '@/providers/websocket-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import MobileSidebar from '@/components/dashboard/MobileSidebar';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { QuickActionsProvider, useQuickActions } from '@/providers/quick-actions-provider';
import AICopilot from '@/components/dashboard/AICopilot';
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const { hasModuleAccess, tenantPlan, enabledModules, allModules, panelRole, criticalStockCount } = useModules();
    const sidebarSections = useMemo(() => filterNavSections(getSidebarSections(), panelRole), [panelRole]);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(['Günlük', 'Büyüme', 'Operasyon', 'Finans', 'Sistem', 'Kişisel']));
    const { data: orderStats } = useOrderStats();
    const { active: activeAnnouncements, unreadCount, markAsRead, dismiss } = useAnnouncements();
    const { theme, toggleTheme, resolvedMode } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isCompactHeader, setIsCompactHeader] = useState(false);
    const [showLiveFeed, setShowLiveFeed] = useState(true);
    const [platformTransitionDuration, setPlatformTransitionDuration] = useState(0.24);
    const prefersReducedMotion = useReducedMotion();
    const shouldReduceMotion = prefersReducedMotion || !theme.animations;
    const { openQuickSale, openAddProduct } = useQuickActions();
    const [creditMenuOpen, setCreditMenuOpen] = useState(false);
    useKeyboardShortcuts();

    const currentPageTitle = useMemo(() => getPageTitle(pathname ?? '/dashboard'), [pathname]);

    const activeModuleCount = useMemo(() => {
        if (Array.isArray(enabledModules) && enabledModules.length > 0) return enabledModules.length;
        if (!Array.isArray(allModules)) return 0;
        return allModules.filter((m) => hasModuleAccess(m.key)).length;
    }, [enabledModules, allModules, hasModuleAccess]);

    const triggerHaptic = () => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(8);
        }
    };

    // Auth guard - redirect to login if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login?callbackUrl=' + encodeURIComponent(pathname ?? '/dashboard'));
        }
    }, [status, router, pathname]);

    useEffect(() => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            sidebarSections.forEach((section) => next.add(section.title));
            return next;
        });
    }, [sidebarSections]);

    useEffect(() => {
        const activeSection = sidebarSections.find(s => s.items.some(i => i.href === pathname || (pathname?.startsWith(i.href) && i.href !== '/dashboard')));
        if (activeSection) {
            setExpandedSections((prev) => new Set(prev).add(activeSection.title));
        }
    }, [pathname, sidebarSections]);

    // Persist LiveFeed preference
    useEffect(() => {
        const saved = localStorage.getItem('dashboard_show_live_feed');
        if (saved !== null) {
            setShowLiveFeed(saved === 'true');
        }
    }, []);

    const toggleLiveFeed = () => {
        const newVal = !showLiveFeed;
        setShowLiveFeed(newVal);
        localStorage.setItem('dashboard_show_live_feed', String(newVal));
        triggerHaptic();
    };

    useEffect(() => {
        const onScroll = () => {
            setIsCompactHeader(window.scrollY > 24);
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        if (isIOS) {
            setPlatformTransitionDuration(0.3);
            return;
        }

        if (isAndroid) {
            setPlatformTransitionDuration(0.22);
            return;
        }

        setPlatformTransitionDuration(0.24);
    }, []);

    // Show loading skeleton while checking auth status
    if (status !== 'authenticated' || !session) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-11 h-11">
                        <div className="absolute inset-0 rounded-full border-2 border-border" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                        Oturum doğrulanıyor…
                    </p>
                </div>
            </div>
        );
    }

    const toggleSection = (title: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title);
            else next.add(title);
            return next;
        });
    };

    return (
        <div className="dashboard-pro dashboard-mobile-shell flex min-h-[100dvh] bg-background text-foreground font-sans selection:bg-indigo-500/20 overflow-x-hidden relative" data-dashboard data-theme-style={theme.themeStyle || 'default'}>
            {/* Sidebar - sadece desktop'ta görünür */}
            <aside
                role="navigation"
                aria-label="Ana menü"
                className="hidden lg:flex w-[17.5rem] flex-col fixed inset-y-0 z-50 border-r border-border"
                style={{ background: 'var(--dash-sidebar-bg)' }}
            >
                <div className="px-5 py-4 border-b border-border/70">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs group-hover:bg-indigo-500 transition-colors">
                            <span className="text-sm font-semibold text-white">P</span>
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-semibold tracking-tight text-foreground block truncate">Pazar Yönetimi</span>
                            <span className="text-[11px] font-medium text-muted-foreground">İşletme Paneli</span>
                        </div>
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-3 border-b border-border/60">
                    <div className="flex gap-2">
                        <button
                            onClick={openQuickSale}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                        >
                            <Zap size={13} /> Hızlı Satış
                        </button>
                        <button
                            onClick={openAddProduct}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-muted/60 hover:bg-muted text-foreground border border-border/70 rounded-lg text-xs font-medium transition-colors"
                        >
                            <Package size={13} /> Ürün Ekle
                        </button>
                    </div>
                </div>

                <div className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {sidebarSections.map((section) => (
                        <div key={section.title} className="mb-1">
                            <button
                                onClick={() => toggleSection(section.title)}
                                aria-expanded={expandedSections.has(section.title)}
                                aria-controls={`nav-section-${section.title}`}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                            >
                                {section.title}
                                <ChevronDown
                                    size={13}
                                    aria-hidden="true"
                                    className={`transition-transform duration-200 ${expandedSections.has(section.title) ? 'rotate-180' : ''}`}
                                />
                            </button>
                            <AnimatePresence>
                                {expandedSections.has(section.title) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden"
                                    >
                                        {section.items.map((item) => {
                                            const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/dashboard');
                                            const ItemIcon = resolveNavIcon(item.icon);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors group mb-0.5 text-xs ${isActive
                                                        ? 'bg-muted text-foreground font-semibold shadow-xs'
                                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                                        }`}
                                                >
                                                    <ItemIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground group-hover:text-foreground transition-colors'}`} />
                                                    <span className="flex-1 truncate">{item.label}</span>
                                                    {item.label === 'Siparişler' ? (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                            {orderStats?.today?.total || '0'}
                                                        </span>
                                                    ) : item.id === 'inventory' && criticalStockCount > 0 ? (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                            {criticalStockCount}
                                                        </span>
                                                    ) : item.badge && (
                                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${item.badge === '!'
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    {item.pro && !hasModuleAccess(item.moduleKey || '') && (
                                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 uppercase flex items-center gap-1">
                                                            <Lock size={8} /> Pro
                                                        </span>
                                                    )}
                                                    {item.pro && hasModuleAccess(item.moduleKey || '') && (
                                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
                                                            <Crown size={8} /> Aktif
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                <div className="p-3.5 mt-auto border-t border-border/60">
                    <div className="rounded-xl p-3.5 border border-border/70 bg-muted/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={12} className="text-indigo-500" />
                            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">{tenantPlan} Plan</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2.5">
                            {activeModuleCount}/{allModules.length} modül aktif
                        </p>
                        <div className="w-full bg-muted h-1 rounded-full overflow-hidden mb-2">
                            <div
                                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.round((activeModuleCount / Math.max(allModules.length, 1)) * 100))}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                            <span>Kullanım</span>
                            <Link href="/dashboard/upgrade" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Yükselt</Link>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 max-w-full lg:ml-[17.5rem] flex flex-col min-h-[100dvh] overflow-x-hidden relative">
                {theme.themeStyle === 'nexora' && (
                    <div className="nexora-dot-pattern fixed inset-0 pointer-events-none z-0" />
                )}
                <DashboardHeaderBar
                    currentPageTitle={currentPageTitle}
                    isCompactHeader={isCompactHeader}
                    session={session}
                    tenantPlan={tenantPlan}
                    creditMenuOpen={creditMenuOpen}
                    setCreditMenuOpen={setCreditMenuOpen}
                    profileMenuOpen={profileMenuOpen}
                    setProfileMenuOpen={setProfileMenuOpen}
                    showLiveFeed={showLiveFeed}
                    toggleLiveFeed={toggleLiveFeed}
                    resolvedMode={resolvedMode}
                    toggleTheme={toggleTheme}
                    triggerHaptic={triggerHaptic}
                    activeAnnouncements={activeAnnouncements}
                    unreadCount={unreadCount}
                    markAsRead={markAsRead}
                    dismiss={dismiss}
                />

                {/* Content with Sidebar */}
                <div className="flex flex-1 flex-col lg:flex-row min-h-0 min-w-0 max-w-full overflow-x-hidden">
                    <main id="main-content" role="main" aria-label="Ana içerik" className="dashboard-mobile-content flex-1 min-w-0 max-w-full p-3.5 sm:p-4 lg:p-8 overflow-x-hidden pb-24 lg:pb-8">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={pathname}
                                className="w-full max-w-full min-w-0 overflow-x-hidden"
                                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.995 }}
                                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.995 }}
                                transition={{ duration: shouldReduceMotion ? 0.01 : platformTransitionDuration, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Announcement Banner - Sabit Duyurular */}
                                <AnnouncementBanner
                                    announcements={activeAnnouncements}
                                    onDismiss={dismiss}
                                    onRead={markAsRead}
                                />
                                <DashboardRouteGuard>{children}</DashboardRouteGuard>
                            </motion.div>
                        </AnimatePresence>
                    </main>
                    <LiveFeed isOpen={showLiveFeed} onToggle={toggleLiveFeed} />
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav onMenuOpen={() => setMobileMenuOpen(true)} onHaptic={triggerHaptic} />

            {/* Mobile Sidebar Drawer */}
            <MobileSidebar
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                onHaptic={triggerHaptic}
            />

            <KeyboardShortcutsHelp />
            <AICopilot />
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ModuleProvider>
            <WebSocketProvider>
                <ToastProvider>
                    <QuickActionsProvider>
                        <ErrorBoundary>
                            <OnboardingProvider>
                                <NotificationProvider><DashboardLayoutContent>{children}</DashboardLayoutContent></NotificationProvider>
                            </OnboardingProvider>
                        </ErrorBoundary>
                    </QuickActionsProvider>
                </ToastProvider>
            </WebSocketProvider>
        </ModuleProvider>
    );
}
