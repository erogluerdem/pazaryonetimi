"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
    ArrowRight, Moon, Sun, Menu, X, ChevronDown, ChevronRight, Search,
    Zap, BarChart3, Package, Users, Globe, Layers,
    BookOpen, Video, Calendar, Award, FileText, HelpCircle,
    Building2, Newspaper, Briefcase, Gift, MessageCircle, Heart, Target,
    ShoppingBag, Store, Boxes, TrendingUp, ClipboardList,
    Truck, CreditCard, Bell, Settings, Sparkles, Play,
    Rocket, Star, Brain, DollarSign, Shirt,
    Laptop, Apple, LayoutDashboard, LogOut
} from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// ─── Types ────────────────────────────────────────────
interface MegaMenuColumn {
    title: string;
    icon?: React.ElementType;
    items: {
        label: string;
        href: string;
        description?: string;
        icon?: React.ElementType;
        badge?: string;
        isNew?: boolean;
        color?: string;
    }[];
}

interface MegaMenuItem {
    label: string;
    megaMenu?: {
        tagline?: string;
        columns: MegaMenuColumn[];
        featured?: {
            title: string;
            description: string;
            href: string;
            image?: string;
            badge?: string;
            gradient?: string;
            stats?: { label: string; value: string }[];
        };
        bottomCTA?: {
            label: string;
            href: string;
            icon?: React.ElementType;
        };
    };
    href?: string;
}

// ─── Color Maps for Icons ─────────────────────────────
const iconColorMap: Record<string, { bg: string; text: string; hoverBg: string }> = {
    blue: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', hoverBg: 'group-hover/item:bg-orange-600' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', hoverBg: 'group-hover/item:bg-purple-600' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', hoverBg: 'group-hover/item:bg-emerald-600' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', hoverBg: 'group-hover/item:bg-orange-600' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', hoverBg: 'group-hover/item:bg-pink-600' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', hoverBg: 'group-hover/item:bg-teal-600' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', hoverBg: 'group-hover/item:bg-amber-600' },
    red: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', hoverBg: 'group-hover/item:bg-red-600' },
    indigo: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', hoverBg: 'group-hover/item:bg-orange-600' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', hoverBg: 'group-hover/item:bg-cyan-600' },
};

