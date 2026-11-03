import { cn } from '../../../utils/cn';
const styles = {
    'market-timing-game': String.raw`
        tw:max-w-[1000px] tw:m-[0_auto] tw:pb-[3rem] tw:min-w-[0] tw:[&_.positive]:text-positive
        tw:[&_.positive_b]:text-positive tw:[&_.negative]:text-negative tw:[&_.negative_b]:text-negative
        tw:[&_:is(a,_button,_summary):focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_:is(a,_button,_summary):focus-visible]:[outline-offset:3px]
    `,
    'market-timing-game__header': String.raw`
        tw:mb-[1.25rem] tw:[&_h1]:text-[length:clamp(1.55rem,_3vw,_2.35rem)] tw:[&_p]:text-secondary
        tw:[&_p]:[line-height:1.6]
    `,
    'timing-board': String.raw`
        tw:min-w-[0] tw:p-[1.5rem] tw:ui-fill-surface tw:ui-border-strong tw:rounded-[18px]
        tw:[box-shadow:var(--shadow-md)] tw:[scroll-margin-top:1rem] tw:[@media(max-width:700px)]:p-[1rem]
    `,
    'timing-round-header': String.raw`
        tw:ui-row tw:justify-between tw:gap-[.75rem] tw:text-[length:.9rem] tw:text-secondary
    `,
    'timing-clock': String.raw`
        tw:[font-variant-numeric:tabular-nums] tw:text-main tw:[font-weight:700] tw:whitespace-nowrap
    `,
    'timing-progress': String.raw`
        tw:block tw:[appearance:none] tw:w-full tw:h-[4px] tw:m-[.75rem_0_1rem] tw:[border:0] tw:rounded-[4px]
        tw:overflow-hidden tw:ui-fill-muted tw:[accent-color:var(--accent-primary)]
        tw:[&::-webkit-progress-bar]:ui-fill-muted tw:[&::-webkit-progress-value]:[background:var(--accent-primary)]
        tw:[&::-moz-progress-bar]:[background:var(--accent-primary)]
    `,
    'timing-stats': String.raw`
        tw:[&_strong]:[font-variant-numeric:tabular-nums]
        tw:[@media(max-width:700px)]:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:[@media(max-width:700px)]:gap-[.5rem]
        tw:[@media(max-width:700px)]:mb-[1rem] tw:[@media(max-width:700px)]:[&_>_div]:p-[.6rem]
    `,
    'timing-chart': String.raw`
        tw:w-full tw:min-w-[0] tw:h-[280px] tw:[@media(max-width:700px)]:h-[220px]
    `,
    'timing-chart-note': String.raw`
        tw:m-[.4rem_0_.8rem] tw:text-[length:.7rem] tw:text-muted
    `,
    'timing-controls': String.raw`
        tw:pt-[.9rem] tw:[border-top:1px_solid_var(--border-primary)]
    `,
    'timing-trade-buttons': String.raw`
        tw:grid tw:grid-cols-[1fr_1fr_auto] tw:gap-[.65rem] tw:[&_.btn]:min-h-[44px]
        tw:[@media(max-width:700px)]:grid-cols-[1fr_1fr] tw:[@media(max-width:700px)]:gap-[.5rem]
        tw:[@media(max-width:700px)]:[&_.btn:last-child]:col-span-full
        tw:[@media(max-width:700px)]:[&_.btn:last-child]:min-h-[44px]
        tw:[@media(max-width:700px)]:[&_.btn:last-child]:p-[.35rem] tw:[@media(max-width:700px)]:[&_.btn]:pl-[.65rem]
        tw:[@media(max-width:700px)]:[&_.btn]:pr-[.65rem] tw:[@media(max-width:700px)]:[&_.btn]:text-[length:.8rem]
    `,
    btn: String.raw``,
    'timing-sell': String.raw`
        tw:[&:not(:disabled)]:text-main tw:[&:not(:disabled)]:[border-color:rgba(245,_158,_11,_.5)]
    `,
    'timing-order-status': String.raw`
        tw:min-h-[1.5em] tw:m-[.7rem_0_.15rem] tw:text-[length:.8rem] tw:text-secondary
    `,
    'timing-shortcuts': String.raw`
        tw:text-muted tw:text-[length:.7rem] tw:[@media(max-width:700px)]:hidden
    `,
    'timing-results': String.raw`
        tw:p-[1.4rem] tw:mt-[1rem] tw:ui-fill-surface tw:ui-border-strong tw:rounded-[16px] tw:[&_h2]:m-[0_0_.6rem]
        tw:[&_h2]:text-[length:1.4rem] tw:[&_h2]:text-main tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.6]
        tw:[@media(max-width:700px)]:p-[1rem]
    `,
    'timing-round-list': String.raw`
        tw:grid tw:gap-[.6rem] tw:m-[1rem_0]
    `,
    'timing-result-costs': String.raw`
        tw:text-[length:.75rem]
    `,
    positive: String.raw``,
    negative: String.raw``,
    'timing-rules': String.raw``,
} as const;
export function MarketTimingGameDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
