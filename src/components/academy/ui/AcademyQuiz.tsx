import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { quizStyle as s } from './AcademyQuiz.styles';
const actionClass = (secondary?: boolean) => cn(s('quiz-button'), secondary && s('button--secondary'));
export function AcademyQuizButton({
    secondary,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
    return <button {...props} className={cn(actionClass(secondary), className)} />;
}
export function AcademyQuizLink({ className, ...props }: LinkProps) {
    return <Link {...props} className={cn(actionClass(), className)} />;
}
export function AcademyQuizIntro({
    icon,
    title,
    description,
    children,
}: {
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={s('quiz-start')}>
            <div className={s('quiz-start__icon')}>{icon}</div>
            <h2>{title}</h2>
            <p>{description}</p>
            {children}
        </div>
    );
}
export function AcademyQuizQuestion({
    step,
    title,
    progress,
    children,
}: {
    step: ReactNode;
    title: ReactNode;
    progress: number;
    children: ReactNode;
}) {
    return (
        <div className="quiz-question">
            <span className={s('quiz-question__step')}>{step}</span>
            <h2 className={s('quiz-question__text')}>{title}</h2>
            <div className={s('quiz-options')}>{children}</div>
            <div className={s('quiz-progress')}>
                <div className={s('quiz-progress__bar')} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}
export function AcademyQuizChoice({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={cn(s('quiz-option'), className)} />;
}
export function AcademyQuizResult({
    badge,
    type,
    title,
    description,
    children,
}: {
    badge: ReactNode;
    type: 'conservador' | 'moderado' | 'agresivo';
    title: ReactNode;
    description: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={s('quiz-result')}>
            <div className={cn(s('quiz-result__badge'), s(`quiz-result__badge--${type}`))}>{badge}</div>
            <h2 className={s('quiz-result__title')}>{title}</h2>
            <p className={s('quiz-result__desc')}>{description}</p>
            {children}
        </div>
    );
}
export function AcademyQuizRecommendation({
    title,
    label,
    value,
    action,
}: {
    title: ReactNode;
    label: ReactNode;
    value: ReactNode;
    action: ReactNode;
}) {
    return (
        <div className={s('suggested-portfolio')}>
            <h3>{title}</h3>
            <div className={s('portfolio-preview')}>
                <div className={s('portfolio-preview__info')}>
                    <span className={s('portfolio-preview__label')}>{label}</span>
                    <span className={s('portfolio-preview__value')}>{value}</span>
                </div>
                {action}
            </div>
        </div>
    );
}
export function AcademyQuizActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('quiz-result__actions'), className)} />;
}
