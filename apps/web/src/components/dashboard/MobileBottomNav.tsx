'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '@/providers/theme-provider';
import { useOrderStats } from '@/lib/hooks';
import { getBottomNavItems } from '@/lib/navigation.config';
import { resolveNavIcon } from '@/lib/navigation-icons';

interface MobileBottomNavProps {
  onMenuOpen: () => void;
  onHaptic?: () => void;
}

export default function MobileBottomNav({ onMenuOpen, onHaptic }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { data: orderStats } = useOrderStats();
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = prefersReducedMotion || !theme.animations;
  const currentPath = pathname ?? '';
  const navItems = getBottomNavItems();

  const isActive = (href: string) => {
    if (href === '/dashboard') return currentPath === '/dashboard';
    return currentPath.startsWith(href);
  };

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[100] lg:hidden px-2 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]">
      <div className="mobile-bottom-nav-inner relative mx-auto flex items-end justify-around px-2 pt-2 pb-[calc(0.45rem+env(safe-area-inset-bottom,0px))]">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = resolveNavIcon(item.icon);
          const badge = item.id === 'orders' ? orderStats?.today?.total : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onHaptic}
              className="flex flex-col items-center justify-center min-w-[60px] py-1 relative group active:scale-95 transition-transform duration-150 haptic-tap"
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1 w-6 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <motion.div
                className="relative"
                animate={active && !shouldReduceMotion ? { y: [0, -2, 0], scale: [1, 1.05, 1] } : { y: 0, scale: 1 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: 'easeOut' }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.0 : 1.6}
                  className={`transition-colors duration-200 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}
                />
                {badge !== undefined && Number(badge) > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-medium flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </motion.div>
              <span className={`text-[10px] font-medium mt-0.5 tracking-tight transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}>
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => {
            onHaptic?.();
            onMenuOpen();
          }}
          aria-label="Menüyü aç"
          className="flex flex-col items-center justify-center min-w-[60px] py-1 active:scale-95 transition-transform haptic-tap"
        >
          <Menu size={20} strokeWidth={1.6} className="text-muted-foreground" />
          <span className="text-[10px] font-medium mt-0.5 tracking-tight text-muted-foreground">Menü</span>
        </button>
      </div>
    </nav>
  );
}
