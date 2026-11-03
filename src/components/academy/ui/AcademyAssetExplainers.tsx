import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { AcademyPanel } from './AcademyPanel';
import { assetExplainerClass as part } from './assetExplainerStyles';

export function AcademyFactCard({ appearance, label, value, description, style, labelStyle }: { appearance: 'bond' | 'geography'; label: ReactNode; value: ReactNode; description: ReactNode; style?: CSSProperties; labelStyle?: CSSProperties }) {
    if (appearance === 'geography') return <AcademyPanel variant="geography" className={part('geo-card')} style={style}><h4 style={labelStyle}>{label}</h4><p className={part('geo-card__region')}>{value}</p><p className={part('geo-card__weight')}>{description}</p></AcademyPanel>;
    return <AcademyPanel variant="bondAnatomy" className="bond-anatomy__item"><span className={part('bond-anatomy__label')}>{label}</span><span className={part('bond-anatomy__value')}>{value}</span><span className={part('bond-anatomy__desc')}>{description}</span></AcademyPanel>;
}

export function AcademyTextCard({ appearance, title, children }: { appearance: 'checklist' | 'mistake'; title: ReactNode; children: ReactNode }) {
    const Root = appearance === 'mistake' ? 'article' : 'div';
    return <Root className={part(appearance === 'mistake' ? 'bond-mistake-card' : 'bond-checklist-item')}><h4>{title}</h4>{children}</Root>;
}

export function AcademyCreditCard({ title, range, description, implication, implicationLabel, style }: { title: ReactNode; range: ReactNode; description: ReactNode; implication: ReactNode; implicationLabel: ReactNode; style?: CSSProperties }) {
    return <div className={part('credit-spread-card')} style={style}><h3>{title}</h3><span className={part('credit-spread-card__range')}>{range}</span><p>{description}</p><div className={part('credit-spread-card__implication')}><strong>{implicationLabel}</strong> {implication}</div></div>;
}

export function AcademyDirectionalCard({ direction, fromIcon, from, toIcon, to, connector, children }: { direction: 'up' | 'down'; fromIcon: ReactNode; from: ReactNode; toIcon: ReactNode; to: ReactNode; connector: ReactNode; children: ReactNode }) {
    return <div className={cn(part('inverse-card'), part(`inverse-card--${direction}`))}>{fromIcon}<h4>{from}</h4><div className={part('inverse-card__arrow')}>{connector}</div>{toIcon}<h4>{to}</h4><p>{children}</p></div>;
}

export function AcademyFinalTip({ as: Root = 'section', icon, title, children }: { as?: 'section' | 'div'; icon: ReactNode; title: ReactNode; children: ReactNode }) {
    return <Root className={part('asset-page__final-tip')}>{icon}<div><h3>{title}</h3><p>{children}</p></div></Root>;
}
