"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Sparkles, Minimize2, Maximize2,
  RotateCcw, ShoppingCart, DollarSign, Clipboard,
  Loader2, ThumbsUp, ThumbsDown,
  ArrowRight, BarChart3, Package, TrendingUp,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTenantId } from '@/lib/tenant';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  type?: 'text' | 'briefing' | 'data';
  isLoading?: boolean;
}

interface QuickAction {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  action: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'daily', icon: Sparkles, label: 'Günlük Özet', action: 'daily-summary' },
  { id: 'orders', icon: ShoppingCart, label: 'Bekleyen Siparişler', action: 'pending-orders' },
  { id: 'revenue', icon: DollarSign, label: 'Bugünkü Ciro', action: 'revenue-today' },
  { id: 'stock', icon: Package, label: 'Kritik Stoklar', action: 'low-stock-alert' },
  { id: 'top', icon: TrendingUp, label: 'En Çok Satanlar', action: 'top-products' },
  { id: 'competitor', icon: BarChart3, label: 'Pazar Analizi', action: 'competitor-check' },
];

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const tenantId = useTenantId();
  const tenantHeaders = { 'Content-Type': 'application/json', ...(tenantId ? { 'x-tenant-id': tenantId } : {}) };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    loadSuggestions();
  }, [pathname]);

  const loadSuggestions = async () => {
    try {
      const res = await fetch('/api/ai/copilot/suggestions', {
        method: 'POST',
        headers: tenantHeaders,
        body: JSON.stringify({ currentPage: pathname }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch {
      setSuggestions([]);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setShowQuickActions(false);
    setIsTyping(true);

    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    try {
      const history = messages
        .filter((m) => !m.isLoading)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/copilot/chat', {
        method: 'POST',
        headers: tenantHeaders,
        body: JSON.stringify({ message: text.trim(), history, context: pathname }),
      });

      const data = res.ok
        ? await res.json()
        : { message: 'Şu anda yanıt veremiyorum. Lütfen tekrar deneyin.', suggestions: [] };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: data.message, isLoading: false, suggestions: data.suggestions, type: data.type }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.', isLoading: false }
            : m,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setShowQuickActions(false);
    setIsTyping(true);

    const loadingId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    try {
      const res = await fetch('/api/ai/copilot/quick-action', {
        method: 'POST',
        headers: tenantHeaders,
        body: JSON.stringify({ action }),
      });

      const data = res.ok ? await res.json() : { message: 'Aksiyon yürütülemedi.' };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: data.message, isLoading: false, type: data.type }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: 'İşlem sırasında bir hata oluştu.', isLoading: false }
            : m,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowQuickActions(true);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    setUnreadCount(0);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating Quiet Pill */}
      <AnimatePresence>
        {!isOpen && !isMobile && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={toggleOpen}
            className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/95 hover:bg-card text-foreground border border-border/80 shadow-md hover:shadow-lg transition-all backdrop-blur-md text-xs font-medium group"
          >
            <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles size={11} />
            </div>
            <span>Asistan</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-semibold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 52 : 'auto',
            }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[100] w-[380px] sm:w-[410px] max-h-[640px] bg-card text-card-foreground border border-border/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground tracking-tight">Akıllı Asistan</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-muted-foreground font-medium">Hazır</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Sohbeti Temizle"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                </button>
                <button
                  onClick={toggleOpen}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[420px] text-xs">
                  {messages.length === 0 && (
                    <div className="text-center py-6">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                        <Sparkles size={20} />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Size nasıl yardımcı olabilirim?</h4>
                      <p className="text-xs text-muted-foreground mb-5 max-w-[260px] mx-auto leading-relaxed">
                        Sipariş durumu, ciro performansı, envanter veya pazaryeri analizleriniz hakkında sorular sorabilirsiniz.
                      </p>

                      {showQuickActions && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {QUICK_ACTIONS.map((qa) => (
                            <button
                              key={qa.id}
                              onClick={() => handleQuickAction(qa.action)}
                              className="flex items-center gap-2 p-2.5 rounded-lg border border-border/70 hover:border-border hover:bg-muted/50 transition-all text-left group"
                            >
                              <div className="w-6 h-6 rounded-md bg-muted text-muted-foreground group-hover:text-foreground flex items-center justify-center shrink-0">
                                <qa.icon size={12} />
                              </div>
                              <span className="text-[11px] font-medium text-foreground truncate">{qa.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {suggestions.length > 0 && (
                        <div className="space-y-1.5 text-left mt-3">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                            Önerilen Sorular
                          </p>
                          {suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(s)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg border border-border/50 hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                            >
                              <ArrowRight size={10} className="text-indigo-500 shrink-0" />
                              <span className="truncate">{s}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-last' : ''}`}>
                        <div
                          className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-muted/70 text-foreground border border-border/50 rounded-bl-xs'
                          }`}
                        >
                          {msg.isLoading ? (
                            <div className="flex items-center gap-2 py-0.5">
                              <Loader2 size={13} className="animate-spin text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">İnceleniyor...</span>
                            </div>
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                          )}
                        </div>

                        {msg.suggestions && msg.suggestions.length > 0 && !msg.isLoading && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {msg.suggestions.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => sendMessage(s)}
                                className="px-2 py-0.5 rounded-full bg-muted/60 border border-border/60 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}

                        {msg.role === 'assistant' && !msg.isLoading && (
                          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                            <button className="p-1 rounded hover:text-foreground hover:bg-muted transition-colors">
                              <ThumbsUp size={10} />
                            </button>
                            <button className="p-1 rounded hover:text-foreground hover:bg-muted transition-colors">
                              <ThumbsDown size={10} />
                            </button>
                            <button
                              onClick={() => navigator.clipboard.writeText(msg.content)}
                              className="p-1 rounded hover:text-foreground hover:bg-muted transition-colors"
                              title="Kopyala"
                            >
                              <Clipboard size={10} />
                            </button>
                            <span className="text-[9px] text-muted-foreground ml-auto">
                              {msg.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-border/80 bg-card shrink-0">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Bir soru yazın..."
                        rows={1}
                        className="w-full px-3 py-2 bg-muted/50 border border-border/70 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 resize-none max-h-20"
                        style={{ minHeight: '36px' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = '36px';
                          target.style.height = Math.min(target.scrollHeight, 80) + 'px';
                        }}
                      />
                    </div>
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || isTyping}
                      className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
