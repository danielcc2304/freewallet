import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';
import { learningStyle as s } from './AcademyLearningParts.styles';
export function AcademyLearningHeading({
    title,
    description,
    action,
}: {
    title: ReactNode;
    description: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className={s('fundamentos__section-head')}>
            {action ? (
                <div className={s('fundamentos__section-head-row')}>
                    <h2>{title}</h2>
                    {action}
                </div>
            ) : (
                <h2>{title}</h2>
            )}
            <p>{description}</p>
        </div>
    );
}
export function AcademyLearningToggle({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={cn(s('fundamentos__collapse-toggle'), className)} />;
}
export function AcademyLearningGoal({
    title,
    description,
    children,
    ...props
}: Omit<HTMLAttributes<HTMLElement>, 'title'> & { title: ReactNode; description: ReactNode }) {
    return (
        <article {...props} className={s('fundamentos__goal-card')}>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className={s('fundamentos__goal-links')}>{children}</div>
        </article>
    );
}
