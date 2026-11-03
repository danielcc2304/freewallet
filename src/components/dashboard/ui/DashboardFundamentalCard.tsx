import type { ReactNode } from 'react';

export function DashboardFundamentalCard({ icon, label, value, category, children }: { icon: ReactNode; label: ReactNode; value: ReactNode; category: ReactNode; children?: ReactNode }) {
    return <div className="metric-card tw:ui-stack tw:gap-ui-sm tw:ui-fill-panel tw:ui-border-default tw:p-[1rem] tw:rounded-[12px] tw:[transition:transform_.2s,border-color_.2s] tw:min-w-0 tw:[&:hover]:-translate-y-[2px] tw:[&:hover]:border-accent">
        <div className="metric-card__header tw:justify-between tw:ui-row tw:gap-[.5rem] tw:text-secondary tw:mb-[.5rem]">
            <span className="metric-card__icon tw:flex tw:text-accent tw:opacity-80">{icon}</span>
            <span className="metric-card__label tw:text-[.75rem] tw:font-semibold tw:uppercase tw:tracking-[.025em]">{label}</span>
        </div>
        <div className="metric-card__value tw:text-[1.25rem] tw:font-bold tw:mb-[.25rem] tw:wrap-anywhere">{value}</div>
        <div className="metric-card__category tw:text-[.65rem] tw:text-muted tw:[background:rgba(255,255,255,.05)] tw:p-[.1rem_.4rem] tw:rounded-[4px] tw:inline-block">{category}</div>
        {children}
    </div>;
}
