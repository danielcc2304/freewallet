import { cn } from '../../../utils/cn';

const styles = {
    'portfolio-excel-insights__benchmark-portfolio': String.raw`
        tw:flex tw:justify-between tw:flex-wrap tw:gap-[.5rem] tw:m-[1rem_0] tw:p-[.85rem] tw:ui-border
        tw:rounded-[9px] tw:ui-fill-surface tw:[&_span]:text-muted tw:[&_span]:text-[length:.8rem]
        tw:[&_strong]:text-main
    `,
    'portfolio-excel-insights__panel-heading': String.raw`
        tw:flex tw:justify-between tw:gap-[1rem] tw:items-start tw:[&_h3]:ui-row tw:[&_h3]:gap-[.4rem]
        tw:[&_h3]:m-[0_0_.35rem] tw:[&_h3]:text-[length:.95rem] tw:[&_p]:m-[0] tw:[&_p]:text-muted
        tw:[&_p]:text-[length:.75rem] tw:[&_>_strong]:text-secondary tw:[&_>_strong]:text-[length:.75rem]
        tw:[&_>_strong]:whitespace-nowrap tw:[@media(max-width:680px)]:grid
        tw:[@media(max-width:680px)]:grid-cols-[minmax(0,_1fr)]
    `,
    'portfolio-excel-insights__panel-actions': String.raw`
        tw:grid tw:[justify-items:end] tw:gap-[.55rem] tw:[@media(max-width:680px)]:w-full
        tw:[@media(max-width:680px)]:min-w-[0] tw:[@media(max-width:680px)]:[justify-items:stretch]
    `,
    'portfolio-excel-insights__period-summary': String.raw`
        tw:grid tw:[justify-items:end] tw:gap-[.1rem] tw:text-right tw:[&_span]:text-muted
        tw:[&_span]:text-[length:.68rem] tw:[&_small]:text-muted tw:[&_small]:text-[length:.68rem]
        tw:[&_strong]:text-positive tw:[&_strong]:text-[length:.9rem] tw:[&_strong.is-negative]:text-negative
        tw:[&_strong:empty]:hidden tw:[@media(max-width:680px)]:[justify-items:start]
        tw:[@media(max-width:680px)]:text-left
    `,
    'portfolio-excel-insights__control-row': String.raw`
        tw:[&_.is-ok]:text-positive tw:[&_.is-warn]:text-negative tw:ui-row tw:justify-between tw:gap-[.7rem]
        tw:p-[.55rem_0] tw:[border-top:1px_solid_var(--border-primary)] tw:text-secondary tw:text-[length:.75rem]
        tw:[&_svg]:flex-[0_0_auto] tw:[&_svg]:text-muted tw:[&_strong]:text-main tw:[&_strong]:whitespace-nowrap
    `,
    'portfolio-excel-insights__movement-row': String.raw`
        tw:ui-row tw:justify-between tw:gap-[.7rem] tw:p-[.55rem_0] tw:[border-top:1px_solid_var(--border-primary)]
        tw:text-secondary tw:text-[length:.75rem] tw:[&_strong]:text-main tw:[&_strong]:whitespace-nowrap
        tw:[&_span]:grid tw:[&_span]:gap-[.15rem] tw:[&_span]:min-w-[0] tw:[&_small]:text-muted
        tw:[&_small]:wrap-anywhere
    `,
    'portfolio-excel-insights__leader-row': String.raw`
        tw:flex tw:justify-between tw:gap-[.75rem] tw:p-[.7rem_0] tw:[border-top:1px_solid_var(--border-primary)]
        tw:[&_span]:grid tw:[&_span]:gap-[.15rem] tw:[&_span]:min-w-[0] tw:[&_strong]:text-accent
        tw:[&_small]:text-muted tw:[&_small]:wrap-anywhere tw:[&_b]:text-main tw:[&_b]:whitespace-nowrap
    `,
    'portfolio-excel-insights__live-status': String.raw`
        tw:ui-row tw:gap-[.5rem] tw:mt-[.8rem] tw:p-[.7rem] tw:rounded-[8px] tw:[background:rgba(16,185,129,.08)]
        tw:text-positive tw:text-[length:.75rem]
    `,
    'portfolio-excel-insights__workbook-notice': String.raw`
        tw:ui-row tw:gap-[.85rem] tw:mb-[1rem] tw:p-[1rem] tw:ui-border tw:rounded-control tw:ui-fill-muted
        tw:text-main tw:[&_>_svg]:shrink-[0] tw:[&_>_svg]:[color:var(--color-warning)] tw:[&_>_div]:flex-[1]
        tw:[&_>_div]:min-w-[0] tw:[&_strong]:text-[length:.85rem] tw:[&_p]:m-[.3rem_0_0] tw:[&_p]:text-muted
        tw:[&_p]:text-[length:.8rem] tw:[&_p]:[line-height:1.5] tw:[&_button]:shrink-[0] tw:[&_button]:ui-border
        tw:[&_button]:rounded-[8px] tw:[&_button]:p-[.65rem_.9rem] tw:[&_button]:min-h-[44px]
        tw:[&_button]:text-main tw:[&_button]:ui-fill-surface tw:[&_button]:cursor-pointer
        tw:[&_button]:[font-family:inherit] tw:[&_button]:[font-weight:inherit] tw:[&_button]:[font-style:inherit]
        tw:[&_button]:[font-variant:inherit] tw:[&_button]:[font-stretch:inherit]
        tw:[&_button]:[line-height:inherit] tw:[&_button]:text-[length:.8rem]
        tw:[&_button:hover]:[background:var(--accent-primary)] tw:[&_button:hover]:[color:white]
        tw:[&_button:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_button:focus-visible]:[outline-offset:3px] tw:[@media(max-width:680px)]:flex-wrap
        tw:[@media(max-width:680px)]:items-start tw:[@media(max-width:680px)]:[&_button]:w-full
    `,
    'portfolio-excel-insights__loading': String.raw`
        tw:ui-row tw:gap-[8px] tw:min-h-[28px] tw:m-[8px_0] tw:text-muted tw:text-[length:0.85rem]
        tw:[&_svg]:shrink-[0] tw:[&_svg]:[animation:insights-loading_1s_linear_infinite]
        tw:[@media(prefers-reduced-motion:reduce)]:[&_svg]:[animation:none]
    `,
    'portfolio-excel-insights__block': String.raw`
        tw:mb-[12px] tw:[&_progress]:block tw:[&_progress]:w-full tw:[&_progress]:h-[5px] tw:[&_progress]:[border:0]
        tw:[&_progress]:rounded-[8px] tw:[&_progress]:overflow-hidden tw:[&_progress]:ui-fill-surface
        tw:[&_progress]:[accent-color:#10b981] tw:[&_progress::-webkit-progress-bar]:ui-fill-surface
        tw:[&_progress::-webkit-progress-value]:[background:#10b981]
        tw:[&_progress::-moz-progress-bar]:[background:#10b981]
    `,
} as const;
export function historyStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
