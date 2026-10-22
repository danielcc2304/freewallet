import type { HTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

const layouts = {
    "metrics": "tw:grid tw:grid-cols-[repeat(4,minmax(0,1fr))] tw:gap-[1rem] tw:mb-[1.3rem]",
    "columns": "tw:grid tw:grid-cols-[repeat(2,minmax(0,1fr))] tw:gap-[1.25rem] tw:[align-items:start]",
    "form": "tw:grid tw:grid-cols-[repeat(2,minmax(0,1fr))] tw:gap-[.2rem_1rem]",
    "categories": "tw:grid tw:grid-cols-[repeat(3,minmax(0,1fr))] tw:gap-[.8rem]",
    "accounts": "tw:grid tw:grid-cols-[repeat(3,minmax(0,1fr))] tw:gap-[1rem] tw:mt-[1rem]"
};
export function ExpenseGrid({ variant, className, ...props }: HTMLAttributes<HTMLDivElement> & { variant: keyof typeof layouts }) {
    return <div {...props} className={cn(layouts[variant], className)} />;
}
