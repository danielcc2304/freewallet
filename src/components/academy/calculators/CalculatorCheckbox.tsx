import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface CalculatorCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    label: ReactNode;
    onChange: (checked: boolean) => void;
}

export function CalculatorCheckbox({ label, onChange, className, ...props }: CalculatorCheckboxProps) {
    return <label className="salary-calc__check tw:flex tw:items-start tw:gap-[.7rem] tw:min-h-[44px] tw:p-[.7rem_0] tw:text-[.84rem] tw:leading-[1.5] tw:cursor-pointer">
        <input {...props} type="checkbox" onChange={event => onChange(event.target.checked)} className={cn('tw:w-[18px] tw:h-[18px] tw:shrink-0 tw:mt-[2px] tw:[accent-color:var(--accent-primary)]', className)} />
        <span>{label}</span>
    </label>;
}
