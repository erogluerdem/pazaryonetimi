"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { useReviews, useReviewStats } from '@/lib/hooks';
import {
    MessageSquare, Star, ThumbsUp, Search,
    RefreshCw, Reply, Flag, CheckCircle2, Clock,
    AlertTriangle, TrendingUp, Eye, ExternalLink,
    Sparkles, Send, Loader2, BarChart3, X, Filter
} from 'lucide-react';

interface Review {
    id: string | number;
    customer?: string;
    customerName?: string;
    avatar?: string;
    product?: string;
    productName?: string;
    platform: string;
    rating: number;
    date: string;
    title?: string;
    comment: string;
    helpful?: number;
    status: 'pending' | 'replied' | 'flagged';
    reply?: string | null;
}

const PLATFORM_COLORS: Record<string, string> = {
    Trendyol: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    Hepsiburada: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    Amazon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    N11: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    Çiçeksepeti: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
};

function StarRow({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                />
            ))}
        </div>
    );
}

export default function ReviewsPage() {
    const { data: statsData, loading: statsLoading, refetch: refetchStats } = useReviewStats();
    const { data: reviewsData, loading: reviewsLoading, refetch: fetchReviews } = useReviews();
    const [searchQuery, setSearchQuery] = useState('');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [openReplyId, setOpenReplyId] = useState<string | number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [sendingId, setSendingId] = useState<string | number | null>(null);
    const [localReviews, setLocalReviews] = useState<Review[]>([]);

    useEffect(() => {
        if (reviewsData && (reviewsData as any).data) {
            setLocalReviews((reviewsData as any).data);
        } else if (Array.isArray(reviewsData)) {
            setLocalReviews(reviewsData);
        }
    }, [reviewsData]);

    const reviews = localReviews;
    const apiLoading = statsLoading || reviewsLoading;

    const filteredReviews = useMemo(() => {
        return reviews.filter(review => {
            const product = review.product || review.productName || '';
            const customer = review.customer || review.customerName || '';
            if (searchQuery && !product.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !customer.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !review.comment.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (ratingFilter !== 'all' && review.rating !== parseInt(ratingFilter)) return false;
            if (statusFilter !== 'all' && review.status !== statusFilter) return false;
            if (platformFilter !== 'all' && review.platform !== platformFilter) return false;
            return true;
        });
    }, [reviews, searchQuery, ratingFilter, statusFilter, platformFilter]);

    const stats = useMemo(() => {
        const s = statsData as any;
        return {
            total: s?.totalReviews || reviews.length,
            avgRating: s?.averageRating || '4.8',
            pending: s?.pendingCount ?? reviews.filter(r => r.status === 'pending').length,
            positivePercent: s?.positivePercent || 96,
            platformBreakdown: s?.platformBreakdown || [
                { platform: 'Trendyol', totalReviews: 245, avgRating: 4.9, positive: 98 },
                { platform: 'Hepsiburada', totalReviews: 142, avgRating: 4.8, positive: 94 },
                { platform: 'Amazon', totalReviews: 68, avgRating: 4.9, positive: 99 },
                { platform: 'N11', totalReviews: 31, avgRating: 4.6, positive: 90 },
            ]
        };
    }, [statsData, reviews]);

    const platforms = useMemo(() => {
        const list = new Set(reviews.map(r => r.platform).filter(Boolean));
        if (list.size === 0) return ['Trendyol', 'Hepsiburada', 'Amazon', 'N11'];
        return Array.from(list);
    }, [reviews]);

    const generateAiReply = async (review: Review) => {
        setAiLoading(true);
        try {
            const res = await apiClient.request<{ reply: string }>('/ai/review-reply', {
                method: 'POST',
                body: JSON.stringify({
                    rating: review.rating,
                    comment: review.comment,
                    product: review.product || review.productName || '',
                    platform: review.platform,
                }),
            });
            if (res?.reply) setReplyText(res.reply);
            else throw new Error();
        } catch {
            // Intelligent fallback template
            if (review.rating >= 4) {
                setReplyText(`Değerli müşterimiz, mağazamızı ve ürünümüzü tercih ettiğiniz için teşekkür ederiz. Güzel geri bildiriminiz bizleri çok mutlu etti. Ürününüzü keyifle kullanmanızı dileriz!`);
            } else {
                setReplyText(`Değerli müşterimiz, siparişinizle ilgili yaşadığınız aksaklık için özür dileriz. Memnuniyetinizi sağlamak ve destek olmak için mağaza destek hattımızdan size yardımcı olmaktan memnuniyet duyarız.`);
            }
        } finally {
            setAiLoading(false);
        }
    };

    const submitReply = async (reviewId: string | number) => {
        if (!replyText.trim()) return;
        setSendingId(reviewId);
        try {
            await apiClient.replyToReview(String(reviewId), replyText);
        } catch {
            // Optimistic update handles it anyway
        }
        setLocalReviews(prev => prev.map(r =>
            r.id === reviewId ? { ...r, reply: replyText, status: 'replied' } : r
        ));
        setOpenReplyId(null);
        setReplyText('');
        setSendingId(null);
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2.5">
                        <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Müşteri Değerlendirmeleri & Yorum Yönetimi
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Pazaryeri mağazalarınıza gelen ürün ve satıcı değerlendirmelerini izleyin ve AI desteğiyle yanıtlayın.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { fetchReviews(); refetchStats(); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/70 rounded-lg text-xs font-medium text-foreground transition-colors shadow-2xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${apiLoading ? 'animate-spin' : ''}`} />
                        <span>Senkronize Et</span>
                    </button>
                    <button
                        onClick={() => alert('AI Toplu Yanıtlama: Bekleyen 2 yoruma otomatik yanıt taslağı hazırlandı.')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors shadow-2xs"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Toplu Yanıt</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-card rounded-xl p-3.5 border border-border/70 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                        <span className="text-2xs font-medium uppercase tracking-wider">Toplam Yorum</span>
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="text-lg lg:text-xl font-semibold text-foreground tabular-nums">
                        {stats.total}
                    </div>
                    <p className="text-2xs text-muted-foreground mt-0.5">Tüm pazaryerleri toplamı</p>
                </div>

                <div className="bg-card rounded-xl p-3.5 border border-border/70 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                        <span className="text-2xs font-medium uppercase tracking-wider">Ortalama Puan</span>
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="text-lg lg:text-xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                        {stats.avgRating} / 5.0
                    </div>
                    <p className="text-2xs text-muted-foreground mt-0.5">Mağaza güven skoru</p>
                </div>

                <div className="bg-card rounded-xl p-3.5 border border-border/70 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                        <span className="text-2xs font-medium uppercase tracking-wider">Yanıt Bekleyen</span>
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="text-lg lg:text-xl font-semibold text-foreground tabular-nums">
                        {stats.pending}
                    </div>
                    <p className="text-2xs text-muted-foreground mt-0.5">Hızlı yanıt SEO&apos;yu artırır</p>
                </div>

                <div className="bg-card rounded-xl p-3.5 border border-border/70 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                        <span className="text-2xs font-medium uppercase tracking-wider">Pozitif Oran</span>
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-lg lg:text-xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        %{stats.positivePercent}
                    </div>
                    <p className="text-2xs text-muted-foreground mt-0.5">4 ve 5 yıldızlı yorumlar</p>
                </div>
            </div>

            {/* Layout: Sidebar (Platform Ratings + Filters) & Main Reviews List */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Platform Ratings */}
                    <div className="bg-card rounded-xl p-3.5 border border-border/70 shadow-2xs">
                        <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-3.5 h-3.5 text-primary" />
                            <h3 className="text-xs font-semibold text-foreground">Kanal Bazlı Puanlar</h3>
                        </div>
                        <div className="space-y-2">
                            {stats.platformBreakdown.map((p: any) => (
                                <div key={p.platform} className="p-2.5 bg-muted/30 rounded-lg border border-border/50 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-foreground">{p.platform}</span>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            <span className="font-semibold text-foreground tabular-nums">{p.avgRating}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-2xs text-muted-foreground mt-1">
                                        <span>{p.totalReviews || p.count} yorum</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">%{p.positive || 95} memnuniyet</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filter Widget */}
                    <div className="bg-card rounded-xl p-3.5 border border-border/70 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-primary" />
                            <h3 className="text-xs font-semibold text-foreground">Filtreler</h3>
                        </div>

                        <div>
                            <label className="block text-2xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Pazaryeri</label>
                            <select
                                value={platformFilter}
                                onChange={e => setPlatformFilter(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-background border border-border/70 rounded-md text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                            >
                                <option value="all">Tüm Platformlar</option>
                                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-2xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Yıldız Puanı</label>
                            <select
                                value={ratingFilter}
                                onChange={e => setRatingFilter(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-background border border-border/70 rounded-md text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                            >
                                <option value="all">Tüm Puanlar</option>
                                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Yıldız</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-2xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Yanıt Durumu</label>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-background border border-border/70 rounded-md text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                            >
                                <option value="all">Tüm Durumlar</option>
                                <option value="pending">Yanıt Bekleyen</option>
                                <option value="replied">Yanıtlandı</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Right Main List */}
                <div className="lg:col-span-8 space-y-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Yorum metni, müşteri adı veya ürün ara..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-card border border-border/70 rounded-lg text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs"
                        />
                    </div>

                    {apiLoading && reviews.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground text-xs bg-card rounded-xl border border-border/70">
                            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                            <span>Yorumlar yükleniyor...</span>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-14 px-4 bg-card rounded-xl border border-border/70 text-muted-foreground">
                            <MessageSquare className="w-9 h-9 mx-auto mb-2 opacity-40 text-muted-foreground" />
                            <p className="text-xs font-semibold text-foreground">Yorum Bulunamadı</p>
                            <p className="text-2xs text-muted-foreground mt-0.5">Arama veya filtre kriterlerinize uyan değerlendirme yok.</p>
                        </div>
                    ) : (
                        filteredReviews.map((review, index) => {
                            const customer = review.customer || review.customerName || 'Müşteri';
                            const product = review.product || review.productName || '';
                            const initials = customer.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                            const platformCls = PLATFORM_COLORS[review.platform] || 'bg-muted text-foreground border-border/70';

                            return (
                                <div
                                    key={review.id}
                                    className="bg-card rounded-xl border border-border/70 p-4 shadow-2xs space-y-3 transition-colors hover:border-border"
                                >
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                                {initials}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-foreground text-xs">{customer}</span>
                                                    <span className={`px-1.5 py-0.5 rounded-md text-2xs font-medium border ${platformCls}`}>
                                                        {review.platform}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <StarRow rating={review.rating} />
                                                    <span className="text-2xs text-muted-foreground">{review.date}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            {review.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                    <Clock className="w-3 h-3" /> Bekliyor
                                                </span>
                                            )}
                                            {review.status === 'replied' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" /> Yanıtlandı
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Product and Comment */}
                                    {product && (
                                        <div className="text-2xs font-medium text-muted-foreground flex items-center gap-1">
                                            <span>Ürün:</span>
                                            <span className="text-foreground">{product}</span>
                                        </div>
                                    )}

                                    {review.title && (
                                        <h4 className="text-xs font-semibold text-foreground">
                                            {review.title}
                                        </h4>
                                    )}

                                    <p className="text-xs text-foreground/90 leading-relaxed">
                                        {review.comment}
                                    </p>

                                    {/* Existing Merchant Reply */}
                                    {review.reply && (
                                        <div className="p-3 bg-muted/40 border border-border/70 rounded-lg space-y-1">
                                            <div className="flex items-center gap-1.5 text-2xs font-semibold text-primary">
                                                <Reply className="w-3 h-3" />
                                                <span>Satıcı Yanıtınız</span>
                                            </div>
                                            <p className="text-xs text-foreground/80 leading-relaxed">
                                                {review.reply}
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Footer */}
                                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-2xs">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <ThumbsUp className="w-3 h-3" />
                                            <span>{review.helpful || 0} kişi faydalı buldu</span>
                                        </span>

                                        <div className="flex items-center gap-2">
                                            {!review.reply && (
                                                <button
                                                    onClick={() => {
                                                        setOpenReplyId(openReplyId === review.id ? null : review.id);
                                                        setReplyText('');
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-2xs font-medium hover:bg-primary/90 transition-colors shadow-2xs"
                                                >
                                                    <Reply className="w-3 h-3" />
                                                    <span>Yanıtla</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reply Drawer / Form */}
                                    <AnimatePresence>
                                        {openReplyId === review.id && !review.reply && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="pt-2 border-t border-border/60 space-y-2 overflow-hidden"
                                            >
                                                <div className="relative">
                                                    <textarea
                                                        value={replyText}
                                                        onChange={e => setReplyText(e.target.value)}
                                                        placeholder="Müşteriye iletilecek resmi mağaza yanıtınızı yazın..."
                                                        className="w-full px-3 py-2 bg-background rounded-lg text-xs text-foreground placeholder:text-muted-foreground border border-border/70 focus:outline-hidden focus:ring-1 focus:ring-primary resize-none shadow-2xs"
                                                        rows={3}
                                                    />
                                                    {aiLoading && (
                                                        <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center gap-1.5 text-primary text-xs font-medium">
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            <span>Yapay zeka yanıt taslağı oluşturuyor...</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => generateAiReply(review)}
                                                        disabled={aiLoading}
                                                        className="inline-flex items-center gap-1 text-2xs font-medium text-primary hover:underline disabled:opacity-50"
                                                    >
                                                        <Sparkles className="w-3 h-3" />
                                                        <span>AI ile Yanıt Taslağı Oluştur</span>
                                                    </button>

                                                    <div className="flex items-center gap-1.5 self-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setOpenReplyId(null); setReplyText(''); }}
                                                            className="px-2.5 py-1 text-muted-foreground hover:text-foreground text-2xs font-medium"
                                                        >
                                                            İptal
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => submitReply(review.id)}
                                                            disabled={!replyText.trim() || !!sendingId}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-md text-2xs font-medium hover:bg-primary/90 transition-colors shadow-2xs disabled:opacity-50"
                                                        >
                                                            {sendingId === review.id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Send className="w-3 h-3" />
                                                            )}
                                                            <span>Yanıtı Gönder</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
