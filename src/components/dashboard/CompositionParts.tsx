import type { ButtonHTMLAttributes, DetailsHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { compositionStyle as s } from './CompositionParts.styles';
/** Native details keep independent, initially collapsed fund and heatmap controls. */
export function CompositionDisclosure({
    variant,
    title,
    hint,
    children,
    className,
    ...props
}: Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'title'> & {
    variant: 'heatmap' | 'fund';
    title: ReactNode;
    hint?: ReactNode;
}) {
    return (
        <details
            {...props}
            className={cn(
                s(
                    variant === 'heatmap'
                        ? 'portfolio-composition__heatmap-details'
                        : 'portfolio-composition__breakdown-groups',
                ),
                className,
            )}
        >
            <summary>
                {title}
                {hint != null && <span>{hint}</span>}
            </summary>
            {variant === 'fund' ? (
                <div className={s('portfolio-composition__distribution-grid')}>{children}</div>
            ) : (
                children
            )}
        </details>
    );
}
export function CompositionExposureRow({
    name,
    source,
    weight,
    amount,
    residual,
    className,
    ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'name'> & {
    name: ReactNode;
    source: ReactNode;
    weight: ReactNode;
    amount: ReactNode;
    residual?: boolean;
}) {
    return (
        <button
            {...props}
            className={cn(
                s('portfolio-composition__exposure-row'),
                residual && s('portfolio-composition__exposure-row--residual'),
                className,
            )}
        >
            <span className={s('portfolio-composition__exposure-name')}>
                <strong>{name}</strong>
                <small>{source}</small>
            </span>
            <span className={s('portfolio-composition__exposure-value')}>
                <strong>{weight}</strong>
                <small>{amount}</small>
            </span>
        </button>
    );
}
export function CompositionGroupHeading({
    title,
    description,
    total,
}: {
    title: ReactNode;
    description?: ReactNode;
    total: ReactNode;
}) {
    return (
        <div className={s('portfolio-composition__exposure-group-header')}>
            {description != null ? (
                <div>
                    <h5>{title}</h5>
                    <p>{description}</p>
                </div>
            ) : (
                <h5>{title}</h5>
            )}
            <span>{total}</span>
        </div>
    );
}