// ─── Navigation Data ──────────────────────────────────
const navLinks: MegaMenuItem[] = [
    {
        label: 'Platform',
        megaMenu: {
            tagline: 'Pazaryeri operasyonlarını tek merkezden yönetin',
            columns: [
                {
                    title: 'Pazaryeri Yönetimi',
                    icon: Globe,
                    items: [
                        { label: 'Çoklu Pazaryeri', href: '/entegrasyonlar', description: 'Trendyol, Hepsiburada, Amazon, N11', icon: Globe, color: 'blue' },
                        { label: 'Ürün Yönetimi', href: '/features/inventory', description: 'Toplu ürün ve varyant kontrolü', icon: Package, color: 'purple' },
                        { label: 'Sipariş Merkezi', href: '/features/automation', description: 'Tüm siparişler tek ekranda', icon: ShoppingBag, color: 'green' },
                        { label: 'Stok Senkronizasyonu', href: '/features/inventory', description: 'Gerçek zamanlı stok takibi', icon: Boxes, color: 'orange' },
                    ]
                },
                {
                    title: 'İşletme Araçları',
                    icon: BarChart3,
                    items: [
                        { label: 'Analitik & Raporlama', href: '/features/analytics', description: 'Satış performansı ve trendler', icon: BarChart3, color: 'teal' },
                        { label: 'Fiyatlandırma Motoru', href: '/features/pricing', description: 'Dinamik fiyat optimizasyonu', icon: TrendingUp, color: 'amber' },
                        { label: 'Kargo Yönetimi', href: '/features/integration', description: 'Entegre kargo çözümleri', icon: Truck, color: 'cyan' },
                        { label: 'Muhasebe Entegrasyonu', href: '/features/integration', description: 'e-Fatura ve e-Arşiv', icon: CreditCard, color: 'indigo' },
                    ]
                },
                {
                    title: 'Akıllı Araçlar',
                    icon: Brain,
                    items: [
                        { label: 'Yapay Zeka Asistanı', href: '/features/ai', description: 'SEO ve içerik optimizasyonu', icon: Brain, color: 'purple' },
                        { label: 'Dinamik Fiyatlandırma', href: '/features/pricing', description: 'Otomatik rakip takibi', icon: DollarSign, color: 'orange' },
                        { label: 'Gelişmiş Analitik', href: '/features/analytics', description: 'Satış ve karlılık raporları', icon: BarChart3, color: 'blue' },
                        { label: 'İş Akış Otomasyonu', href: '/features/automation', description: 'Tekrarlayan işleri sıfırlayın', icon: Zap, badge: 'Yeni', color: 'green' },
                    ]
                }
            ],
            featured: {
                title: 'Yapay Zeka Pulse',
                description: 'Tüm mağazalarınızın nabzını AI ile tutun. Fırsatları ve riskleri saniyeler içinde tespit edin.',
                href: '/features/ai',
                image: '/images/mega-featured-ai.jpg',
                stats: [
                    { label: 'Anlık analiz', value: '< 2 sn' },
                    { label: 'Aktif satıcı', value: '12K+' },
                ],
            },
            bottomCTA: {
                label: 'Tüm özellikleri keşfedin',
                href: '/features'
            }
        }
    },
    {
        label: 'Çözümler',
        megaMenu: {
            tagline: 'İşletmenizin ölçeğine ve sektörüne özel çözümler',
            columns: [
                {
                    title: 'İşletme Ölçeği',
                    icon: Target,
                    items: [
                        { label: 'Başlangıç', href: '/solutions/startup', description: 'Yeni e-ticaret girişimleri', icon: Rocket, color: 'green' },
                        { label: 'Büyüyen İşletmeler', href: '/solutions/sme', description: 'Ölçekleme aşamasındakiler', icon: TrendingUp, color: 'blue' },
                        { label: 'Kurumsal', href: '/solutions/enterprise', description: '1000+ SKU işletmeler', icon: Building2, badge: 'Özel', color: 'purple' },
                    ]
                },
                {
                    title: 'Sektörel Çözümler',
                    icon: Store,
                    items: [
                        { label: 'Moda & Tekstil', href: '/solutions/moda', description: 'Varyant ve sezon yönetimi', icon: Shirt, color: 'pink' },
                        { label: 'Elektronik', href: '/solutions/elektronik', description: 'Seri no ve garanti takibi', icon: Laptop, color: 'blue' },
                        { label: 'Kozmetik', href: '/solutions/kozmetik', description: 'SKT ve parti yönetimi', icon: Sparkles, color: 'purple' },
                        { label: 'Gıda', href: '/solutions/gida', description: 'Soğuk zincir ve FIFO', icon: Apple, color: 'green' },
                    ]
                },
                {
                    title: 'Kullanım Senaryoları',
                    icon: Layers,
                    items: [
                        { label: 'Dropshipping', href: '/solutions/dropshipping', description: 'Tedarikçi entegrasyonu', icon: Truck, color: 'orange' },
                        { label: 'Marka Satıcısı', href: '/solutions/brand', description: 'Tek marka çok kanal', icon: Award, color: 'amber' },
                        { label: 'Toptancı', href: '/solutions/wholesale', description: 'B2B ve B2C birlikte', icon: Layers, color: 'teal' },
                    ]
                }
            ],
            featured: {
                title: 'Başarı Hikayeleri',
                description: 'Müşterilerimizin %300 büyüme hikayelerini okuyun.',
                href: '/case-studies',
                badge: '50+ Hikaye',
                gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
                stats: [
                    { label: 'Ort. büyüme', value: '%214' },
                    { label: 'Memnuniyet', value: '4.9/5' },
                ],
            }
        }
    },
    {
        label: 'Kaynaklar',
        megaMenu: {
            tagline: 'Öğrenin, gelişin ve 7/24 destek alın',
            columns: [
                {
                    title: 'Öğrenin',
                    icon: BookOpen,
                    items: [
                        { label: 'Blog', href: '/blog', description: 'E-ticaret stratejileri', icon: FileText, color: 'blue' },
                        { label: 'Rehberler', href: '/resources', description: 'Detaylı kılavuzlar', icon: BookOpen, color: 'green' },
                        { label: 'Video Eğitimler', href: '/video-library', description: '50+ eğitim videosu', icon: Video, color: 'red' },
                        { label: 'Webinarlar', href: '/webinars', description: 'Canlı ve kayıtlı', icon: Calendar, isNew: true, color: 'purple' },
                    ]
                },
                {
                    title: 'Destek',
                    icon: HelpCircle,
                    items: [
                        { label: 'Yardım Merkezi', href: '/destek', description: 'SSS ve dökümanlar', icon: HelpCircle, color: 'teal' },
                        { label: 'API Dökümanları', href: '/docs/api', description: 'Geliştirici kaynakları', icon: ClipboardList, color: 'indigo' },
                        { label: 'Durum Sayfası', href: '/status', description: 'Sistem durumu', icon: Bell, color: 'amber' },
                        { label: 'İletişim', href: '/iletisim', description: '7/24 destek', icon: MessageCircle, color: 'cyan' },
                    ]
                },
                {
                    title: 'Topluluk',
                    icon: Users,
                    items: [
                        { label: 'Satıcı Topluluğu', href: '/community', description: '25K+ aktif üye', icon: Users, color: 'blue' },
                        { label: 'Partner Programı', href: '/partner', description: 'İş ortağımız olun', icon: Heart, color: 'pink' },
                        { label: 'Referans Programı', href: '/referral', description: '%20 komisyon kazanın', icon: Gift, color: 'orange' },
                    ]
                }
            ],
            featured: {
                title: '2026 E-ticaret Raporu',
                description: 'Türkiye e-ticaret trendleri ve pazaryeri analizleri.',
                href: '/resources/2026-rapor',
                badge: 'Yeni',
                gradient: 'from-orange-600 via-red-600 to-pink-600',
                stats: [
                    { label: 'Sayfa', value: '48' },
                    { label: 'Pazar', value: '6 kanal' },
                ],
            }
        }
    },
    {
        label: 'Kurumsal',
        megaMenu: {
            tagline: 'Ekibimiz, vizyonumuz ve iletişim kanallarımız',
            columns: [
                {
                    title: 'Hakkımızda',
                    icon: Building2,
                    items: [
                        { label: 'Hikayemiz', href: '/kurumsal/hakkimizda', description: 'Vizyonumuz ve misyonumuz', icon: Building2, color: 'blue' },
                        { label: 'Ekibimiz', href: '/team', description: 'Arkamızdaki insanlar', icon: Users, color: 'purple' },
                        { label: 'Kariyer', href: '/careers', description: 'Bize katılın', icon: Briefcase, badge: '8 pozisyon', color: 'green' },
                    ]
                },
                {
                    title: 'Medya',
                    icon: Newspaper,
                    items: [
                        { label: 'Basın Odası', href: '/press', description: 'Haberler ve duyurular', icon: Newspaper, color: 'indigo' },
                        { label: 'Medya Kiti', href: '/press#media-kit', description: 'Logo ve görseller', icon: FileText, color: 'teal' },
                        { label: 'Başarı Hikayeleri', href: '/case-studies', description: 'Müşteri referansları', icon: Award, color: 'amber' },
                    ]
                },
                {
                    title: 'İletişim',
                    icon: MessageCircle,
                    items: [
                        { label: 'Bize Ulaşın', href: '/iletisim', description: 'Sorularınız için', icon: MessageCircle, color: 'cyan' },
                        { label: 'Canlı Demo', href: '/demo', description: 'Kayıtsız anında test', icon: Play, color: 'emerald' },
                        { label: 'Demo Talep', href: '/demo-talep', description: 'Birebir uzman görüşmesi', icon: Calendar, color: 'orange' },
                    ]
                }
            ],
            featured: {
                title: 'Ekibimize Katılın!',
                description: 'Türkiye\'nin en hızlı büyüyen SaaS şirketinde kariyer fırsatları.',
                href: '/careers',
                badge: 'Hiring',
                gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
                stats: [
                    { label: 'Açık pozisyon', value: '8' },
                    { label: 'Ekip', value: '45+' },
                ],
            }
        }
    },
    { href: '/pricing', label: 'Fiyatlandırma' },
    { href: '/entegrasyonlar', label: 'Entegrasyonlar' },
];

