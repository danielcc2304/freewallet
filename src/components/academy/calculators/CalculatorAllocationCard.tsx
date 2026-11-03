interface CalculatorAllocationCardProps {
    title: string;
    items: readonly { label: string; value: number }[];
    formatValue: (value: number) => string;
    maxItems?: number;
}

/** Percentage allocation with formatted labels and a bounded visual track. */
export function CalculatorAllocationCard({ title, items, formatValue, maxItems = 8 }: CalculatorAllocationCardProps) {
    return <article className="fund-info__breakdown-card tw:min-w-0 tw:p-ui-lg tw:ui-fill-muted tw:ui-border tw:rounded-control">
        <h3 className="tw:m-[0_0_var(--spacing-lg)] tw:text-[length:var(--font-size-base)]">{title}</h3>
        <div className="fund-info__breakdown-list tw:ui-stack tw:gap-ui-md">
            {items.slice(0, maxItems).map(item => <div className="fund-info__breakdown-item" key={item.label}>
                <div className="fund-info__breakdown-label tw:flex tw:justify-between tw:gap-ui-md tw:text-secondary tw:text-[length:var(--font-size-sm)]">
                    <span className="tw:wrap-anywhere">{item.label}</span><strong className="tw:shrink-0 tw:text-main">{formatValue(item.value)}</strong>
                </div>
                <div className="fund-info__breakdown-track tw:h-[6px] tw:mt-ui-xs tw:overflow-hidden tw:ui-fill-surface tw:rounded-[var(--radius-full)]" aria-hidden="true">
                    <span className="tw:block tw:h-full tw:[background:linear-gradient(90deg,var(--accent-primary),var(--accent-secondary))] tw:rounded-[inherit]" style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }} />
                </div>
            </div>)}
        </div>
    </article>;
}
