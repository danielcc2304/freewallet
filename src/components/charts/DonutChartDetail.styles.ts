import { cn } from '../../utils/cn';
const styles = {
    'donut-chart': String.raw`
        tw:w-full tw:min-w-[0] tw:overflow-visible
    `,
    'donut-chart__title': String.raw`
        tw:text-[length:var(--font-size-base)] tw:[font-weight:600] tw:text-main tw:text-center tw:mb-ui-md
    `,
    'donut-chart__plot': String.raw`
        tw:w-full tw:h-[220px] tw:min-w-[0] tw:overflow-visible tw:[@media(max-width:640px)]:[&&]:h-[210px]
    `,
    'donut-tooltip': String.raw`
        tw:ui-fill-surface tw:ui-border-strong tw:rounded-control tw:p-[var(--spacing-sm)_var(--spacing-md)]
        tw:[box-shadow:var(--shadow-md)] tw:text-center
    `,
    'donut-tooltip__name': String.raw`
        tw:text-[length:var(--font-size-sm)] tw:[font-weight:600] tw:text-main tw:mb-ui-xs
    `,
    'donut-tooltip__value': String.raw`
        tw:text-[length:var(--font-size-base)] tw:[font-weight:700] tw:text-accent
    `,
    'donut-tooltip__percent': String.raw`
        tw:text-[length:var(--font-size-sm)] tw:text-secondary
    `,
    'donut-legend': String.raw`
        tw:[list-style:none] tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))] tw:gap-ui-xs
        tw:m-[var(--spacing-md)_0_0] tw:p-[0] tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'donut-legend__item': String.raw`
        tw:grid tw:grid-cols-[auto_minmax(0,_1fr)_auto] tw:items-center tw:gap-x-ui-xs tw:gap-y-[2px] tw:min-w-[0]
        tw:p-[.45rem_.55rem] tw:ui-border tw:rounded-[var(--radius-sm)] tw:ui-fill-muted
        tw:text-[length:var(--font-size-sm)]
    `,
    'donut-legend__dot': String.raw`
        tw:w-[10px] tw:h-[10px] tw:rounded-[var(--radius-sm)]
    `,
    'donut-legend__name': String.raw`
        tw:min-w-[0] tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:text-main tw:[font-weight:600]
    `,
    'donut-legend__percent': String.raw`
        tw:[justify-self:end] tw:text-secondary tw:[font-weight:700]
    `,
    'donut-legend__value': String.raw`
        tw:col-[2_/_-1] tw:text-muted tw:text-[length:var(--font-size-xs)]
    `,
} as const;
export function DonutChartDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
