import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { AcademyLinkCard, AcademyPanel } from './AcademyPanel';
import { assetGuideStyle as s } from './AcademyAssetGuideCard.styles';
/** Consistent asset guide card, preserving native link and article semantics. */
export function AcademyAssetGuideCard({
    to,
    color,
    titleId,
    descriptionId,
    icon,
    title,
    description,
    risk,
    guide,
}: {
    to?: string;
    color: string;
    titleId: string;
    descriptionId: string;
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
    risk: ReactNode;
    guide: ReactNode;
}) {
    const content = (
        <>
            <div className={s('strategy-asset__header')}>
                <span className={s('strategy-asset__icon')} aria-hidden="true">
                    {icon}
                </span>
                <h3 id={titleId}>{title}</h3>
            </div>
            <p id={descriptionId} className={s('strategy-asset__description')}>
                {description}
            </p>
            <div className={s('strategy-asset__footer')}>
                <div className={s('strategy-asset__risk')}>
                    <span>Riesgo</span>
                    <strong>{risk}</strong>
                </div>
                {to && <span className={s('strategy-asset__guide')}>{guide}</span>}
            </div>
        </>
    );
    const style = { '--asset-color': color } as CSSProperties;
    return to ? (
        <AcademyLinkCard
            variant="workspace"
            className={cn(s('strategy-asset'), s('strategy-asset--linked'))}
            style={style}
            to={to}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
        >
            {content}
        </AcademyLinkCard>
    ) : (
        <AcademyPanel
            variant="workspace"
            as="article"
            className={s('strategy-asset')}
            style={style}
            aria-labelledby={titleId}
        >
            {content}
        </AcademyPanel>
    );
}
