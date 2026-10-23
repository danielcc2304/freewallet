import type { FormEventHandler, ReactNode } from 'react';
import { calculatorLookupClass as part } from './calculatorLookupStyles';

interface SearchProps {
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
    onSubmit: FormEventHandler<HTMLFormElement>;
    sample: ReactNode;
    children: ReactNode;
}

/** Lookup framing owns the title, form layout and example area, leaving controls and requests to the caller. */
export function CalculatorSearchPanel({ icon, title, description, onSubmit, sample, children }: SearchProps) {
    return <section className={part('fund-info__search-card')}>
        <div className={part('fund-info__search-title')}>{icon}<div><h2>{title}</h2><p>{description}</p></div></div>
        <form className={part('fund-info__form')} onSubmit={onSubmit}>{children}</form>
        <div className={part('fund-info__sample')}>{sample}</div>
    </section>;
}

export function CalculatorEmptyState({ icon, title, children }: { icon: ReactNode; title: ReactNode; children: ReactNode }) {
    return <section className={part('fund-info__empty-state')}><div className={part('fund-info__empty-icon')}>{icon}</div><h2>{title}</h2><p>{children}</p></section>;
}

export function CalculatorFeedback({ appearance, icon, children }: { appearance: 'error' | 'loading' | 'footnote'; icon?: ReactNode; children: ReactNode }) {
    const root = appearance === 'error' ? 'fund-info__alert' : appearance === 'loading' ? 'fund-info__loading' : 'fund-info__result-footnote';
    return <div className={part(root)} role={appearance === 'error' ? 'alert' : appearance === 'loading' ? 'status' : undefined} aria-live={appearance === 'loading' ? 'polite' : undefined}>
        {appearance === 'loading' ? <span className={part('fund-info__loading-spinner')} /> : icon}<span>{children}</span>
    </div>;
}

export function CalculatorHolding({ name, weight }: { name: ReactNode; weight: ReactNode }) {
    return <div className={part('fund-info__holding')}><span>{name}</span><strong>{weight}</strong></div>;
}
