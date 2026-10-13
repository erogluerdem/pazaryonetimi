'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Building2, Eye, EyeOff, Loader2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    acceptTerms: false,
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptTerms) {
      setError('Lütfen kullanım koşullarını kabul edin.');
      return;
    }

    if (!formData.fullName.trim()) {
      setError('Ad Soyad alanı zorunludur.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName,
          lastName,
          company: formData.companyName,
        }),
      });

      const data = await registerRes.json().catch(() => ({}));

      if (!registerRes.ok) {
        throw new Error(data.error || 'Kayıt işlemi başarısız oldu.');
      }

      const loginResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (loginResult?.ok) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      router.push('/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt işlemi sırasında bir hata oluştu.');
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      badge="14 Gün Ücretsiz Deneme"
      title={
        <>
          E-Ticaret operasyonunuzu <span className="text-primary font-bold">büyütün.</span>
        </>
      }
      description="Pazaryonetimi ile Trendyol, Hepsiburada, Amazon ve tüm pazaryerlerindeki mağazalarınızı dakikalar içinde entegre edin."
      topLink={{
        text: 'Zaten hesabınız var mı?',
        linkText: 'Giriş yapın',
        href: '/login',
      }}
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Hesap Oluşturun</h2>
      <p className="mb-6 mt-1.5 text-xs sm:text-sm text-muted-foreground">
        Hemen ücretsiz kaydolun, kredi kartı gerekmez.
      </p>

      {/* Error Message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form className="grid gap-3.5" onSubmit={handleRegister}>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-foreground">Ad Soyad</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Adınız Soyadınız"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-input bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-foreground">Şirket / Mağaza Adı</label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Şirketiniz veya Mağazanız"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-input bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-foreground">İş E-postası</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ornek@sirketiniz.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-input bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-foreground">Şifre</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="En az 8 karakter"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input
            id="terms"
            type="checkbox"
            required
            checked={formData.acceptTerms}
            onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
            className="size-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs text-muted-foreground leading-normal cursor-pointer select-none">
            <Link href="/kurumsal/kullanim-kosullari" className="text-foreground underline underline-offset-2 hover:text-primary">
              Kullanım Koşulları
            </Link>
            'nı ve{' '}
            <Link href="/kurumsal/gizlilik" className="text-foreground underline underline-offset-2 hover:text-primary">
              Gizlilik Politikası
            </Link>
            'nı okudum ve kabul ediyorum.
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 shadow-xs transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Hesap oluşturuluyor...
            </>
          ) : (
            <>
              Ücretsiz Başlayın
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
