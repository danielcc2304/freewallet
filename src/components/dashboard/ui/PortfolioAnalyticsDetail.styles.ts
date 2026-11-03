import { cn } from '../../../utils/cn';
const styles = {
    'portfolio-analytics__kpis': String.raw`
        tw:grid tw:grid-cols-[repeat(7,_minmax(0,_1fr))] tw:gap-[.65rem]
        tw:[@media(max-width:1100px)]:grid-cols-[repeat(4,_minmax(0,_1fr))]
        tw:[@media(max-width:760px)]:grid-cols-[1fr_1fr]
        tw:[@media(max-width:540px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
    `,
    'portfolio-analytics__body': String.raw`
        tw:grid tw:grid-cols-[minmax(0,_1.5fr)_minmax(260px,_1fr)] tw:gap-[1rem] tw:mt-[1.25rem]
        tw:[@media(max-width:760px)]:grid-cols-[1fr_1fr] tw:[@media(max-width:760px)]:grid
        tw:[@media(max-width:540px)]:grid-cols-[1fr]
    `,
    'portfolio-analytics': String.raw`
        tw:[&_h3]:ui-row tw:[&_h3]:gap-[.4rem] tw:[&_h3]:m-[0_0_.8rem] tw:[&_h3]:text-main
        tw:[&_h3]:text-[length:.95rem]
    `,
    'portfolio-analytics__empty': String.raw`
        tw:min-h-[230px] tw:grid tw:place-items-center tw:text-muted tw:text-center
    `,
    'portfolio-analytics__allocation-row': String.raw`
        tw:grid tw:grid-cols-[72px_1fr_48px] tw:items-center tw:gap-[.5rem] tw:m-[.7rem_0] tw:text-secondary
        tw:text-[length:.8rem] tw:[&_div]:h-[7px] tw:[&_div]:overflow-hidden tw:[&_div]:rounded-[99px]
        tw:[&_div]:ui-fill-panel tw:[&_i]:block tw:[&_i]:h-full tw:[&_i]:rounded-[inherit]
        tw:[&_i]:[background:var(--accent-primary)] tw:[&_strong]:text-right tw:[&_strong]:text-main
    `,
    'portfolio-analytics__leaders-title': String.raw`
        tw:[margin-top:1.2rem]!
    `,
    'portfolio-analytics__leader': String.raw`
        tw:flex tw:justify-between tw:gap-[.75rem] tw:p-[.55rem_0] tw:[border-top:1px_solid_var(--border-primary)]
        tw:[&_span]:grid tw:[&_span]:gap-[.1rem] tw:[&_strong]:text-accent tw:[&_small]:text-muted
        tw:[&_small]:whitespace-nowrap tw:[&_small]:overflow-hidden tw:[&_small]:text-ellipsis
        tw:[&_small]:max-w-[180px] tw:[&_b]:text-main tw:[&_b]:text-[length:.82rem] tw:[&_b]:whitespace-nowrap
    `,
    'portfolio-analytics__alerts': String.raw`
        tw:flex tw:gap-[.6rem] tw:mt-[1rem] tw:p-[.85rem_1rem] tw:[border:1px_solid_rgba(16,185,129,.3)]
        tw:rounded-control tw:[background:rgba(16,185,129,.08)] tw:text-positive
        tw:[&.has-alerts]:[border-color:rgba(245,158,11,.35)] tw:[&.has-alerts]:[background:rgba(245,158,11,.08)]
        tw:[&.has-alerts]:[color:var(--color-warning)] tw:[&_div]:grid tw:[&_div]:gap-[.2rem]
        tw:[&_span]:text-secondary tw:[&_span]:text-[length:.8rem]
    `,
    'has-alerts': String.raw``,
} as const;
export function PortfolioAnalyticsDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
