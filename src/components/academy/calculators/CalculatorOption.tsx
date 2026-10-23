import type { ReactNode } from 'react';
import { calculatorToolClass as part } from './calculatorToolStyles';

type Props = { appearance?: 'compound'; children: ReactNode } | {
    appearance: 'fire'; control: ReactNode; label: ReactNode; description: ReactNode;
};

/** The native input remains inside its implicit label, including keyboard and checked behaviour. */
export function CalculatorOption(props: Props) {
    if (props.appearance === 'fire') return <label className={part('fire__optional-toggle')}>
        {props.control}<span className={part('fire__optional-copy')}><strong>{props.label}</strong><small>{props.description}</small></span>
    </label>;
    return <label className={part('compound__radio')}>{props.children}</label>;
}
