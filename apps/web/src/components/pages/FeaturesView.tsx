"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Wand2, FileText, Truck, Zap, Shield, Globe, ArrowRight, Sparkles,
    Brain, Target, TrendingUp, Package, Clock, Users, Star, Play,
    Cpu, BarChart3, Eye, ChevronRight, Rocket, Bell, Layers, RefreshCw,
    DollarSign, Settings, MessageSquare, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import MarketingPageShell from '@/components/landing/MarketingPageShell';

const FEATURES_DATA = {
    stats: [
        { value: "50K+", label: "Aktif Satıcı", icon: Users },
        { value: "%40", label: "Verimlilik Artışı", icon: TrendingUp },
        { value: "15+", label: "Pazaryeri Entegrasyonu", icon: Globe },
        { value: "7/24", label: "AI Asistan Desteği", icon: Brain },
    ],
    categories: [
        { id: 'ai', name: 'Yapay Zeka', icon: Brain, color: 'from-purple-500 to-pink-500' },
        { id: 'inventory', name: 'Stok Yönetimi', icon: Package, color: 'from-orange-500 to-amber-500' },
        { id: 'pricing', name: 'Fiyatlandırma', icon: DollarSign, color: 'from-green-500 to-emerald-500' },
        { id: 'analytics', name: 'Analitik', icon: BarChart3, color: 'from-orange-500 to-amber-500' },
        { id: 'automation', name: 'Otomasyon', icon: Zap, color: 'from-red-500 to-rose-500' },
        { id: 'integration', name: 'Entegrasyonlar', icon: Layers, color: 'from-amber-500 to-violet-500' },
    ],
    features: {
        ai: [
            {
                title: "AI SEO Optimizasyonu",
                desc: "Yapay zeka, ürün başlıklarınızı ve açıklamalarınızı otomatik olarak optimize eder. Arama sonuçlarında üst sıralara çıkın.",
                icon: Wand2,
                stats: ["+%45 Görünürlük", "+%32 Tıklanma"],
                demo: true
            },
            {
                title: "Akıllı Fiyat Önerileri",
                desc: "Rakip fiyatlarını, talep değişimlerini ve marjlarınızı analiz ederek en karlı fiyatı önerir.",
                icon: Target,
                stats: ["+%28 Kar Marjı", "Anlık Güncelleme"],
            },
            {
                title: "Trend Tahmini",
                desc: "Pazar trendlerini önceden tahmin ederek stok ve fiyat stratejinizi optimize edin.",
                icon: TrendingUp,
                stats: ["%92 Doğruluk", "7 Gün Önceden"],
            },
            {
                title: "Müşteri Davranış Analizi",
                desc: "Müşteri segmentasyonu ve satın alma kalıplarını AI ile analiz edin.",
                icon: Users,
                stats: ["+%35 Dönüşüm", "Kişiselleştirme"],
            },
        ],
        inventory: [
            {
                title: "Çoklu Depo Yönetimi",
                desc: "Tüm depolarınızı tek panelden yönetin. Otomatik stok transferi ve optimizasyonu.",
                icon: Box,
                stats: ["Sınırsız Depo", "Anlık Senkron"],
            },
            {
                title: "Kritik Stok Uyarıları",
                desc: "Stok seviyeleri kritik noktaya düştüğünde anında bildirim alın.",
                icon: Bell,
                stats: ["SMS + E-posta", "Özel Eşikler"],
            },
            {
                title: "Otomatik Sipariş Oluşturma",
                desc: "Stok azaldığında tedarikçilere otomatik sipariş oluşturun.",
                icon: RefreshCw,
                stats: ["%99 Stok Tutarlılığı", "0 Fire"],
            },
            {
                title: "Barkod & SKU Yönetimi",
                desc: "Gelişmiş barkod sistemi ile ürünlerinizi hızlıca takip edin.",
                icon: Package,
                stats: ["QR Kod Desteği", "Toplu İşlem"],
            },
        ],
        pricing: [
            {
                title: "Dinamik Fiyatlandırma",
                desc: "Rakip fiyatlarına göre otomatik fiyat ayarlama. Rekabette hep bir adım önde.",
                icon: DollarSign,
                stats: ["Anlık Takip", "Akıllı Kurallar"],
            },
            {
                title: "Marj Koruma",
                desc: "Minimum ve maksimum kar marjı belirleyin, sistem asla bu sınırların dışına çıkmaz.",
                icon: Shield,
                stats: ["Otomatik Koruma", "Esnek Kurallar"],
            },
            {
                title: "Kampanya Yönetimi",
                desc: "Pazaryeri kampanyalarına otomatik katılım ve fiyat optimizasyonu.",
                icon: Zap,
                stats: ["+%60 Satış", "Otomatik Katılım"],
            },
            {
                title: "Rakip Fiyat Takibi",
                desc: "Rakiplerinizin fiyatlarını 7/24 takip edin ve analiz raporları alın.",
                icon: Eye,
                stats: ["500+ Rakip", "Anlık Bildirim"],
            },
        ],
        analytics: [
            {
                title: "Gelişmiş Dashboard",
                desc: "Tüm metriklerinizi tek ekranda görün. Özelleştirilebilir widget'lar.",
                icon: BarChart3,
                stats: ["50+ Metrik", "Gerçek Zamanlı"],
            },
            {
                title: "Satış Raporları",
                desc: "Detaylı satış analizleri, trend grafikleri ve karşılaştırmalı raporlar.",
                icon: FileText,
                stats: ["PDF/Excel Export", "Otomatik Raporlama"],
            },
            {
                title: "Performans Skorları",
                desc: "Pazaryeri performans skorlarınızı takip edin ve iyileştirme önerileri alın.",
                icon: Star,
                stats: ["SEO Skoru", "Satıcı Puanı"],
            },
            {
                title: "Müşteri Analitiği",
                desc: "Müşteri davranışları, satın alma kalıpları ve segment analizleri.",
                icon: Users,
                stats: ["Kohort Analizi", "LTV Hesaplama"],
            },
        ],
        automation: [
            {
                title: "Sipariş Otomasyonu",
                desc: "Siparişleri otomatik onayla, faturalandır ve kargoya ver.",
                icon: Truck,
                stats: ["%95 Otomasyon", "0 Manuel İş"],
            },
            {
                title: "Toplu Ürün Güncelleme",
                desc: "Binlerce ürünü tek tıkla güncelleyin. Excel import/export.",
                icon: Layers,
                stats: ["50K+ Ürün/dk", "Sınırsız Güncelleme"],
            },
            {
                title: "Kural Tabanlı Aksiyon",
                desc: "If-then kuralları ile kendi otomasyon senaryolarınızı oluşturun.",
                icon: Settings,
                stats: ["Sınırsız Kural", "Drag & Drop"],
            },
            {
                title: "Zamanlanmış Görevler",
                desc: "Fiyat güncellemeleri, stok kontrolleri ve raporları zamanlayın.",
                icon: Clock,
                stats: ["Cron Desteği", "Tekrar Eden Görevler"],
            },
        ],
        integration: [
            {
                title: "Pazaryeri Entegrasyonları",
                desc: "Trendyol, Hepsiburada, Amazon, N11, Çiçeksepeti ve daha fazlası.",
                icon: Globe,
                stats: ["15+ Pazaryeri", "Tek Tıkla Bağlantı"],
            },
            {
                title: "Kargo Entegrasyonları",
                desc: "Yurtiçi, Aras, MNG, PTT ve diğer kargo firmalarıyla entegre.",
                icon: Truck,
                stats: ["12+ Kargo", "Otomatik Etiket"],
            },
            {
                title: "Muhasebe Entegrasyonları",
                desc: "Logo, Mikro, Paraşüt ve diğer muhasebe yazılımlarıyla senkronize.",
                icon: FileText,
                stats: ["Otomatik Fatura", "e-Arşiv Desteği"],
            },
            {
                title: "API & Webhook",
                desc: "Güçlü API ile kendi entegrasyonlarınızı geliştirin.",
                icon: Cpu,
                stats: ["RESTful API", "Gerçek Zamanlı Webhook"],
            },
        ],
    },
    integrations: [
        { name: 'Trendyol', logo: '/images/pazaryeri/Trendyol.png' },
        { name: 'Hepsiburada', logo: '/images/pazaryeri/Hepsiburada.png' },
        { name: 'Amazon', logo: '/images/pazaryeri/Amazon.png' },
        { name: 'N11', logo: '/images/pazaryeri/N11.png' },
        { name: 'Çiçeksepeti', logo: '/images/pazaryeri/ciceksepeti.png' },
        { name: 'GittiGidiyor', logo: '/images/pazaryeri/GittiGidiyor.png' },
        { name: 'Pazarama', logo: '/images/pazaryeri/Pazarama.png' },
        { name: 'Pttavm', logo: '/images/pazaryeri/pttavm.png' },
    ],
    testimonials: [
        {
            quote: "Stok yönetimimiz tamamen değişti. Artık manuel işlem yapmıyoruz.",
            author: "Ahmet Yılmaz",
            role: "E-Ticaret Müdürü, TechStore",
            avatar: "AY",
            rating: 5
        },
        {
            quote: "AI fiyatlandırma önerisi ile kar marjımız %40 arttı.",
            author: "Elif Kaya",
            role: "Kurucu, ModaButik",
            avatar: "EK",
            rating: 5
        },
        {
            quote: "15 pazaryerini tek panelden yönetmek inanılmaz kolaylaştı.",
            author: "Mehmet Demir",
            role: "CEO, MegaShop",
            avatar: "MD",
            rating: 5
        }
    ]
};

