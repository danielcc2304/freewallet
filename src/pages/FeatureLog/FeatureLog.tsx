import { ArrowLeft, CalendarDays, FileText, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import featureLogMarkdown from '../../../FEATURE_LOG.md?raw';
import { APP_NAME, APP_VERSION } from '../../constants/app';
import './FeatureLog.css';

type FeatureLogLine = {
    depth: number;
    text: string;
};

type FeatureLogSection = {
    label: string;
    items: FeatureLogLine[];
};

type FeatureLogEntry = {
    date: string;
    title: string;
    sections: FeatureLogSection[];
};

const sectionLabels = new Set(['Funcionalidad', 'Resumen', 'Archivos']);

function parseFeatureLog(markdown: string): FeatureLogEntry[] {
    const entryBlocks = markdown
        .split(/\n(?=###\s+\d{4}-\d{2}-\d{2}\s+-\s+)/)
        .filter((block) => block.startsWith('### '));

    return entryBlocks.flatMap((block) => {
        const lines = block.trim().split('\n');
        const heading = lines[0].match(/^###\s+(\d{4}-\d{2}-\d{2})\s+-\s+(.+)$/);

        if (!heading) {
            return [];
        }

        const sections: FeatureLogSection[] = [];
        let currentSection: FeatureLogSection | null = null;

        for (const line of lines.slice(1)) {
            const sectionMatch = line.match(/^-\s+([^:]+):\s*$/);

            if (sectionMatch && sectionLabels.has(sectionMatch[1])) {
                currentSection = { label: sectionMatch[1], items: [] };
                sections.push(currentSection);
                continue;
            }

            const itemMatch = line.match(/^(\s*)-\s+(.+)$/);

            if (itemMatch && currentSection) {
                currentSection.items.push({
                    depth: Math.floor(itemMatch[1].length / 2),
                    text: itemMatch[2],
                });
            }
        }

        return [{
            date: heading[1],
            title: heading[2],
            sections,
        }];
    });
}

function renderInlineText(text: string) {
    return text.split(/(`[^`]+`)/g).map((part, index) => {
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
        }

        return <span key={`${part}-${index}`}>{part}</span>;
    });
}

function FeatureLogSectionList({ section }: { section: FeatureLogSection }) {
    return (
        <section className="feature-log-entry__section">
            <h3 className="feature-log-entry__section-title">{section.label}</h3>
            <ul className="feature-log-entry__list">
                {section.items.map((item, index) => (
                    <li
                        key={`${section.label}-${index}-${item.text}`}
                        className="feature-log-entry__item"
                        style={{ '--feature-log-indent': `${item.depth * 1.1}rem` } as CSSProperties}
                    >
                        {renderInlineText(item.text)}
                    </li>
                ))}
            </ul>
        </section>
    );
}

const featureLogEntries = parseFeatureLog(featureLogMarkdown);

export function FeatureLog() {
    return (
        <div className="feature-log">
            <header className="feature-log__header">
                <Link to="/settings" className="feature-log__back-link" aria-label="Volver a configuracion">
                    <ArrowLeft size={18} />
                    <span>Volver</span>
                </Link>

                <div className="feature-log__title-row">
                    <div className="feature-log__title-icon">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <p className="feature-log__eyebrow">{APP_NAME} v{APP_VERSION}</p>
                        <h1 className="feature-log__title">Novedades</h1>
                    </div>
                </div>
                <p className="feature-log__subtitle">
                    Listado de mejoras publicadas.
                </p>
            </header>

            <div className="feature-log__summary" aria-label="Resumen del registro">
                <div className="feature-log__summary-item">
                    <FileText size={18} />
                    <span>{featureLogEntries.length} entradas</span>
                </div>
                {featureLogEntries[0] && (
                    <div className="feature-log__summary-item">
                        <CalendarDays size={18} />
                        <span>Ultima update: {featureLogEntries[0].date}</span>
                    </div>
                )}
            </div>

            <div className="feature-log__entries">
                {featureLogEntries.map((entry) => {
                    const functionality = entry.sections.find((section) => section.label === 'Funcionalidad');
                    const summary = entry.sections.find((section) => section.label === 'Resumen');
                    const files = entry.sections.find((section) => section.label === 'Archivos');

                    return (
                        <article key={`${entry.date}-${entry.title}`} className="feature-log-entry">
                            <div className="feature-log-entry__meta">
                                <time dateTime={entry.date}>{entry.date}</time>
                            </div>

                            <h2 className="feature-log-entry__title">{entry.title}</h2>

                            {functionality && <FeatureLogSectionList section={functionality} />}
                            {summary && <FeatureLogSectionList section={summary} />}

                            {files && (
                                <details className="feature-log-entry__files">
                                    <summary>Archivos modificados</summary>
                                    <FeatureLogSectionList section={files} />
                                </details>
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
