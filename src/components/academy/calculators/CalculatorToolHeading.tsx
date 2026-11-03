import type { ReactNode } from 'react';
import { calculatorToolClass as part } from './calculatorToolStyles';

interface Props {
    appearance: 'compound' | 'fire' | 'retirement';
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
}

/** Shared title structure, with each tool retaining its icon colour and typography. */
export function CalculatorToolHeading({ appearance, icon, title, description }: Props) {
    return <div className={part(`${appearance}__title-group`)}>
        {icon}
        <div className={appearance === 'compound' ? 'compound__title-content' : undefined}>
            <h1 className={part(`${appearance}__title`)}>{title}</h1>
            <p className={part(appearance === 'compound' ? 'compound__description' : `${appearance}__subtitle`)}>{description}</p>
        </div>
    </div>;
}
