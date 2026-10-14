"use client";


import MarketingPageShell from '@/components/landing/MarketingPageShell';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Play, Calendar, Clock, Users, CheckCircle2, ArrowRight,
    Building2, Mail, Phone, User, Briefcase, Globe, Sparkles,
    Monitor, Shield, Zap, BarChart3, Package, ShoppingCart,
    Star, MessageSquare, Video, Headphones
} from 'lucide-react';
import Link from 'next/link';

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    employees: string;
    marketplaces: string[];
    message: string;
    preferredTime: string;
}

const marketplaceOptions = [
    { id: 'trendyol', label: 'Trendyol', icon: '🟠' },
    { id: 'hepsiburada', label: 'Hepsiburada', icon: '🟡' },
    { id: 'amazon', label: 'Amazon', icon: '📦' },
    { id: 'n11', label: 'N11', icon: '🔵' },
    { id: 'ciceksepeti', label: 'Çiçeksepeti', icon: '💐' },
    { id: 'gittigidiyor', label: 'GittiGidiyor', icon: '🛒' },
    { id: 'other', label: 'Diğer', icon: '➕' },
];

const employeeOptions = [
    '1-5 kişi',
    '6-20 kişi',
    '21-50 kişi',
    '51-200 kişi',
    '200+ kişi',
];

const roleOptions = [
    'CEO / Kurucu',
    'E-ticaret Müdürü',
    'Operasyon Müdürü',
    'Pazarlama Müdürü',
    'IT Müdürü',
    'Satış Temsilcisi',
    'Diğer',
];

const timeOptions = [
    'Sabah (09:00 - 12:00)',
    'Öğlen (12:00 - 14:00)',
    'Öğleden Sonra (14:00 - 17:00)',
    'Akşam (17:00 - 19:00)',
];

const benefits = [
    { icon: Monitor, title: 'Canlı Platform Demo', description: 'Gerçek verilerle platform deneyimi' },
    { icon: Users, title: 'Birebir Danışmanlık', description: 'İhtiyaçlarınıza özel çözümler' },
    { icon: BarChart3, title: 'ROI Analizi', description: 'Potansiyel kazanç hesaplaması' },
    { icon: Zap, title: 'Hızlı Kurulum Planı', description: '24 saat içinde başlayın' },
];

const features = [
    'Tüm pazaryeri entegrasyonları',
    'AI destekli fiyatlandırma',
    'Otomatik stok senkronizasyonu',
    'Gelişmiş analitik raporlar',
    'Toplu ürün yönetimi',
    '7/24 teknik destek',
];

const testimonials = [
    { name: 'Ahmet Y.', role: 'CEO, TechStore', text: 'Demo sonrası hemen başladık. 2 ayda satışlarımız %150 arttı.' },
    { name: 'Zeynep K.', role: 'E-ticaret Müdürü', text: 'Kapsamlı demo sayesinde tüm sorularımız yanıtlandı.' },
];

