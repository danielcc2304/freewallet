import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { AcademyPanel } from './AcademyPanel';
import { bondPartStyle as s } from './AcademyBondParts.styles';
type ContentProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & { title: ReactNode };
/** Explanatory panels share their title/body structure; their data remains with each lesson. */
export function AcademyAssetVisual({
    variant,
    title,
    children,
    className,
    ...props
}: ContentProps & { variant: 'anatomy' | 'duration' | 'inflation' }) {
    const root =
        variant === 'anatomy' ? 'bond-anatomy' : variant === 'duration' ? 'duration-visual' : 'inflation-visual';
    return (
        <div {...props} className={cn(s(root), className)}>
            <h3>{title}</h3>
            {variant === 'anatomy' ? (
                children
            ) : (
                <div className={s(variant === 'duration' ? 'duration-bars' : 'inflation-bars')}>{children}</div>
            )}
        </div>
    );
}
export function AcademyConvexityPanel({ title, copy, chart }: { title: ReactNode; copy: ReactNode; chart: ReactNode }) {
    return (
        <div className={s('convexity-explainer')}>
            <h3>{title}</h3>
            <div className={s('convexity-content')}>
                <div className={s('convexity-text')}>{copy}</div>
                <div className={s('convexity-chart')}>
                    <div className={s('convexity-chart__visual')}>{chart}</div>
                </div>
            </div>
        </div>
    );
}
export function AcademyConvexityLabel({ placement, children }: { placement: 'top' | 'bottom'; children: ReactNode }) {
    return <div className={cn(s('convexity-chart__label'), s(`convexity-chart__label--${placement}`))}>{children}</div>;
}
export function AcademyYieldCurve({
    title,
    signal,
    description,
    color,
    children,
    ...props
}: ContentProps & { signal: ReactNode; description: ReactNode; color: string }) {
    return (
        <AcademyPanel
            {...props}
            variant="yieldCurve"
            className={s('yield-curve-card')}
            style={{ '--curve-color': color } as CSSProperties}
        >
            <div className="yield-curve-card__header">
                <h4>{title}</h4>
                <span className={s('yield-curve-card__signal')}>{signal}</span>
            </div>
            <p className="yield-curve-card__desc">{description}</p>
            <div className="yield-curve-card__chart">
                <div className={s('mini-curve')}>{children}</div>
            </div>
        </AcademyPanel>
    );
}
export function AcademyYieldBar({
    label,
    value,
    height,
    color,
}: {
    label: ReactNode;
    value: ReactNode;
    height: string;
    color: string;
}) {
    return (
        <div className={s('mini-curve__bar-group')}>
            <div className={s('mini-curve__bar')} style={{ height, backgroundColor: color }} />
            <span className={s('mini-curve__label')}>{label}</span>
            <span className={s('mini-curve__val')} style={{ color }}>
                {value}
            </span>
        </div>
    );
}
export function AcademyBondLadderStep({
    rung,
    title,
    description,
    hint,
    ...props
}: ContentProps & { rung: ReactNode; description: ReactNode; hint: ReactNode }) {
    return (
        <div {...props} className={s('bond-ladder__step')}>
            <span className={s('bond-ladder__rung')}>{rung}</span>
            <h4>{title}</h4>
            <p>{description}</p>
            <span className={s('bond-ladder__hint')}>{hint}</span>
        </div>
    );
}
export function AcademyDurationInputs({ title, children, ...props }: ContentProps) {
    return (
        <div {...props} className={s('duration-input-card')}>
            <h4>{title}</h4>
            {children}
        </div>
    );
}
export function AcademyBondMetric({
    appearance,
    label,
    value,
    valueClassName,
}: {
    appearance: 'duration' | 'spread';
    label: ReactNode;
    value: ReactNode;
    valueClassName?: string;
}) {
    return (
        <div className={s(appearance === 'duration' ? 'duration-summary-card' : 'spread-sim__metric')}>
            <span className={appearance === 'spread' ? s('spread-sim__metric-label') : undefined}>{label}</span>
            <strong className={valueClassName}>{value}</strong>
        </div>
    );
}
export function AcademyDurationMix({ title, children }: { title: ReactNode; children: ReactNode }) {
    return (
        <div className={s('duration-mix')}>
            <h4>{title}</h4>
            <div className={s('duration-mix__bars')}>{children}</div>
        </div>
    );
}
export function AcademyBondRange({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
    return (
        <label className={s('spread-sim__control')}>
            <span>{label}</span>
            <input {...props} />
        </label>
    );
}
export function AcademyBondChoice({
    appearance,
    active,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { appearance: 'mode' | 'preset' | 'stress'; active: boolean }) {
    return (
        <button
            {...props}
            className={cn(
                s(
                    appearance === 'mode'
                        ? 'spread-sim__mode-btn'
                        : appearance === 'preset'
                          ? 'spread-sim__preset'
                          : 'spread-sim__stress-btn',
                ),
                active && 'is-active',
                className,
            )}
        />
    );
}
export function AcademyGuideCta({
    title,
    description,
    action,
    ...props
}: Omit<LinkProps, 'title' | 'children'> & { title: ReactNode; description: ReactNode; action: ReactNode }) {
    return (
        <div className={s('cta-box')}>
            <div className={s('cta-box__content')}>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link {...props} className={s('cta-box__button')}>
                    {action}
                </Link>
            </div>
        </div>
    );
}

/** Static price/yield illustration, kept native and shared with its explanatory panel. */
export function AcademyConvexityGraphic() {
    return (
        <>
            <AcademyConvexityLabel placement="top">Beneficio por convexidad ↑</AcademyConvexityLabel>
            <svg viewBox="0 0 200 120" className={s('convexity-svg')}>
                {/* Linear (duration only) */}
                <line x1="20" y1="100" x2="180" y2="20" stroke="#64748b" strokeDasharray="5,5" strokeWidth="2" />
                {/* Curved (with convexity) */}
                <path d="M20,100 Q60,85 100,60 Q140,35 180,15" stroke="#10b981" strokeWidth="3" fill="none" />
                <text x="90" y="115" fill="#64748b" fontSize="9" textAnchor="middle">
                    Duración (lineal)
                </text>
                <text x="140" y="25" fill="#10b981" fontSize="9" textAnchor="middle">
                    Con convexidad
                </text>
            </svg>
            <AcademyConvexityLabel placement="bottom">Yield →</AcademyConvexityLabel>
        </>
    );
}
