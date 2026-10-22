import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

export const expenseSurface = "tw:ui-fill-panel tw:ui-border-strong tw:rounded-[20px] tw:min-w-[0]";
interface SurfaceProps extends HTMLAttributes<HTMLElement> { as?: 'section' | 'div' | 'article' | 'details'; open?: boolean }
/** Panel/card hooks preserve the existing materials and responsive rules. */
export function ExpensePanel({ as: Tag = 'section', className, ...props }: SurfaceProps) {
    return <Tag {...props} className={cn('expense-panel', expenseSurface, "tw:p-[1.4rem] tw:mb-[1.25rem]", className)} />;
}
export function ExpenseCard({ as: Tag = 'div', className, ...props }: SurfaceProps) {
    return <Tag {...props} className={cn("tw:p-[1rem] tw:ui-border-strong tw:rounded-[14px] tw:ui-fill-surface tw:min-w-[0]", className)} />;
}
interface HeadingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> { title: ReactNode; headingProps?: HTMLAttributes<HTMLHeadingElement> }
export function ExpensePanelHeading({ title, headingProps, className, children, ...props }: HeadingProps) {
    return <div {...props} className={cn('expense-panel-title', "tw:ui-row tw:justify-between tw:gap-[.7rem] tw:mb-[1.1rem] tw:flex-wrap", className)}>
        <ExpensePanelTitle {...headingProps}>{title}</ExpensePanelTitle>
        {children}
    </div>;
}

export function ExpensePanelTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return <h2 {...props} className={cn("tw:ui-row tw:gap-[.5rem] tw:text-[length:1.04rem] tw:[font-weight:700] tw:[letter-spacing:-.015em] tw:[line-height:1.5]", className)} />;
}
