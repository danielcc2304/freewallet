import { cn } from '../../../utils/cn';

const styles = {
    'expense-status': String.raw`
        tw:inline-flex tw:gap-[.5rem] tw:items-center tw:text-[length:.78rem] tw:text-secondary tw:whitespace-nowrap
    `,
    'expense-status-dot': String.raw`
        tw:w-[7px] tw:h-[7px] tw:rounded-[50%] tw:[background:var(--accent-primary)]
    `,
    'expense-status-dot--busy': String.raw`
        tw:[&.expense-status-dot--busy]:[background:#fbbf24]
    `,
    'expense-import__category-select': String.raw`
        tw:w-full tw:min-w-[150px] tw:min-h-[42px] tw:p-[.6rem_.7rem] tw:ui-border-strong tw:rounded-[10px]
        tw:ui-fill-surface tw:text-main tw:[font-family:inherit] tw:[font-weight:inherit] tw:[font-style:inherit]
        tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit] tw:text-[length:.78rem]
        tw:[&_option]:ui-fill-surface tw:[&_option]:text-main
    `,
    'expense-import__pagination': String.raw`
        tw:ui-row tw:justify-end tw:gap-[.5rem] tw:m-[.75rem_0] tw:text-secondary tw:text-[length:.78rem]
        tw:[&_.expense-btn]:min-h-[40px] tw:[&_.expense-btn]:p-[.55rem_.8rem]
    `,
    'expense-import-summary': String.raw`
        tw:ui-row tw:flex-wrap tw:gap-[.75rem] tw:m-[1rem_0] tw:text-[length:.8rem] tw:[&_span]:text-secondary
    `,
    'expense-error': String.raw`
        tw:p-[1rem] tw:[border:1px_solid_rgba(251,113,133,.35)] tw:[background:rgba(251,113,133,.06)]
        tw:rounded-[12px] tw:m-[1rem_0] tw:text-[length:.83rem] tw:[line-height:1.6] tw:text-main
    `,
    'expense-sync-error': String.raw`
        tw:p-[1rem] tw:[border:1px_solid_rgba(251,113,133,.35)] tw:[background:rgba(251,113,133,.06)]
        tw:rounded-[12px] tw:m-[1rem_0] tw:text-[length:.83rem] tw:[line-height:1.6] tw:text-main
        tw:[&_.expense-actions]:mt-[.85rem]
    `,
    'expense-notice': String.raw`
        tw:ui-row tw:gap-[.6rem] tw:text-accent tw:text-[length:.8rem] tw:p-[.8rem_1rem]
        tw:[background:rgba(var(--accent-rgb),.08)] tw:rounded-[11px] tw:mb-[1rem] tw:[&_button]:ml-[auto]
        tw:[&_button]:flex tw:[&_button]:ui-fill-transparent tw:[&_button]:[border:0] tw:[&_button]:[color:inherit]
        tw:[&_button]:cursor-pointer
    `,
    'expense-loading': String.raw`
        tw:ui-row tw:justify-center tw:gap-[.8rem] tw:p-[6rem_1rem] tw:text-secondary
    `,
} as const;
export function expenseFeedbackStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
