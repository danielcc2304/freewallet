import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { CalculatorPanel } from './CalculatorPanel';

interface CalculatorSectionProps {
    icon: ReactNode;
    title: string;
    children: ReactNode;
    className?: string;
}

/** Fund-sheet sections share their surface, heading and content structure. */
export function CalculatorSection({ icon, title, children, className }: CalculatorSectionProps) {
    return <CalculatorPanel as="section" surface="panel" border="primary" className={cn('fund-info__section tw:p-ui-xl tw:rounded-[var(--radius-lg)] tw:shadow-[var(--shadow-sm)] tw:[@media(max-width:640px)]:p-ui-lg', className)}>
        <div className="fund-info__section-heading tw:ui-row tw:gap-ui-sm tw:pb-ui-md tw:mb-ui-lg tw:[border-bottom:1px_solid_var(--border-primary)]">
            <span className="fund-info__section-icon tw:inline-flex tw:text-accent">{icon}</span>
            <h2 className="tw:m-0 tw:text-[length:var(--font-size-xl)]">{title}</h2>
        </div>
        {children}
    </CalculatorPanel>;
}
