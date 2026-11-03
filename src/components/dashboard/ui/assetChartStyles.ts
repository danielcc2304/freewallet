import { cn } from '../../../utils/cn';

const styles = {
    'asset-detail__chart-section': String.raw`
        tw:[background:rgba(255,_255,_255,_0.02)] tw:rounded-[12px] tw:p-[1.25rem] tw:ui-border-default tw:min-w-[0]
        tw:w-full tw:box-border tw:max-w-full tw:overflow-hidden tw:[@media(max-width:768px)]:p-[0.85rem]
    `,
    'asset-detail__chart-header': String.raw`
        tw:ui-row tw:justify-between tw:flex-wrap tw:gap-[0.75rem] tw:min-w-[0] tw:mb-[1rem]
    `,
    'asset-detail__chart-title': String.raw`
        tw:ui-row tw:gap-[0.5rem] tw:[font-weight:600] tw:text-secondary tw:min-w-[0]
    `,
    'asset-detail__chart-container': String.raw`
        tw:relative tw:isolate tw:overflow-hidden tw:h-[240px] tw:min-w-[0] tw:w-full tw:[user-select:none]
        tw:[touch-action:pan-y] tw:[cursor:crosshair] tw:[&_.recharts-wrapper]:[touch-action:pan-y]
        tw:[&_.recharts-surface]:[touch-action:pan-y] tw:[@media(max-width:768px)]:w-[calc(100%_+_0.9rem)]
        tw:[@media(max-width:768px)]:ml-[-0.45rem]
    `,
    'chart-overlay': String.raw`
        tw:absolute tw:inset-[0] tw:ui-fill-muted tw:[backdrop-filter:blur(2px)] tw:ui-row tw:justify-center
        tw:z-[10] tw:rounded-[8px] tw:[&_>_span]:text-muted tw:[&_>_span]:text-[length:0.8rem]
        tw:[&.error-state]:flex-col tw:[&.error-state]:gap-[0.5rem] tw:[&.error-state]:text-muted
        tw:[&.error-state]:text-center tw:[&.error-state]:p-[1rem] tw:[&.error-state]:box-border
        tw:[&.error-state]:cursor-default tw:[&.error-state_.btn]:min-h-[44px] tw:[&.error-state_.btn]:mt-[.5rem]
        tw:[&.error-state_p]:[font-weight:600] tw:[&.error-state_p]:text-secondary
    `,
    'asset-detail__chart-selection': String.raw`
        tw:ui-row tw:flex-wrap tw:gap-[0.45rem_0.75rem] tw:min-h-[2.25rem] tw:mt-[0.65rem] tw:p-[0.55rem_0.7rem]
        tw:ui-border-default tw:rounded-[8px] tw:[background:rgba(255,_255,_255,_0.025)] tw:text-muted
        tw:text-[length:0.75rem] tw:[&_strong]:text-main tw:[&_strong]:text-[length:0.82rem]
        tw:[&.positive]:[border-color:rgba(34,_197,_94,_0.45)] tw:[&.positive_strong]:text-positive
        tw:[&.negative]:[border-color:rgba(239,_68,_68,_0.45)] tw:[&.negative_strong]:text-negative
        tw:[&_button]:ml-[auto] tw:[&_button]:p-[0.2rem_0.45rem] tw:[&_button]:ui-border-default
        tw:[&_button]:rounded-[5px] tw:[&_button]:ui-fill-transparent tw:[&_button]:text-secondary
        tw:[&_button]:text-[length:0.7rem] tw:[&_button]:cursor-pointer tw:[&_button:hover]:text-main
        tw:[&_button:hover]:[border-color:var(--accent-primary)] tw:[@media(max-width:768px)]:[&_button]:ml-[0]
    `,
    'asset-detail__chart-source': String.raw`
        tw:m-[0.55rem_0_0] tw:text-muted tw:text-[length:0.7rem] tw:[line-height:1.45]
    `,
    'asset-detail__fund-sections': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem] tw:min-w-[0] tw:[&_section]:min-w-[0]
        tw:[&_section]:p-[1rem] tw:[&_section]:ui-border-default tw:[&_section]:rounded-[12px]
        tw:[&_section]:[background:rgba(255,255,255,.02)] tw:[&_h3]:m-[0_0_.75rem] tw:[&_h3]:text-[length:.95rem]
        tw:[&_p]:m-[0] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.55] tw:[&_p]:wrap-anywhere
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    'asset-detail__holding-list': String.raw`
        tw:grid tw:gap-[.55rem] tw:[&_>_div]:flex tw:[&_>_div]:justify-between tw:[&_>_div]:gap-[.75rem]
        tw:[&_>_div]:text-secondary tw:[&_>_div]:text-[length:.8rem] tw:[&_span]:min-w-[0] tw:[&_span]:wrap-anywhere
        tw:[&_strong]:text-main tw:[&_strong]:whitespace-nowrap
    `,
} as const;
export function assetChartStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
