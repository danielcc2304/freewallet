import { cn } from '../../utils/cn';
const styles = {
    heatmap: String.raw`
        tw:w-full
    `,
    heatmap__container: String.raw`
        tw:flex tw:flex-wrap tw:gap-[4px] tw:min-h-[200px]
    `,
    heatmap__item: String.raw`
        tw:ui-stack tw:items-center tw:justify-center tw:gap-ui-xs tw:p-ui-md tw:rounded-control tw:cursor-pointer
        tw:[transition:all_var(--transition-fast)] tw:min-h-[100px] tw:text-center
        tw:[&:hover]:[transform:scale(1.02)] tw:[&:hover]:z-[1] tw:[&:hover]:[box-shadow:var(--shadow-md)]
        tw:[&:not(.heatmap\_\_item--child)_>_.heatmap\_\_item-symbol]:max-w-full
        tw:[&:not(.heatmap\_\_item--child)_>_.heatmap\_\_item-symbol]:overflow-hidden
        tw:[&:not(.heatmap\_\_item--child)_>_.heatmap\_\_item-symbol]:text-ellipsis
        tw:[&:not(.heatmap\_\_item--child)_>_.heatmap\_\_item-symbol]:whitespace-nowrap
        tw:[@media(max-width:640px)]:[&&]:min-h-[80px] tw:[@media(max-width:640px)]:[&&]:p-ui-sm
        tw:[@media(max-width:640px)]:[&&:not(.heatmap\_\_item--child)_>_.heatmap\_\_item-symbol]:whitespace-normal
        tw:[@media(max-width:640px)]:[&&:not(.heatmap\_\_item--child)_>_.heatmap\_\_item-symbol]:[display:-webkit-box]
        tw:[@media(max-width:640px)]:[&&:not(.heatmap\_\_item--child)_>_.heatmap\_\_item-symbol]:[-webkit-line-clamp:2]
        tw:[@media(max-width:640px)]:[&&:not(.heatmap\_\_item--child)_>_.heatmap\_\_item-symbol]:[-webkit-box-orient:vertical]
        tw:[&:focus-visible]:[outline:2px_solid_var(--text-primary)] tw:[&:focus-visible]:[outline-offset:2px]
    `,
    'heatmap__item--hovered': String.raw`
        tw:[&.heatmap\_\_item--hovered]:[transform:scale(1.02)]
        tw:[&.heatmap\_\_item--hovered]:[box-shadow:var(--shadow-md)]
    `,
    'heatmap__item--child': String.raw`
        tw:[&.heatmap\_\_item--child]:min-h-[60px] tw:[&.heatmap\_\_item--child]:min-w-[min(96px,_100%)]
        tw:[&.heatmap\_\_item--child]:max-w-full tw:[&.heatmap\_\_item--child]:p-ui-sm
        tw:[&_.heatmap\_\_item-symbol]:max-w-full tw:[&_.heatmap\_\_item-symbol]:overflow-hidden
        tw:[&_.heatmap\_\_item-symbol]:text-ellipsis tw:[&_.heatmap\_\_item-symbol]:whitespace-nowrap
        tw:[&_.heatmap\_\_item-symbol]:text-[length:var(--font-size-xs)]
        tw:[&_.heatmap\_\_item-symbol]:[line-height:1.25] tw:[&_.heatmap\_\_item-name]:text-[length:0.65rem]
        tw:[&_.heatmap\_\_item-symbol]:wrap-anywhere tw:[&_.heatmap\_\_item-symbol]:whitespace-normal
        tw:[&_.heatmap\_\_item-symbol]:[display:-webkit-box] tw:[&_.heatmap\_\_item-symbol]:[-webkit-line-clamp:2]
        tw:[&_.heatmap\_\_item-symbol]:[-webkit-box-orient:vertical]
        tw:[@media(max-width:640px)]:[&&_.heatmap\_\_item-name]:block
        tw:[@media(max-width:640px)]:[&&_.heatmap\_\_item-symbol]:whitespace-normal
        tw:[@media(max-width:640px)]:[&&_.heatmap\_\_item-symbol]:[display:-webkit-box]
        tw:[@media(max-width:640px)]:[&&_.heatmap\_\_item-symbol]:[-webkit-line-clamp:2]
        tw:[@media(max-width:640px)]:[&&_.heatmap\_\_item-symbol]:[-webkit-box-orient:vertical]
    `,
    'heatmap__item-symbol': String.raw`
        tw:text-[length:var(--font-size-lg)] tw:[font-weight:700]
        tw:[@media(max-width:640px)]:text-[length:var(--font-size-base)]
    `,
    'heatmap__item-name': String.raw`
        tw:text-[length:var(--font-size-xs)] tw:opacity-[0.8] tw:max-w-full tw:overflow-hidden tw:text-ellipsis
        tw:whitespace-nowrap tw:[@media(max-width:640px)]:[&&]:hidden
    `,
    'heatmap__item-change': String.raw`
        tw:text-[length:var(--font-size-sm)] tw:[font-weight:600]
    `,
    'heatmap__item-value': String.raw`
        tw:text-[length:var(--font-size-xs)] tw:opacity-[0.7]
    `,
    heatmap__group: String.raw`
        tw:ui-stack tw:gap-[2px] tw:min-w-[min(200px,_100%)] tw:max-w-full
    `,
    'heatmap__group-label': String.raw`
        tw:text-[length:var(--font-size-xs)] tw:[font-weight:700] tw:text-main tw:p-ui-xs tw:ui-fill-surface
        tw:ui-border tw:rounded-[var(--radius-sm)] tw:text-center tw:overflow-hidden tw:text-ellipsis
        tw:whitespace-normal tw:[display:-webkit-box] tw:[-webkit-line-clamp:2] tw:[-webkit-box-orient:vertical]
        tw:wrap-anywhere
    `,
    'heatmap__group-items': String.raw`
        tw:flex tw:flex-wrap tw:gap-[2px] tw:flex-[1] tw:min-w-[0]
    `,
    heatmap__legend: String.raw`
        tw:ui-row tw:justify-center tw:gap-ui-sm tw:mt-ui-md
    `,
    'heatmap__legend-label': String.raw`
        tw:text-[length:var(--font-size-xs)] tw:text-muted
    `,
    'heatmap__legend-gradient': String.raw`
        tw:w-[150px] tw:h-[8px] tw:rounded-[var(--radius-full)]
        tw:[background:linear-gradient(to_right,_#ef4444,_#f87171,_var(--bg-tertiary),_#4ade80,_#22c55e)]
    `,
} as const;
export function HeatmapDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
