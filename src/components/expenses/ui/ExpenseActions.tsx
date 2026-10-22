import type { HTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

const layouts = {
    "toolbar": "tw:ui-row tw:flex-wrap tw:gap-[.65rem]",
    "form": "tw:flex tw:justify-end tw:gap-[.6rem] tw:[border-top:1px_solid_var(--border-secondary)] tw:mt-[1.2rem] tw:pt-[1rem]",
    "heading": "tw:ui-row tw:justify-end tw:gap-[.65rem] tw:flex-wrap",
    "row": "tw:flex tw:gap-[.2rem] tw:shrink-[0]"
};
export function ExpenseActions({ variant = 'toolbar', className, ...props }: HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof layouts }) {
    return <div {...props} className={cn(layouts[variant], className)} />;
}
