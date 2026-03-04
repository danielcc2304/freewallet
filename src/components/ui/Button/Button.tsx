import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
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
    return (
        <button
            className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${loading ? 'btn--loading' : ''
                } ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="btn__spinner" />
            ) : (
                <>
                    {icon && <span className="btn__icon">{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
}
