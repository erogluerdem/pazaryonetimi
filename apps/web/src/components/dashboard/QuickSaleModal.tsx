'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Search, Package, ArrowRight } from 'lucide-react';
import { useQuickSale } from '@/hooks/useQuickSale';

interface QuickSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function QuickSaleModal({ isOpen, onClose }: QuickSaleModalProps) {
    const {
        status,
        errorMessage,
        searchQuery,
        setSearchQuery,
        selectedItems,
        customerData,
        setCustomerData,
        focusedProductIndex,
        filteredProducts,
        totalAmount,
        orderLoading,
        handleClose,
        addItem,
        removeItem,
        updateQuantity,
        handleSubmit,
        handleKeyDown // Make sure this is returned from the hook!
    } = useQuickSale(onClose);

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Handle keyboard shortcuts for the entire modal
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') handleClose();
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen, handleClose]);


    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 12 }}
                        transition={{ duration: 0.2 }}
                        className="bg-card rounded-xl w-full max-w-4xl overflow-hidden border border-border shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-muted/20 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-foreground">Hızlı Satış Terminali</h2>
                                    <p className="text-xs text-muted-foreground">Klavye ile süper hızlı sipariş oluşturun</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1">
                            {status === 'success' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center h-full py-16 space-y-4"
                                >
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold text-foreground">Satış Başarılı!</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Sipariş sisteme işlendi.</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
                                    {/* Left: Product Selection (7 cols) */}
                                    <div className="lg:col-span-7 p-4 sm:p-5 border-r border-border/70 flex flex-col gap-4">

                                        {/* Search Bar */}
                                        <div className="relative z-20">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        // @ts-ignore
                                                        if (typeof handleKeyDown === 'function') handleKeyDown(e);
                                                    }}
                                                    className="w-full bg-background border border-border/80 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors shadow-2xs"
                                                    placeholder="Ürün ara... (Enter ile ekle)"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-muted border border-border/60 rounded text-[10px] text-muted-foreground font-mono">
                                                        <span>↑↓</span>
                                                    </kbd>
                                                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-muted border border-border/60 rounded text-[10px] text-muted-foreground font-mono">
                                                        <span>↵</span>
                                                    </kbd>
                                                </div>
                                            </div>

                                            {/* Dropdown Results */}
                                            <AnimatePresence>
                                                {searchQuery && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -6 }}
                                                        className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-30"
                                                    >
                                                        {filteredProducts.length > 0 ? (
                                                            filteredProducts.map((p: import("@/lib/hooks").Product, index: number) => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => addItem(p)}
                                                                    className={`w-full p-2.5 text-left flex items-center justify-between border-b border-border/50 last:border-0 transition-colors text-xs ${index === focusedProductIndex ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-muted/50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${index === focusedProductIndex ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-muted text-muted-foreground'}`}>
                                                                            <Package className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="font-medium text-foreground truncate">{p.name}</div>
                                                                            <div className="text-[10px] text-muted-foreground font-mono">{p.sku}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                        <div className="font-semibold text-foreground tabular-nums">{p.price.toLocaleString('tr-TR')} ₺</div>
                                                                        {index === focusedProductIndex && <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-6 text-center text-muted-foreground text-xs">
                                                                <Package className="w-6 h-6 mx-auto mb-1 opacity-30" />
                                                                <p>Ürün bulunamadı.</p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Selected Items List */}
                                        <div className="flex-1 flex flex-col min-h-0 bg-muted/20 rounded-lg border border-border/60 overflow-hidden">
                                            <div className="px-3.5 py-2.5 border-b border-border/60 bg-card flex justify-between items-center text-xs">
                                                <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">Sepet ({selectedItems.length})</h3>
                                                {selectedItems.length > 0 && (
                                                    <button onClick={() => selectedItems.forEach(i => removeItem(i.productId))} className="text-[11px] text-rose-500 hover:underline">Sepeti Temizle</button>
                                                )}
                                            </div>

                                            <div className="overflow-y-auto p-2 space-y-1.5 flex-1">
                                                <AnimatePresence mode='popLayout'>
                                                    {selectedItems.length > 0 ? (
                                                        selectedItems.map(item => (
                                                            <motion.div
                                                                layout
                                                                initial={{ opacity: 0, x: -12 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: 12 }}
                                                                key={item.productId}
                                                                className="flex items-center gap-2.5 p-2 bg-card rounded-md border border-border/60 group text-xs shadow-2xs"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-foreground truncate">{item.name}</div>
                                                                    <div className="text-[10px] text-muted-foreground font-mono">{item.price.toLocaleString('tr-TR')} ₺ x {item.quantity}</div>
                                                                </div>

                                                                <div className="flex items-center bg-muted rounded border border-border/70 overflow-hidden">
                                                                    <button
                                                                        onClick={() => updateQuantity(item.productId, -1)}
                                                                        className="w-6 h-6 flex items-center justify-center hover:bg-muted-foreground/10 active:scale-95 transition-all text-foreground text-xs"
                                                                    >-</button>
                                                                    <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                                                                    <button
                                                                        onClick={() => updateQuantity(item.productId, 1)}
                                                                        className="w-6 h-6 flex items-center justify-center hover:bg-muted-foreground/10 active:scale-95 transition-all text-foreground text-xs"
                                                                    >+</button>
                                                                </div>

                                                                <div className="text-right min-w-[65px]">
                                                                    <div className="font-semibold text-foreground tabular-nums">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</div>
                                                                </div>

                                                                <button
                                                                    onClick={() => removeItem(item.productId)}
                                                                    className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-rose-500 rounded transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </motion.div>
                                                        ))
                                                    ) : (
                                                        <div className="h-32 flex flex-col items-center justify-center text-muted-foreground/60">
                                                            <Package className="w-8 h-8 mb-1 stroke-1" />
                                                            <p className="text-xs">Henüz ürün eklenmedi</p>
                                                        </div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Footer Totals */}
                                            {selectedItems.length > 0 && (
                                                <div className="px-3.5 py-2.5 bg-card border-t border-border/60 mt-auto">
                                                    <div className="flex justify-between items-center mb-0.5 text-xs">
                                                        <span className="text-muted-foreground">Ara Toplam</span>
                                                        <span className="text-foreground font-medium tabular-nums">{totalAmount.toLocaleString('tr-TR')} ₺</span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-1 border-t border-border/40">
                                                        <span className="text-xs font-semibold text-foreground">Genel Toplam</span>
                                                        <span className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">{totalAmount.toLocaleString('tr-TR')} <span className="text-xs font-normal">₺</span></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Customer Form & Actions (5 cols) */}
                                    <div className="lg:col-span-5 p-4 sm:p-5 bg-card flex flex-col h-full border-t lg:border-t-0 border-border/70">
                                        <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Müşteri & Ödeme</h3>

                                        <form id="quick-sale-form" onSubmit={(e) => handleSubmit(e)} className="space-y-3 flex-1 overflow-y-auto pr-1">
                                            <div className="space-y-2.5">
                                                <div className="group">
                                                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Ad Soyad</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={customerData.name}
                                                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                                                        className="w-full bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                                                        placeholder="Müşteri adı"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    <div className="group">
                                                        <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Telefon</label>
                                                        <input
                                                            type="tel"
                                                            value={customerData.phone}
                                                            onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                                            className="w-full bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                                                            placeholder="05..."
                                                        />
                                                    </div>
                                                    <div className="group">
                                                        <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">E-posta</label>
                                                        <input
                                                            type="email"
                                                            value={customerData.email}
                                                            onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                                                            className="w-full bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                                                            placeholder="mail@"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Adres</label>
                                                    <textarea
                                                        value={customerData.address}
                                                        onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                                                        rows={3}
                                                        className="w-full bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                                        placeholder="Teslimat adresi..."
                                                    />
                                                </div>
                                            </div>

                                            {status === 'error' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400"
                                                >
                                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                    {errorMessage}
                                                </motion.div>
                                            )}
                                        </form>

                                        <div className="pt-3 border-t border-border/70 mt-auto">
                                            <button
                                                form="quick-sale-form"
                                                disabled={orderLoading || selectedItems.length === 0}
                                                type="submit"
                                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                            >
                                                {orderLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                <span>Satışı Onayla</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
