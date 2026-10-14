"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Store, Shield, ArrowRight, CheckCircle2, Zap, BarChart3,
    Boxes, Receipt, Truck, Users, Activity, Sparkles,
    Lock, ExternalLink, Globe, Play, ChevronRight, Eye,
    Check, ShoppingCart, Cpu, Server, CreditCard, ShieldCheck, Calendar
} from 'lucide-react';

export default function DemoPortalPage() {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<'merchant' | 'admin'>('merchant');

    const handleLaunchMerchantDemo = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('pazaryonetimi_demo', 'true');
        }
        router.push('/dashboard?demo=true');
    };

    const handleLaunchAdminDemo = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('pazaryonetimi_admin_demo', 'true');
        }
        router.push('/admin?demo=true');
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
            {/* Top Announcement Bar */}
            <div className="border-b border-border/70 bg-muted/40 py-2.5 px-4 text-center text-xs">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-2xs border border-emerald-500/20">
                        CANLI DEMO
                    </span>
                    <span className="text-muted-foreground">
                        Kayıt olmadan veya kredi kartı girmeden hem <strong>Kullanıcı (Mağaza)</strong> hem de <strong>Süper Admin</strong> panelini hemen inceleyin.
                    </span>
                </div>
            </div>

            {/* Navigation / Brand Header */}
            <header className="border-b border-border/70 bg-card/60 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
                            P
                        </div>
                        <span className="font-semibold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                            pazaryonetimi<span className="text-primary">.com</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="/login"
                            className="px-3 py-1.5 rounded-lg border border-border/70 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                        >
                            Giriş Yap
                        </Link>
                        <Link
                            href="/signup"
                            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors shadow-2xs"
                        >
                            Ücretsiz Başla
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>İnteraktif Canlı Keşif Portalı</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
                        Pazar Yönetimi Deneyimini <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Canlı Demo ile Keşfedin
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        Pazaryeri satıcılarının operasyonlarını hızlandıran <strong>Kullanıcı Paneli</strong> ve çoklu kiracıları yöneten <strong>SaaS Süper Admin Paneli</strong> canlı örnek verilerle hazır.
                    </p>

                    {/* Mode Toggle Switcher */}
                    <div className="inline-flex items-center bg-card border border-border/80 rounded-xl p-1 shadow-2xs mt-4">
                        <button
                            onClick={() => setSelectedTab('merchant')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                                selectedTab === 'merchant'
                                    ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Store className="w-4 h-4" />
                            <span>1. Mağaza & Satıcı Paneli</span>
                        </button>
                        <button
                            onClick={() => setSelectedTab('admin')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                                selectedTab === 'admin'
                                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Shield className="w-4 h-4" />
                            <span>2. Süper Admin Paneli</span>
                        </button>
                    </div>
                </div>

                {/* Dual Demo Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
                    {/* Card 1: Merchant Panel Demo */}
                    <div className={`relative bg-card rounded-2xl border transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between shadow-xs ${
                        selectedTab === 'merchant' 
                            ? 'border-primary ring-2 ring-primary/20 shadow-md' 
                            : 'border-border/80 hover:border-border'
                    }`}>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <Store className="w-6 h-6" />
                                </div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    SATICI DENEYİMİ
                                </span>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold text-foreground tracking-tight">
                                    Kullanıcı (Mağaza) Paneli
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                    Trendyol, Hepsiburada, Amazon ve N11 mağazanızı tek çatı altında toplayan operasyon merkezi.
                                </p>
                            </div>

                            {/* Demo Snapshot KPI */}
                            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-xl border border-border/60 text-center">
                                <div>
                                    <span className="text-2xs text-muted-foreground block">Aylık Ciro</span>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground tabular-nums font-mono">₺284.950</span>
                                </div>
                                <div>
                                    <span className="text-2xs text-muted-foreground block">Siparişler</span>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground tabular-nums font-mono">412 Adet</span>
                                </div>
                                <div>
                                    <span className="text-2xs text-muted-foreground block">Aktif Stok</span>
                                    <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">86 Ürün</span>
                                </div>
                            </div>

                            {/* Feature List */}
                            <div className="space-y-2.5">
                                <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Demo İçinde Test Edebileceğiniz Özellikler:
                                </span>
                                {[
                                    { icon: Zap, text: 'Aşağıdan yukarıya kesintisiz canlı sipariş akışı' },
                                    { icon: Boxes, text: 'Barkod okutarak saniyeler içinde iade ve stok kabulü' },
                                    { icon: Receipt, text: 'GİB onaylı e-Arşiv ve Ticari fatura yönetimi' },
                                    { icon: Truck, text: 'Desi ve Türk kargo firmaları (Yurtiçi, Hepsijet, Aras)' },
                                    { icon: BarChart3, text: 'Buy Box koruması ve rakip fiyat takip kalkanı' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-foreground/90">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span>{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-border/70 space-y-2">
                            <button
                                onClick={handleLaunchMerchantDemo}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-sm group"
                            >
                                <span>Mağaza Panelini Başlat (Demo)</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                            <p className="text-[11px] text-muted-foreground text-center">
                                Giriş gerektirmez • Doğrudan kontrol paneline yönlendirir
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Super Admin Panel Demo */}
                    <div className={`relative bg-card rounded-2xl border transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between shadow-xs ${
                        selectedTab === 'admin' 
                            ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-md' 
                            : 'border-border/80 hover:border-border'
                    }`}>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    YÖNETİCİ DENEYİMİ
                                </span>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold text-foreground tracking-tight">
                                    Süper Admin (SaaS) Paneli
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                    Platform genelini, kiracı mağazaları, SaaS paket aboneliklerini ve sistem altyapısını yöneten panel.
                                </p>
                            </div>

                            {/* Demo Snapshot KPI */}
                            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-xl border border-border/60 text-center">
                                <div>
                                    <span className="text-2xs text-muted-foreground block">Kayıtlı Kiracı</span>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground tabular-nums font-mono">148 Mağaza</span>
                                </div>
                                <div>
                                    <span className="text-2xs text-muted-foreground block">SaaS MRR</span>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground tabular-nums font-mono">₺428.900</span>
                                </div>
                                <div>
                                    <span className="text-2xs text-muted-foreground block">API Sağlığı</span>
                                    <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">%99.98</span>
                                </div>
                            </div>

                            {/* Feature List */}
                            <div className="space-y-2.5">
                                <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Demo İçinde Test Edebileceğiniz Özellikler:
                                </span>
                                {[
                                    { icon: Users, text: 'Çoklu kiracı (multi-tenant) mağaza profilleri ve paketleri' },
                                    { icon: CreditCard, text: 'SaaS abonelik ödemeleri, fatura ve MRR trendleri' },
                                    { icon: Cpu, text: 'AI model yönetimi, token kotaları ve kuyruk izleme' },
                                    { icon: Server, text: 'Sunucu yükü, microservice gecikmeleri ve veritabanı' },
                                    { icon: ShieldCheck, text: 'Güvenlik denetim kayıtları ve rol bazlı erişim (RBAC)' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-foreground/90">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        <span>{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-border/70 space-y-2">
                            <button
                                onClick={handleLaunchAdminDemo}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm group"
                            >
                                <span>Süper Admin Panelini Başlat (Demo)</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                            <p className="text-[11px] text-muted-foreground text-center">
                                Giriş gerektirmez • Platform operasyon ekranına yönlendirir
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ / Info Section */}
                <div className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>Demo Modu Hakkında Sıkça Sorulan Sorular</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-foreground">Kayıt olmam gerekiyor mu?</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Hayır. Butonlara tıkladığınız anda tek tıkla demo moduna geçebilir ve tüm ekranları gezebilirsiniz.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-foreground">Veriler gerçek mi?</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Veriler, Türkiye pazaryeri e-ticaret ekosistemine (Trendyol, Hepsiburada, Amazon vb.) birebir uyumlu gerçekçi simülasyon verileridir.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-foreground">Paneller arasında geçiş yapılabilir mi?</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Evet! Demo modundayken ekranın üstündeki ve altındaki hızlı geçiş butonlarıyla Mağaza ve Admin panelleri arasında tek tıkla geçiş yapabilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 1-on-1 Demo Booking Callout */}
                <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-indigo-500/10 border border-orange-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
                    <div className="space-y-1.5 text-center sm:text-left">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 font-semibold text-2xs">
                            <Calendar className="w-3 h-3" />
                            ÖZEL KURUMSAL SUNUM
                        </span>
                        <h4 className="text-base sm:text-lg font-semibold text-foreground">
                            Uzman Ekibimizle Birebir Canlı Demo Planlayın
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-xl">
                            İşletmenizin ciro hedeflerine, pazaryeri mağazalarınıza ve ERP/muhasebe ihtiyaçlarınıza özel 30 dakikalık kişiselleştirilmiş demo randevusu oluşturun.
                        </p>
                    </div>
                    <Link
                        href="/demo-talep"
                        className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 group"
                    >
                        <span>Demo Randevusu Al</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </main>
        </div>
    );
}
