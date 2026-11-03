import { cn } from '../../../utils/cn';
const styles = {
    strategies: String.raw`
        tw:max-w-[1100px] tw:m-[0_auto] tw:pb-[3rem] tw:[container-type:inline-size] tw:text-main tw:wrap-anywhere
        tw:[&_:is(a):focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_:is(a):focus-visible]:[outline-offset:4px]
        tw:[&_.strategies\_\_approach-card--active]:[border-top-color:#8b5cf6]!
        tw:[&_:is(.strategies\_\_approach-card,_.strategies\_\_entry-card)_h3]:text-[length:1.2rem]
        tw:[&_:is(.strategies\_\_approach-card,_.strategies\_\_entry-card)_h3]:[line-height:1.35]
        tw:[&_:is(.strategies\_\_approach-card,_.strategies\_\_entry-card)_h3]:m-[0_0_.75rem]
        tw:[&_:is(.strategies\_\_approach-card,_.strategies\_\_entry-card)_p]:text-[length:.95rem]
        tw:[&_:is(.strategies\_\_approach-card,_.strategies\_\_entry-card)_p]:[line-height:1.7]
        tw:[&_:is(.strategies\_\_approach-card,_.strategies\_\_entry-card)_p]:text-secondary
        tw:[&_:is(.strategies\_\_approach-card,_.strategies\_\_entry-card)_p]:m-[0]
    `,
    strategies__section: String.raw`
        tw:mt-[2.5rem] tw:[scroll-margin-top:1.5rem] tw:[@container(max-width:680px)]:mt-[2rem]
        tw:[@media(max-width:1024px)]:[scroll-margin-top:5rem]
    `,
    strategies__grid: String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem]
        tw:[@container(max-width:680px)]:grid-cols-[1fr]
    `,
    'strategies__approach-card': String.raw`
        tw:ui-stack tw:[border-top:3px_solid_var(--accent-primary)]!
    `,
    'strategies__approach-card--active': String.raw`
        tw:[&_.strategies\_\_icon]:[color:#a78bfa] tw:[&_.strategies\_\_icon]:[background:rgba(139,_92,_246,_.12)]
        tw:[html[data-theme='light']_&_.strategies\_\_icon]:[color:#7c3aed]
    `,
    'strategies__card-heading': String.raw`
        tw:ui-row tw:flex-wrap tw:gap-[.75rem] tw:mb-[1rem]
    `,
    strategies__icon: String.raw`
        tw:grid tw:place-items-center tw:w-[44px] tw:h-[44px] tw:rounded-[12px]
        tw:[background:rgba(var(--accent-rgb),_.08)] tw:text-accent tw:[.strategies\_\_entry-card_>_&]:mb-[1rem]
    `,
    strategies__tag: String.raw`
        tw:text-[length:.8rem] tw:text-secondary tw:[line-height:1.5]
    `,
    strategies__term: String.raw`
        tw:text-[length:.8rem] tw:text-secondary tw:[line-height:1.5] tw:block tw:m-[-.25rem_0_.75rem]
    `,
    strategies__takeaway: String.raw`
        tw:mt-[auto] tw:p-[.9rem_1rem] tw:rounded-[10px] tw:ui-fill-muted tw:text-[length:.85rem]
        tw:[line-height:1.6]
    `,
    'strategies__entry-card': String.raw``,
    'strategies__chart-heading': String.raw`
        tw:ui-row tw:justify-between tw:flex-wrap tw:gap-[.5rem] tw:mb-[1.5rem] tw:[&_h3]:m-[0]
        tw:[&_h3]:text-[length:1.1rem] tw:[&_>_span]:text-[length:.75rem] tw:[&_>_span]:text-secondary
    `,
    'strategies__balance-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[1.25rem]
        tw:[@container(max-width:680px)]:grid-cols-[1fr] tw:[@container(max-width:680px)]:gap-[1rem]
    `,
    strategies__legend: String.raw`
        tw:flex tw:flex-wrap tw:gap-[1rem] tw:mt-[1rem] tw:text-[length:.8rem] tw:text-secondary tw:[&_span]:ui-row
        tw:[&_span]:gap-[.45rem] tw:[&_i]:w-[9px] tw:[&_i]:h-[9px] tw:[&_i]:rounded-[3px]
        tw:[&_i]:[background:#047857] tw:[&_span_+_span_i]:[background:#1d4ed8]
    `,
    strategies__tools: String.raw`
        tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[1rem]
        tw:[@container(max-width:680px)]:grid-cols-[1fr]
    `,
} as const;
export function StrategiesReadingStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
