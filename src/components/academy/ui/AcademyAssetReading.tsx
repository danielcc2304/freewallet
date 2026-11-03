import type { HTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { assetReadingStyle as s } from './AcademyAssetReading.styles';
/** A single reading header shared by all five asset guides. */
export function AcademyAssetHero({
    icon,
    title,
    description,
    children,
    className,
    ...props
}: Omit<HTMLAttributes<HTMLElement>, 'title'> & { icon: ReactNode; title: ReactNode; description: ReactNode }) {
    return (
        <AcademyPageHeader {...props} section="Aprender" className={cn(s('asset-page__hero'), className)}>
            <div className={s('asset-page__hero-icon')}>{icon}</div>
            <h1>{title}</h1>
            <p className={s('asset-page__hero-sub')}>{description}</p>
            <div className={s('asset-page__hero-stats')}>{children}</div>
        </AcademyPageHeader>
    );
}
export function AcademyAssetBackLink({ className, ...props }: LinkProps) {
    return <Link {...props} className={cn(s('asset-page__back'), className)} />;
}
export function AcademyAssetText({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('asset-page__text-block'), className)} />;
}
export function AcademyAssetInlineLink({ className, ...props }: LinkProps) {
    return <Link {...props} className={cn(s('asset-page__cta-link'), className)} />;
}
export function AcademyAssetNavigation({ sections }: { sections: readonly { id: string; label: string }[] }) {
    return (
        <nav className={s('asset-guide-nav')} aria-label="Secciones de esta guía">
            <span className={s('asset-guide-nav__label')}>En esta guía</span>
            <div className={s('asset-guide-nav__links')}>
                {sections.map(({ id, label }) => (
                    <a key={id} href={`#${id}`}>
                        {label}
                    </a>
                ))}
            </div>
        </nav>
    );
}
