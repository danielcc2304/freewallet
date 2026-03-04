import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, icon, className = '', ...props }, ref) => {
        return (
            <div className={`input-wrapper ${error ? 'input-wrapper--error' : ''} ${className}`}>
                {label && <label className="input__label">{label}</label>}
                <div className="input__container">
                    {icon && <span className="input__icon">{icon}</span>}
                    <input
                        ref={ref}
                        className={`input ${icon ? 'input--with-icon' : ''}`}
                        {...props}
                    />
                </div>
                {error && <span className="input__error">{error}</span>}
                {hint && !error && <span className="input__hint">{hint}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
