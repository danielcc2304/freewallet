import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { assetBarStyle as s } from './AcademyAssetBars.styles';
type BarProps = HTMLAttributes<HTMLDivElement> & {
    label: ReactNode;
    value: ReactNode;
    fillStyle: CSSProperties;
    valueStyle?: CSSProperties;
};
export function AcademyAssetBar({
    variant,
    label,
    value,
    fillStyle,
    valueStyle,
    className,
    ...props
}: BarProps & { variant: 'duration' | 'inflation' }) {
    const prefix = variant === 'duration' ? 'duration-bar' : 'inflation-bar';
    return (
        <div {...props} className={cn(s(prefix), className)}>
            <span className={s(`${prefix}__label`)}>{label}</span>
            <div className={s(`${prefix}__track`)}>
                <div className={s(`${prefix}__fill`)} style={fillStyle} />
            </div>
            <span className={s(`${prefix}__value`)} style={valueStyle}>
                {value}
            </span>
        </div>
    );
}
export function AcademyDurationMixRow({
    label,
    value,
    width,
    term,
}: {
    label: ReactNode;
    value: ReactNode;
    width: string;
    term: 'short' | 'mid' | 'long';
}) {
    return (
        <div className={s('duration-mix__row')}>
            <span>{label}</span>
            <div className={s('duration-mix__track')}>
                <div className={cn(s('duration-mix__fill'), s(`duration-mix__fill--${term}`))} style={{ width }} />
            </div>
            <strong>{value}</strong>
        </div>
    );
}
export function AcademyRatingRow({
    rating,
    color,
    width,
    label,
    example,
}: {
    rating: ReactNode;
    color: string;
    width: string;
    label: ReactNode;
    example: ReactNode;
}) {
    return (
        <div className={s('rating-row')}>
            <span className={s('rating-row__badge')} style={{ backgroundColor: color }}>
                {rating}
            </span>
            <div className={s('rating-row__bar-container')}>
                <div className={s('rating-row__bar')} style={{ width, backgroundColor: color }} />
            </div>
            <div className={s('rating-row__info')}>
                <span className={s('rating-row__label')}>{label}</span>
                <span className={s('rating-row__example')}>{example}</span>
            </div>
        </div>
    );
}
export function AcademyRatingDivider({ above, below }: { above: ReactNode; below: ReactNode }) {
    return (
        <div className={s('rating-scale__divider')}>
            <span>{above}</span>
            <span>{below}</span>
        </div>
    );
}
