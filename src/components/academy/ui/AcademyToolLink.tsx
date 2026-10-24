import type { ReactNode } from 'react';
import type { LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { AcademyLinkCard } from './AcademyPanel';
import { riskTool } from './riskTool.styles';
import { strategyTool } from './strategyTool.styles';
import { taxTool } from './taxTool.styles';
import { crisisTool } from './crisisTool.styles';
/** Reusable linked lesson/tool card with an icon, explanatory copy and a final action. */
export function AcademyToolLink({
    variant,
    icon,
    title,
    description,
    action,
    category,
    className,
    ...props
}: Omit<LinkProps, 'title' | 'children'> & {
    variant: 'risk' | 'strategy' | 'tax' | 'crisis';
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
    action: ReactNode;
    category?: ReactNode;
}) {
    const tax = variant === 'tax';
    const root =
        variant === 'risk'
            ? cn('risk-mgmt__card', riskTool('risk-mgmt__tool'))
            : variant === 'strategy'
              ? strategyTool('strategies__tool-card')
              : tax
                ? taxTool('tax-info__tool-card')
                : crisisTool('crisis__next-card');
    return (
        <AcademyLinkCard {...props} variant={tax ? 'taxTool' : variant} className={cn(root, className)}>
            {tax ? <span className={taxTool('tax-info__tool-icon')}>{icon}</span> : icon}
            {tax && <span className={taxTool('tax-info__tool-category')}>{category}</span>}
            <h3>{title}</h3>
            <p>{description}</p>
            <span className={tax ? taxTool('tax-info__tool-action') : undefined}>{action}</span>
        </AcademyLinkCard>
    );
}
export function AcademyTaxComparison({
    kind,
    icon,
    title,
    children,
}: {
    kind: 'fund' | 'etf';
    icon: ReactNode;
    title: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={cn(taxTool('comparison-card'), kind)}>
            <div className="header">
                {icon}
                <h3>{title}</h3>
            </div>
            <ul>{children}</ul>
        </div>
    );
}
