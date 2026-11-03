import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { taxReadingStyle as s } from './AcademyTaxReading.styles';
export function AcademyTaxBracket({
    range,
    rate,
    highlight = false,
}: {
    range: ReactNode;
    rate: ReactNode;
    highlight?: boolean;
}) {
    return (
        <div className={cn(s('bracket-card'), highlight && 'highlight')}>
            <span className={s('bracket-range')}>{range}</span>
            <strong className={s('bracket-rate')}>{rate}</strong>
        </div>
    );
}
export function AcademyTaxHeading({ icon, title }: { icon: ReactNode; title: ReactNode }) {
    return (
        <div className={s('tax-info__card-header')}>
            {icon}
            <h3>{title}</h3>
        </div>
    );
}
export function AcademyTaxSectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return <h2 {...props} className={cn(s('tax-info__section-title'), className)} />;
}
export function AcademyTaxEquation({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('compensation-viz'), className)} />;
}
export function AcademyTaxTerm({
    icon,
    children,
    result = false,
}: {
    icon?: ReactNode;
    children: ReactNode;
    result?: boolean;
}) {
    return (
        <div className={cn(s('viz-item'), result && 'result')}>
            {icon}
            <span>{children}</span>
        </div>
    );
}
export function AcademyTaxOperator({ children }: { children: ReactNode }) {
    return <div className={s('viz-operator')}>{children}</div>;
}
export function AcademyTaxColumns({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('tax-info__two-cols'), className)} />;
}
