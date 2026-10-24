import { cn } from '../../../utils/cn';

// Styles belong to the structured components; theme hooks remain stable.
const styles = {
    "assets-table__asset": String.raw`tw:ui-stack tw:min-w-[0]`,
    "assets-table__identifiers": String.raw`
    tw:flex tw:flex-wrap tw:gap-[0_var(--spacing-xs)] tw:min-w-[0] tw:[@media(max-width:640px)]:flex-col
    tw:[@media(max-width:640px)]:gap-[0]
`,
    "assets-table__name": String.raw`
    tw:order-[1] tw:[font-weight:600] tw:text-main tw:[line-height:1.35] tw:[@media(max-width:640px)]:overflow-hidden
    tw:[@media(max-width:640px)]:text-ellipsis tw:[@media(max-width:640px)]:whitespace-nowrap
`,
    "assets-table__symbol": String.raw`
    tw:text-[length:var(--font-size-xs)] tw:text-muted tw:[@media(max-width:640px)]:max-w-full
    tw:[@media(max-width:640px)]:overflow-hidden tw:[@media(max-width:640px)]:text-ellipsis
    tw:[@media(max-width:640px)]:whitespace-nowrap
`,
    "assets-table__isin": String.raw`
    tw:text-[length:var(--font-size-xs)] tw:text-muted tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap
    tw:[@media(max-width:640px)]:max-w-full tw:[@media(max-width:640px)]:overflow-hidden
    tw:[@media(max-width:640px)]:text-ellipsis tw:[@media(max-width:640px)]:whitespace-nowrap
`,
    "assets-table__open": String.raw`
    tw:[border:0] tw:ui-fill-transparent tw:[&&]:[color:inherit] tw:[font-family:inherit] tw:[font-size:inherit]
    tw:[font-weight:inherit] tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit]
    tw:[line-height:inherit] tw:cursor-pointer tw:text-left tw:p-[0] tw:min-h-[44px]
    tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&:focus-visible]:[outline-offset:3px]
    tw:[&:focus-visible]:rounded-[4px]
`,
    "assets-table__sort": String.raw`
    tw:[border:0] tw:ui-fill-transparent tw:[&&]:[color:inherit] tw:[font-family:inherit] tw:[font-size:inherit]
    tw:[font-weight:inherit] tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit]
    tw:[line-height:inherit] tw:cursor-pointer tw:text-left tw:inline-flex tw:items-center tw:gap-[.35rem]
    tw:min-h-[44px] tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)]
    tw:[&:focus-visible]:[outline-offset:3px] tw:[&:focus-visible]:rounded-[4px]
`,
    "assets-table__lots-toggle": String.raw`
    tw:inline-flex tw:items-center tw:gap-[.3rem] tw:p-[.25rem_0] tw:min-h-[32px] tw:[border:0] tw:[background:none]
    tw:text-secondary tw:[font-family:inherit] tw:[font-size:inherit] tw:[font-weight:inherit] tw:[font-style:inherit]
    tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit] tw:text-[length:var(--font-size-xs)]
    tw:cursor-pointer tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)]
    tw:[&:focus-visible]:[outline-offset:3px]
`,
    "assets-table__today": String.raw`
    tw:ui-stack tw:items-end tw:gap-[2px] tw:[&_small]:text-muted tw:[@media(max-width:640px)]:ui-stack
    tw:[@media(max-width:640px)]:items-end tw:[@media(max-width:640px)]:gap-[2px]
    tw:[@media(max-width:640px)]:[line-height:1.2]
    tw:[@media(max-width:640px)]:[&_strong]:text-[length:var(--font-size-xs)]
    tw:[@media(max-width:640px)]:[&_strong]:[font-weight:700] tw:[@media(max-width:640px)]:[&_small]:text-muted
    tw:[@media(max-width:640px)]:[&_small]:text-[length:.64rem]
`,
    "assets-table__variation-date": String.raw`tw:text-[length:.7rem]`,
    "assets-table__gain": String.raw`tw:ui-stack tw:[@media(max-width:640px)]:items-end`,
    "assets-table__change": String.raw`tw:[font-weight:600]`,
    "assets-table__change--positive": String.raw`tw:[&.assets-table\_\_change--positive]:text-positive`,
    "assets-table__change--negative": String.raw`tw:[&.assets-table\_\_change--negative]:text-negative`,
    "assets-table__gain-value": String.raw`tw:text-[length:var(--font-size-xs)] tw:text-muted tw:[@media(max-width:640px)]:whitespace-nowrap`,
    "assets-table__weight": String.raw`tw:ui-row tw:gap-ui-sm`,
    "assets-table__weight-bar": String.raw`tw:w-[60px] tw:h-[6px] tw:ui-fill-muted tw:rounded-[var(--radius-full)] tw:overflow-hidden`,
    "assets-table__weight-fill": String.raw`
    tw:h-full tw:[background:linear-gradient(90deg,_var(--accent-primary),_var(--accent-secondary))]
    tw:rounded-[var(--radius-full)] tw:[transition:width_var(--transition-base)]
`,
    "assets-table__mobile-details": String.raw`
    tw:[@media(max-width:640px)]:flex tw:[@media(max-width:640px)]:flex-wrap tw:[@media(max-width:640px)]:items-baseline
    tw:[@media(max-width:640px)]:gap-x-ui-md tw:[@media(max-width:640px)]:gap-y-[2px]
    tw:[@media(max-width:640px)]:mt-ui-xs tw:[@media(max-width:640px)]:p-[var(--spacing-xs)_var(--spacing-sm)]
    tw:[@media(max-width:640px)]:ui-fill-muted tw:[@media(max-width:640px)]:rounded-[var(--radius-sm)]
    tw:[@media(max-width:640px)]:[&_>_div]:inline-flex tw:[@media(max-width:640px)]:[&_>_div]:items-baseline
    tw:[@media(max-width:640px)]:[&_>_div]:gap-[4px] tw:[@media(max-width:640px)]:[&_>_div]:min-w-[0]
    tw:[@media(max-width:640px)]:[&_span]:text-muted tw:[@media(max-width:640px)]:[&_span]:text-[length:.65rem]
    tw:[@media(max-width:640px)]:[&_span]:whitespace-nowrap tw:[@media(max-width:640px)]:[&_strong]:overflow-hidden
    tw:[@media(max-width:640px)]:[&_strong]:text-main
    tw:[@media(max-width:640px)]:[&_strong]:text-[length:var(--font-size-xs)]
    tw:[@media(max-width:640px)]:[&_strong]:text-ellipsis tw:[@media(max-width:640px)]:[&_strong]:whitespace-nowrap
`
} as const;

export function assetTableClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
