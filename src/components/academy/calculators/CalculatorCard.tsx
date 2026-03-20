import type { HTMLAttributes, ReactNode } from 'react';
import './CalculatorCard.css';

interface CalculatorCardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function CalculatorCard({ className, children, ...props }: CalculatorCardProps) {
    const classes = ['calculator-card', className].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}
