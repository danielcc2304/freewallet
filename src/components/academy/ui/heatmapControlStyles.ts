import { cn } from '../../../utils/cn';

// Styles belong to the structured components; theme hooks remain stable.
const styles = {
    "market-heatmap__tabs": String.raw`
    tw:inline-flex tw:flex-wrap tw:max-w-full tw:p-[3px] tw:ui-border tw:rounded-[11px] tw:ui-fill-canvas
    tw:[@media(max-width:820px)]:grid tw:[@media(max-width:820px)]:grid-cols-[repeat(2,_1fr)]
    tw:[@media(max-width:820px)]:w-full
`,
    "market-heatmap__tab": String.raw`
    tw:[border:0] tw:[font-family:inherit] tw:[font-size:inherit] tw:[font-weight:inherit] tw:[font-style:inherit]
    tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit] tw:cursor-pointer
    tw:[transition:color_var(--transition-fast),_background_var(--transition-fast),_border-color_var(--transition-fast),_transform_var(--transition-fast)]
    tw:p-[0.62rem_0.9rem] tw:rounded-[8px] tw:text-secondary tw:ui-fill-transparent tw:text-[length:var(--font-size-sm)]
    tw:[font-weight:600] tw:whitespace-nowrap tw:[&:hover]:text-main tw:[&:focus-visible]:text-main
    tw:[@media(max-width:820px)]:[padding-inline:0.55rem] tw:[@media(max-width:820px)]:whitespace-normal
`,
    "market-heatmap__tab--active": String.raw`
    tw:[&.market-heatmap\_\_tab--active]:text-main tw:[&.market-heatmap\_\_tab--active]:ui-fill-muted
    tw:[&.market-heatmap\_\_tab--active]:[box-shadow:var(--shadow-sm)]
`,
    "market-heatmap__display-options": String.raw`tw:inline-flex tw:p-[3px] tw:ui-border tw:rounded-[11px] tw:ui-fill-canvas tw:[@media(max-width:820px)]:w-full`,
    "market-heatmap__display-option": String.raw`
    tw:[border:0] tw:[font-family:inherit] tw:[font-size:inherit] tw:[font-weight:inherit] tw:[font-style:inherit]
    tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit] tw:cursor-pointer
    tw:[transition:color_var(--transition-fast),_background_var(--transition-fast),_border-color_var(--transition-fast),_transform_var(--transition-fast)]
    tw:min-w-[3.4rem] tw:p-[0.62rem_0.75rem] tw:rounded-[8px] tw:text-secondary tw:ui-fill-transparent
    tw:text-[length:var(--font-size-sm)] tw:[font-weight:600] tw:[&:hover]:text-main tw:[&:focus-visible]:text-main
    tw:[@media(max-width:820px)]:flex-[1]
`,
    "market-heatmap__display-option--active": String.raw`
    tw:[&.market-heatmap\_\_display-option--active]:text-main
    tw:[&.market-heatmap\_\_display-option--active]:ui-fill-muted
    tw:[&.market-heatmap\_\_display-option--active]:[box-shadow:var(--shadow-sm)]
`,
    "market-heatmap__index-intro": String.raw`
    tw:ui-row tw:justify-between tw:gap-[1rem] tw:items-start tw:pb-[1rem]
    tw:[border-bottom:1px_solid_var(--border-primary)] tw:[&_h2]:m-[0_0_0.25rem]
    tw:[&_h2]:text-[length:clamp(1.3rem,_2vw,_1.7rem)] tw:[&_p]:m-[0] tw:[&_p]:text-secondary
    tw:[&_p]:text-[length:var(--font-size-sm)] tw:[&_>_span]:flex-[0_0_auto] tw:[&_>_span]:p-[0.35rem_0.6rem]
    tw:[&_>_span]:rounded-[var(--radius-full)] tw:[&_>_span]:text-muted tw:[&_>_span]:ui-fill-muted
    tw:[&_>_span]:text-[length:var(--font-size-xs)] tw:[&_>_span]:[font-weight:600] tw:[@media(max-width:520px)]:grid
    tw:[@media(max-width:520px)]:[&_>_span]:[justify-self:start]
`,
    "market-heatmap__legend": String.raw`tw:ui-row tw:justify-center tw:gap-[0.65rem] tw:m-[0.75rem_0_1rem] tw:text-muted tw:text-[length:0.7rem]`,
    "market-heatmap__legend-scale": String.raw`
    tw:w-[min(240px,_42vw)] tw:h-[8px] tw:rounded-[var(--radius-full)]
    tw:[background:linear-gradient(90deg,_hsl(0_69%_26%),_hsl(0_69%_34%),_#374151_50%,_hsl(153_70%_30%),_hsl(153_70%_22%))]
`,
    "market-heatmap__selected-company": String.raw`
    tw:grid tw:grid-cols-[auto_minmax(0,_1fr)_auto] tw:items-baseline tw:gap-[0.1rem_0.65rem] tw:min-w-[0]
    tw:[&_>_span]:col-span-full tw:[&_>_span]:text-muted tw:[&_>_span]:text-[length:0.65rem]
    tw:[&_>_span]:[font-weight:700] tw:[&_>_span]:[letter-spacing:0.07em] tw:[&_>_span]:[text-transform:uppercase]
    tw:[&_strong]:overflow-hidden tw:[&_strong]:text-ellipsis tw:[&_strong]:whitespace-nowrap tw:[&_small]:text-muted
    tw:[&_b]:col-[3] tw:[&_b]:row-[2_/_span_2] tw:[&_b]:self-center tw:[&_b]:text-[length:var(--font-size-lg)]
    tw:[@media(max-width:520px)]:grid-cols-[minmax(0,_1fr)_auto] tw:[@media(max-width:520px)]:[&_small]:col-span-full
    tw:[@media(max-width:520px)]:[&_b]:col-[2] tw:[@media(max-width:520px)]:[&_b]:row-[2]
`,
    "market-heatmap__sector-item": String.raw`
    tw:grid tw:grid-cols-[minmax(0,_1fr)_auto] tw:gap-[0.2rem_0.65rem] tw:min-w-[0] tw:p-[0.65rem_0.75rem]
    tw:[border-left:2px_solid_var(--accent-primary)] tw:ui-fill-muted tw:[&_strong]:overflow-hidden
    tw:[&_strong]:text-ellipsis tw:[&_>_span]:overflow-hidden tw:[&_>_span]:text-ellipsis tw:[&_strong]:text-main
    tw:[&_strong]:text-[length:var(--font-size-xs)] tw:[&_strong]:[line-height:1.25] tw:[&_>_span]:whitespace-nowrap
    tw:[&_>_span]:text-secondary tw:[&_>_span]:text-[length:var(--font-size-xs)] tw:[&_>_span]:[font-weight:700]
    tw:[&_small]:col-span-full tw:[&_small]:text-muted tw:[&_small]:text-[length:0.68rem]
    tw:[&_small_b]:[font-weight:700]
`
} as const;

export function heatmapControlClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
