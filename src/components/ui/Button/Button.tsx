import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { buttonStyles, type ButtonStyleOptions } from './buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonStyleOptions['variant'];
    size?: ButtonStyleOptions['size'];
    icon?: ReactNode;
    loading?: boolean;
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    loading,
    fullWidth,
    disabled,
    className = '',
    ...props
}: ButtonProps) {
    const content = <>
        {icon && <span className="btn__icon tw:flex tw:items-center tw:justify-center">{icon}</span>}
        {children}
    </>;
    return (
        <button
            {...props}
            data-ui="button"
            className={buttonStyles({ variant, size, fullWidth, loading, className })}
            disabled={disabled || loading}
            aria-busy={loading || props['aria-busy']}
        >
            {loading ? <span className="tw:inline-flex tw:items-center tw:justify-center tw:gap-ui-sm tw:opacity-0">{content}</span> : content}
            {loading && <LoaderCircle aria-hidden="true" className="btn__spinner tw:absolute tw:size-[18px] tw:animate-ui-spinner tw:motion-reduce:animate-none" />}
        </button>
    );
}
