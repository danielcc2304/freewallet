/** Presentation recipes shared by both rankings; valuation and ordering stay in Performers. */
export const performerStyles = {
    root: 'tw:h-full tw:min-w-0 tw:overflow-hidden',
    icon: 'tw:[transition:color_var(--transition-fast)]',
    list: 'tw:list-none tw:ui-stack tw:gap-ui-sm tw:min-w-0',
    item: 'tw:ui-row tw:gap-ui-md tw:p-ui-sm tw:rounded-control tw:ui-fill-muted tw:[transition:background_var(--transition-fast)] tw:w-full tw:min-w-0 tw:box-border tw:hover:[background:var(--bg-card-hover)] tw:max-[540px]:gap-[.6rem] tw:max-[540px]:p-[.6rem]',
    rank: 'tw:size-[24px] tw:ui-row tw:justify-center tw:rounded-[var(--radius-full)] tw:ui-fill-surface tw:text-[length:var(--font-size-sm)] tw:font-semibold tw:text-muted',
    info: 'tw:flex-1 tw:ui-stack tw:min-w-0',
    symbol: 'tw:font-semibold tw:text-main tw:min-w-0 tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap',
    name: 'tw:text-[length:var(--font-size-xs)] tw:text-muted tw:whitespace-nowrap tw:overflow-hidden tw:text-ellipsis',
    data: 'tw:ui-stack tw:items-end tw:min-w-0 tw:max-w-[42%] tw:max-[540px]:max-w-[45%]',
    change: 'tw:font-semibold tw:text-[length:var(--font-size-sm)] tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:max-[540px]:text-[.78rem]',
    value: 'tw:text-[length:var(--font-size-xs)] tw:text-muted tw:max-w-full tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap',
    empty: 'tw:text-center tw:text-muted tw:p-ui-lg',
} as const;
