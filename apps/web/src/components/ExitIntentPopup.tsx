"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ArrowRight, Clock, Sparkles, Percent } from 'lucide-react';


interface ExitIntentPopupProps {
    delay?: number; // Minimum time on page before showing (ms)
}

export default function ExitIntentPopup({ delay = 5000 }: ExitIntentPopupProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [hasShown, setHasShown] = useState(false);
    const [timeOnPage, setTimeOnPage] = useState(0);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('exitIntent_shown') === 'true') {
            setHasShown(true);
        }
    }, []);

    // Track time on page
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeOnPage(prev => prev + 1000);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Exit intent detection
    const handleMouseLeave = useCallback((e: MouseEvent) => {
        if (
            e.clientY <= 0 && // Mouse leaving from top
            !hasShown &&
            timeOnPage >= delay
        ) {
            setIsVisible(true);
            setHasShown(true);
            sessionStorage.setItem('exitIntent_shown', 'true');
        }
    }, [hasShown, timeOnPage, delay]);

    useEffect(() => {
        // Skip if already shown
        if (hasShown) {
            return;
        }

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [handleMouseLeave, hasShown]);

    const handleClose = () => {
        setIsVisible(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // Here you would send the email to your backend
        setTimeout(() => {
            setIsVisible(false);
        }, 3000);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100]"
                    />

                    {/* Modal Wrapper for Centering and Perspective */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none" style={{ perspective: "1200px" }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30, rotateX: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20, rotateX: -5 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                            className="relative w-full max-w-lg pointer-events-auto"
                        >
                            {/* Premium Revolving Border Wrapper */}
                            <div className="relative p-[1px] rounded-[32px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]">
                                <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,transparent_20%,#059669_40%,#0d9488_60%,transparent_80%)] animate-[spin_6s_linear_infinity] opacity-100 dark:opacity-75" />

                                <div className="relative bg-white dark:bg-slate-900/90 backdrop-blur-3xl rounded-[31px] overflow-hidden">
                                    {/* Close Button - Premium Positioning */}
                                    <button
                                        onClick={handleClose}
                                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-white hover:bg-red-500 transition-all duration-300 z-30 group"
                                    >
                                        <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                                    </button>

                                    {/* Header Banner: Aurora Mesh Style */}
                                    <div className="relative h-48 overflow-hidden">
                                        {/* Mesh Gradient Orbs */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700" />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], x: [0, 20, 0] }}
                                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-400/30 rounded-full blur-[80px]"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.3, 1], rotate: [0, -45, 0], y: [0, 30, 0] }}
                                            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                            className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-[70px]"
                                        />

                                        {/* Noise Texture Over Header */}
                                        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                                        <div className="relative h-full flex flex-col items-center justify-center pt-6 text-center z-10">
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4 shadow-xl shadow-black/10"
                                            >
                                                <Gift size={32} className="text-white drop-shadow-lg" />
                                            </motion.div>
                                            <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                                                Bir Dakika!
                                            </h3>
                                            <p className="text-white/90 font-medium text-sm">
                                                Özel teklifimizi kaçırmayın
                                            </p>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-8 pb-4 relative">
                                        {!submitted ? (
                                            <>
                                                {/* Offer Highlight */}
                                                <div className="text-center mb-8 relative">
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[11px] font-black uppercase tracking-widest mb-5 border border-emerald-500/20">
                                                        <Sparkles size={14} className="animate-pulse" />
                                                        Sadece Bugüne Özel
                                                    </div>

                                                    <h4 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                                                        İlk 3 Ay <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">%30 İndirim</span>
                                                    </h4>
                                                    <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium text-sm">
                                                        Hemen demo talep edin, bu özel avantajdan anında yararlanın.
                                                    </p>
                                                </div>

                                                {/* Form Container */}
                                                <form onSubmit={handleSubmit} className="space-y-4">
                                                    <div className="relative group">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <input
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            placeholder="Kurumsal e-posta adresiniz"
                                                            required
                                                            className="relative w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                                        />
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        className="group/btn relative w-full h-14 overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-500/25 dark:shadow-emerald-500/10 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                                                    >
                                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                                            <span>İndirimli Demo Talep Et</span>
                                                            <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                                        </div>
                                                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                                    </button>
                                                </form>

                                                {/* Trust Markers */}
                                                <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <Clock size={12} className="text-emerald-500" />
                                                        <span>14 Gün ÜCRETSİZ</span>
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/10" />
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <Sparkles size={12} className="text-emerald-500" />
                                                        <span>SINIRSIZ ERİŞİM</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-12">
                                                <motion.div
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30"
                                                >
                                                    <Sparkles size={40} className="text-emerald-600 dark:text-emerald-400" />
                                                </motion.div>
                                                <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
                                                    Harika! 🎉
                                                </h4>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                                    Teklifinizi kaydettik. Ekibimiz en kısa sürede sizinle iletişime geçecek.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Modal Actions Footer */}
                                    <div className="px-8 pb-8 flex flex-col items-center">
                                        {!submitted && (
                                            <button
                                                onClick={handleClose}
                                                className="group text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors duration-300 flex items-center gap-2"
                                            >
                                                <span>Hayır, teşekkürler</span>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">• Tam fiyat ödemek istiyorum</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
