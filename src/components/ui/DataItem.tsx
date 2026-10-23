import type { ReactNode } from 'react';
import { CardContent } from './Card';
import { cn } from '../../utils/cn';

interface DataItemProps {
    as?: 'div' | 'article' | 'content';
    icon?: ReactNode;
    detailAs?: 'span' | 'small';
    label: ReactNode;
    value: ReactNode;
    detail?: ReactNode;
    layout?: 'metric' | 'identity' | 'fee' | 'detail' | 'planning' | 'transactions' | 'csv' | 'heatmap' | 'learningSummary' | 'portfolioAdvanced' | 'portfolioFlow' | 'portfolioDaily';
    valueAs?: 'strong' | 'span' | 'div';
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
    detailClassName?: string;
}

const roots = {
    portfolioAdvanced: 'tw:min-w-0 tw:ui-stack tw:gap-[.25rem] tw:p-[.8rem] tw:ui-border tw:rounded-[10px] tw:ui-fill-muted',
    portfolioFlow: 'tw:grid tw:gap-[.3rem] tw:p-[.85rem] tw:ui-border-strong tw:rounded-[12px] tw:bg-[rgba(255,255,255,.02)]',
    portfolioDaily: 'tw:grid tw:grid-cols-[auto_1fr] tw:items-center tw:gap-x-[.4rem] tw:gap-y-[.2rem] tw:text-secondary tw:text-[length:var(--font-size-xs)] tw:[&_svg]:text-accent tw:[&_svg]:row-span-2',
    learningSummary: 'tw:p-[.75rem_.9rem] tw:ui-fill-surface tw:ui-border-default tw:rounded-[14px] tw:grid tw:place-content-center tw:justify-items-center tw:gap-[.35rem] tw:min-h-[68px] tw:text-center tw:[@media(max-width:480px)]:min-h-[60px] tw:[@media(max-width:480px)]:p-[.5rem_.45rem] tw:[@media(max-width:480px)]:gap-[.2rem]',
    planning: 'tw:grid tw:gap-[.3rem]',
    transactions: 'tw:ui-stack tw:gap-[.35rem]',
    csv: 'tw:ui-fill-surface tw:ui-border tw:rounded-[14px] tw:p-[.9rem] tw:ui-stack tw:gap-[.3rem]',
    heatmap: 'tw:grid tw:gap-[.3rem] tw:p-[.85rem_1rem]',
    metric: 'tw:min-w-0 tw:p-ui-md tw:ui-fill-muted tw:ui-border tw:rounded-control',
    identity: 'tw:min-w-0 tw:pl-ui-md tw:[border-left:3px_solid_rgba(var(--accent-rgb),.25)]',
    fee: 'tw:ui-stack tw:gap-ui-xs tw:p-ui-md tw:ui-fill-muted tw:rounded-control',
    detail: 'tw:ui-fill-surface tw:ui-border-default tw:p-[1.5rem] tw:rounded-[20px] tw:ui-stack tw:gap-[.75rem] tw:justify-center tw:h-full',
};
const labels = {
    portfolioAdvanced: 'tw:text-secondary tw:text-[length:var(--font-size-xs)] tw:leading-[1.35]',
    portfolioFlow: 'tw:text-muted tw:text-[.78rem]',
    portfolioDaily: '',
    learningSummary: 'tw:text-muted tw:text-[.76rem] tw:leading-[1.2] tw:max-w-none tw:uppercase tw:tracking-[.04em] tw:[@media(max-width:480px)]:text-[.62rem] tw:[@media(max-width:480px)]:leading-none',
    planning: 'tw:text-secondary tw:text-[.875rem]',
    transactions: 'tw:text-secondary tw:text-[.875rem]',
    csv: 'tw:text-muted tw:text-[length:var(--font-size-xs)]',
    heatmap: 'tw:text-muted tw:text-[.7rem] tw:font-semibold',
    metric: 'tw:block tw:text-muted tw:text-[length:var(--font-size-xs)] tw:font-bold tw:uppercase tw:tracking-[.03em]',
    identity: 'tw:block tw:text-muted tw:text-[length:var(--font-size-xs)]',
    fee: 'tw:text-muted tw:text-[length:var(--font-size-sm)]',
    detail: 'tw:text-[.75rem] tw:text-secondary tw:uppercase tw:font-bold',
};
const values = {
    portfolioAdvanced: 'tw:text-main tw:text-[length:var(--font-size-lg)] tw:leading-[1.1] tw:wrap-anywhere',
    portfolioFlow: '',
    portfolioDaily: 'tw:text-main tw:text-[length:var(--font-size-sm)] tw:wrap-anywhere',
    learningSummary: 'tw:text-[1.3rem] tw:text-main tw:leading-none tw:whitespace-nowrap tw:[@media(max-width:480px)]:text-[1.05rem]',
    planning: 'tw:text-[1.4rem]',
    transactions: 'tw:text-[1.75rem] tw:leading-none',
    csv: 'tw:text-[length:var(--font-size-lg)] tw:text-main tw:font-bold',
    heatmap: 'tw:ui-row tw:gap-[.35rem] tw:text-[length:var(--font-size-lg)]',
    metric: 'tw:block tw:mt-ui-xs tw:text-main tw:text-[length:var(--font-size-lg)] tw:wrap-anywhere',
    identity: 'tw:block tw:mt-[.2rem] tw:text-main tw:text-[length:var(--font-size-sm)] tw:leading-[1.45] tw:wrap-anywhere',
    fee: 'tw:text-main tw:text-[length:var(--font-size-lg)]',
    detail: '',
};

/** Financial data formatting and missing-value policy remain with the caller. */
export function DataItem({ as = 'div', icon, detailAs: Detail = 'span', label, value, detail, layout = 'metric', valueAs: Value = 'strong', className, labelClassName, valueClassName, detailClassName }: DataItemProps) {
    const Root = as === 'content' ? CardContent : as;
    return <Root className={cn(roots[layout], className)}>
        {icon}
        <span className={cn(labels[layout], labelClassName)}>{label}</span>
        <Value className={cn(values[layout], valueClassName)}>{value}</Value>
        {detail && <Detail className={cn(layout === 'portfolioAdvanced' ? 'tw:text-muted tw:text-[length:var(--font-size-xs)] tw:leading-[1.35]' : 'tw:block tw:text-muted tw:text-[length:var(--font-size-xs)] tw:mt-ui-xs', detailClassName)}>{detail}</Detail>}
    </Root>;
}
