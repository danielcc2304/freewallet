import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

type TransactionTone = 'buy' | 'sell' | 'transfer' | 'edit' | 'delete';
type WorkbookTone = 'ok' | 'warn' | 'neutral';
type StatusPillProps = HTMLAttributes<HTMLElement> & {
    as?: 'span' | 'div';
    icon?: ReactNode;
} & ({ appearance: 'transaction'; tone: TransactionTone } | { appearance: 'workbook'; tone: WorkbookTone });

const colors = {
    buy: 'tw:bg-[rgba(16,185,129,.12)] tw:text-[#10b981]',
    sell: 'tw:bg-[rgba(245,158,11,.12)] tw:text-[#f59e0b]',
    transfer: 'tw:bg-[rgba(139,92,246,.12)] tw:text-[#8b5cf6]',
    edit: 'tw:bg-[rgba(59,130,246,.12)] tw:text-[#3b82f6]',
    delete: 'tw:bg-[rgba(239,68,68,.12)] tw:text-[#ef4444]',
    ok: 'tw:data-[tone=ok]:border-[rgba(16,185,129,.35)] tw:bg-[rgba(16,185,129,.1)] tw:text-[#34d399]',
    warn: 'tw:data-[tone=warn]:border-[rgba(245,158,11,.4)] tw:bg-[rgba(245,158,11,.1)] tw:text-[#fbbf24]',
    neutral: 'tw:text-secondary',
};

/** Shared status structure; callers keep the labels and financial meaning of each state. */
export function StatusPill({ as: Tag = 'span', appearance, tone, icon, children, className, ...props }: StatusPillProps) {
    const transaction = appearance === 'transaction';
    return <Tag {...props} data-tone={tone} className={cn(transaction
        ? 'transactions__badge tw:inline-flex tw:items-center tw:gap-[.4rem] tw:w-fit tw:p-[.35rem_.65rem] tw:rounded-[999px] tw:text-[.75rem] tw:font-bold'
        : `portfolio-csv-status portfolio-csv-status--${tone} tw:flex-[0_0_auto] tw:p-[.35rem_.65rem] tw:ui-border-strong tw:rounded-[999px] tw:text-[.72rem] tw:font-extrabold tw:tracking-[.04em]`, colors[tone], className)}>
        {icon}{transaction ? <span>{children}</span> : children}
    </Tag>;
}
