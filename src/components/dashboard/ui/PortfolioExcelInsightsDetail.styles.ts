import { cn } from '../../../utils/cn';
const styles = {
    'portfolio-excel-insights': String.raw`
        tw:min-w-[0]
    `,
    'portfolio-excel-insights__source': String.raw`
        tw:inline-flex tw:items-center tw:gap-[.35rem] tw:text-muted tw:text-[length:.72rem] tw:max-w-[210px]
        tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap
    `,
    'portfolio-excel-insights__kpis': String.raw`
        tw:grid tw:grid-cols-[repeat(6,_minmax(0,_1fr))] tw:gap-[.65rem]
        tw:[@media(max-width:1000px)]:grid-cols-[repeat(4,_minmax(0,_1fr))]
        tw:[@media(max-width:680px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
    `,
    'portfolio-excel-insights__comparison-dates': String.raw`
        tw:m-[1rem_0_.25rem] tw:text-main tw:text-[length:.8rem]
    `,
    'portfolio-excel-insights__benchmark-kpis': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[.65rem] tw:m-[1rem_0]
        tw:[@media(max-width:680px)]:grid-cols-[1fr]
    `,
    'portfolio-excel-insights__mini-chart': String.raw`
        tw:[&_h3]:ui-row tw:[&_h3]:gap-[.4rem] tw:[&_h3]:m-[0_0_.35rem] tw:[&_h3]:text-[length:.95rem]
    `,
    'portfolio-excel-insights__control-column': String.raw`
        tw:[&_h3]:ui-row tw:[&_h3]:gap-[.4rem] tw:[&_h3]:m-[0_0_.35rem] tw:[&_h3]:text-[length:.95rem]
        tw:[&_>_p]:text-muted tw:[&_>_p]:text-[length:.78rem]
    `,
    'portfolio-excel-insights__chart-note': String.raw`
        tw:m-[.75rem_0_0] tw:text-muted tw:text-[length:.72rem] tw:[line-height:1.45]
        tw:[.portfolio-excel-insights\_\_history-line_&]:flex-[1]
        tw:[.portfolio-excel-insights\_\_history-line_&]:mb-[0]
    `,
    'portfolio-excel-insights__history-line': String.raw`
        tw:ui-row tw:gap-[.25rem] tw:mb-[.5rem]
    `,
    'portfolio-excel-insights__empty': String.raw`
        tw:min-h-[220px] tw:grid tw:place-items-center tw:text-muted tw:text-center
    `,
    'portfolio-excel-insights__allocation': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem] tw:[@media(max-width:680px)]:grid-cols-[1fr]
    `,
    'portfolio-excel-insights__controls': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem] tw:grid-cols-[repeat(3,_minmax(0,_1fr))]
        tw:[@media(max-width:1000px)]:grid-cols-[1fr_1fr] tw:[@media(max-width:680px)]:grid-cols-[1fr]
    `,
    'portfolio-excel-insights__stats': String.raw`
        tw:grid tw:grid-cols-[repeat(6,_minmax(0,_1fr))] tw:gap-[.5rem] tw:mt-[.85rem]
        tw:[@media(max-width:1000px)]:grid-cols-[repeat(3,_minmax(0,_1fr))]
        tw:[@media(max-width:680px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
    `,
    'portfolio-excel-insights__objective-row': String.raw`
        tw:ui-row tw:justify-between tw:gap-[.7rem] tw:p-[.55rem_0] tw:[border-top:1px_solid_var(--border-primary)]
        tw:text-secondary tw:text-[length:.75rem] tw:[&_b]:text-main tw:[&_b]:whitespace-nowrap tw:[&_span]:grid
        tw:[&_span]:gap-[.15rem] tw:[&_span]:min-w-[0] tw:[&_small]:text-muted tw:[&_small]:wrap-anywhere
    `,
    'portfolio-excel-insights__footnote': String.raw`
        tw:m-[.9rem_0_0] tw:text-muted tw:text-[length:.7rem]
    `,
    'portfolio-excel-insights__link-error': String.raw`
        tw:text-negative tw:text-[length:.8rem]
    `,
    'portfolio-excel-insights__blocks': String.raw`
        tw:col-span-full
    `,
    'portfolio-excel-insights__block-categories': String.raw`
        tw:mb-[20px] tw:[&_summary]:cursor-pointer tw:[&_summary]:mb-[12px] tw:[&_label]:grid tw:[&_label]:gap-[6px]
        tw:[&_label]:m-[12px_0] tw:[&_select]:w-full tw:[&_select]:min-w-[0] tw:[&_select]:max-w-full
        tw:[&_select]:p-[10px] tw:[&_select]:text-main tw:[&_select]:ui-fill-surface tw:[&_select]:ui-border-default
        tw:[&_select]:rounded-[8px]
    `,
} as const;
export function PortfolioExcelInsightsDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
