import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { assetGuideFrameStyle as s } from './AssetGuideFrame.styles';
export function AssetGuideFrame({
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { appearance: string }) {
    return <div {...props} className={cn(s('asset-page'), `asset-page--${appearance}`, className)} />;
}
export function AssetGuideDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return <p {...props} className={cn(s('asset-page__section-desc'), className)} />;
}
const layouts = {
    inverse: 'inverse-relationship',
    curves: 'yield-curves',
    rating: 'rating-scale',
    spreads: 'credit-spreads-grid',
    checklist: 'bond-checklist-grid',
    ladder: 'bond-ladder',
    mistakes: 'bond-mistakes-grid',
} as const;
export function AssetGuideLayout({
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { appearance: keyof typeof layouts }) {
    return <div {...props} className={cn(s(layouts[appearance]), className)} />;
}
export function AssetGuideComparison({ left, right, label }: { left: ReactNode; right: ReactNode; label: ReactNode }) {
    return (
        <div className={s('asset-page__versus')}>
            {left}
            <div className={s('versus-divider')}>{label}</div>
            {right}
        </div>
    );
}
export function AssetGuideBondCategory({
    icon,
    title,
    description,
    children,
    ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & { icon: ReactNode; title: ReactNode; description: ReactNode }) {
    return (
        <div {...props} className={cn(s('bond-type-block'), props.className)}>
            <div className={s('bond-type-block__header')}>
                <span className={s('bond-type-block__emoji')}>{icon}</span>
                <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
}
