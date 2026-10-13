'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Crown,
  CreditCard,
  Shield,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

function getInitials(name?: string | null) {
  if (!name) return 'PY';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const menuItems = [
  { href: '/dashboard/settings/profile', label: 'Profilim', icon: User },
  { href: '/dashboard/settings', label: 'Hesap Ayarları', icon: Settings },
  { href: '/dashboard/payments', label: 'Ödemeler & Plan', icon: CreditCard },
  { href: '/dashboard/security', label: 'Güvenlik', icon: Shield },
];

interface DashboardUserMenuProps {
  session: Session | null;
  tenantPlan?: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function DashboardUserMenu({ session, tenantPlan = 'Pro', open, onToggle, onClose }: DashboardUserMenuProps) {
  const name = session?.user?.name || 'Kullanıcı';
  const email = session?.user?.email || '';
  const initials = getInitials(session?.user?.name);
  const planLabel = tenantPlan || 'Pro';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`group flex items-center gap-2.5 p-1 lg:px-2.5 lg:py-1.5 rounded-xl border transition-colors ${
          open
            ? 'bg-muted border-border text-foreground shadow-xs'
            : 'bg-muted/30 border-border/70 hover:bg-muted/70 hover:border-border text-foreground'
        }`}
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
        </div>

        <div className="text-left hidden lg:block min-w-0 max-w-[130px]">
          <div className="text-xs font-semibold text-foreground truncate leading-tight">
            {name}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{planLabel}</span>
          </div>
        </div>

        <ChevronDown
          size={13}
          className={`text-muted-foreground shrink-0 transition-transform duration-200 hidden sm:block ${open ? 'rotate-180 text-foreground' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={onClose} aria-hidden="true" />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-[61] overflow-hidden p-1.5"
            >
              <div className="p-3 border-b border-border/70 mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 flex items-center justify-center text-xs font-semibold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{email}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground border border-border/50">
                    <Crown size={10} className="text-amber-500" />
                    {planLabel} Paket
                  </span>
                  <Link
                    href="/dashboard/upgrade"
                    onClick={onClose}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Yükselt
                  </Link>
                </div>
              </div>

              <div className="space-y-0.5">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={onClose}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <item.icon size={14} className="text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-1 mt-1 border-t border-border/70">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
