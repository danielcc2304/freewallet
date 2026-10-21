import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';
import { cn } from '../../../utils/cn';
import { inputStyles } from './inputStyles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: ReactNode;
    density?: 'normal' | 'comfortable';
    inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, icon, density = 'normal', inputClassName, className, id, 'aria-describedby': describedBy, ...props }, ref) => {
        const generatedId = useId().replace(/:/g, '');
        const inputId = id ?? `input-${generatedId}`;
        const hintId = `${inputId}-hint`;
        const errorId = `${inputId}-error`;
        const description = [describedBy, error ? errorId : hint ? hintId : undefined].filter(Boolean).join(' ') || undefined;

        return (
            <div className={cn('input-wrapper tw:flex tw:flex-col tw:gap-ui-xs', density === 'comfortable' && 'tw:gap-2', error && 'input-wrapper--error', className)}>
                {label && <label className={cn('input__label tw:text-sm tw:leading-[1.6] tw:font-medium tw:text-secondary', density === 'comfortable' && 'tw:text-base tw:font-normal tw:text-main')} htmlFor={inputId}>{label}</label>}
                <div className="input__container tw:relative tw:flex tw:items-center tw:min-w-0">
                    {icon && <span aria-hidden="true" className="input__icon tw:absolute tw:left-ui-md tw:flex tw:items-center tw:text-muted tw:pointer-events-none">{icon}</span>}
                    <input
                        ref={ref}
                        id={inputId}
                        {...props}
                        data-density={density}
                        className={inputStyles({ density, icon: !!icon, className: inputClassName })}
                        aria-invalid={error ? true : props['aria-invalid']}
                        aria-describedby={description}
                    />
                </div>
                {error && <span id={errorId} className="input__error tw:text-sm tw:leading-[1.6] tw:text-negative">{error}</span>}
                {hint && !error && <span id={hintId} className={cn('input__hint tw:text-sm tw:leading-[1.6] tw:text-muted', density === 'comfortable' && 'tw:text-secondary')}>{hint}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
