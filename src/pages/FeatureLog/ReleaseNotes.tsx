import type { CSSProperties, ReactNode } from 'react';
import { releaseStyle as s } from './ReleaseNotes.styles';
export function ReleaseLogHeading({
    icon,
    eyebrow,
    title,
    subtitle,
}: {
    icon: ReactNode;
    eyebrow: ReactNode;
    title: ReactNode;
    subtitle: ReactNode;
}) {
    return (
        <>
            <div className={s('feature-log__title-row')}>
                <div className={s('feature-log__title-icon')}>{icon}</div>
                <div>
                    <p className={s('feature-log__eyebrow')}>{eyebrow}</p>
                    <h1 className={s('feature-log__title')}>{title}</h1>
                </div>
            </div>
            <p className={s('feature-log__subtitle')}>{subtitle}</p>
        </>
    );
}
export function ReleaseLogSummary({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <div className={s('feature-log__summary-item')}>
            {icon}
            <span>{children}</span>
        </div>
    );
}
export function ReleaseNoteCard({ date, title, children }: { date: string; title: ReactNode; children: ReactNode }) {
    return (
        <article className={s('feature-log-entry')}>
            <div className={s('feature-log-entry__meta')}>
                <time dateTime={date}>{date}</time>
            </div>
            <h2 className={s('feature-log-entry__title')}>{title}</h2>
            {children}
        </article>
    );
}
export function ReleaseNoteSection({
    label,
    items,
    renderText,
}: {
    label: string;
    items: readonly { depth: number; text: string }[];
    renderText: (text: string) => ReactNode;
}) {
    return (
        <section className={s('feature-log-entry__section')}>
            <h3 className={s('feature-log-entry__section-title')}>{label}</h3>
            <ul className={s('feature-log-entry__list')}>
                {items.map((item, index) => (
                    <li
                        key={`${label}-${index}-${item.text}`}
                        className={s('feature-log-entry__item')}
                        style={{ '--feature-log-indent': `${item.depth * 1.1}rem` } as CSSProperties}
                    >
                        {renderText(item.text)}
                    </li>
                ))}
            </ul>
        </section>
    );
}
export function ReleaseNoteFiles({ summary, children }: { summary: ReactNode; children: ReactNode }) {
    return (
        <details className={s('feature-log-entry__files')}>
            <summary>{summary}</summary>
            {children}
        </details>
    );
}
