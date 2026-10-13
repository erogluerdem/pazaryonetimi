"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────
export type ThemeStyle = 'default' | 'nexora';
export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemeColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'teal' | 'indigo' | 'violet' | 'rose' | 'slate';
export type ThemeFont = 'inter' | 'poppins' | 'roboto' | 'open-sans' | 'montserrat' | 'lato';
export type ThemeRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ThemeSettings {
    mode: ThemeMode;
    color: ThemeColor;
    font: ThemeFont;
    radius: ThemeRadius;
    compactMode: boolean;
    sidebarPosition: 'left' | 'right';
    animations: boolean;
    themeStyle: ThemeStyle;
}

export const defaultThemeSettings: ThemeSettings = {
    mode: 'light',
    color: 'blue',
    font: 'inter',
    radius: 'lg',
    compactMode: false,
    sidebarPosition: 'left',
    animations: true,
    themeStyle: 'default',
};

// ─── Color Palette Map ────────────────────────────────
export const colorPalettes: Record<ThemeColor, { primary: string; primaryRgb: string; hover: string; gradient: string }> = {
    blue:   { primary: '#3b82f6', primaryRgb: '59,130,246',  hover: '#2563eb', gradient: 'from-blue-500 to-cyan-500' },
    purple: { primary: '#8b5cf6', primaryRgb: '139,92,246',  hover: '#7c3aed', gradient: 'from-purple-500 to-pink-500' },
    green:  { primary: '#22c55e', primaryRgb: '34,197,94',   hover: '#16a34a', gradient: 'from-green-500 to-emerald-500' },
    orange: { primary: '#f97316', primaryRgb: '249,115,22',  hover: '#ea580c', gradient: 'from-orange-500 to-amber-500' },
    red:    { primary: '#ef4444', primaryRgb: '239,68,68',   hover: '#dc2626', gradient: 'from-red-500 to-rose-500' },
    pink:   { primary: '#ec4899', primaryRgb: '236,72,153',  hover: '#db2777', gradient: 'from-pink-500 to-fuchsia-500' },
    teal:   { primary: '#14b8a6', primaryRgb: '20,184,166',  hover: '#0d9488', gradient: 'from-teal-500 to-cyan-500' },
    indigo: { primary: '#6366f1', primaryRgb: '99,102,241',  hover: '#4f46e5', gradient: 'from-indigo-500 to-violet-500' },
    violet: { primary: '#7c3aed', primaryRgb: '124,58,237',  hover: '#6d28d9', gradient: 'from-violet-500 to-purple-500' },
    rose:   { primary: '#e11d48', primaryRgb: '225,29,72',   hover: '#be123c', gradient: 'from-rose-500 to-pink-500' },
    slate:  { primary: '#475569', primaryRgb: '71,85,105',   hover: '#334155', gradient: 'from-slate-500 to-gray-600' },
};

export const radiusMap: Record<ThemeRadius, string> = {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
};

export const fontMap: Record<ThemeFont, string> = {
    'inter': "'Inter', system-ui, sans-serif",
    'poppins': "'Poppins', system-ui, sans-serif",
    'roboto': "'Roboto', system-ui, sans-serif",
    'open-sans': "'Open Sans', system-ui, sans-serif",
    'montserrat': "'Montserrat', system-ui, sans-serif",
    'lato': "'Lato', system-ui, sans-serif",
};

// ─── Context ──────────────────────────────────────────
interface ThemeContextType {
    theme: ThemeSettings;
    resolvedMode: 'dark' | 'light';
    setThemeSettings: (settings: Partial<ThemeSettings>) => void;
    resetTheme: () => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'pazar-theme-settings';

// ─── Provider ─────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<ThemeSettings>(() => {
        if (typeof window === 'undefined') {
            return defaultThemeSettings;
        }

        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                return defaultThemeSettings;
            }

            const parsed = JSON.parse(saved) as Partial<ThemeSettings>;
            return { ...defaultThemeSettings, ...parsed };
        } catch {
            return defaultThemeSettings;
        }
    });
    const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
        if (typeof window === 'undefined') {
            return true;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Listen for system color scheme changes
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Resolve actual mode
    const resolvedMode: 'dark' | 'light' = theme.mode === 'system'
        ? (systemPrefersDark ? 'dark' : 'light')
        : theme.mode;

    // Apply theme to DOM
    useEffect(() => {
        const root = document.documentElement;

        // Mode
        if (resolvedMode === 'light') {
            root.setAttribute('data-theme', 'light');
            root.classList.remove('dark');
        } else {
            root.setAttribute('data-theme', 'dark');
            root.classList.add('dark');
        }

        // Theme style (default vs nexora)
        root.setAttribute('data-theme-style', theme.themeStyle || 'default');

        // Color variables
        const palette = colorPalettes[theme.color];
        root.style.setProperty('--theme-primary', palette.primary);
        root.style.setProperty('--theme-primary-rgb', palette.primaryRgb);
        root.style.setProperty('--theme-primary-hover', palette.hover);

        // Radius
        root.style.setProperty('--theme-radius', radiusMap[theme.radius]);

        // Font
        root.style.setProperty('--theme-font', fontMap[theme.font]);

        // Compact mode
        root.setAttribute('data-compact', theme.compactMode ? 'true' : 'false');

        // Animations
        root.setAttribute('data-animations', theme.animations ? 'true' : 'false');

        // Sidebar position
        root.setAttribute('data-sidebar', theme.sidebarPosition);

        // Persist
        localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));

        // Backward compat
        localStorage.setItem('theme', resolvedMode);
    }, [theme, resolvedMode]);

    const setThemeSettings = useCallback((partial: Partial<ThemeSettings>) => {
        setTheme(prev => ({ ...prev, ...partial }));
    }, []);

    const resetTheme = useCallback(() => {
        setTheme(defaultThemeSettings);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => ({
            ...prev,
            mode: (prev.mode === 'dark' || (prev.mode === 'system' && systemPrefersDark)) ? 'light' : 'dark'
        }));
    }, [systemPrefersDark]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedMode, setThemeSettings, resetTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
