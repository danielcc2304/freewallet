import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { assetTableClass as part } from './assetTableStyles';

type Tone = 'positive' | 'negative' | '';
const toneClass = (tone: Tone) => tone ? part(`assets-table__change--${tone}`) : undefined;

export function DashboardAssetIdentity({ name, symbol, isin, onOpen, ariaLabel, children }: { name: ReactNode; symbol: ReactNode; isin?: string; onOpen: MouseEventHandler<HTMLButtonElement>; ariaLabel: string; children: ReactNode }) {
    return <div className={part('assets-table__asset')}>
        <button type="button" className={cn(part('assets-table__name'), part('assets-table__open'))} onClick={onOpen} aria-label={ariaLabel}>{name}</button>
        {children}
        <div className={part('assets-table__identifiers')}><span className={part('assets-table__symbol')}>{symbol}</span>{isin && <span className={part('assets-table__isin')}>ISIN {isin}</span>}</div>
    </div>;
}

/** Display components accept formatted values; valuation and return policies stay in AssetsTable. */
export function DashboardAssetChange({ appearance, percent, amount, date, tone }: { appearance: 'daily' | 'gain'; percent: ReactNode; amount: ReactNode; date?: ReactNode; tone: Tone }) {
    if (appearance === 'daily') return <span className={cn(part('assets-table__today'), toneClass(tone))}><strong>{percent}</strong><small>{amount}</small><small className={part('assets-table__variation-date')}>{date}</small></span>;
    return <div className={part('assets-table__gain')}><span className={cn(part('assets-table__change'), toneClass(tone))}>{percent}</span><span className={part('assets-table__gain-value')}>{amount}</span></div>;
}

export function DashboardAssetWeight({ width, children }: { width: string; children: ReactNode }) {
    return <div className={part('assets-table__weight')}><div className={part('assets-table__weight-bar')}><div className={part('assets-table__weight-fill')} style={{ width }} /></div><span>{children}</span></div>;
}

export function DashboardMobileFacts({ children }: { children: ReactNode }) {
    return <div className={part('assets-table__mobile-details')}>{children}</div>;
}

export function DashboardMobileFact({ label, value, children }: { label: ReactNode; value: ReactNode; children?: ReactNode }) {
    return <div><span>{label}</span><strong>{value}</strong>{children}</div>;
}

export function DashboardTableButton({ appearance, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { appearance: 'sort' | 'lots' }) {
    return <button {...props} className={cn(part(appearance === 'sort' ? 'assets-table__sort' : 'assets-table__lots-toggle'), className)} />;
}
