import { cn } from '../../../utils/cn';

const styles = {
    'portfolio-csv-hero': String.raw`
        tw:relative tw:mb-[1.4rem] tw:p-[2rem] tw:rounded-[18px] tw:ui-border
        tw:[background:radial-gradient(circle_at_10%_10%,_rgba(16,_185,_129,_0.18),_transparent_45%),_________radial-gradient(circle_at_90%_20%,_rgba(59,_130,_246,_0.18),_transparent_42%),_________var(--bg-secondary)]
        tw:overflow-hidden tw:[&_h1]:m-[0_0_0.65rem] tw:[&_h1]:text-[length:clamp(1.6rem,_2.3vw,_2.4rem)]
        tw:[&_h1]:max-w-[820px] tw:[&&_p]:m-[0] tw:[&_p]:max-w-[820px] tw:[&_p]:text-secondary
        tw:[&_p]:[line-height:1.7] tw:[@media(max-width:700px)]:p-[1.15rem]
    `,
    'portfolio-csv-hero__badge': String.raw`
        tw:inline-flex tw:text-[length:var(--font-size-xs)] tw:[text-transform:uppercase] tw:[letter-spacing:0.08em]
        tw:p-[0.3rem_0.6rem] tw:rounded-[var(--radius-full)] tw:ui-border-strong tw:mb-[0.8rem] tw:text-accent
        tw:[font-weight:700]
    `,
    'portfolio-csv-upload__card': String.raw`
        tw:ui-fill-surface tw:ui-border tw:rounded-[14px] tw:p-[1rem] tw:ui-stack tw:gap-[0.55rem]
        tw:[&_h3]:text-[length:var(--font-size-base)] tw:[&_h3]:m-[0] tw:[&_h3]:ui-row tw:[&_h3]:gap-[0.4rem]
        tw:[&&_p]:m-[0] tw:[&_p]:text-secondary tw:[&_p]:text-[length:var(--font-size-sm)] tw:[&_p]:[line-height:1.5]
        tw:[&_small]:text-muted tw:[&_small]:text-[length:var(--font-size-xs)]
    `,
    'portfolio-csv-upload__card--utility': String.raw`
        tw:[&.portfolio-csv-upload\_\_card--utility]:[background:linear-gradient(140deg,_var(--bg-secondary),_var(--bg-tertiary))]
    `,
    'portfolio-csv-upload__actions': String.raw`
        tw:ui-row tw:gap-[0.5rem] tw:flex-wrap
    `,
    'portfolio-csv-empty-state': String.raw`
        tw:[border:1px_dashed_var(--border-secondary)] tw:rounded-[10px] tw:p-[1rem] tw:ui-fill-muted
        tw:text-secondary tw:text-[length:var(--font-size-sm)] tw:[line-height:1.55]
    `,
    'portfolio-csv-pie-legend': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[0.45rem]
        tw:[@media(max-width:700px)]:grid-cols-[1fr]
    `,
    'portfolio-csv-pie-legend__item': String.raw`
        tw:grid tw:grid-cols-[auto_1fr_auto] tw:items-center tw:gap-[0.45rem] tw:ui-border tw:rounded-[10px]
        tw:p-[0.45rem_0.55rem] tw:ui-fill-muted
    `,
    'portfolio-csv-pie-legend__dot': String.raw`
        tw:w-[9px] tw:h-[9px] tw:rounded-[50%]
    `,
    'portfolio-csv-pie-legend__name': String.raw`
        tw:text-secondary tw:text-[length:var(--font-size-xs)] tw:overflow-hidden tw:text-ellipsis
        tw:whitespace-nowrap
    `,
    'portfolio-csv-pie-legend__weight': String.raw`
        tw:text-main tw:text-[length:var(--font-size-xs)] tw:[font-weight:600]
    `,
    'portfolio-csv-insights': String.raw`
        tw:[list-style:none] tw:p-[0] tw:m-[0] tw:ui-stack tw:gap-[0.55rem] tw:[&_li]:ui-row
        tw:[&_li]:justify-between tw:[&_li]:gap-[0.8rem] tw:[&_li]:ui-border tw:[&_li]:rounded-[10px]
        tw:[&_li]:p-[0.65rem_0.75rem] tw:[&_li]:ui-fill-muted tw:[&_span]:text-secondary
        tw:[&_span]:text-[length:var(--font-size-sm)] tw:[&_strong]:text-main
        tw:[&_strong]:text-[length:var(--font-size-sm)] tw:[&_strong]:text-right
        tw:[@media(max-width:700px)]:[&_li]:flex-col tw:[@media(max-width:700px)]:[&_li]:items-start
    `,
    'portfolio-csv-note': String.raw`
        tw:mt-[0.75rem] tw:[border:1px_dashed_var(--border-secondary)] tw:rounded-[10px] tw:p-[0.7rem]
        tw:[background:rgba(16,_185,_129,_0.06)] tw:[&&_p]:m-[0] tw:[&_p]:text-secondary
        tw:[&_p]:text-[length:var(--font-size-sm)] tw:[&_p]:[line-height:1.6]
    `,
    'portfolio-csv-check': String.raw`
        tw:ui-border tw:rounded-[10px] tw:p-[0.75rem] tw:ui-fill-muted tw:[&&_p]:m-[0] tw:[&_p]:text-secondary
        tw:[&_p]:text-[length:var(--font-size-sm)] tw:[&_p]:[line-height:1.5]
    `,
    'portfolio-csv-check--good': String.raw`
        tw:[&.portfolio-csv-check--good]:[background:rgba(16,_185,_129,_0.08)]
    `,
    'portfolio-csv-check--warn': String.raw`
        tw:[&.portfolio-csv-check--warn]:[background:rgba(245,_158,_11,_0.1)]
    `,
    'portfolio-csv-check__top': String.raw`
        tw:ui-row tw:justify-between tw:gap-[0.75rem] tw:mb-[0.35rem]
    `,
    'portfolio-csv-check__title': String.raw`
        tw:text-secondary tw:text-[length:var(--font-size-sm)]
    `,
    'portfolio-csv-check__value': String.raw`
        tw:text-main tw:text-[length:var(--font-size-base)]
    `,
    'portfolio-csv-controls-table__head': String.raw`
        tw:grid tw:grid-cols-[minmax(220px,_2fr)_minmax(90px,_0.7fr)_minmax(180px,_1fr)] tw:items-center
        tw:gap-[0.75rem] tw:text-muted tw:text-[length:var(--font-size-xs)] tw:[text-transform:uppercase]
        tw:[letter-spacing:0.05em] tw:p-[0_0.25rem] tw:[@media(max-width:700px)]:hidden
    `,
    'portfolio-csv-plan-table__head': String.raw`
        tw:grid tw:grid-cols-[minmax(140px,_1.2fr)_repeat(3,_minmax(80px,_0.8fr))] tw:gap-[0.75rem] tw:items-center
        tw:text-muted tw:text-[length:var(--font-size-xs)] tw:[text-transform:uppercase] tw:[letter-spacing:0.05em]
        tw:p-[0_0.25rem] tw:[@media(max-width:700px)]:hidden
    `,
    'portfolio-csv-plan-table__row': String.raw`
        tw:grid tw:grid-cols-[minmax(140px,_1.2fr)_repeat(3,_minmax(80px,_0.8fr))] tw:gap-[0.75rem] tw:items-center
        tw:ui-border tw:rounded-[10px] tw:p-[0.7rem_0.75rem] tw:ui-fill-muted
        tw:[@media(max-width:700px)]:grid-cols-[1fr] tw:[@media(max-width:700px)]:gap-[0.55rem]
        tw:[@media(max-width:700px)]:[&_span]:ui-row tw:[@media(max-width:700px)]:[&_span]:justify-between
        tw:[@media(max-width:700px)]:[&_span]:gap-[0.8rem]
        tw:[@media(max-width:700px)]:[&_span]:text-[length:var(--font-size-sm)]
        tw:[@media(max-width:700px)]:[&_span::before]:[content:attr(data-label)]
        tw:[@media(max-width:700px)]:[&_span::before]:text-muted
        tw:[@media(max-width:700px)]:[&_span::before]:text-[length:var(--font-size-xs)]
        tw:[@media(max-width:700px)]:[&_span::before]:[text-transform:uppercase]
        tw:[@media(max-width:700px)]:[&_span::before]:[letter-spacing:0.04em]
    `,
    'portfolio-csv-plan-table__bucket': String.raw`
        tw:text-main tw:[@media(max-width:700px)]:pb-[0.35rem]
        tw:[@media(max-width:700px)]:[border-bottom:1px_solid_var(--border-primary)]
    `,
    'portfolio-csv-plan-table__delta--over': String.raw`
        tw:[&.portfolio-csv-plan-table\_\_delta--over]:[color:#ef4444]
        tw:[&.portfolio-csv-plan-table\_\_delta--over]:[font-weight:700]
    `,
    'portfolio-csv-plan-table__delta--under': String.raw`
        tw:[&.portfolio-csv-plan-table\_\_delta--under]:[color:#10b981]
        tw:[&.portfolio-csv-plan-table\_\_delta--under]:[font-weight:700]
    `,
    'portfolio-csv-tooltip': String.raw`
        tw:min-w-[190px] tw:ui-fill-surface tw:ui-border-strong tw:rounded-[10px] tw:p-[0.55rem_0.65rem]
        tw:[box-shadow:var(--shadow-md)]
    `,
    'portfolio-csv-tooltip__label': String.raw`
        tw:text-[length:var(--font-size-xs)] tw:text-main tw:[font-weight:700] tw:mb-[0.35rem]
    `,
    'portfolio-csv-tooltip__rows': String.raw`
        tw:ui-stack tw:gap-[0.28rem]
    `,
    'portfolio-csv-tooltip__row': String.raw`
        tw:grid tw:grid-cols-[auto_1fr_auto] tw:items-center tw:gap-[0.4rem]
    `,
    'portfolio-csv-tooltip__dot': String.raw`
        tw:w-[9px] tw:h-[9px] tw:rounded-[50%]
    `,
    'portfolio-csv-tooltip__name': String.raw`
        tw:text-secondary tw:text-[length:var(--font-size-xs)]
    `,
    'portfolio-csv-tooltip__value': String.raw`
        tw:text-main tw:text-[length:var(--font-size-xs)]
    `,
    'portfolio-csv-advanced__header': String.raw`
        tw:flex tw:items-start tw:justify-between tw:gap-[1rem] tw:mb-[0.9rem] tw:[&_h2]:mb-[0.35rem]
        tw:[&_p]:mb-[0] tw:[@media(max-width:700px)]:flex-col
    `,
    'portfolio-csv-advanced__source': String.raw`
        tw:flex-[0_0_auto] tw:p-[0.45rem_0.65rem] tw:[border:1px_solid_rgba(16,_185,_129,_0.3)] tw:rounded-[999px]
        tw:[background:rgba(16,_185,_129,_0.08)] tw:text-accent tw:text-[length:var(--font-size-xs)]
        tw:[font-weight:700] tw:[@media(max-width:700px)]:self-start
    `,
} as const;
export function portfolioAnalysisStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