export default function DemoPage() {
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        role: '',
        employees: '',
        marketplaces: [],
        message: '',
        preferredTime: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleMarketplaceToggle = (id: string) => {
        setFormData(prev => ({
            ...prev,
            marketplaces: prev.marketplaces.includes(id)
                ? prev.marketplaces.filter(m => m !== id)
                : [...prev.marketplaces, id]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/demo/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Bir hata oluştu');
            }

            setIsSubmitted(true);
        } catch (error) {
            console.error('Demo request error:', error);
            alert('Bir hata oluştu, lütfen tekrar deneyiniz.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <MarketingPageShell as="section" className="pb-24" padded={false}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/20 blur-[150px] rounded-full" />
                </div>

                <div className="container mx-auto px-6 relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 size={48} className="text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                            Demo Talebiniz Alındı! 🎉
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                            Ekibimiz <span className="text-emerald-600 dark:text-emerald-400 font-bold">24 saat içinde</span> sizinle iletişime geçecek.
                        </p>

                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-8">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Sonraki Adımlar:</h3>
                            <div className="space-y-3 text-left">
                                {[
                                    'Talebinizi aldığımıza dair e-posta gönderdik',
                                    'Uzmanımız sizi arayarak demo tarihini belirleyecek',
                                    '30 dakikalık canlı demo görüşmesi yapılacak',
                                    'Size özel fiyat teklifi sunulacak'
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                                            {i + 1}
                                        </div>
                                        <span className="text-slate-600 dark:text-slate-400">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/demo" className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-600/20 transition-all flex items-center gap-2 justify-center">
                                <Sparkles size={18} />
                                Canlı Demoyu Şimdi İncele
                            </Link>
                            <Link href="/" className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity">
                                Ana Sayfaya Dön
                            </Link>
                            <Link href="/video-library" className="px-6 py-3 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-colors flex items-center gap-2 justify-center">
                                <Play size={18} />
                                Videoları İzle
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </MarketingPageShell>
        );
    }

    return (
        <MarketingPageShell as="section" className="pb-24" padded={false}>
            {/* Animated Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }} />
                <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-orange-500/10 dark:bg-orange-500/20 blur-[180px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/20 blur-[150px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-100 to-purple-100 dark:from-orange-900/40 dark:to-amber-900/40 border border-orange-200/50 dark:border-orange-700/50 rounded-full mb-8"
                    >
                        <Video size={16} className="text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-bold text-orange-700 dark:text-orange-300 tracking-wide">ÜCRETSİZ DEMO</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
                        Pazaryonetimi&apos;ni{' '}
                        <span className="bg-gradient-to-r from-orange-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Keşfedin
                        </span>
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        30 dakikalık ücretsiz demo ile platformumuzu tanıyın.
                        <span className="text-orange-600 dark:text-orange-400 font-semibold"> Hiçbir taahhüt yok.</span>
                    </p>

                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <span>Randevu oluşturmadan hemen test etmek mi istiyorsunuz?</span>
                        <Link href="/demo" className="font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1">
                            <span>Canlı Demo Portalı</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-5 gap-12">
                    {/* Left Side - Benefits */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-8"
                    >
                        {/* Benefits */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Demo&apos;da Neler Var?</h2>
                            <div className="space-y-4">
                                {benefits.map((benefit, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/10 to-purple-500/10 dark:from-orange-500/20 dark:to-purple-500/20 flex items-center justify-center flex-shrink-0">
                                            <benefit.icon size={24} className="text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{benefit.title}</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{benefit.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200/50 dark:border-orange-700/30">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Sparkles size={18} className="text-orange-600 dark:text-orange-400" />
                                Demo&apos;da Görecekleriniz
                            </h3>
                            <div className="space-y-2">
                                {features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Testimonials */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 dark:text-white">Demo Sonrası Yorumlar</h3>
                            {testimonials.map((testimonial, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                    <div className="flex items-center gap-1 mb-2">
                                        {[...Array(5)].map((_, j) => (
                                            <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">&ldquo;{testimonial.text}&rdquo;</p>
                                    <div className="text-sm">
                                        <span className="font-bold text-slate-900 dark:text-white">{testimonial.name}</span>
                                        <span className="text-slate-400"> • {testimonial.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Support Info */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/30">
                            <Headphones size={24} className="text-emerald-600 dark:text-emerald-400" />
                            <div>
                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Sorularınız mı var?</p>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">+90 212 555 0123</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side - Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-3"
                    >
                        <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                                    <Calendar size={24} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Demo Randevusu Al</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Formu doldurun, 24 saat içinde arayalım</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Fields */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Ad *
                                        </label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                                placeholder="Adınız"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Soyad *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                            placeholder="Soyadınız"
                                        />
                                    </div>
                                </div>

                                {/* Contact Fields */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            E-posta *
                                        </label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                                placeholder="ornek@sirket.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Telefon *
                                        </label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="tel"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                                placeholder="+90 5XX XXX XX XX"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Company Fields */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Şirket Adı *
                                        </label>
                                        <div className="relative">
                                            <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.company}
                                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                                placeholder="Şirket adınız"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Pozisyon *
                                        </label>
                                        <div className="relative">
                                            <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <select
                                                required
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none"
                                            >
                                                <option value="">Seçiniz</option>
                                                {roleOptions.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Employee Count */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Çalışan Sayısı *
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {employeeOptions.map(option => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, employees: option })}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.employees === option
                                                        ? 'bg-orange-600 text-white'
                                                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Marketplaces */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Kullandığınız Pazaryerleri
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {marketplaceOptions.map(mp => (
                                            <button
                                                key={mp.id}
                                                type="button"
                                                onClick={() => handleMarketplaceToggle(mp.id)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${formData.marketplaces.includes(mp.id)
                                                        ? 'bg-orange-600 text-white'
                                                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                    }`}
                                            >
                                                <span>{mp.icon}</span>
                                                {mp.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preferred Time */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tercih Ettiğiniz Saat Aralığı
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {timeOptions.map(time => (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, preferredTime: time })}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${formData.preferredTime === time
                                                        ? 'bg-orange-600 text-white'
                                                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                    }`}
                                            >
                                                <Clock size={14} />
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Mesajınız (Opsiyonel)
                                    </label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                                        placeholder="Demo'da özellikle görmek istediğiniz özellikler..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        <>
                                            Demo Randevusu Talep Et
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>

                                {/* Privacy Note */}
                                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                    Formu göndererek{' '}
                                    <Link href="/privacy" className="text-orange-600 dark:text-orange-400 hover:underline">
                                        Gizlilik Politikası
                                    </Link>
                                    &apos;nı kabul etmiş olursunuz.
                                </p>
                            </form>
                        </div>
                    </motion.div>
                </div>

                {/* FAQ */}
                <section className="mt-16">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Sık Sorulan Sorular</h3>
                        <div className="space-y-3">
                            <details className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10">
                                <summary className="font-semibold cursor-pointer">Demo ne kadar sürüyor?</summary>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Canlı demo genellikle 20-30 dakika sürer; ihtiyaçlarınıza göre kısa veya geniş kapsamlı olabilir.</p>
                            </details>
                            <details className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10">
                                <summary className="font-semibold cursor-pointer">Demo sonrası hangi destek sağlanır?</summary>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Demo sonrası özel teklif, onboarding planı ve kurulum desteği sağlıyoruz; isterseniz entegrasyonları ekibimiz ile başlatırız.</p>
                            </details>
                            <details className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10">
                                <summary className="font-semibold cursor-pointer">Demo için teknik ön bilgi gerekiyor mu?</summary>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Hayır — temel iş süreçlerinizi bilmemiz yeterli; isterseniz API/entegrasyon detaylarını da paylaşabilirsiniz.</p>
                            </details>
                        </div>
                    </div>
                </section>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20 text-center"
                >
                    <p className="text-slate-500 dark:text-slate-400 mb-6">5,000+ işletme tarafından güveniliyor</p>
                    <div className="flex flex-wrap justify-center gap-8 opacity-50">
                        {['Trendyol', 'Hepsiburada', 'Amazon', 'N11', 'Çiçeksepeti'].map((brand, i) => (
                            <div key={i} className="text-xl font-bold text-slate-400 dark:text-slate-600">
                                {brand}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </MarketingPageShell>
    );
}
