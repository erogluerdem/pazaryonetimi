import * as React from 'react';
import { cn, getInitials } from '@/lib/utils';

export function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<'table'> & { containerClassName?: string }) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        'relative w-full overflow-x-auto rounded-xl border border-border bg-card shadow-xs transition-colors',
        containerClassName
      )}
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('bg-muted/40 text-muted-foreground [&_tr]:border-b border-border/80', className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0 divide-y divide-border/60', className)}
      {...props}
    />
  );
}

export function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-t border-border bg-muted/50 font-medium text-foreground [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b border-border/60 transition-colors hover:bg-muted/40 has-aria-expanded:bg-muted/40 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 px-3.5 text-left align-middle font-medium whitespace-nowrap text-xs text-muted-foreground uppercase tracking-wider [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-3.5 align-middle whitespace-nowrap text-foreground text-sm [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

export function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

// ─── Nexora-Style Specialized Table Cells ────────────────────────────

export interface TableStatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export function TableStatusBadge({
  status,
  variant = 'neutral',
  className,
}: TableStatusBadgeProps) {
  const styles: Record<string, string> = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    neutral: 'bg-muted text-muted-foreground border-border',
  };

  const dots: Record<string, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles[variant] || styles.neutral,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', dots[variant] || dots.neutral)} />
      {status}
    </span>
  );
}

export function TableAvatarCell({
  name,
  subtitle,
  avatarUrl,
  tag,
}: {
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  tag?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden font-semibold text-xs text-foreground">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="size-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground text-sm">{name}</span>
          {tag && (
            <span className="h-4 px-1.5 text-[10px] font-semibold rounded bg-muted text-muted-foreground border border-border">
              {tag}
            </span>
          )}
        </div>
        {subtitle && (
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

export function TableProgressBar({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const percent = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">
        %{percent}
      </span>
    </div>
  );
}
