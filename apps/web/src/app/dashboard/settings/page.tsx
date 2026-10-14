"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Link2,
    User,
    Bell,
    Shield,
    CreditCard,
    Palette,
    Key,
    ChevronRight,
    ArrowRight,
    Zap,
    Users,
    FileText,
    Truck,
} from 'lucide-react';

const settingsCategories = [
    {
        id: 'integrations',
        title: 'Pazaryeri Entegrasyonları',
        description: 'Trendyol, Hepsiburada, Amazon ve 40+ pazaryeri bağlantısı',
        icon: Link2,
        href: '/dashboard/settings/integrations',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        badge: '40+',
        featured: true,
    },
    {
        id: 'integration-hub',
        title: 'Entegrasyon Merkezi',
        description: 'Pazaryeri, e-ticaret, kargo ve e-fatura — tek panelden yönetim',
        icon: Zap,
        href: '/dashboard/settings/integration-hub',
        color: 'from-violet-500 to-indigo-500',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/20',
        badge: 'Yeni',
        featured: true,
    },
    {
        id: 'service-integrations',
        title: 'Servis Entegrasyonları',
        description: 'Kargo, ödeme, e-fatura ve SMS servis bağlantılarını yönetin',
        icon: Truck,
        href: '/dashboard/settings/service-integrations',
        color: 'from-indigo-500 to-blue-500',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/20',
    },
    {
        id: 'profile',
        title: 'Profil Ayarları',
        description: 'Hesap bilgilerinizi ve şirket detaylarınızı yönetin',
        icon: User,
        href: '/dashboard/settings/profile',
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
    },
    {
        id: 'team',
        title: 'Ekip Yönetimi',
        description: 'Ekip üyelerini ekleyin ve yetkileri düzenleyin',
        icon: Users,
        href: '/dashboard/settings/team',
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
    },
    {
        id: 'notifications',
        title: 'Bildirimler',
        description: 'E-posta, SMS ve push bildirim tercihlerinizi yönetin',
        icon: Bell,
        href: '/dashboard/settings/notifications',
        color: 'from-orange-500 to-amber-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
    },
    {
        id: 'security',
        title: 'Güvenlik',
        description: 'Şifre, 2FA ve oturum güvenliği ayarları',
        icon: Shield,
        href: '/dashboard/security',
        color: 'from-red-500 to-rose-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
    },
    {
        id: 'billing',
        title: 'Faturalandırma',
        description: 'Abonelik planınız, ödeme geçmişi ve faturalar',
        icon: CreditCard,
        href: '/dashboard/payments',
        color: 'from-indigo-500 to-violet-500',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/20',
    },
    {
        id: 'appearance',
        title: 'Görünüm',
        description: 'Tema, dil ve arayüz tercihlerinizi özelleştirin',
        icon: Palette,
        href: '/dashboard/theme',
        color: 'from-pink-500 to-fuchsia-500',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/20',
    },
    {
        id: 'api',
        title: 'API & Webhooks',
        description: 'API anahtarlarınız ve webhook yapılandırması',
        icon: Key,
        href: '/dashboard/webhooks',
        color: 'from-slate-500 to-zinc-500',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
    },
    {
        id: 'verification',
        title: 'Mülk Doğrulama (SEO)',
        description: 'Google, Bing ve Yandex mülk doğrulama kodlarını yönetin',
        icon: Shield,
        href: '/dashboard/settings/verification',
        color: 'from-blue-600 to-indigo-600',
        bgColor: 'bg-blue-600/10',
        borderColor: 'border-blue-600/20',
    },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Page Header */}
            <div>
                <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Ayarlar</h1>
                <p className="text-xs text-muted-foreground mt-1">Hesabınızı, ekibinizi ve entegrasyonlarınızı yönetin</p>
            </div>

            {/* Featured Section - Integrations */}
            <div>
                <Link href="/dashboard/settings/integrations">
                    <div className="relative overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-cyan-500/10 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-colors group cursor-pointer shadow-xs">
                        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Link2 size={24} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h2 className="text-base font-semibold text-foreground">Pazaryeri Entegrasyonları</h2>
                                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-600 text-white">
                                        40+ Platform
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Trendyol, Hepsiburada, Amazon, eBay, Etsy ve dünya çapında 40'tan fazla pazaryerine bağlanın
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all self-end sm:self-auto shrink-0">
                                <span>Entegrasyonları Yönet</span>
                                <ArrowRight size={14} />
                            </div>
                        </div>

                        {/* Mini logos preview */}
                        <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-3">
                            <span className="text-[11px] font-medium text-muted-foreground">Popüler:</span>
                            <div className="flex items-center -space-x-1.5">
                                {['T', 'H', 'N', 'A', 'E', 'S'].map((letter, idx) => (
                                    <div
                                        key={idx}
                                        className="w-6 h-6 rounded-md bg-card border border-border/80 flex items-center justify-center text-[10px] font-semibold text-foreground shadow-2xs"
                                    >
                                        {letter}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[11px] text-muted-foreground">+34 platform daha</span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                {settingsCategories.filter(c => c.id !== 'integrations').map((category) => (
                    <Link key={category.id} href={category.href}>
                        <div className="p-4 bg-card rounded-xl border border-border/70 hover:border-border hover:shadow-xs transition-all group cursor-pointer h-full">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${category.bgColor} shrink-0`}>
                                    <category.icon className={`bg-gradient-to-br ${category.color} bg-clip-text`} size={18} style={{ color: 'inherit' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className="text-xs font-semibold text-foreground truncate">{category.title}</h3>
                                        <ChevronRight size={14} className="text-muted-foreground/60 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{category.description}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="p-4 sm:p-5 bg-card rounded-xl border border-border/70 shadow-xs">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Hızlı İşlemler</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <Link href="/dashboard/settings/integrations">
                        <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors text-left group">
                            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <Zap size={14} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-medium text-foreground truncate">Yeni Entegrasyon</div>
                                <div className="text-[10px] text-muted-foreground truncate">Pazaryeri bağla</div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/settings/team">
                        <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors text-left group">
                            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                <Users size={14} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-medium text-foreground truncate">Üye Ekle</div>
                                <div className="text-[10px] text-muted-foreground truncate">Ekibe davet gönder</div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/upgrade">
                        <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors text-left group">
                            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                                <CreditCard size={14} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-medium text-foreground truncate">Plan Yükselt</div>
                                <div className="text-[10px] text-muted-foreground truncate">Daha fazla özellik</div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/reports">
                        <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors text-left group">
                            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                <FileText size={14} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-medium text-foreground truncate">Raporlar</div>
                                <div className="text-[10px] text-muted-foreground truncate">Raporları indir</div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
