import {ReleaseLogHeading,ReleaseLogSummary,ReleaseNoteCard,ReleaseNoteSection,ReleaseNoteFiles} from './ReleaseNotes';
import { CalendarDays, FileText, Sparkles } from 'lucide-react';
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
    const entryBlocks = markdown.replace(/\r\n?/g, '\n')
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
        <ReleaseNoteSection label={section.label} items={section.items} renderText={renderInlineText} />
    );
}

const featureLogEntries = parseFeatureLog(featureLogMarkdown);

export function FeatureLog() {
    return (
        <div className="feature-log">
            <header className="feature-log__header"><ReleaseLogHeading icon={<>
                        <Sparkles size={28} />
                    </>} eyebrow={<>{APP_NAME} v{APP_VERSION}</>} title={<>Novedades</>} subtitle={<>
                    Listado de mejoras publicadas.
                </>} /></header>

            <div className="feature-log__summary" aria-label="Resumen del registro">
                <ReleaseLogSummary icon={<FileText size={18} />}>{featureLogEntries.length} entradas</ReleaseLogSummary>
                {featureLogEntries[0] && (
                    <ReleaseLogSummary icon={<CalendarDays size={18} />}>Ultima update: {featureLogEntries[0].date}</ReleaseLogSummary>
                )}
            </div>

            <div className="feature-log__entries">
                {featureLogEntries.map((entry) => {
                    const functionality = entry.sections.find((section) => section.label === 'Funcionalidad');
                    const summary = entry.sections.find((section) => section.label === 'Resumen');
                    const files = entry.sections.find((section) => section.label === 'Archivos');

                    return (
                        <ReleaseNoteCard key={`${entry.date}-${entry.title}`} date={entry.date} title={entry.title}>{functionality && <FeatureLogSectionList section={functionality} />}{summary && <FeatureLogSectionList section={summary} />}{files && (
                                <ReleaseNoteFiles summary={<>Archivos modificados</>}><FeatureLogSectionList section={files} /></ReleaseNoteFiles>
                            )}</ReleaseNoteCard>
                    );
                })}
            </div>
        </div>
    );
}
