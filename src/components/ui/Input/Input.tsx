import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, icon, className = '', id, ...props }, ref) => {
        const generatedId = useId().replace(/:/g, '');
        const inputId = id ?? `input-${generatedId}`;

        return (
            <div className={`input-wrapper ${error ? 'input-wrapper--error' : ''} ${className}`}>
                {label && <label className="input__label" htmlFor={inputId}>{label}</label>}
                <div className="input__container">
                    {icon && <span className="input__icon">{icon}</span>}
                    <input
                        ref={ref}
                        id={inputId}
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
