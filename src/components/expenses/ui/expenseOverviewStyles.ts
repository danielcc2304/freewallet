import { cn } from '../../../utils/cn';

const styles = {
    'expense-distribution': String.raw`
        tw:ui-row tw:gap-[1.5rem] tw:[@media(max-width:1150px)]:flex-col tw:[@media(max-width:850px)]:flex-row
        tw:[@media(max-width:600px)]:[&&]:flex-col
    `,
    'expense-donut': String.raw`
        tw:shrink-[0] tw:w-[175px] tw:h-[175px] tw:rounded-[50%] tw:p-[18px] tw:[&_>_div]:ui-fill-panel
        tw:[&_>_div]:rounded-[50%] tw:[&_>_div]:w-full tw:[&_>_div]:h-full tw:[&_>_div]:ui-stack
        tw:[&_>_div]:items-center tw:[&_>_div]:justify-center tw:[&_>_div]:gap-[.35rem] tw:[&_>_div]:text-center
        tw:[&_span]:text-[length:.7rem] tw:[&_span]:text-secondary tw:[&_strong]:text-[length:1.12rem]
        tw:[&_strong]:[letter-spacing:-.03em] tw:[@media(min-width:1500px)]:w-[200px]
        tw:[@media(min-width:1500px)]:h-[200px] tw:[@media(min-width:1500px)]:p-[21px]
    `,
    'expense-legend': String.raw`
        tw:flex-[1] tw:min-w-[0] tw:[list-style:none] tw:p-[0] tw:[&_li]:ui-row tw:[&_li]:justify-between
        tw:[&_li]:gap-[.75rem] tw:[&_li]:p-[.5rem_0] tw:[&_li]:text-[length:.79rem] tw:[&_li_>_span]:ui-row
        tw:[&_li_>_span]:gap-[.5rem] tw:[&_li_>_span]:min-w-[0] tw:[&_i]:inline-block tw:[&_i]:w-[8px]
        tw:[&_i]:h-[8px] tw:[&_i]:rounded-[50%] tw:[&_i]:shrink-[0] tw:[&_strong]:text-right
        tw:[&_strong]:whitespace-nowrap tw:[&_small]:text-secondary tw:[&_small]:block
        tw:[&_small]:text-[length:.7rem] tw:[&_small]:[font-weight:400] tw:[@media(max-width:1150px)]:w-full
    `,
    'expense-facts': String.raw`
        tw:text-[length:.81rem] tw:m-[1rem_0] tw:[&_>_div]:flex tw:[&_>_div]:justify-between
        tw:[&_>_div]:items-baseline tw:[&_>_div]:gap-[1rem] tw:[&_>_div]:p-[.7rem_0]
        tw:[&_>_div]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_dt]:text-secondary
        tw:[&_span]:text-secondary tw:[&_dd]:[font-weight:650] tw:[&_dd]:text-right tw:[&_dd]:whitespace-nowrap
    `,
    'expense-chart-legend': String.raw`
        tw:flex tw:gap-[1rem] tw:text-[length:.75rem] tw:text-secondary tw:m-[.75rem_0] tw:[&_span]:ui-row
        tw:[&_span]:gap-[.4rem] tw:[&_i]:w-[8px] tw:[&_i]:h-[8px] tw:[&_i]:rounded-[3px]
        tw:[&_i]:[background:var(--expense-income)] tw:[&_span:nth-child(2)_i]:[background:var(--expense-spend)]
    `,
    'expense-bar-chart': String.raw`
        tw:flex tw:gap-[1rem] tw:h-[170px] tw:[border-bottom:1px_solid_var(--border-secondary)] tw:mb-[2rem]
        tw:pt-[.7rem]
    `,
    'expense-bar-month': String.raw`
        tw:flex-[1] tw:min-w-[0] tw:h-full tw:relative tw:[&_>_small]:block tw:[&_>_small]:text-center
        tw:[&_>_small]:absolute tw:[&_>_small]:bottom-[-1.5rem] tw:[&_>_small]:w-full
        tw:[&_>_small]:text-[length:.72rem] tw:[&_>_small]:text-secondary
    `,
    'expense-bar-pair': String.raw`
        tw:flex tw:justify-center tw:items-end tw:gap-[4px] tw:h-full tw:[&_span]:w-[28%]
        tw:[&_span]:rounded-[5px_5px_0_0] tw:[&_span]:min-h-[2px] tw:[&_span]:[background:var(--expense-income)]
        tw:[&_span:nth-child(2)]:[background:var(--expense-spend)]
        tw:[&_.expense-bar-refund]:[background:repeating-linear-gradient(45deg,#818cf8,#818cf8_3px,transparent_3px,transparent_6px)]
    `,
    'expense-category-card': String.raw`
        tw:[&_.expense-row_>_span]:text-[length:.85rem] tw:[&_.expense-row_>_span]:[font-weight:600]
        tw:[&_>_strong]:block tw:[&_>_strong]:mt-[.45rem] tw:[&_>_strong]:text-[length:1.1rem]
        tw:[&_small]:text-[length:.74rem] tw:[&_small]:[font-weight:400] tw:[&_small]:text-secondary
        tw:[@media(max-width:600px)]:[&&]:p-[.8rem]
        tw:[@media(max-width:600px)]:[&&_.expense-row_>_span]:text-[length:.78rem]
    `,
    'expense-color-dot': String.raw`
        tw:inline-block tw:w-[8px] tw:h-[8px] tw:rounded-[50%] tw:shrink-[0] tw:mr-[.5rem]
    `,
    'expense-goal': String.raw`
        tw:[&_>_strong]:block tw:[&_>_strong]:mt-[.7rem] tw:[&_>_strong]:text-[length:1.18rem]
        tw:[&_strong_small]:text-[length:.75rem] tw:[&_strong_small]:[font-weight:400]
        tw:[&_strong_small]:text-secondary
    `,
    'expense-account': String.raw`
        tw:[&_h3]:m-[.8rem_0_.3rem] tw:[&_>_strong]:block tw:[&_>_strong]:text-[length:1.75rem]
        tw:[&_>_strong]:[letter-spacing:-.04em] tw:[&_>_strong]:mb-[.3rem] tw:[&_>_small]:text-secondary
        tw:[&_>_small]:text-[length:.73rem] tw:[@media(max-width:600px)]:[&&_>_strong]:text-[length:1.6rem]
    `,
    'expense-account-icon': String.raw`
        tw:ui-row tw:justify-center tw:h-[40px] tw:w-[40px] tw:rounded-[12px] tw:text-accent
        tw:[background:rgba(var(--accent-rgb),.12)]
    `,
    'expense-pagination': String.raw`
        tw:ui-row tw:gap-[1rem] tw:justify-center tw:mt-[1rem] tw:text-[length:.8rem]
    `,
    'expense-start': String.raw`
        tw:ui-row tw:justify-between tw:gap-[1rem] tw:p-[1.4rem] tw:mb-[1.3rem]
        tw:[border:1px_dashed_rgba(var(--accent-rgb),.5)] tw:[background:rgba(var(--accent-rgb),.05)]
        tw:rounded-[20px] tw:[&_h2]:text-[length:1.08rem] tw:[&_p]:mt-[.4rem] tw:[&_p]:text-[length:.85rem]
        tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.6] tw:[@media(max-width:850px)]:flex-col
        tw:[@media(max-width:850px)]:items-start
    `,
} as const;
export function expenseOverviewStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
