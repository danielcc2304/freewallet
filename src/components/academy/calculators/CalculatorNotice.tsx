import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { calculatorToolClass as part } from './calculatorToolStyles';

interface Props {
    appearance: 'rate' | 'compound' | 'fire' | 'retirement' | 'insight' | 'scenario';
    icon?: ReactNode;
    title?: ReactNode;
    children: ReactNode;
}

const roots = {
    rate: 'compound__rate-equivalence', compound: 'compound__disclaimer', fire: 'fire__info-card',
    retirement: 'retirement__note', insight: 'retirement__insight', scenario: 'fire__scenario-card',
} as const;

export function CalculatorNotice({ appearance, icon, title, children }: Props) {
    const Root = appearance === 'rate' ? 'p' : appearance === 'retirement' || appearance === 'insight' ? CalculatorCard : 'div';
    return <Root className={part(roots[appearance])}>
        {appearance === 'insight' && isValidElement(icon) ? cloneElement(icon as ReactElement<{ className?: string }>, { className: part('retirement__insight-icon') }) : icon}
        {appearance === 'scenario' ? <><h3 className={part('fire__scenario-title')}>{title}</h3><p className={part('fire__scenario-text')}>{children}</p></> : appearance === 'insight' ? <div className={part('retirement__insight-content')}><h4>{title}</h4><p>{children}</p></div>
            : appearance === 'fire' || appearance === 'retirement' ? <p>{children}</p> : children}
    </Root>;
}
