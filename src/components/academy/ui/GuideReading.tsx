import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { AcademyPanel } from './AcademyPanel';
import { AcademyGrid } from './AcademyGrid';
import { guideReadingStyle as s, type GuidePart } from './GuideReading.styles';
export function GuideBlock({
    as: Tag = 'div',
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { appearance: GuidePart; as?: 'div' | 'section' | 'article' | 'nav' | 'span' | 'p' }) {
    return <Tag {...props} className={s(appearance, className)} />;
}
export function GuidePanel({
    appearance,
    className,
    ...props
}: ComponentProps<typeof AcademyPanel> & { appearance: GuidePart }) {
    return <AcademyPanel {...props} className={s(appearance, className)} />;
}
export function GuideGrid({
    appearance,
    className,
    ...props
}: ComponentProps<typeof AcademyGrid> & { appearance: GuidePart }) {
    return <AcademyGrid {...props} className={s(appearance, className)} />;
}
export function GuideLink({ appearance, className, ...props }: LinkProps & { appearance: GuidePart }) {
    return <Link {...props} className={s(appearance, className)} />;
}
export function GuideText({
    as: Tag = 'p',
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { appearance: GuidePart; as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' }) {
    return <Tag {...props} className={s(appearance, className)} />;
}
const headers = {
    valuation: { root: 'valuationGuideHero', title: undefined, copy: undefined, icon: 'valuationGuideHeroIcon' },
    errors: { root: 'errorsPageHeader', title: 'errorsPageTitle', copy: 'errorsPageSubtitle', icon: undefined },
    timeline: { root: 'timelineHeader', title: 'timelineTitle', copy: 'timelineDescription', icon: undefined },
    glossary: { root: 'glossaryPageHeader', title: 'glossaryPageTitle', copy: 'glossaryPageSubtitle', icon: undefined },
    scenarios: { root: 'scenariosHeader', title: 'scenariosTitle', copy: 'scenariosSubtitle', icon: undefined },
} satisfies Record<string, { root: GuidePart; title?: GuidePart; copy?: GuidePart; icon?: GuidePart }>;
export function GuideReadingHeader({
    appearance,
    title,
    description,
    icon,
    ...props
}: Omit<ComponentProps<typeof AcademyPageHeader>, 'title' | 'children'> & {
    appearance: keyof typeof headers;
    title: ReactNode;
    description: ReactNode;
    icon?: ReactNode;
}) {
    const h = headers[appearance];
    return (
        <AcademyPageHeader {...props} className={s(h.root)}>
            {icon != null && <div className={h.icon ? s(h.icon) : undefined}>{icon}</div>}
            <h1 className={h.title ? s(h.title) : undefined}>{title}</h1>
            <p className={h.copy ? s(h.copy) : undefined}>{description}</p>
        </AcademyPageHeader>
    );
}
export function GuideReadingSection({
    title,
    children,
    className,
    ...props
}: Omit<HTMLAttributes<HTMLElement>, 'title'> & { title: ReactNode }) {
    return (
        <section {...props} className={s('valuationGuideSection', className)}>
            <h2>{title}</h2>
            {children}
        </section>
    );
}
export function GuideNextStep({
    title,
    description,
    ...props
}: Omit<LinkProps, 'title' | 'children'> & { title: ReactNode; description: ReactNode }) {
    return (
        <Link {...props} className={s('valuationGuideNextCard')}>
            <strong>{title}</strong>
            <p>{description}</p>
        </Link>
    );
}
export function GuideReadingCallout({
    title,
    description,
    children,
}: {
    title: ReactNode;
    description: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className={s('timelineErrorsCta')}>
            <h3>{title}</h3>
            <p>{description}</p>
            {children}
        </section>
    );
}
