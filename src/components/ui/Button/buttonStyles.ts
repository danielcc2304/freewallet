import { cn } from '../../../utils/cn';

const variants = {
    primary: 'btn--primary tw:bg-[linear-gradient(135deg,var(--accent-primary),var(--accent-primary-hover))] tw:bg-transparent tw:text-white tw:shadow-[0_2px_8px_rgba(16,185,129,0.3)] tw:not-disabled:hover:-translate-y-px tw:not-disabled:hover:shadow-[0_4px_12px_rgba(16,185,129,0.4)]',
    secondary: 'btn--secondary tw:border tw:border-line-strong tw:bg-surface-muted tw:text-main tw:not-disabled:hover:bg-panel-hover tw:not-disabled:hover:border-accent',
    ghost: 'btn--ghost tw:bg-transparent tw:text-secondary tw:not-disabled:hover:bg-surface-muted tw:not-disabled:hover:text-main',
    danger: 'btn--danger tw:bg-negative tw:text-white tw:not-disabled:hover:bg-[#dc2626]',
} as const;
const sizes = {
    sm: 'btn--sm tw:px-ui-sm tw:py-ui-xs tw:text-sm',
    md: 'btn--md tw:px-ui-md tw:py-ui-sm tw:text-base',
    lg: 'btn--lg tw:px-ui-lg tw:py-ui-md tw:text-lg',
} as const;

export interface ButtonStyleOptions {
    variant?: keyof typeof variants;
    size?: keyof typeof sizes;
    fullWidth?: boolean;
    loading?: boolean;
    className?: string;
}

/** Shared by Button and real links styled as buttons; no nested controls. */
export function buttonStyles({ variant = 'primary', size = 'md', fullWidth, loading, className }: ButtonStyleOptions = {}) {
    return cn(
        'btn tw:relative tw:inline-flex tw:items-center tw:justify-center tw:gap-ui-sm tw:font-sans tw:font-medium tw:leading-[normal] tw:rounded-control tw:cursor-pointer tw:border-0 tw:no-underline tw:outline-none',
        'tw:transition-[background-color,border-color,box-shadow,color,opacity,transform] tw:duration-150 tw:ease-[ease] tw:disabled:opacity-50 tw:disabled:cursor-not-allowed tw:disabled:transform-none! tw:focus-visible:outline-solid tw:focus-visible:outline-2 tw:focus-visible:outline-accent tw:focus-visible:outline-offset-[3px] tw:motion-reduce:transition-none',
        variants[variant], sizes[size], 'tw:leading-[normal]', fullWidth && 'btn--full tw:w-full', loading && 'btn--loading', className,
    );
}
