"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function FloatingCTA() {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('floatingCTA_dismissed') === 'true') {
            setIsDismissed(true);
            return;
        }

        // Show after scrolling 60% of the page
        const handleScroll = () => {
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            setIsVisible(scrollPercent > 60);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('floatingCTA_dismissed', 'true');
    };

    if (isDismissed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-auto sm:bottom-6 z-50"
                >
                    <div className="relative group">
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />

                        <div className="relative bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-3 sm:p-4 shadow-2xl">
                            {/* Dismiss Button */}
                            <button
                                onClick={handleDismiss}
                                className="absolute -top-2 -right-2 w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors z-10"
                            >
                                <X size={14} />
                            </button>

                            <div className="flex items-center gap-3 sm:gap-4">
                                {/* Icon */}
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                                    <Sparkles size={20} className="text-white" />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/80 text-xs sm:text-sm truncate">14 Gün Ücretsiz Deneyin</p>
                                    <p className="text-white font-bold text-sm sm:text-base truncate">Hemen Demo Talep Edin</p>
                                </div>

                                {/* CTA Button */}
                                <Link
                                    href="/demo"
                                    className="px-4 py-2 bg-white text-orange-700 rounded-xl font-bold text-sm hover:bg-orange-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    Demo İste
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
