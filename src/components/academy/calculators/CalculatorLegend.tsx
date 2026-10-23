import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { calculatorToolClass as part } from './calculatorToolStyles';

export function CalculatorLegend({ appearance, items }: { appearance: 'compound' | 'retirement'; items: { label: ReactNode; tone: 'blue' | 'green' }[] }) {
    return <div className={part(`${appearance}__chart-legend`)} aria-label={appearance === 'compound' ? 'Leyenda del gráfico' : undefined}>
        {items.map((item, index) => <span key={index} className={part(appearance === 'compound' ? 'compound__chart-legend-item' : 'legend-item')}>
            <span className={appearance === 'compound' ? cn(part('compound__chart-legend-dot'), part(`compound__chart-legend-dot--${item.tone}`)) : cn(part('dot'), item.tone === 'blue' ? 'nominal' : 'real')} />{item.label}
        </span>)}
    </div>;
}
