import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { investmentClass as part } from './investmentStyles';

export function InvestmentSearchOption({ selected, symbol, name, kind, className, ...props }: Omit<HTMLAttributes<HTMLLIElement>, 'children'> & { selected: boolean; symbol: ReactNode; name: ReactNode; kind: ReactNode }) {
    return <li {...props} className={cn(part('search-results__item'), selected && part('search-results__item--active'), className)}><span className={part('search-results__identity')}><strong className={part('search-results__symbol')}>{symbol}</strong><span className={part('search-results__name')}>{name}</span></span><span className={part('search-results__type')}>{kind}</span></li>;
}

export function InvestmentSelection({ icon, symbol, name, kind }: { icon: ReactNode; symbol: ReactNode; name: ReactNode; kind: ReactNode }) {
    return <div className={part('selected-asset')}>{icon}<span className={part('selected-asset__content')}><strong className={part('selected-asset__symbol')}>{symbol}</strong><span className={part('selected-asset__name')}>{name}</span></span><span className={part('selected-asset__type')}>{kind}</span></div>;
}

export function InvestmentQuote({ label, value }: { label: ReactNode; value: ReactNode }) {
    return <div className={part('current-price-banner')}><div className={part('current-price-banner__label')}>{label}</div><div className={part('current-price-banner__value')}>{value}</div></div>;
}

export function InvestmentNotice({ appearance, icon, title, children, action }: { appearance: 'warning' | 'manual' | 'noResults'; icon: ReactNode; title?: ReactNode; children: ReactNode; action?: ReactNode }) {
    const root = appearance === 'warning' ? 'quote-warning' : appearance === 'manual' ? 'manual-mode-badge' : 'no-results';
    return <div className={part(root)}>{icon}{appearance === 'noResults' ? <div className={part('no-results__text')}><p>{title}</p><span>{children}</span></div> : children}{action}</div>;
}

export function InvestmentTotal({ label, children }: { label: ReactNode; children: ReactNode }) {
    return <div className={part('operation-total')}>{label}<strong>{children}</strong></div>;
}
