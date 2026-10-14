"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Search,
    Command,
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Settings,
    Warehouse,
    Bot,
    Store,
    FileText,
    Bell,
    TrendingUp,
    Zap,
    ArrowRight,
    Clock,
    Star,
    Hash,
    Calculator,
    Globe,
    Shield,
    CreditCard,
    Megaphone,
    MessageSquare,
    BarChart3,
    Target,
    PieChart,
    Boxes,
    Tags,
    Truck,
    Receipt,
    LineChart,
    X,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { useQuickActions } from '@/providers/quick-actions-provider';
import { getCommandPaletteNavItems } from '@/lib/navigation.config';
import { resolveNavIcon } from '@/lib/navigation-icons';

interface CommandItem {
    id: string;
    title: string;
    description?: string;
    icon: React.ElementType;
    href?: string;
    action?: () => void;
    category: string;
    keywords?: string[];
    shortcut?: string;
}

const navCommands: CommandItem[] = getCommandPaletteNavItems().map((item) => ({
    id: item.id,
    title: item.label,
    description: item.description || `${item.label} sayfasına git`,
    icon: resolveNavIcon(item.icon),
    href: item.href,
    category: item.section,
    keywords: item.keywords,
}));

const allCommands: CommandItem[] = [
    ...navCommands,
    { id: 'quick-sale', title: 'Hızlı Satış', description: 'Yeni satış oluştur', icon: Zap, category: 'Hızlı İşlemler', keywords: ['satış', 'yeni', 'hızlı'] },
    { id: 'add-product', title: 'Yeni Ürün Ekle', description: 'Ürün oluştur', icon: Package, category: 'Hızlı İşlemler', keywords: ['ürün', 'ekle', 'yeni'] },
    { id: 'sync-all', title: 'Tümünü Senkronize Et', description: 'Tüm pazaryerlerini güncelle', icon: Globe, category: 'Hızlı İşlemler', keywords: ['sync', 'senkron', 'güncelle'] },
    { id: 'upgrade', title: 'Planı Yükselt', description: 'Pro özelliklere geç', icon: Star, href: '/dashboard/upgrade', category: 'Sistem', keywords: ['upgrade', 'yükselt', 'pro'] },
];

// AI Suggestions based on context and time
function getAISuggestions(): CommandItem[] {
  const hour = new Date().getHours();
  const suggestions: CommandItem[] = [];
  
  // Time-based suggestions
  if (hour >= 9 && hour <= 11) {
    suggestions.push({
      id: 'ai-morning',
      title: 'Gün Başı Raporu',
      description: 'AI: Sabah satış özeti ve öneriler',
      icon: Sparkles,
      category: 'AI Önerileri',
      action: () => console.log('Morning report'),
      keywords: ['rapor', 'sabah', 'gün başı'],
    });
  }
  
  if (hour >= 14 && hour <= 16) {
    suggestions.push({
      id: 'ai-inventory',
      title: 'Stok Kontrolü',
      description: 'AI: Kritik stok seviyeleri tespit edildi',
      icon: Sparkles,
      category: 'AI Önerileri',
      href: '/dashboard/inventory',
      keywords: ['stok', 'envanter', 'kritik'],
    });
  }
  
  // Always show these smart suggestions
  suggestions.push(
    {
      id: 'ai-forecast',
      title: 'Satış Tahmini',
      description: 'AI: Yarın için %23 artış öngörülüyor',
      icon: Sparkles,
      category: 'AI Önerileri',
      href: '/dashboard/analytics',
      keywords: ['tahmin', 'satış', 'forecast'],
    },
    {
      id: 'ai-optimize',
      title: 'Fiyat Optimizasyonu',
      description: 'AI: 5 üründe fiyat ayarlaması öneriliyor',
      icon: Sparkles,
      category: 'AI Önerileri',
      href: '/dashboard/price-optimization',
      keywords: ['fiyat', 'optimizasyon', 'kar'],
    },
    {
      id: 'ai-competitor',
      title: 'Rakip Analizi',
      description: 'AI: 3 rakip yeni kampanya başlatmış',
      icon: Sparkles,
      category: 'AI Önerileri',
      href: '/dashboard/competitor-tracking',
      keywords: ['rakip', 'analiz', 'pazar'],
    }
  );
  
  return suggestions;
}

