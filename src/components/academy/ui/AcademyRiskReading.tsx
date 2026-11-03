import type { ComponentProps, HTMLAttributes, ReactNode, TdHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';
import { AcademyPanel } from './AcademyPanel';
import { riskReadingStyle as s } from './AcademyRiskReading.styles';
export function AcademyRiskCard({
    comparison,
    loss,
    currency,
    correlations,
    icon,
    title,
    description,
    children,
    className,
    ...props
}: Omit<ComponentProps<typeof AcademyPanel>, 'variant' | 'title'> & {
    comparison?: boolean;
    loss?: boolean;
    currency?: boolean;
    correlations?: boolean;
    icon?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
}) {
    return (
        <AcademyPanel
            {...props}
            variant="risk"
            className={cn(
                s('risk-mgmt__card'),
                comparison && s('risk-mgmt__comparison'),
                loss && s('risk-mgmt__comparison--loss'),
                correlations && s('risk-mgmt__correlations'),
                currency && s('risk-mgmt__currency'),
                className,
            )}
        >
            {icon != null && <span className={s('risk-mgmt__icon')}>{icon}</span>}
            {title != null && <h3>{title}</h3>}
            {description != null && <p>{description}</p>}
            {children}
        </AcademyPanel>
    );
}
export function AcademyRiskHeading({
    appearance,
    title,
    icon,
    detail,
}: {
    appearance: 'card' | 'matrix';
    title: ReactNode;
    icon?: ReactNode;
    detail?: ReactNode;
}) {
    return (
        <div className={s(appearance === 'card' ? 'risk-mgmt__card-heading' : 'risk-mgmt__matrix-heading')}>
            {icon != null && <span className={s('risk-mgmt__icon')}>{icon}</span>}
            <h3>{title}</h3>
            {detail != null && <span>{detail}</span>}
        </div>
    );
}
/** Table semantics, caption and keyboard-scroll region are preserved. */
export function AcademyCorrelationMatrix({
    caption,
    children,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { caption: ReactNode }) {
    return (
        <div {...props} className={cn(s('risk-mgmt__matrix-scroll'), className)}>
            <table className={s('risk-mgmt__matrix')}>
                <caption>{caption}</caption>
                {children}
            </table>
        </div>
    );
}
const bandStyles = {
    high: s('risk-mgmt__correlation--high'),
    medium: s('risk-mgmt__correlation--medium'),
    neutral: s('risk-mgmt__correlation--neutral'),
    low: s('risk-mgmt__correlation--low'),
};
export function AcademyCorrelationCell({
    band,
    className,
    ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { band: keyof typeof bandStyles }) {
    return <td {...props} className={cn(s('risk-mgmt__correlation'), bandStyles[band], className)} />;
}
export function AcademyCorrelationLegend({
    items,
}: {
    items: readonly { band: 'high' | 'medium' | 'low'; label: ReactNode }[];
}) {
    return (
        <div className={s('risk-mgmt__legend')}>
            {items.map((item) => (
                <span key={item.band}>
                    <i
                        className={s(
                            item.band === 'high'
                                ? 'risk-mgmt__swatch--high'
                                : item.band === 'medium'
                                  ? 'risk-mgmt__swatch--medium'
                                  : 'risk-mgmt__swatch--low',
                        )}
                    />
                    {item.label}
                </span>
            ))}
        </div>
    );
}
export function AcademyRiskTag({ className, ...props }: HTMLAttributes<HTMLElement>) {
    return <span {...props} className={cn(s('risk-mgmt__tag'), className)} />;
}
export function AcademyRiskHorizons({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('risk-mgmt__horizons'), className)} />;
}
export function AcademyRiskHorizon({
    label,
    title,
    children,
}: {
    label: ReactNode;
    title: ReactNode;
    children: ReactNode;
}) {
    return (
        <div>
            <AcademyRiskTag>{label}</AcademyRiskTag>
            <h4>{title}</h4>
            <p>{children}</p>
        </div>
    );
}
