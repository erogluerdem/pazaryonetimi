'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, RotateCcw, KeyRound } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <AuthShell
      badge="Şifre Kurtarma Servisi"
      title={
        <>
          Hesabınıza yeniden <span className="text-primary font-bold">erişin.</span>
        </>
      }
      description="Sistemimizde kayıtlı olan e-posta adresinizi girin, güvenli şifre sıfırlama bağlantınızı anında gönderelim."
      topLink={{
        text: 'Şifrenizi hatırladınız mı?',
        linkText: 'Giriş yapın',
        href: '/login',
      }}
    >
      <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/60 text-primary">
        <KeyRound className="size-5" />
      </div>

      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Şifremi Unuttum
            </h2>
            <p className="mb-6 mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Sistemimizde kayıtlı olan kurumsal e-posta adresinizi girin.
            </p>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="email" className="text-xs font-medium text-foreground">
                  E-posta adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="adiniz@sirket.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-input bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                <ArrowRight className="size-4" />
              </button>

              <div className="mt-4 pt-3 border-t border-border/50 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-3.5" />
                  Giriş sayfasına dön
                </Link>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 space-y-4"
          >
            <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto">
              <CheckCircle2 className="size-8" />
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Bağlantı Gönderildi!
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">{email}</strong> adresine şifre sıfırlama yönergeleri iletildi.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="size-3.5" />
                Tekrar dene
              </button>
              <Link
                href="/login"
                className="block w-full py-2.5 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-xs font-semibold text-foreground transition-colors text-center"
              >
                Giriş sayfasına dön
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