export default function FeaturesView({ data }: { data: any }) {
    const [activeCategory, setActiveCategory] = useState('ai');
    const hero = data?.hero || { title: "Tüm Özellikler", description: "E-ticaret operasyonlarınızı güçlendirin" };

    // Handle hash-based tab switching
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash) {
                // Map hashes to categories if necessary
                const hashMap: Record<string, string> = {
                    'orders': 'automation',
                    'shipping': 'integration',
                    'accounting': 'integration',
                    'ai-pricing': 'ai',
                    'ai-demand': 'ai'
                };

                const targetCategory = hashMap[hash] || hash;

                if (FEATURES_DATA.categories.some(cat => cat.id === targetCategory)) {
                    setActiveCategory(targetCategory);

                    // Smooth scroll to the tabs section
                    const element = document.getElementById('features-tabs');
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        };

        // Initial check
        handleHashChange();

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <MarketingPageShell as="main" padded={false}>
            {/* Hero Section */}
            <section className="relative pt-8 sm:pt-12 pb-20 overflow-hidden">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="text-center max-w-5xl mx-auto">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-50 to-purple-50 dark:from-orange-500/10 dark:to-purple-500/10 border border-orange-100 dark:border-orange-500/20 rounded-full mb-8"
                        >
                            <Sparkles size={16} className="text-orange-600 dark:text-orange-400" />
                            <span className="text-sm font-bold text-orange-700 dark:text-orange-300">50.000+ Satıcı Tarafından Tercih Ediliyor</span>
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight mb-8 leading-[0.95]"
                        >
                            {hero.title}
                            <span className="block bg-gradient-to-r from-orange-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Tek Platformda.
                            </span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed"
                        >
                            {hero.description}
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                        >
                            <Link href="/signup" className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg overflow-hidden shadow-2xl hover:shadow-orange-500/25 transition-all hover:scale-105">
                                <span className="relative z-10 flex items-center gap-2">
                                    Ücretsiz Başla
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </span>
                            </Link>
                            <button className="group flex items-center gap-3 px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 flex items-center justify-center">
                                    <Play size={16} className="text-white ml-0.5" />
                                </div>
                                Demo İzle
                            </button>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                        >
                            {FEATURES_DATA.stats.map((stat, i) => (
                                <div key={i} className="p-6 bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all group">
                                    <stat.icon className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-4 group-hover:scale-110 transition-transform" />
                                    <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

                    {/* Features Section */}
                    {/* Anchor targets for direct links (e.g. /features#inventory) */}
                    {FEATURES_DATA.categories.map(cat => (
                        <div id={cat.id} key={`anchor-${cat.id}`} />
                    ))}
                    <section id="features-tabs" className="py-20 relative">
                <div className="container mx-auto px-6 max-w-7xl">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-full mb-6"
                        >
                            <Cpu size={14} className="text-slate-600 dark:text-slate-400" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Güçlü Özellikler</span>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4"
                        >
                            Her İhtiyaca <span className="text-orange-600">Bir Çözüm</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
                        >
                            Kategorilere göre özelliklerimizi keşfedin ve işinizi nasıl dönüştürebileceğimizi görün.
                        </motion.p>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {FEATURES_DATA.categories.map((cat) => (
                            <motion.button
                                key={cat.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${activeCategory === cat.id
                                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                                    : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
                                    }`}
                            >
                                <cat.icon size={18} />
                                {cat.name}
                            </motion.button>
                        ))}
                    </div>

                    {/* Features Grid */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {FEATURES_DATA.features[activeCategory as keyof typeof FEATURES_DATA.features].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group relative p-8 bg-white dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500"
                                >
                                    {/* Glow Effect */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${FEATURES_DATA.categories.find(c => c.id === activeCategory)?.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`} />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${FEATURES_DATA.categories.find(c => c.id === activeCategory)?.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                <feature.icon size={24} className="text-white" />
                                            </div>
                                            {'demo' in feature && feature.demo && (
                                                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs font-bold rounded-full">
                                                    Demo Mevcut
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">
                                            {feature.title}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                            {feature.desc}
                                        </p>

                                        {/* Stats */}
                                        <div className="flex flex-wrap gap-2">
                                            {feature.stats.map((stat, j) => (
                                                <span key={j} className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {stat}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Learn More */}
                                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                            <button className="flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-400 hover:gap-3 transition-all">
                                                Daha Fazla Bilgi
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* Integrations Section */}
            <section className="py-20 bg-slate-50 dark:bg-white/[0.02] relative overflow-hidden">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4"
                        >
                            Tüm Pazaryerleri <span className="text-orange-600">Tek Çatı Altında</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-lg text-slate-600 dark:text-slate-400"
                        >
                            Türkiye&apos;nin en büyük pazaryerleriyle entegre çalışın.
                        </motion.p>
                    </div>

                    {/* Logos */}
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 dark:from-[#0B1120] to-transparent z-10" />
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 dark:from-[#0B1120] to-transparent z-10" />

                        <div className="flex gap-6 animate-scroll">
                            {[...FEATURES_DATA.integrations, ...FEATURES_DATA.integrations].map((integration, i) => (
                                <div
                                    key={i}
                                    className="flex-shrink-0 w-48 h-24 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center p-4 hover:border-orange-300 dark:hover:border-orange-500/30 hover:shadow-lg transition-all"
                                >
                                    <Image
                                        src={integration.logo}
                                        alt={integration.name}
                                        width={120}
                                        height={40}
                                        className="object-contain opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4"
                        >
                            Müşterilerimiz <span className="text-orange-600">Ne Diyor?</span>
                        </motion.h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {FEATURES_DATA.testimonials.map((testimonial, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 bg-white dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-xl transition-all"
                            >
                                {/* Stars */}
                                <div className="flex gap-1 mb-6">
                                    {[...Array(testimonial.rating)].map((_, j) => (
                                        <Star key={j} size={18} className="text-yellow-500 fill-yellow-500" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-lg text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                                    &quot;{testimonial.quote}&quot;
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{testimonial.author}</div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="py-20 bg-slate-50 dark:bg-white/[0.02]">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4"
                        >
                            Standart vs <span className="text-orange-600">Premium</span>
                        </motion.h2>
                    </div>

                    <div className="bg-white dark:bg-white/5 rounded-[3rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl">
                        <div className="grid grid-cols-3 p-8 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                            <div className="col-span-1 text-sm font-bold text-slate-400 uppercase tracking-widest py-4">ÖZELLİKLER</div>
                            <div className="col-span-1 text-center text-xl font-black text-slate-900 dark:text-white">Standart</div>
                            <div className="col-span-1 text-center text-xl font-black text-orange-600">Premium</div>
                        </div>
                        {[
                            { name: 'Pazaryeri Entegrasyonu', standard: '2 Adet', premium: 'Sınırsız' },
                            { name: 'Ürün Limiti', standard: '1.000', premium: '50.000+' },
                            { name: 'Stok Güncelleme', standard: '15 Dakika', premium: 'Anlık (Realtime)' },
                            { name: 'Sipariş Yönetimi', standard: true, premium: true },
                            { name: 'Faturalandırma', standard: false, premium: true },
                            { name: 'Yapay Zeka SEO', standard: false, premium: true },
                            { name: 'Rakip Analizi', standard: false, premium: true },
                            { name: '7/24 Öncelikli Destek', standard: false, premium: true },
                        ].map((feat, idx) => (
                            <div key={idx} className="grid grid-cols-3 p-6 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                <div className="col-span-1 font-bold text-slate-700 dark:text-slate-300 flex items-center">{feat.name}</div>
                                <div className="col-span-1 text-center font-medium text-slate-500 dark:text-slate-400 flex justify-center items-center">
                                    {typeof feat.standard === 'boolean' ? (
                                        feat.standard ? <CheckCircle className="w-6 h-6 text-orange-500" /> : <span className="text-slate-300">—</span>
                                    ) : feat.standard}
                                </div>
                                <div className="col-span-1 text-center font-bold text-slate-900 dark:text-white flex justify-center items-center">
                                    {typeof feat.premium === 'boolean' ? (
                                        feat.premium ? <CheckCircle className="w-6 h-6 text-orange-600" /> : <span>—</span>
                                    ) : feat.premium}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container mx-auto px-6 max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 via-orange-900 to-amber-900 p-12 md:p-20 text-center"
                    >
                        {/* Background Elements */}
                        <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px]" />
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px]" />
                        </div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-8">
                                <Rocket size={16} className="text-orange-400" />
                                <span className="text-sm font-bold text-white/80">14 Gün Ücretsiz Deneyin</span>
                            </div>

                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
                                E-Ticaretinizi Dönüştürmeye<br />Hazır mısınız?
                            </h2>

                            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12">
                                Hemen ücretsiz deneme hesabınızı oluşturun ve tüm özellikleri keşfedin.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/signup" className="group px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:scale-105">
                                    <span className="flex items-center gap-2">
                                        Ücretsiz Başla
                                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                    </span>
                                </Link>
                                <Link href="/contact" className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
                                    Satış ile Görüşün
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <style jsx>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 30s linear infinite;
                }
            `}</style>
        </MarketingPageShell>
    );
}