// ─── Animations ───────────────────────────────────────
const megaMenuVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
    exit: { opacity: 0, y: 8, transition: { duration: 0.16, ease: 'easeIn' as const } }
};

const megaMenuBackdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.22 } },
    exit: { opacity: 0, transition: { duration: 0.18 } }
};

const contentVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], staggerChildren: 0.04, delayChildren: 0.04 } },
    exit: { opacity: 0, y: -4, transition: { duration: 0.15 } }
};

const contentItem = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } }
};

// Gradient map for icon hover states
const iconGradientMap: Record<string, string> = {
    blue: 'from-orange-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    teal: 'from-teal-500 to-teal-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-amber-500 to-amber-600',
    cyan: 'from-cyan-500 to-cyan-600',
};

// ─── Mega Menu Item Card (Premium) ───────────────────
function MegaMenuItemCard({ item, onClick }: { item: MegaMenuColumn['items'][0]; onClick: () => void }) {
    const colors = iconColorMap[item.color || 'blue'];
    const gradient = iconGradientMap[item.color || 'blue'];

    return (
        <motion.div variants={contentItem}>
            <Link
                href={item.href}
                onClick={onClick}
                className="group/item relative flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.02] hover:bg-orange-50/80 dark:hover:bg-orange-500/[0.06] border border-slate-100/60 dark:border-white/[0.04] hover:border-orange-200/70 dark:hover:border-orange-500/20 hover:shadow-md hover:shadow-orange-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:border-orange-300 transition-all duration-300 cursor-pointer"
            >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/[0.03] to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none" />
                {item.icon && (
                    <div className={`relative w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center shrink-0 transition-all duration-300 group-hover/item:scale-105 group-hover/item:shadow-lg group-hover/item:shadow-orange-500/10 overflow-hidden ring-1 ring-black/[0.03] dark:ring-white/[0.06]`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover/item:opacity-100 transition-opacity duration-300`} />
                        <item.icon size={18} className={`relative z-10 ${colors.text} group-hover/item:text-white transition-colors duration-300`} />
                    </div>
                )}
                <div className="relative flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 group-hover/item:text-orange-700 dark:group-hover/item:text-orange-300 transition-colors">
                            {item.label}
                        </span>
                        {item.badge && (
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r ${gradient} text-white rounded-full shadow-sm`}>
                                {item.badge}
                            </span>
                        )}
                        {item.isNew && (
                            <span className="relative flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Yeni
                            </span>
                        )}
                    </div>
                    {item.description && (
                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors">
                            {item.description}
                        </p>
                    )}
                </div>
                <div className="relative w-8 h-8 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] group-hover/item:bg-orange-500 group-hover/item:shadow-lg group-hover/item:shadow-orange-500/30 flex items-center justify-center transition-all duration-300 opacity-60 group-hover/item:opacity-100 shrink-0">
                    <ArrowRight size={14} className="text-slate-400 group-hover/item:text-white group-hover/item:translate-x-0.5 transition-all" />
                </div>
            </Link>
        </motion.div>
    );
}

