import { cn } from '../../../utils/cn';

const styles = {
    'salary-calc__breakdown': String.raw`
        tw:text-[length:.85rem] tw:[&_>_div]:flex tw:[&_>_div]:justify-between tw:[&_>_div]:items-baseline
        tw:[&_>_div]:gap-[.85rem] tw:[&_>_div]:p-[.65rem_0]
        tw:[&_>_div]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_dt]:text-secondary tw:[&_dt]:min-w-[0]
        tw:[&_dd]:text-right tw:[&_dd]:[font-weight:650] tw:[&_dd]:[font-variant-numeric:tabular-nums]
        tw:[&_dd]:whitespace-nowrap tw:[&_dd_small]:block tw:[&_dd_small]:text-[length:.71rem]
        tw:[&_dd_small]:[font-weight:400] tw:[&_dd_small]:text-secondary
        tw:[&_.salary-calc\_\_total]:[border-bottom:0] tw:[&_.salary-calc\_\_total]:pt-[.85rem]
        tw:[@media(max-width:480px)]:[&&]:text-[length:.8rem]
    `,
    'salary-calc__total': String.raw`
        tw:[&_dd]:text-main tw:[&_dd]:[font-weight:750] tw:[&&_dt]:text-main tw:[&_dt]:[font-weight:750]
    `,
    'salary-calc__person': String.raw`
        tw:min-w-[0] tw:ui-border-strong tw:rounded-[14px] tw:p-[1rem] tw:mb-[1rem] tw:[&_legend]:p-[0_.4rem]
        tw:[&_legend]:text-[length:.85rem] tw:[&_legend]:[font-weight:650]
    `,
    'salary-calc__hero-footer': String.raw`
        tw:grid tw:grid-cols-[1fr_1fr] tw:gap-[.8rem] tw:[border-top:1px_solid_var(--border-secondary)]
        tw:mt-[1.3rem] tw:pt-[1.1rem] tw:[&_span]:text-[length:.77rem] tw:[&_span]:text-secondary tw:[&_b]:block
        tw:[&_b]:text-main tw:[&_b]:text-[length:1.07rem] tw:[&_b]:mt-[.25rem]
    `,
    'salary-calc__tax-value': String.raw`
        tw:m-[1rem_0] tw:[&_>_span]:block tw:[&_>_span]:text-secondary tw:[&_>_span]:text-[length:.79rem]
        tw:[&_small]:block tw:[&_small]:text-secondary tw:[&_small]:text-[length:.79rem] tw:[&_>_strong]:block
        tw:[&_>_strong]:text-[length:1.75rem] tw:[&_>_strong]:[line-height:1.4]
    `,
    'salary-calc__settlement': String.raw`
        tw:flex tw:justify-between tw:gap-[.75rem] tw:p-[.9rem_1rem] tw:rounded-[12px] tw:ui-fill-muted
        tw:text-[length:.84rem]
    `,
} as const;
export function payrollStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
