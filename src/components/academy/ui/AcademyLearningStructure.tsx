import type { HTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { AcademyPanel } from './AcademyPanel';
import { learningStructureStyle as s } from './AcademyLearningStructure.styles';
export function AcademyLearningPage({ liquidGlass, children }: { liquidGlass: boolean; children: ReactNode }) {
    return <div className={cn(s('fundamentos'), liquidGlass && 'fundamentos--liquid-glass')}>{children}</div>;
}
export function AcademyLearningSection({ className, ...props }: HTMLAttributes<HTMLElement>) {
    return (
        <AcademyPanel
            {...props}
            variant="fundamentals"
            as="section"
            className={cn(s('fundamentos__section-block'), className)}
        />
    );
}
/** A complete learning level owns the heading, progress count and module list. */
export function AcademyLearningLevel({
    title,
    count,
    children,
}: {
    title: ReactNode;
    count: ReactNode;
    children: ReactNode;
}) {
    return (
        <article className={s('fundamentos__level-card')}>
            <div className={s('fundamentos__level-head')}>
                <h3>{title}</h3>
                <span>{count}</span>
            </div>
            <div className={s('fundamentos__mini-list')}>{children}</div>
        </article>
    );
}
export function AcademyLearningFeature({
    appearance,
    title,
    description,
    children,
}: {
    appearance: 'spotlight' | 'next';
    title: ReactNode;
    description: ReactNode;
    children: ReactNode;
}) {
    return appearance === 'spotlight' ? (
        <AcademyPanel variant="fundamentals" as="section" className={s('fundamentos__spotlight')}>
            <div className="fundamentos__spotlight-copy">
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
            <div className={s('fundamentos__spotlight-actions')}>{children}</div>
        </AcademyPanel>
    ) : (
        <AcademyPanel variant="fundamentals" className={s('fundamentos__next')}>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className={s('fundamentos__next-links')}>{children}</div>
        </AcademyPanel>
    );
}
export function AcademyLearningAction({
    appearance,
    className,
    ...props
}: LinkProps & { appearance: 'primary' | 'secondary' }) {
    return (
        <Link
            {...props}
            className={cn(
                s('fundamentos__button'),
                s(appearance === 'primary' ? 'fundamentos__button--primary' : 'fundamentos__button--secondary'),
                className,
            )}
        />
    );
}
