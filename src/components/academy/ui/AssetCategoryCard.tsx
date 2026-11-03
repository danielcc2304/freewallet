import type { CSSProperties, ReactNode } from 'react';
import { AcademyPanel } from './AcademyPanel';
import { assetCategoryClass as part } from './assetCategoryStyles';

interface Props {
    title: ReactNode;
    description: ReactNode;
    icon?: ReactNode;
    style?: CSSProperties;
    examples?: string[];
    examplesLabel?: ReactNode;
    footer?: ReactNode;
}

/** Shared subtype structure for equities, cash, real estate and crypto guides. */
export function AssetCategoryCard({ title, description, icon, style, examples, examplesLabel, footer }: Props) {
    return <AcademyPanel variant="subtype" className={part('subtype-card')} style={style}>
        <div className={part('subtype-card__header')}>{icon ?? <div className={part('subtype-card__dot')} />}<h3>{title}</h3></div>
        <p className={part('subtype-card__desc')}>{description}</p>
        {examples && <div className={part('subtype-card__examples')}>
            <span className={part('subtype-card__tag-label')}>{examplesLabel}</span>
            <div className={part('subtype-card__tags')}>{examples.map((example, i) => <span key={i} className={part('subtype-card__tag')}>{example}</span>)}</div>
        </div>}
        {footer && <div className={part('subtype-card__footer')}>{footer}</div>}
    </AcademyPanel>;
}
