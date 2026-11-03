import { calculatorWorkspaceStyle, type Appearance } from './CalculatorWorkspace.styles';
import { CalculatorDisclosure } from './CalculatorDisclosure';
import type { HTMLAttributes, ButtonHTMLAttributes, ReactNode, ComponentProps } from 'react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { CalculatorCard } from './CalculatorCard';



export function CalculatorWorkspace({
    as: Tag = 'div',
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { as?: 'div' | 'aside' | 'main' | 'section'; appearance: Appearance }) {
    return <Tag {...props} className={calculatorWorkspaceStyle(appearance, className)} />;
}
export function CalculatorWorkspaceHeader({
    appearance,
    className,
    ...props
}: ComponentProps<typeof AcademyPageHeader> & { appearance: Appearance }) {
    return <AcademyPageHeader {...props} className={calculatorWorkspaceStyle(appearance, className)} />;
}
export function CalculatorWorkspaceCard({
    appearance,
    title,
    children,
    className,
    ...props
}: Omit<ComponentProps<typeof CalculatorCard>, 'title'> & { appearance: Appearance; title?: ReactNode }) {
    return (
        <CalculatorCard {...props} className={calculatorWorkspaceStyle(appearance, className)}>
            {title != null && <h3>{title}</h3>}
            {children}
        </CalculatorCard>
    );
}
export function CalculatorWorkspaceHint({ className, ...props }: HTMLAttributes<HTMLElement>) {
    return <small {...props} className={calculatorWorkspaceStyle('compoundInputHint', className)} />;
}
export function CalculatorWorkspaceButton({
    appearance,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { appearance: Appearance }) {
    return <button {...props} className={calculatorWorkspaceStyle(appearance, className)} />;
}
export function CalculatorRetirementSummary({ label, value }: { label: ReactNode; value: ReactNode }) {
    return (
        <div className={calculatorWorkspaceStyle('retirementSummaryBadge')}>
            <span className={calculatorWorkspaceStyle('retirementSummaryLabel')}>{label}</span>
            <span className={calculatorWorkspaceStyle('retirementSummaryValue')}>{value}</span>
        </div>
    );
}
export function CalculatorWorkspaceTitle({
    as: Tag = 'h3',
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h3' | 'p'; appearance: Appearance }) {
    return <Tag {...props} className={calculatorWorkspaceStyle(appearance, className)} />;
}

export function CalculatorBondDetails({ className, ...props }: ComponentProps<typeof CalculatorDisclosure>) {
    return (
        <CalculatorDisclosure
            {...props}
            className={calculatorWorkspaceStyle('bondCalcCalculationDetails', className)}
        />
    );
}
