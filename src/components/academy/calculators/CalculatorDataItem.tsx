import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface CalculatorDataItemProps {
    label: ReactNode;
    value: ReactNode;
    detail?: ReactNode;
    layout?: 'metric' | 'identity' | 'fee' | 'detail';
    valueAs?: 'strong' | 'span' | 'div';
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
    detailClassName?: string;
}

const roots = {
    metric: 'tw:min-w-0 tw:p-ui-md tw:ui-fill-muted tw:ui-border tw:rounded-control',
    identity: 'tw:min-w-0 tw:pl-ui-md tw:[border-left:3px_solid_rgba(var(--accent-rgb),.25)]',
    fee: 'tw:ui-stack tw:gap-ui-xs tw:p-ui-md tw:ui-fill-muted tw:rounded-control',
    detail: 'tw:ui-fill-surface tw:ui-border-default tw:p-[1.5rem] tw:rounded-[20px] tw:ui-stack tw:gap-[.75rem] tw:justify-center tw:h-full',
};
const labels = {
    metric: 'tw:block tw:text-muted tw:text-[length:var(--font-size-xs)] tw:font-bold tw:uppercase tw:tracking-[.03em]',
    identity: 'tw:block tw:text-muted tw:text-[length:var(--font-size-xs)]',
    fee: 'tw:text-muted tw:text-[length:var(--font-size-sm)]',
    detail: 'tw:text-[.75rem] tw:text-secondary tw:uppercase tw:font-bold',
};
const values = {
    metric: 'tw:block tw:mt-ui-xs tw:text-main tw:text-[length:var(--font-size-lg)] tw:wrap-anywhere',
    identity: 'tw:block tw:mt-[.2rem] tw:text-main tw:text-[length:var(--font-size-sm)] tw:leading-[1.45] tw:wrap-anywhere',
    fee: 'tw:text-main tw:text-[length:var(--font-size-lg)]',
    detail: '',
};

/** Financial data formatting and missing-value policy remain with the caller. */
export function CalculatorDataItem({ label, value, detail, layout = 'metric', valueAs: Value = 'strong', className, labelClassName, valueClassName, detailClassName }: CalculatorDataItemProps) {
    return <div className={cn(roots[layout], className)}>
        <span className={cn(labels[layout], labelClassName)}>{label}</span>
        <Value className={cn(values[layout], valueClassName)}>{value}</Value>
        {detail && <span className={cn('tw:block tw:text-muted tw:text-[length:var(--font-size-xs)] tw:mt-ui-xs', detailClassName)}>{detail}</span>}
    </div>;
}
