import { cn } from '../../../utils/cn';

export function inputStyles({ density = 'normal', icon = false, className }: {
    density?: 'normal' | 'comfortable'; icon?: boolean; className?: string;
} = {}) {
    return cn(
        'input tw:w-full tw:min-w-0 tw:box-border tw:font-sans tw:text-base tw:leading-[normal] tw:border tw:border-line tw:rounded-control tw:text-main tw:bg-surface-muted tw:px-ui-md tw:py-ui-sm',
        'tw:transition-[background-color,border-color,box-shadow,color] tw:duration-150 tw:placeholder:text-muted tw:focus:outline-none tw:focus:border-accent tw:focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)] tw:disabled:opacity-50 tw:disabled:cursor-not-allowed',
        density === 'comfortable' && 'tw:p-[.8rem] tw:leading-[1.6] tw:rounded-xl tw:border-(--border-color) tw:bg-surface tw:data-[density=comfortable]:bg-surface tw:focus:data-[density=comfortable]:bg-surface tw:focus-visible:outline-solid tw:focus-visible:outline-2 tw:focus-visible:outline-accent tw:focus-visible:outline-offset-2',
        icon && 'input--with-icon tw:pl-[calc(var(--spacing-md)+24px)]',
        'tw:aria-invalid:border-negative tw:aria-invalid:focus:border-negative tw:aria-invalid:focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
        className,
    );
}
