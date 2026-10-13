"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, TrendingUp, TrendingDown, DollarSign, ShoppingCart,
    Users, Package, CheckCircle, Circle, ArrowRight, Trophy,
    Flame, Star, Award, Zap, Sparkles, Calendar
} from 'lucide-react';

interface Goal {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    prefix?: string;
    icon?: React.ElementType;
    color: string;
    deadline: string;
    status: 'on-track' | 'behind' | 'completed' | 'at-risk';
}

const iconMap: Record<string, React.ElementType> = {
    'revenue': DollarSign,
    'orders': ShoppingCart,
    'customers': Users,
    'products': Package,
};

const getGoalIcon = (goal: Goal): React.ElementType => {
    return goal.icon || iconMap[goal.id] || Target;
};

interface GoalTrackerProps {
    goals?: Goal[];
}

export default function GoalTracker({ goals: propGoals }: GoalTrackerProps) {
    const goals = Array.isArray(propGoals) ? propGoals : [];
    const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle size={10} /> Tamamlandı</span>;
            case 'on-track':
                return <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full"><TrendingUp size={10} /> Yolunda</span>;
            case 'behind':
                return <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full"><TrendingDown size={10} /> Geride</span>;
            case 'at-risk':
                return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full"><Flame size={10} /> Risk</span>;
            default:
                return null;
        }
    };

    const formatValue = (goal: Goal, value: number) => {
        if (goal.prefix === '₺') {
            return `₺${value.toLocaleString('tr-TR')}`;
        }
        return `${value.toLocaleString('tr-TR')} ${goal.unit}`;
    };

    return (
        <div className="dash-card rounded-xl border border-border/70 bg-card p-5 lg:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-foreground tracking-tight">Hedef Takibi</h3>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar size={12} />
                    <span>
                      {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {goals.length === 0 ? (
                <div className="p-4 rounded-xl bg-background/50 border border-border text-center">
                    <p className="text-sm font-semibold text-foreground">Hedef verisi bulunamadı</p>
                    <p className="text-xs text-slate-500 mt-1">Hedefleriniz tanımlandığında burada gerçek veriler görünecek.</p>
                </div>
            ) : (
            <div className="space-y-3">
                {goals.map((goal) => {
                    const percentage = Math.min(100, (goal.current / goal.target) * 100);
                    return (
                        <motion.div
                            key={goal.id}
                            className="p-3 rounded-xl bg-background/50 border border-border hover:border-primary/30 transition-all cursor-pointer"
                            onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
                            whileHover={{ scale: 1.01 }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {(() => { const Icon = getGoalIcon(goal); return <Icon className={`w-4 h-4 ${goal.color}`} />; })()}
                                    <span className="text-xs font-bold text-foreground">{goal.title}</span>
                                </div>
                                {getStatusBadge(goal.status)}
                            </div>

                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="font-bold text-foreground">{formatValue(goal, goal.current)}</span>
                                <span className="text-slate-500">/ {formatValue(goal, goal.target)}</span>
                            </div>

                            <div className="h-2 bg-background rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${
                                        percentage >= 90 ? 'bg-green-500' :
                                        percentage >= 70 ? 'bg-blue-500' :
                                        percentage >= 50 ? 'bg-amber-500' :
                                        'bg-red-500'
                                    }`}
                                />
                            </div>

                            <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] text-slate-500">%{percentage.toFixed(0)} tamamlandı</span>
                                <span className="text-[10px] text-slate-500">Son: {goal.deadline}</span>
                            </div>

                            <AnimatePresence>
                                {selectedGoal === goal.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                                <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                                                <span className="text-[10px] text-primary">
                                                    {percentage >= 80 
                                                        ? `Harika gidiyorsun! Kalan ${formatValue(goal, goal.target - goal.current)} ile hedefe ulaşacaksın.`
                                                        : `Hedefe ulaşmak için günlük ${formatValue(goal, Math.ceil((goal.target - goal.current) / 15))} gerekiyor.`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
            )}

            {/* Overall Progress */}
            {goals.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border/60">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-medium text-foreground">Genel Başarı Oranı</span>
                        <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                            %{(goals.reduce((acc, g) => acc + (g.current / g.target) * 100, 0) / goals.length).toFixed(0)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
