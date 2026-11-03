import { cn } from '../../utils/cn';

// Styles belong to the structured components; theme hooks remain stable.
const styles = {
    "search-results__item": String.raw`
    tw:grid tw:grid-cols-[minmax(0,_1fr)_auto] tw:items-center tw:gap-ui-md tw:p-[0.75rem] tw:rounded-[var(--radius-sm)]
    tw:cursor-pointer tw:[transition:background_var(--transition-fast)] tw:[&:hover]:ui-fill-muted
`,
    "search-results__item--active": String.raw`tw:[&.search-results\_\_item--active]:ui-fill-muted`,
    "search-results__identity": String.raw`tw:grid tw:gap-[0.15rem] tw:min-w-[0]`,
    "search-results__symbol": String.raw`tw:[font-weight:600] tw:text-accent`,
    "search-results__name": String.raw`tw:text-secondary tw:whitespace-nowrap tw:overflow-hidden tw:text-ellipsis`,
    "search-results__type": String.raw`
    tw:text-[length:var(--font-size-xs)] tw:text-muted tw:[text-transform:uppercase] tw:p-[0.25rem_0.5rem]
    tw:rounded-[999px] tw:ui-fill-panel
`,
    "selected-asset": String.raw`
    tw:ui-row tw:gap-ui-sm tw:p-[var(--spacing-sm)_var(--spacing-md)] tw:[background:var(--color-positive-bg)]
    tw:rounded-control tw:mt-ui-sm tw:[border:1px_solid_color-mix(in_srgb,_var(--color-positive)_28%,_transparent)]
    tw:text-positive
`,
    "selected-asset__content": String.raw`
    tw:grid tw:gap-[0.1rem] tw:min-w-[0]
    tw:[border:1px_solid_color-mix(in_srgb,_var(--color-positive)_28%,_transparent)] tw:text-positive
`,
    "selected-asset__symbol": String.raw`tw:[font-weight:600] tw:text-positive`,
    "selected-asset__name": String.raw`tw:text-secondary tw:text-[length:var(--font-size-sm)] tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap`,
    "selected-asset__type": String.raw`
    tw:ml-[auto] tw:p-[0.25rem_0.55rem] tw:rounded-[999px]
    tw:[background:color-mix(in_srgb,_var(--color-positive)_14%,_transparent)] tw:text-positive
    tw:text-[length:var(--font-size-xs)] tw:[font-weight:700] tw:whitespace-nowrap
`,
    "current-price-banner": String.raw`
    tw:ui-row tw:justify-between tw:p-ui-md
    tw:[background:linear-gradient(135deg,_rgba(34,_197,_94,_0.1),_rgba(22,_163,_74,_0.1))]
    tw:[border:1px_solid_rgba(34,_197,_94,_0.3)] tw:rounded-control tw:mt-ui-sm
`,
    "current-price-banner__label": String.raw`tw:text-[length:var(--font-size-sm)] tw:[font-weight:500] tw:text-secondary`,
    "current-price-banner__value": String.raw`tw:inline-flex tw:items-center tw:gap-[0.45rem] tw:text-[length:var(--font-size-lg)] tw:[font-weight:600] tw:text-positive`,
    "quote-warning": String.raw`
    tw:ui-row tw:gap-[0.55rem] tw:p-[0.75rem_0.9rem] tw:rounded-control
    tw:[border:1px_solid_color-mix(in_srgb,_var(--color-warning)_40%,_transparent)]
    tw:[background:color-mix(in_srgb,_var(--color-warning)_9%,_transparent)] tw:text-secondary
    tw:text-[length:var(--font-size-sm)] tw:[&_svg]:flex-[0_0_auto] tw:[&_svg]:[color:var(--color-warning)]
`,
    "no-results": String.raw`
    tw:flex tw:items-start tw:gap-ui-md tw:p-ui-md tw:ui-fill-surface tw:[border:1px_solid_var(--color-warning)]
    tw:rounded-control tw:mt-ui-xs tw:[&>svg]:[color:var(--color-warning)] tw:[&>svg]:shrink-[0] tw:[&>svg]:mt-[2px]
    tw:[@media(max-width:768px)]:flex-col tw:[@media(max-width:768px)]:text-center
    tw:[@media(max-width:768px)]:[&>svg]:m-[0_auto]
`,
    "no-results__text": String.raw`
    tw:flex-[1] tw:[&_p]:m-[0] tw:[&_p]:[font-weight:500] tw:[&_p]:text-main
    tw:[&_span]:text-[length:var(--font-size-sm)] tw:[&_span]:text-muted
`,
    "manual-mode-badge": String.raw`
    tw:ui-row tw:gap-ui-sm tw:p-[var(--spacing-sm)_var(--spacing-md)]
    tw:[background:linear-gradient(135deg,_rgba(139,_92,_246,_0.1),_rgba(59,_130,_246,_0.1))]
    tw:[border:1px_solid_rgba(139,_92,_246,_0.3)] tw:rounded-control tw:mt-ui-sm tw:[color:var(--accent-tertiary)]
    tw:text-[length:var(--font-size-sm)] tw:[font-weight:500]
`,
    "form-actions": String.raw`
    tw:flex tw:gap-ui-md tw:justify-end tw:pt-ui-md tw:[border-top:1px_solid_var(--border-primary)]
    tw:[@media(max-width:768px)]:flex-col-reverse tw:[@media(max-width:768px)]:[&_button]:w-full
`,
    "operation-total": String.raw`
    tw:ui-row tw:justify-between tw:gap-[1rem] tw:p-[0.85rem_1rem] tw:mt-[-0.45rem] tw:rounded-control tw:ui-fill-muted
    tw:ui-border tw:text-[length:var(--font-size-sm)] tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap
    tw:[&_strong]:text-main tw:[&_strong]:text-[length:var(--font-size-base)] tw:[&_strong]:whitespace-nowrap
    tw:[@media(max-width:768px)]:items-start tw:[@media(max-width:768px)]:flex-col
`
} as const;

export function investmentClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
