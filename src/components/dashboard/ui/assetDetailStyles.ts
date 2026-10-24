import { cn } from '../../../utils/cn';

// Styles belong to the structured components; theme hooks remain stable.
const styles = {
    "asset-detail__header": String.raw`
    tw:flex tw:justify-between tw:items-start tw:gap-[1rem] tw:min-w-[0] tw:w-full tw:box-border tw:overflow-hidden
    tw:pb-[1.5rem] tw:[border-bottom:1px_solid_var(--border-color)] tw:[@media(max-width:768px)]:flex-col
    tw:[@media(max-width:768px)]:gap-[1rem]
`,
    "asset-detail__title-group": String.raw`tw:min-w-[0] tw:flex-[1_1_0] tw:overflow-visible tw:[@media(max-width:768px)]:flex-[0_0_auto]`,
    "asset-detail__symbol": String.raw`tw:text-[length:2rem] tw:[font-weight:800] tw:[line-height:1] tw:mb-[0.25rem] tw:text-accent`,
    "asset-detail__name": String.raw`tw:text-[length:1rem] tw:text-secondary tw:wrap-anywhere`,
    "asset-detail__price-group": String.raw`
    tw:min-w-[0] tw:text-right tw:flex-[0_0_min(42%,_14rem)] tw:w-[min(42%,_14rem)] tw:max-w-[42%] tw:overflow-hidden
    tw:[@media(max-width:768px)]:flex-[0_0_auto] tw:[@media(max-width:768px)]:text-left
    tw:[@media(max-width:768px)]:max-w-full tw:[@media(max-width:768px)]:w-full
`,
    "asset-detail__price": String.raw`tw:text-[length:1.75rem] tw:[font-weight:700] tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap`,
    "asset-detail__change": String.raw`
    tw:ui-row tw:justify-end tw:gap-[0.25rem] tw:text-[length:0.875rem] tw:[font-weight:600] tw:min-w-[0]
    tw:overflow-hidden tw:whitespace-nowrap tw:text-ellipsis tw:[&.positive]:text-positive tw:[&.negative]:text-negative
    tw:[@media(max-width:768px)]:justify-start
`,
    "asset-detail__period-performance": String.raw`
    tw:flex tw:items-baseline tw:flex-wrap tw:gap-[0.35rem_0.65rem] tw:m-[-0.35rem_0_0.8rem] tw:text-muted
    tw:text-[length:0.75rem] tw:[&_strong]:text-[length:1rem] tw:[&_strong.positive]:text-positive
    tw:[&_strong.negative]:text-negative tw:[&_small]:text-muted
`,
    "asset-detail__chart-legend": String.raw`
    tw:ui-row tw:justify-between tw:gap-[1rem] tw:mt-[0.7rem] tw:text-secondary tw:text-[length:0.75rem]
    tw:[&_span:first-child]:inline-flex tw:[&_span:first-child]:items-center tw:[&_span:first-child]:gap-[0.4rem]
    tw:[&_span:first-child]:[font-weight:600] tw:[@media(max-width:768px)]:items-start
    tw:[@media(max-width:768px)]:flex-col
`,
    "asset-detail__legend-line": String.raw`tw:w-[22px] tw:h-[3px] tw:rounded-[99px] tw:[background:var(--accent-primary)]`,
    "asset-detail__chart-axis-hint": String.raw`tw:text-muted`,
    "asset-detail__company": String.raw`
    tw:min-w-[0] tw:p-[1.25rem] tw:ui-border-default tw:rounded-[12px] tw:[background:rgba(255,_255,_255,_0.02)]
    tw:[&_.section-title]:m-[0_0_.75rem] tw:[&_p]:m-[0] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.6]
    tw:[&_p]:wrap-anywhere tw:[&_a]:inline-block tw:[&_a]:mt-[.6rem] tw:[&_a]:text-muted tw:[&_a]:text-[length:.75rem]
    tw:[&_a:hover]:text-accent
`,
    "asset-detail__footer": String.raw`
    tw:ui-row tw:gap-[0.5rem] tw:text-muted tw:text-[length:0.75rem] tw:mt-[0.5rem] tw:pt-[1rem]
    tw:[border-top:1px_solid_var(--border-color)]
`
} as const;

export function assetDetailClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