// ─── Desktop Mega Menu Panel ──────────────────────────
function DesktopMegaMenuPanel({
    menuLabel,
    megaMenu,
    onClose
}: {
    menuLabel: string;
    megaMenu: NonNullable<MegaMenuItem['megaMenu']>;
    onClose: () => void;
}) {
    const [activeCol, setActiveCol] = React.useState(0);
    const [search, setSearch] = React.useState('');
    const searchRef = useRef<HTMLInputElement>(null);
    const activeColumn = megaMenu.columns[activeCol];
    const ActiveIcon = activeColumn?.icon;

    useEffect(() => {
        setActiveCol(0);
        setSearch('');
    }, [menuLabel]);

    const filteredItems = React.useMemo(() => {
        const items = activeColumn?.items ?? [];
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) =>
            item.label.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q)
        );
    }, [activeColumn, search]);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveCol((c) => Math.min(c + 1, megaMenu.columns.length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveCol((c) => Math.max(c - 1, 0));
            }
            if (e.key === '/' && document.activeElement !== searchRef.current) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [megaMenu.columns.length]);

    return (
        <div
            role="dialog"
            aria-label={`${menuLabel} menüsü`}
            className="relative bg-white/[0.98] dark:bg-[#0a0f1e]/[0.98] backdrop-blur-3xl rounded-[1.35rem] overflow-hidden border border-slate-200/80 dark:border-white/[0.09] shadow-[0_40px_100px_-20px_rgba(15,23,42,0.22)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.65)] ring-1 ring-black/[0.03] dark:ring-white/[0.04]"
        >
            {/* Top brand accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400" />
            {/* Soft ambient wash */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-orange-400/[0.06] dark:bg-orange-500/[0.08] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-40 w-56 h-56 bg-amber-400/[0.04] rounded-full blur-3xl pointer-events-none" />

            {/* Panel header */}
            <div className="relative flex items-center gap-3 px-5 py-3.5 border-b border-slate-100/90 dark:border-white/[0.06] bg-slate-50/40 dark:bg-white/[0.02] overflow-hidden min-w-0">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">{menuLabel}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{megaMenu.tagline}</span>
                    </div>
                    <div className="relative mt-2.5 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Özellik ara… (/ ile odaklan)"
                            className="w-full pl-9 pr-3 py-2 text-[12.5px] rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-300 dark:focus:border-orange-500/40 transition-all"
                        />
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] text-[10px] font-bold text-slate-400">
                        <kbd className="text-slate-500">↑↓</kbd> kategori
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] text-[10px] font-bold text-slate-400">
                        <kbd className="text-slate-500">Esc</kbd> kapat
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Menüyü kapat"
                    className="shrink-0 w-9 h-9 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:border-orange-200 dark:hover:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all"
                >
                    <X size={16} className="mx-auto" />
                </button>
            </div>

            <div className="relative flex max-h-[min(480px,calc(100vh-11rem))] overflow-hidden">
                {/* ── Left Sidebar ── */}
                <div className="w-[210px] shrink-0 bg-slate-50/70 dark:bg-white/[0.025] border-r border-slate-100/90 dark:border-white/[0.06] p-3 flex flex-col gap-1.5 overflow-hidden">
                    <div className="px-2 pt-1 pb-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Kategoriler</p>
                    </div>
                    {megaMenu.columns.map((col, idx) => {
                        const isActive = activeCol === idx;
                        return (
                            <button
                                key={idx}
                                onMouseEnter={() => { setActiveCol(idx); setSearch(''); }}
                                onClick={() => { setActiveCol(idx); setSearch(''); }}
                                className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-250 ${
                                    isActive
                                        ? 'bg-white dark:bg-white/[0.09] shadow-sm shadow-orange-500/5 border border-orange-100/80 dark:border-orange-500/20 text-orange-700 dark:text-orange-300'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white border border-transparent'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId={`mega-menu-active-tab-${menuLabel}`}
                                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-orange-500 to-amber-500"
                                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                    />
                                )}
                                {col.icon && (
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-250 ${
                                        isActive
                                            ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                                            : 'bg-slate-100/90 dark:bg-white/[0.06] text-slate-400 group-hover:bg-slate-200/80 dark:group-hover:bg-white/[0.09] group-hover:text-slate-600'
                                    }`}>
                                        <col.icon size={15} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 pl-0.5">
                                    <div className="text-[13px] font-bold leading-tight truncate">{col.title}</div>
                                    <div className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-orange-500/80 dark:text-orange-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {col.items.length} bağlantı
                                    </div>
                                </div>
                                <ChevronRight size={13} className={`shrink-0 transition-all duration-200 ${isActive ? 'opacity-100 text-orange-500 translate-x-0' : 'opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0'}`} />
                            </button>
                        );
                    })}

                    {megaMenu.bottomCTA && (
                        <div className="mt-auto pt-3 border-t border-slate-100/80 dark:border-white/[0.06]">
                            <Link
                                href={megaMenu.bottomCTA.href}
                                onClick={onClose}
                                className="group flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-[12px] font-bold transition-all duration-200 hover:shadow-lg hover:shadow-orange-600/30"
                            >
                                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                    <Rocket size={13} />
                                </div>
                                <span className="flex-1 truncate leading-tight">{megaMenu.bottomCTA.label}</span>
                                <ArrowRight size={11} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* ── Center Content ── */}
                <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.22) 1px, transparent 0)',
                            backgroundSize: '22px 22px',
                        }}
                    />

                    <div className="relative flex-1 p-5 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCol}
                                variants={contentVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-3 mb-4 pb-3.5 border-b border-slate-100/90 dark:border-white/[0.06]">
                                    {ActiveIcon && (
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100/80 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                            <ActiveIcon size={18} />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{activeColumn?.title}</h3>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Hızlı erişim — {activeColumn?.items.length} seçenek</p>
                                    </div>
                                </div>

                                {filteredItems.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {filteredItems.map((item, idx) => (
                                            <MegaMenuItemCard key={`${item.href}-${idx}`} item={item} onClick={onClose} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-14 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                                        <Search size={28} className="text-slate-300 dark:text-slate-600 mb-3" />
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Sonuç bulunamadı</p>
                                        <p className="text-xs text-slate-400 mt-1">Farklı bir anahtar kelime deneyin</p>
                                    </div>
                                )}

                                {!search && activeColumn && activeColumn.items.length > 0 && (
                                    <div className="mt-4 pt-3.5 border-t border-slate-100/80 dark:border-white/[0.06]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 mb-2">Hızlı erişim</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {activeColumn.items.slice(0, 4).map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={onClose}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-100/80 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06] hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-300 hover:border-orange-200 dark:hover:border-orange-500/25 transition-all"
                                                >
                                                    {item.icon && <item.icon size={11} />}
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Featured Right Rail ── */}
                {megaMenu.featured && (
                    <div className="w-[250px] shrink-0 border-l border-slate-100/90 dark:border-white/[0.06] p-4 bg-slate-50/30 dark:bg-white/[0.015] overflow-hidden">
                        <Link
                            href={megaMenu.featured.href}
                            onClick={onClose}
                            className={`group/feat relative flex flex-col h-full p-5 rounded-2xl bg-gradient-to-br ${megaMenu.featured.gradient || 'from-orange-600 to-amber-600'} overflow-hidden hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300`}
                        >
                            <div
                                className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{
                                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                                    backgroundSize: '20px 20px',
                                }}
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,transparent_50%)]" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/feat:translate-x-full transition-transform duration-1000" />
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -left-4 bottom-8 w-24 h-24 bg-black/10 rounded-full blur-xl" />

                            <div className="relative z-10 flex items-center justify-between mb-5">
                                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 group-hover/feat:scale-105 transition-transform">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                {megaMenu.featured.badge && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white/20 text-white rounded-full backdrop-blur-sm ring-1 ring-white/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                        {megaMenu.featured.badge}
                                    </span>
                                )}
                            </div>

                            <div className="relative z-10 flex-1">
                                <h4 className="text-[17px] font-black text-white leading-snug mb-2">{megaMenu.featured.title}</h4>
                                <p className="text-[12.5px] text-white/80 leading-relaxed">{megaMenu.featured.description}</p>

                                {megaMenu.featured.stats && (
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        {megaMenu.featured.stats.map((stat) => (
                                            <div key={stat.label} className="px-3 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/15">
                                                <div className="text-[15px] font-black text-white leading-none">{stat.value}</div>
                                                <div className="text-[9px] font-bold uppercase tracking-wider text-white/60 mt-1">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 mt-6 flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[12.5px] font-bold transition-colors ring-1 ring-white/20 group-hover/feat:gap-3">
                                <span>Keşfet</span>
                                <ArrowRight size={14} className="group-hover/feat:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Navbar ───────────────────────────────────────────
export default function Navbar() {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const [scrolled, setScrolled] = useState(false);
    const overlayNav = isHomePage && !scrolled;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const megaMenuRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [mounted, setMounted] = useState(false);
    const activeMegaLink = navLinks.find((link) => link.label === activeDropdown && link.megaMenu);
    const { resolvedMode, toggleTheme } = useTheme();
    const { data: session, status } = useSession();

    const trackMenuClick = useCallback((label: string, href: string, section: string) => {
        try {
            const payload = {
                label,
                href,
                section,
                ts: Date.now(),
            };

            if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon('/api/analytics/menu-click', blob);
                return;
            }

            void fetch('/api/analytics/menu-click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true,
            });
        } catch {
            // analytics fire-and-forget
        }
    }, []);

    const closeMegaMenu = useCallback(() => {
        if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
        setActiveDropdown(null);
    }, []);

    const handleMegaNavEnter = useCallback((label: string) => {
        if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);

        if (!activeDropdown) {
            setActiveDropdown(label);
            return;
        }

        if (activeDropdown === label) return;

        switchTimeoutRef.current = setTimeout(() => {
            setActiveDropdown(label);
        }, 220);
    }, [activeDropdown]);

    const handleMegaNavLeave = useCallback(() => {
        if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const inNav = dropdownRef.current?.contains(target);
            const inMega = megaMenuRef.current?.contains(target);
            if (!inNav && !inMega && activeDropdown) {
                closeMegaMenu();
            }
            if (profileRef.current && !profileRef.current.contains(target)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown, closeMegaMenu]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeMegaMenu();
        };
        if (activeDropdown) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [activeDropdown, closeMegaMenu]);

    useEffect(() => {
        if (mobileMenuOpen || activeDropdown) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [mobileMenuOpen, activeDropdown]);

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 transition-all duration-300 ${activeDropdown ? 'z-[310]' : 'z-[200]'}`}
                style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
                <div className={overlayNav ? 'w-full' : 'container mx-auto px-4'}>
                    <div className={`flex items-center justify-between transition-all duration-300 ${
                        overlayNav
                            ? 'px-4 sm:px-6 lg:px-8 py-3 bg-white/75 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/10'
                            : scrolled
                                ? 'mx-4 sm:mx-6 mt-2 px-2.5 sm:px-5 lg:px-6 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl shadow-lg border border-slate-200/50 dark:border-white/[0.06]'
                                : 'mx-4 sm:mx-6 mt-2 px-2.5 sm:px-5 lg:px-6 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/[0.08] shadow-sm'
                    }`}>

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group min-w-0">
                            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white font-bold italic text-sm group-hover:scale-110 transition-all duration-300 shadow-lg shadow-orange-600/25 group-hover:shadow-orange-600/40">
                                P
                                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white truncate max-[389px]:hidden">
                                Pazar<span className="text-orange-600 dark:text-orange-400">yonetimi</span>
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden lg:flex items-center gap-0.5" ref={dropdownRef}>
                            {navLinks.map((link) =>
                                link.megaMenu ? (
                                    <div
                                        key={link.label}
                                        className="relative"
                                        onMouseEnter={() => handleMegaNavEnter(link.label)}
                                        onMouseLeave={handleMegaNavLeave}
                                    >
                                        <button
                                            type="button"
                                            aria-expanded={activeDropdown === link.label}
                                            aria-haspopup="true"
                                            onClick={() => setActiveDropdown(link.label)}
                                            className={`relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${activeDropdown === link.label
                                                ? 'text-orange-700 dark:text-orange-400 bg-orange-50/80 dark:bg-orange-500/10'
                                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            {link.label}
                                            <ChevronDown
                                                size={13}
                                                className={`transition-transform duration-300 ${activeDropdown === link.label ? 'rotate-180' : ''}`}
                                            />
                                            {activeDropdown === link.label && (
                                                <motion.span
                                                    layoutId="nav-mega-indicator"
                                                    className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                />
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        key={link.href}
                                        href={link.href!}
                                        onClick={() => trackMenuClick(link.label, link.href || '/', 'desktop-main')}
                                        className="px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.04] rounded-xl transition-all duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                )
                            )}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <button
                                onClick={toggleTheme}
                                className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                aria-label="Tema değiştir"
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={resolvedMode}
                                        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {resolvedMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                    </motion.div>
                                </AnimatePresence>
                            </button>

                            {status === 'authenticated' && session ? (
                                <>
                                    <Link
                                        href="/dashboard/support"
                                        onClick={() => trackMenuClick('Destek Talebi', '/dashboard/support', 'desktop-actions')}
                                        className="hidden md:flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                    >
                                        <HelpCircle size={16} />
                                        <span>Destek Talebi</span>
                                    </Link>

                                    <Link
                                        href="/dashboard"
                                        onClick={() => trackMenuClick('Panel', '/dashboard', 'desktop-actions')}
                                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-sm font-bold hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all border border-orange-200/50 dark:border-orange-500/20 shadow-sm"
                                    >
                                        <LayoutDashboard size={16} />
                                        <span>Panel</span>
                                    </Link>

                                    <div className="relative" ref={profileRef}>
                                        <button
                                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-orange-600/20 ring-2 ring-white dark:ring-slate-900 transition-transform group-hover:scale-105">
                                                {session.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                            </div>
                                            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''} hidden xs:block`} />
                                        </button>

                                        <AnimatePresence>
                                            {profileMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/60 dark:border-white/[0.08] overflow-hidden z-[60]"
                                                >
                                                    <div className="p-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.05]">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{session.user?.name}</div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{session.user?.email}</div>
                                                    </div>
                                                    <div className="p-2">
                                                        <Link
                                                            href="/dashboard"
                                                            onClick={() => { trackMenuClick('Admin Paneli', '/dashboard', 'desktop-profile'); setProfileMenuOpen(false); }}
                                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-white/5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
                                                        >
                                                            <LayoutDashboard size={16} /> Admin Paneli
                                                        </Link>
                                                        <Link
                                                            href="/dashboard/settings"
                                                            onClick={() => { trackMenuClick('Hesap Ayarları', '/dashboard/settings', 'desktop-profile'); setProfileMenuOpen(false); }}
                                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-white/5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
                                                        >
                                                            <Settings size={16} /> Hesap Ayarları
                                                        </Link>
                                                        <div className="h-px bg-slate-100 dark:bg-white/[0.05] my-2 mx-1" />
                                                        <button
                                                            onClick={() => signOut()}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-medium text-red-500 dark:text-red-400 transition-all"
                                                        >
                                                            <LogOut size={16} /> Çıkış Yap
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        onClick={() => trackMenuClick('Giriş Yap', '/login', 'desktop-actions')}
                                        className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        Giriş Yap
                                    </Link>

                                    <Link
                                        href="/demo"
                                        onClick={() => trackMenuClick('Demo İzle', '/demo', 'desktop-actions')}
                                        className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        Demo
                                    </Link>

                                    <Link
                                        href="/signup"
                                        onClick={() => trackMenuClick('Ücretsiz Başla', '/signup', 'desktop-actions')}
                                        className="hidden min-[390px]:flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-orange-600/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 relative overflow-hidden group/signup"
                                    >
                                        <span className="relative z-10">Ücretsiz Başla</span>
                                        <ArrowRight size={14} className="relative z-10 group-hover/signup:translate-x-0.5 transition-transform hidden sm:block" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-700 to-amber-700 opacity-0 group-hover/signup:opacity-100 transition-opacity" />
                                    </Link>

                                    <Link
                                        href="/signup"
                                        onClick={() => trackMenuClick('Ücretsiz Başla', '/signup', 'desktop-actions')}
                                        className="min-[390px]:hidden inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm"
                                        aria-label="Ücretsiz Başla"
                                    >
                                        <Rocket size={16} />
                                    </Link>
                                </>
                            )}

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all text-slate-600 dark:text-white border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                                aria-expanded={mobileMenuOpen}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={mobileMenuOpen ? 'close' : 'menu'}
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                                    </motion.div>
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Centered Desktop Mega Menu (portal) ── */}
            {mounted && activeMegaLink?.megaMenu && createPortal(
                <AnimatePresence>
                    <motion.div
                        key="mega-menu-layer"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={megaMenuBackdropVariants}
                        className="hidden lg:block fixed inset-0 z-[300] pointer-events-none overflow-hidden"
                    >
                        <button
                            type="button"
                            aria-label="Menüyü kapat"
                            className="absolute inset-0 bg-slate-900/25 dark:bg-black/45 backdrop-blur-[2px] cursor-default pointer-events-auto"
                            onClick={closeMegaMenu}
                        />
                        <motion.div
                            key={activeDropdown}
                            ref={megaMenuRef}
                            variants={megaMenuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute left-1/2 top-[calc(4.25rem+env(safe-area-inset-top,0px))] -translate-x-1/2 z-10 w-[min(980px,calc(100vw-2rem))] max-h-[calc(100vh-5.5rem)] overflow-hidden pointer-events-auto"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.10] via-amber-500/[0.04] to-transparent rounded-[1.35rem] blur-xl pointer-events-none" />
                            <DesktopMegaMenuPanel
                                menuLabel={activeDropdown || ''}
                                megaMenu={activeMegaLink.megaMenu}
                                onClose={closeMegaMenu}
                            />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}

            {/* ── Mobile Fullscreen Menu ── */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-40 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-2xl pt-[max(4.75rem,env(safe-area-inset-top))] overflow-y-auto lg:hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobil Menü"
                    >
                        {/* Premium Background Effects */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-orange-500/10 via-purple-500/5 to-transparent blur-3xl opacity-50" />
                            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] opacity-30" />
                        </div>

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: { transition: { staggerChildren: 0.05 } }
                            }}
                            className="relative container mx-auto px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] space-y-1"
                        >
                            <div className="sticky top-0 z-10 mb-3 -mx-1 px-1 py-2 bg-white/70 dark:bg-[#0B1120]/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/10">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Menü</span>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white"
                                        aria-label="Menüyü kapat"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-2 px-2">
                                    <Link
                                        href="/demo"
                                        onClick={() => { trackMenuClick('Demo İste', '/demo', 'mobile-top-strip'); setMobileMenuOpen(false); }}
                                        className="min-h-[44px] rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center"
                                    >
                                        Demo
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        onClick={() => { trackMenuClick('Fiyatlandırma', '/pricing', 'mobile-top-strip'); setMobileMenuOpen(false); }}
                                        className="min-h-[44px] rounded-lg bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center"
                                    >
                                        Fiyat
                                    </Link>
                                    <Link
                                        href="/login"
                                        onClick={() => { trackMenuClick('Giriş Yap', '/login', 'mobile-top-strip'); setMobileMenuOpen(false); }}
                                        className="min-h-[44px] rounded-lg bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center"
                                    >
                                        Giriş
                                    </Link>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {navLinks.map((link) => (
                                    <motion.div
                                        key={link.label}
                                        variants={{
                                            hidden: { opacity: 0, x: -20 },
                                            visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
                                        }}
                                    >
                                        {link.megaMenu ? (
                                            <MobileMegaMenu
                                                label={link.label}
                                                megaMenu={link.megaMenu}
                                                onTrack={trackMenuClick}
                                                onClose={() => setMobileMenuOpen(false)}
                                            />
                                        ) : (
                                            <Link
                                                href={link.href!}
                                                onClick={() => { trackMenuClick(link.label, link.href || '/', 'mobile-main'); setMobileMenuOpen(false); }}
                                                className="group flex items-center justify-between p-4 min-h-[56px] text-base font-bold text-slate-900 dark:text-white bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all duration-300 shadow-sm"
                                            >
                                                {link.label}
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                    <ArrowRight size={14} />
                                                </div>
                                            </Link>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { delay: 0.2 } }
                                }}
                                className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    {status === 'authenticated' ? (
                                        <>
                                            <Link
                                                href="/dashboard"
                                                onClick={() => { trackMenuClick('Admin Paneli', '/dashboard', 'mobile-quick'); setMobileMenuOpen(false); }}
                                                className="flex flex-col items-center justify-center py-4 bg-orange-600 rounded-2xl shadow-lg shadow-orange-500/20 text-white gap-1 col-span-2 overflow-hidden relative group"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                <LayoutDashboard size={20} />
                                                <span className="text-base font-bold">Admin Paneli</span>
                                            </Link>
                                            <Link
                                                href="/dashboard/support"
                                                onClick={() => { trackMenuClick('Destek', '/dashboard/support', 'mobile-quick'); setMobileMenuOpen(false); }}
                                                className="flex flex-col items-center justify-center py-4 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors gap-1"
                                            >
                                                <HelpCircle size={18} className="text-orange-500" />
                                                <span className="text-sm font-bold text-slate-800 dark:text-white">Destek</span>
                                            </Link>
                                            <button
                                                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                                                className="flex flex-col items-center justify-center py-4 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-colors gap-1"
                                            >
                                                <LogOut size={18} className="text-red-500" />
                                                <span className="text-sm font-bold text-red-600 dark:text-red-400">Çıkış</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href="/signup"
                                                onClick={() => { trackMenuClick('Ücretsiz Başla', '/signup', 'mobile-quick'); setMobileMenuOpen(false); }}
                                                className="flex items-center justify-center py-4 text-base font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all col-span-2"
                                            >
                                                Ücretsiz Başla
                                            </Link>
                                            <Link
                                                href="/login"
                                                onClick={() => { trackMenuClick('Giriş Yap', '/login', 'mobile-quick'); setMobileMenuOpen(false); }}
                                                className="flex items-center justify-center py-4 text-base font-bold text-slate-800 dark:text-white bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                                            >
                                                Giriş Yap
                                            </Link>
                                            <Link
                                                href="/demo"
                                                onClick={() => { trackMenuClick('Demo İzle', '/demo', 'mobile-quick'); setMobileMenuOpen(false); }}
                                                className="flex items-center justify-center py-4 text-base font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all"
                                            >
                                                Demo İzle
                                            </Link>
                                        </>
                                    )}
                                </div>

                                {/* Status & Contact */}
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sistemler Aktif</span>
                                    </div>
                                    <Link href="/iletisim" className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline">
                                        Destek Al
                                    </Link>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ─── Mobile Mega Menu Component ───────────────────────
function MobileMegaMenu({
    label,
    megaMenu,
    onTrack,
    onClose
}: {
    label: string;
    megaMenu: MegaMenuItem['megaMenu'];
    onTrack: (label: string, href: string, section: string) => void;
    onClose: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeColumn, setActiveColumn] = useState<number | null>(null);

    if (!megaMenu) return null;

    return (
        <div className={`overflow-hidden rounded-2xl transition-all duration-300 border ${isOpen ? 'bg-white/80 dark:bg-slate-900/80 border-orange-100 dark:border-orange-500/20 shadow-lg shadow-orange-500/5' : 'bg-white/50 dark:bg-white/5 border-slate-200/50 dark:border-white/5'}`}>
            <button
                onClick={() => { setIsOpen(!isOpen); setActiveColumn(null); }}
                className="flex items-center justify-between w-full p-4 min-h-[56px] text-left transition-colors"
                aria-expanded={isOpen}
            >
                <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                    {label}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-orange-50 dark:bg-orange-500/10 rotate-180' : 'bg-transparent'}`}>
                    <ChevronDown size={18} className={`transition-colors ${isOpen ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="px-3 pb-4 space-y-2.5 pt-2">
                            {megaMenu.columns.map((column, colIdx) => (
                                <div key={colIdx} className={`rounded-2xl overflow-hidden border transition-colors ${activeColumn === colIdx ? 'bg-orange-50/50 dark:bg-orange-500/[0.06] border-orange-200/70 dark:border-orange-500/20' : 'bg-slate-50/60 dark:bg-white/[0.02] border-slate-100 dark:border-white/5'}`}>
                                    <button
                                        onClick={() => setActiveColumn(activeColumn === colIdx ? null : colIdx)}
                                        className="flex items-center gap-3 w-full px-4 py-3.5 min-h-[52px] text-left transition-colors"
                                    >
                                        {column.icon && (
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${activeColumn === colIdx ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' : 'bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-500'}`}>
                                                <column.icon size={15} />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0 text-left">
                                            <span className="block font-bold text-sm text-slate-800 dark:text-slate-100">
                                                {column.title}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{column.items.length} bağlantı</span>
                                        </div>
                                        <ChevronRight
                                            size={14}
                                            className={`shrink-0 transition-transform duration-300 ${activeColumn === colIdx ? 'rotate-90 text-orange-500' : 'text-slate-400'}`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {activeColumn === colIdx && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.22 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-2.5 pb-2.5 space-y-1.5">
                                                    {column.items.map((item, itemIdx) => {
                                                        const colors = iconColorMap[item.color || 'blue'];
                                                        const ItemIcon = item.icon;
                                                        return (
                                                            <Link
                                                                key={itemIdx}
                                                                href={item.href}
                                                                onClick={() => { onTrack(item.label, item.href, `mobile-submenu:${label}`); onClose(); }}
                                                                className="group flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-slate-100/80 dark:border-white/[0.05] hover:border-orange-200 dark:hover:border-orange-500/25 transition-all"
                                                            >
                                                                {ItemIcon && (
                                                                    <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                                                                        <ItemIcon size={15} className={colors.text} />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                                            {item.label}
                                                                        </span>
                                                                        {item.badge && (
                                                                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-full">
                                                                                {item.badge}
                                                                            </span>
                                                                        )}
                                                                        {item.isNew && (
                                                                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full">
                                                                                Yeni
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {item.description && (
                                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                                            {item.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <ArrowRight size={14} className="text-slate-300 group-hover:text-orange-500 shrink-0 transition-colors" />
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            {/* Mobile Featured Card */}
                            {megaMenu.featured && (
                                <Link
                                    href={megaMenu.featured.href}
                                    onClick={() => { onTrack(megaMenu.featured?.title || label, megaMenu.featured?.href || '/', `mobile-featured:${label}`); onClose(); }}
                                    className={`relative block p-5 rounded-xl bg-gradient-to-br ${megaMenu.featured.gradient || 'from-orange-600 to-amber-600'} overflow-hidden shadow-lg shadow-orange-500/25`}
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-20">
                                        <Sparkles size={48} className="text-white rotate-12" />
                                    </div>
                                    <div className="relative z-10">
                                        {megaMenu.featured.badge && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm rounded-full mb-3">
                                                <Star size={10} fill="currentColor" />
                                                {megaMenu.featured.badge}
                                            </span>
                                        )}
                                        <h4 className="font-bold text-lg text-white mb-1.5">{megaMenu.featured.title}</h4>
                                        <p className="text-sm text-white/90 leading-relaxed mb-4">{megaMenu.featured.description}</p>
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-sm font-bold text-orange-700 rounded-lg shadow-sm">
                                            İncele <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
