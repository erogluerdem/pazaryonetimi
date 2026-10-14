"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
    Github, Twitter, Linkedin, Instagram, ArrowRight, Heart, Send, ChevronDown,
    Zap, Building2, LifeBuoy, BookOpen, ShieldCheck, Globe
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import Image from 'next/image';



const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative w-full bg-[#FAFAF9] dark:bg-[#0B1120] pt-12 sm:pt-20 overflow-hidden border-t border-slate-100 dark:border-white/5 transition-colors duration-500">
            {/* 3D Multi-Layer Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Noise Texture Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />
                {/* Dot Grid */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }} />

                {/* Advanced Ambient Glows */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.05, 0.1, 0.05]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-orange-500/10 dark:bg-orange-600/10 rounded-full blur-[180px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.03, 0.08, 0.03]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[150px]"
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-t from-orange-500/[0.02] dark:from-orange-500/[0.04] to-transparent" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Upper Section: CTA & Newsletter */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-10 sm:mb-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 mb-6 group cursor-default">
                            <span className="w-2 h-2 rounded-full bg-orange-600 dark:bg-orange-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 tracking-widest uppercase">14 Gün Ücretsiz</span>
                        </div>
                        <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-4 sm:mb-6 tracking-tighter leading-[0.9]">
                            Pazaryerlerinizi <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-400 dark:to-amber-400">Tek Panelde Yönetin.</span>
                        </h2>
                        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-md mb-6 sm:mb-8 leading-relaxed font-light">
                            Stok, sipariş ve kargo operasyonlarınızı tek merkezden yönetin. Kredi kartı gerekmez.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <Link href="/signup" className="group relative w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-full font-bold overflow-hidden shadow-xl shadow-orange-600/20 hover:shadow-2xl hover:shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 duration-300 text-center">
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Ücretsiz Başla
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                            <Link href="/demo" className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-full font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all hover:-translate-y-0.5 shadow-sm text-center">
                                Demo İzle
                            </Link>
                        </div>
                    </motion.div>

                    {/* 3D Tilt Newsletter Card */}
                    <NewsletterCard />
                </div>

                {/* Divider Line with Gradient */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent mb-8 sm:mb-12" />

                {/* Footer Links Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-10 mb-8 sm:mb-12">
                    <div className="col-span-1 lg:col-span-2 mb-6 lg:mb-0">
                        {/* Mobile Brand Card / Desktop Brand Info */}
                        <div className="relative p-6 lg:p-0 rounded-3xl lg:rounded-none bg-slate-50 lg:bg-transparent dark:bg-white/[0.02] lg:dark:bg-transparent border border-slate-200 lg:border-none dark:border-white/[0.06] lg:dark:border-none flex flex-col items-center lg:items-start text-center lg:text-left gap-6 overflow-hidden">
                            {/* Subtle background glow for mobile card */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl lg:hidden rounded-full pointer-events-none" />

                            <Link href="/" className="inline-block group relative z-10">
                                <span className="text-2xl lg:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 group-hover:from-orange-600 group-hover:to-amber-600 transition-all duration-300">
                                    Pazaryonetimi
                                </span>
                            </Link>
                            <p className="relative z-10 text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium max-w-sm">
                                Operayonları tek ekrandan yönetin. Karmaşayı azaltın, satışları artırın. Yeni nesil e-ticaret deneyimi.
                            </p>
                            <div className="relative z-10 flex gap-4">
                                {[
                                    { Icon: Twitter, href: "https://twitter.com/pazaryonetimi", label: "Twitter" },
                                    { Icon: Github, href: "https://github.com/pazaryonetimi", label: "GitHub" },
                                    { Icon: Linkedin, href: "https://linkedin.com/company/pazaryonetimi", label: "LinkedIn" },
                                    { Icon: Instagram, href: "https://instagram.com/pazaryonetimi", label: "Instagram" }
                                ].map((item, i) => (
                                    <MagneticSocialLink key={i} Icon={item.Icon} href={item.href} label={item.label} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {[
                        { title: "Ürün", icon: Zap, links: [{ label: 'Özellikler', href: '/features' }, { label: 'Çözümler', href: '/solutions' }, { label: 'Fiyatlandırma', href: '/pricing' }, { label: 'Entegrasyonlar', href: '/entegrasyonlar' }, { label: 'Demo İste', href: '/demo' }] },
                        { title: "Şirket", icon: Building2, links: [{ label: 'Hakkımızda', href: '/kurumsal/hakkimizda' }, { label: 'Kariyer', href: '/careers' }, { label: 'Basın', href: '/press' }, { label: 'Blog', href: '/blog' }, { label: 'Başarı Hikayeleri', href: '/case-studies' }] },
                        { title: "Destek", icon: LifeBuoy, links: [{ label: 'Yardım Merkezi', href: '/destek' }, { label: 'Sık Sorular', href: '/faq' }, { label: 'API Dokümantasyon', href: '/docs/api' }, { label: 'Sistem Durumu', href: '/status' }, { label: 'Topluluk', href: '/community' }] },
                        { title: "Kaynaklar", icon: BookOpen, links: [{ label: 'Rehberler', href: '/resources' }, { label: 'Videolar', href: '/video-library' }, { label: 'Webinarlar', href: '/webinars' }, { label: 'Partner Program', href: '/partner' }, { label: 'Referans Programı', href: '/referral' }] },
                        {
                            title: "Yasal", icon: ShieldCheck, links: [
                                { label: 'Gizlilik Politikası', href: '/kurumsal/gizlilik-politikasi' },
                                { label: 'Kullanım Şartları', href: '/kurumsal/kullanim-sartlari' },
                                { label: 'Çerez Politikası', href: '/kurumsal/cerez-politikasi' },
                                { label: 'KVKK', href: '/kurumsal/kvkk' },
                                { label: 'Satış Sözleşmesi', href: '/kurumsal/satis-sozlesmesi' },
                                { label: 'Hizmet Politikaları', href: '/kurumsal/hizmet-politikalari' }
                            ]
                        }
                    ].map((column, idx) => (
                        <FooterColumn key={idx} title={column.title} icon={column.icon} links={column.links} />
                    ))}
                </div>

                {/* Divider before bottom bar */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent mt-4 mb-8" />

                {/* Sophisticated Bottom Bar */}
                <div className="py-8 lg:py-10 border-t border-slate-100 dark:border-white/5">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
                        {/* Legal & Copyright */}
                        <div className="flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
                            <p className="text-[11px] lg:text-xs text-slate-400 font-medium" suppressHydrationWarning>© {currentYear} Pazaryonetimi Inc. Tüm hakları saklıdır.</p>
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-[10px] lg:text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                                <Link href="/security" className="hover:text-orange-500 transition-colors">Güvenlik</Link>
                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
                                <Link href="/status" className="hover:text-orange-500 transition-colors">Durum</Link>
                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
                                <Link href="/privacy" className="hover:text-orange-500 transition-colors">Gizlilik</Link>
                            </div>
                        </div>

                        {/* Grounding Bar (Badges) */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6">
                            {/* Payment Methods */}
                            <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-inner group relative">
                                <Image
                                    src="/images/iyzico-visa-mastercard-troy.png"
                                    alt="Ödeme Yöntemleri"
                                    width={200}
                                    height={20}
                                    className="h-5 w-auto object-contain opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                                />
                            </div>

                            {/* System Indicator */}
                            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] border border-emerald-500/20 dark:border-emerald-500/10 group cursor-default">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-25"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] lg:text-[11px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Sistemler Aktif</span>
                            </div>

                            {/* Geo/Love Badge (Hidden on very small mobile) */}
                            <div className="hidden sm:flex items-center gap-2 group cursor-default text-[11px] text-slate-400 font-semibold opacity-60 hover:opacity-100 transition-opacity">
                                <span>Türkiye'de</span>
                                <Heart size={12} className="text-red-500 fill-red-500 animate-pulse group-hover:scale-125 transition-transform" />
                                <span>Aşkla Yapıldı</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// --- Sub-components for better organization ---

const FooterColumn = ({ title, icon: Icon, links }: { title: string, icon: any, links: { label: string, href: string }[] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-3 lg:mb-0">
            {/* Mobile Column Header (Card Style) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full p-4 lg:hidden rounded-2xl border transition-all duration-300 ${isOpen
                    ? "bg-slate-100 dark:bg-white/[0.04] border-slate-300 dark:border-white/20 shadow-lg"
                    : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors duration-300 ${isOpen ? "bg-orange-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                        }`}>
                        <Icon size={18} />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{title}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    <ChevronDown size={18} className={isOpen ? "text-orange-500" : "text-slate-400"} />
                </motion.div>
            </button>

            {/* Desktop Column Header */}
            <div className="hidden lg:flex items-center gap-2 mb-6">
                <Icon size={16} className="text-orange-500" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{title}</h4>
            </div>

            <div className="hidden lg:block">
                <ul className="space-y-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {links.map(link => (
                        <li key={link.label}>
                            <Link href={link.href} className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-2 group relative">
                                <span className="w-0 group-hover:w-3 h-px bg-orange-500 dark:bg-orange-400 transition-all duration-300 ease-out" />
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Mobile Expanded Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden lg:hidden"
                    >
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 bg-slate-50/50 dark:bg-white/[0.01] rounded-b-2xl border-x border-b border-slate-200 dark:border-white/[0.06] -mt-2 pt-6">
                            {links.map(link => (
                                <li key={link.label}>
                                    <Link href={link.href} className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white dark:hover:bg-white/5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-300 transition-all duration-200">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const NewsletterCard = () => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const handleSubscribe = async () => {
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setStatus('error');
            setMessage('Geçerli bir e-posta adresi girin.');
            return;
        }
        setStatus('loading');
        setMessage('');
        try {
            const res = await fetch('/api/public/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || 'Abonelik başarısız');
            }
            setStatus('success');
            setMessage(data.message || 'Bültene başarıyla abone oldunuz!');
            setEmail('');
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Bir hata oluştu.');
        }
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative group perspective-1000 mt-4 lg:mt-0"
        >
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-600 via-amber-600 to-purple-600 rounded-[35px] blur-2xl opacity-0 group-hover:opacity-20 transition duration-700" />
            <div
                style={{ transform: "translateZ(80px)" }}
                className="relative p-6 sm:p-10 md:p-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[24px] sm:rounded-[32px] border border-white/50 dark:border-white/10 shadow-2xl dark:shadow-none overflow-hidden transition-all duration-300 group-hover:shadow-[0_20px_50px_rgba(234,88,12,0.1)] dark:group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
                {/* Internal Glow Follower */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000" />

                <div className="relative z-10">
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-600 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-500">
                            <Send size={28} className="-ml-1 translate-y-0.5 group-hover:rotate-12 transition-transform" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Bülten</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Zirveye giden yolu birlikte çizelim.</p>
                        </div>
                    </div>

                    <div className="relative flex gap-3 p-1 bg-slate-50 dark:bg-black/20 rounded-[22px] border border-slate-200 dark:border-white/5 focus-within:border-orange-500/50 transition-colors">
                        <input
                            type="email"
                            placeholder="E-posta adresiniz"
                            aria-label="Bülten aboneliği için e-posta adresiniz"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (status !== 'idle') setStatus('idle');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                            disabled={status === 'loading'}
                            className="flex-1 bg-transparent px-5 py-4 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium disabled:opacity-60"
                        />
                        <button
                            type="button"
                            onClick={handleSubscribe}
                            disabled={status === 'loading'}
                            aria-label="Bültene abone ol"
                            className="px-7 py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white rounded-[20px] font-bold transition-all shadow-lg hover:shadow-orange-500/30 group-hover:px-8 group/btn"
                        >
                            <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {message && (
                        <p className={`mt-3 text-xs font-medium px-2 ${status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {message}
                        </p>
                    )}

                    <p className="mt-5 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-500 font-bold tracking-tight px-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span>Üst düzey içerik, sıfır spam politikası.</span>
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const MagneticSocialLink = ({ Icon, href, label }: { Icon: React.ComponentType<{ size?: number; className?: string }>, href: string, label: string }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 150, damping: 15 });
    const springY = useSpring(y, { stiffness: 150, damping: 15 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        x.set(mouseX * 0.4);
        y.set(mouseY * 0.4);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.a
            href={href}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            aria-label={label}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-white dark:hover:text-black dark:text-slate-400 bg-white dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-white hover:border-transparent transition-all shadow-sm hover:shadow-xl duration-300 group"
        >
            <Icon size={19} className="group-hover:scale-110 transition-transform" />
        </motion.a>
    );
};

export default Footer;
