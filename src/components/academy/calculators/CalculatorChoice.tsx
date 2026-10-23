import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { calculatorToolClass as part } from './calculatorToolStyles';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    appearance: 'compound' | 'fire';
    selected: boolean;
    icon?: ReactNode;
    label: ReactNode;
    description?: ReactNode;
}

/** Native button semantics and caller-owned selection state; label structure is shared. */
export function CalculatorChoice({ appearance, selected, icon, label, description, className, ...props }: Props) {
    const base = appearance === 'compound' ? 'compound__mode-btn' : 'fire__projection-btn';
    return <button {...props} className={cn(part(base), selected && part(`${base}--active`), className)}>
        {icon}{label}{description && <span>{description}</span>}
    </button>;
}