// Son kullanılan komutları tutmak için
const recentCommandIds = ['dashboard', 'orders', 'products', 'ai-advisor'];

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { openQuickSale, openAddProduct } = useQuickActions();

    const aiSuggestions = getAISuggestions();

    // Filtrelenmiş komutlar
    const filteredCommands = search
        ? allCommands.filter(cmd => {
            const searchLower = search.toLowerCase();
            return (
                cmd.title.toLowerCase().includes(searchLower) ||
                cmd.description?.toLowerCase().includes(searchLower) ||
                cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
            );
        })
        : [...aiSuggestions, ...allCommands];

    // Kategorilere göre grupla
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {} as Record<string, CommandItem[]>);

    // Son kullanılanlar
    const recentCommands = recentCommandIds
        .map(id => allCommands.find(c => c.id === id))
        .filter(Boolean) as CommandItem[];

    // Keyboard kısayolları
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K veya Ctrl+K ile aç
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }

            // Escape ile kapat
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Modal açıldığında input'a focus
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
                setSearch('');
                setSelectedIndex(0);
            }, 100);
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const totalItems = filteredCommands.length;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % totalItems);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
                break;
            case 'Enter':
                e.preventDefault();
                const selected = filteredCommands[selectedIndex];
                if (selected) executeCommand(selected);
                break;
        }
    }, [filteredCommands, selectedIndex]);

    // Komutu çalıştır
    const executeCommand = (cmd: CommandItem) => {
        setIsOpen(false);
        if (cmd.id === 'quick-sale') {
            openQuickSale();
        } else if (cmd.id === 'add-product') {
            openAddProduct();
        } else if (cmd.href) {
            router.push(cmd.href);
        } else if (cmd.action) {
            cmd.action();
        }
    };

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            selectedElement?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border/80 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
            >
                <Search size={14} />
                <span className="hidden md:inline">Ara...</span>
                <kbd className="hidden md:flex items-center gap-1 px-1.5 py-0.5 bg-background border border-border/70 rounded text-[10px] font-mono ml-auto">
                    <Command size={10} /> K
                </kbd>
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Command Palette */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: -12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: -12 }}
                            transition={{ duration: 0.15 }}
                            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl z-[101] overflow-hidden"
                        >
                            {/* Search Input */}
                            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/80">
                                <Search size={16} className="text-muted-foreground shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setSelectedIndex(0);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Sayfa ara, komut çalıştır..."
                                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                                />
                                <kbd className="hidden md:flex items-center px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono text-muted-foreground border border-border/60">
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
                                {!search && recentCommands.length > 0 && (
                                    <div className="mb-3">
                                        <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Son Kullanılanlar
                                        </div>
                                        {recentCommands.map((cmd, idx) => (
                                            <CommandListItem
                                                key={cmd.id}
                                                command={cmd}
                                                isSelected={selectedIndex === idx}
                                                onClick={() => executeCommand(cmd)}
                                                dataIndex={idx}
                                            />
                                        ))}
                                    </div>
                                )}

                                {Object.entries(groupedCommands).map(([category, commands], catIdx) => {
                                    const startIndex = search
                                        ? filteredCommands.findIndex(c => c.id === commands[0].id)
                                        : recentCommands.length + Object.entries(groupedCommands)
                                            .slice(0, catIdx)
                                            .reduce((acc, [, cmds]) => acc + cmds.length, 0);

                                    return (
                                        <div key={category} className="mb-3">
                                            <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                {category}
                                            </div>
                                            {commands.map((cmd, idx) => (
                                                <CommandListItem
                                                    key={cmd.id}
                                                    command={cmd}
                                                    isSelected={selectedIndex === startIndex + idx}
                                                    onClick={() => executeCommand(cmd)}
                                                    dataIndex={startIndex + idx}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}

                                {filteredCommands.length === 0 && (
                                    <div className="py-12 text-center">
                                        <Search size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                                        <p className="text-xs font-medium text-foreground">Sonuç bulunamadı</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">Farklı anahtar kelimeler deneyin</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-2.5 border-t border-border/70 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1 py-0.2 bg-background border border-border/70 rounded text-[9px]">↑</kbd>
                                        <kbd className="px-1 py-0.2 bg-background border border-border/70 rounded text-[9px]">↓</kbd>
                                        <span className="ml-1 text-[10px]">Gezin</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1 py-0.2 bg-background border border-border/70 rounded text-[9px]">↵</kbd>
                                        <span className="ml-1 text-[10px]">Aç</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Sparkles size={11} className="text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-[10px]">AI destekli arama</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// List Item Component
function CommandListItem({
    command,
    isSelected,
    onClick,
    dataIndex
}: {
    command: CommandItem;
    isSelected: boolean;
    onClick: () => void;
    dataIndex: number;
}) {
    const Icon = command.icon;

    return (
        <button
            data-index={dataIndex}
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-xs ${isSelected
                ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-medium'
                : 'text-foreground hover:bg-muted/60'
                }`}
        >
            <div className={`p-1.5 rounded-md ${isSelected ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-400' : 'bg-muted text-muted-foreground'}`}>
                <Icon size={14} />
            </div>
            <div className="flex-1 text-left min-w-0">
                <div className="font-medium truncate">{command.title}</div>
                {command.description && (
                    <div className="text-[11px] text-muted-foreground truncate">{command.description}</div>
                )}
            </div>
            {command.shortcut && (
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono text-muted-foreground border border-border/50">
                    {command.shortcut}
                </kbd>
            )}
            <ChevronRight size={13} className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground/60'} />
        </button>
    );
}

export default CommandPalette;
