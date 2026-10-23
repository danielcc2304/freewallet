import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

export function PortfolioButton({ ghost, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { ghost?: boolean }) {
    return <button {...props} className={cn('portfolio-csv-btn tw:inline-flex tw:items-center tw:gap-[.4rem] tw:rounded-[10px] tw:ui-border-strong tw:text-main tw:font-semibold tw:p-[.5rem_.75rem] tw:hover:border-accent tw:hover:text-accent', ghost ? 'portfolio-csv-btn--ghost tw:ui-fill-transparent' : 'tw:ui-fill-muted', className)} />;
}
