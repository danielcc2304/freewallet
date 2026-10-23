import type { ReactNode } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { calculatorToolClass as part } from './calculatorToolStyles';

interface Props {
    appearance: 'compound' | 'fire' | 'retirement';
    title: ReactNode;
    legend?: ReactNode;
    badge?: ReactNode;
    children: ReactNode;
}

/** Chart framing is shared; series, scales, tooltips and data remain with each calculator. */
export function CalculatorChart({ appearance, title, legend, badge, children }: Props) {
    const Root = appearance === 'fire' ? 'div' : CalculatorCard;
    const rootClass = appearance === 'fire' ? 'fire__chart-container' : appearance === 'compound' ? 'compound__chart' : 'retirement__chart-box';
    return <Root className={part(rootClass)}>
        {appearance === 'retirement' ? <>
            <h3 className={part('retirement__chart-title')}>{title}</h3>{legend}
        </> : <div className={part(`${appearance}__chart-header`)}>
            {appearance === 'compound' ? <h4>{title}</h4> : <h3 className={part('fire__chart-title')}>{title}</h3>}
            {legend}{badge && <span className={part('fire__chart-badge')}>{badge}</span>}
        </div>}
        <div className={appearance === 'retirement' ? 'retirement__chart-wrapper' : part(`${appearance}__chart-canvas`)}>{children}</div>
    </Root>;
}
