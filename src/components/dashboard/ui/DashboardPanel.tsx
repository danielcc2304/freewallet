import type { HTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

interface DashboardPanelProps extends HTMLAttributes<HTMLElement> {
    as?: 'div' | 'section';
    constrain?: boolean;
}

/** Inner analytics surface, separate from Card's Liquid Glass material. */
export function DashboardPanel({ as: Tag = 'section', constrain = true, className, ...props }: DashboardPanelProps) {
    return <Tag {...props} className={cn('tw:p-[1rem] tw:ui-border tw:rounded-control tw:ui-fill-muted', constrain && 'tw:min-w-0', className)} />;
}
