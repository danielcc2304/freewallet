import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { journeySupportStyle as s } from './JourneySupport.styles';
export function JourneyCrisis({
    title,
    duration,
    objective,
    children,
    errors,
}: {
    title: ReactNode;
    duration: ReactNode;
    objective: ReactNode;
    children: ReactNode;
    errors: readonly string[];
}) {
    return (
        <div className={s('timeline__crisis')}>
            <div className={s('timeline__crisis-header')}>
                <AlertCircle size={28} className={s('timeline__crisis-icon')} />
                <div>
                    <h3 className={s('timeline__crisis-title')}>{title}</h3>
                    <p className={s('timeline__crisis-subtitle')}>{duration}</p>
                </div>
            </div>
            <div className={s('timeline__crisis-content')}>
                <div className={s('timeline__crisis-objective')}>
                    <strong>🎯 Objetivo:</strong> {objective}
                </div>
                <div className={s('timeline__crisis-actions')}>{children}</div>
                <div className={s('timeline__crisis-errors')}>
                    <strong>⚠️ Errores críticos:</strong>
                    <ul>
                        {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
export function JourneyCrisisColumn({ title, items }: { title: ReactNode; items: readonly ReactNode[] }) {
    return (
        <div className={s('timeline__crisis-column')}>
            <h4>{title}</h4>
            <ul>
                {items.map((item, i) => (
                    <li key={i}>{item}</li>
                ))}
            </ul>
        </div>
    );
}
export function JourneyNextSection({
    appearance,
    title,
    description,
    children,
}: {
    appearance: 'next' | 'guide';
    title: ReactNode;
    description: ReactNode;
    children: ReactNode;
}) {
    const Tag = appearance === 'guide' ? 'section' : 'div';
    return (
        <Tag className={s(appearance === 'guide' ? 'timeline__guide-next' : 'timeline__next')}>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className={s(appearance === 'guide' ? 'timeline__guide-links' : 'timeline__next-links')}>
                {children}
            </div>
        </Tag>
    );
}
export function JourneyNextLink({ className, ...props }: LinkProps) {
    return <Link {...props} className={cn(s('timeline__next-link'), className)} />;
}
