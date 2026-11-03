import type { ReactNode } from 'react';

/** Shared correction row; confirmation and persistence stay in PortfolioSummary. */
export function DashboardReviewRow({ label, labelAs: Label = 'strong', children }: { label: ReactNode; labelAs?: 'strong' | 'span'; children: ReactNode }) {
    return <div className="portfolio-summary__deletion-review tw:ui-row tw:flex-wrap tw:gap-[.65rem] tw:p-[.75rem_0] tw:[border-top:1px_solid_var(--border-color)] tw:[&_p]:basis-full tw:[&_.btn]:whitespace-normal tw:[&_.btn]:min-h-[44px]">
        <Label className="tw:wrap-anywhere">{label}</Label>{children}
    </div>;
}
