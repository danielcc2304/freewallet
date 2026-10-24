import type { InputHTMLAttributes, ReactNode } from 'react';
import { NativeControl } from '../../../components/ui/NativeControl';
import { cn } from '../../../utils/cn';
import { portfolioControlClass as part } from './portfolioControlStyles';

export function PortfolioHoldingControl({ name, detail, weight, children }: { name: ReactNode; detail: ReactNode; weight: ReactNode; children: ReactNode }) {
    return <div className={part('portfolio-csv-controls-table__row')}><div className={part('portfolio-csv-controls-table__asset')}><strong>{name}</strong><small>{detail}</small></div><strong>{weight}</strong>{children}</div>;
}

export function PortfolioTargetField({ label, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> & { label: ReactNode }) {
    return <label className={part('portfolio-csv-targets__item')}><span>{label}</span><NativeControl appearance="portfolio" as="input" {...props} /></label>;
}

export function PortfolioTargetTotal({ warning, label, children }: { warning: boolean; label: ReactNode; children: ReactNode }) {
    return <div className={cn(part('portfolio-csv-targets__total'), warning && part('portfolio-csv-targets__total--warn'))}><span>{label}</span><strong>{children}</strong></div>;
}
