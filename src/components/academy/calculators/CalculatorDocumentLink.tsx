import type { ReactNode } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

export function CalculatorDocumentLink({ href, title, subtitle }: { href: string; title: ReactNode; subtitle: ReactNode }) {
    return <a className="fund-info__document tw:ui-row tw:gap-ui-sm tw:min-w-0 tw:p-ui-md tw:text-secondary tw:ui-fill-muted tw:ui-border tw:rounded-control tw:[&:hover]:text-main tw:[&:hover]:border-accent" href={href} target="_blank" rel="noopener noreferrer">
        <FileText size={17} className="tw:text-accent tw:shrink-0" />
        <span className="tw:ui-stack tw:min-w-0 tw:gap-[.15rem]">
            <strong className="tw:wrap-anywhere tw:text-main tw:text-[length:var(--font-size-sm)]">{title}</strong>
            <small className="tw:wrap-anywhere tw:text-muted tw:text-[length:var(--font-size-xs)]">{subtitle}</small>
        </span>
        <ExternalLink size={15} className="tw:shrink-0 tw:ml-auto tw:text-muted" />
    </a>;
}
