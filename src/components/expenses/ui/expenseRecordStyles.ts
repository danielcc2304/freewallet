import { cn } from '../../../utils/cn';

// Styles belong to the structured components; theme hooks remain stable.
const styles = {
    "expense-month": String.raw`
    tw:ui-row tw:gap-[.4rem] tw:p-[.35rem] tw:ui-border-strong tw:ui-fill-panel tw:rounded-[14px] tw:[&_button]:grid
    tw:[&_button]:place-items-center tw:[&_button]:w-[38px] tw:[&_button]:h-[38px] tw:[&_button]:[border:0]
    tw:[&_button]:text-main tw:[&_button]:ui-fill-transparent tw:[&_button]:rounded-[9px] tw:[&_button]:cursor-pointer
    tw:[&_input]:ui-fill-transparent tw:[&_input]:[border:0] tw:[&_input]:text-main tw:[&_input]:[font-family:inherit]
    tw:[&_input]:[font-size:inherit] tw:[&_input]:[font-weight:inherit] tw:[&_input]:[font-style:inherit]
    tw:[&_input]:[font-variant:inherit] tw:[&_input]:[font-stretch:inherit] tw:[&_input]:[line-height:inherit]
    tw:[&_input]:text-[length:.94rem] tw:[&_input]:p-[.4rem] tw:[&_input]:min-w-[0]
`,
    "expense-row": String.raw`
    tw:ui-row tw:justify-between tw:gap-[.8rem] tw:[&_small]:block tw:[&_small]:text-[length:.75rem]
    tw:[&_small]:text-secondary tw:[&_small]:[font-weight:400] tw:[&_small]:[line-height:1.5] tw:[&_small]:mt-[.25rem]
    tw:[&_>_div:first-child]:min-w-[0] tw:[&_strong]:text-[length:.88rem] tw:[&_strong]:wrap-anywhere
`,
    "expense-search": String.raw`
    tw:flex-[2_1_220px] tw:ui-row tw:p-[0_.85rem] tw:ui-border-strong tw:rounded-[11px] tw:ui-fill-surface
    tw:text-secondary tw:[&_input]:w-full tw:[&_input]:min-w-[0] tw:[&_input]:[border:0] tw:[&_input]:min-h-[44px]
    tw:[&_input]:p-[.6rem] tw:[&_input]:ui-fill-transparent tw:[&_input]:text-main tw:[&_input]:[font-family:inherit]
    tw:[&_input]:[font-size:inherit] tw:[&_input]:[font-weight:inherit] tw:[&_input]:[font-style:inherit]
    tw:[&_input]:[font-variant:inherit] tw:[&_input]:[font-stretch:inherit] tw:[&_input]:[line-height:inherit]
    tw:[&_input]:text-[length:.85rem]
`,
    "expense-calendar-day": String.raw`
    tw:ui-stack tw:gap-[.65rem] tw:p-[.6rem] tw:rounded-[10px] tw:ui-fill-muted tw:[&_span]:text-[length:.75rem]
    tw:[&_span]:text-secondary tw:[&_strong]:text-[length:.75rem] tw:[@media(max-width:600px)]:p-[.5rem]
    tw:[@media(max-width:600px)]:[&_strong]:text-[length:.68rem]
`,
    "expense-calendar-day--spent": String.raw`tw:[&.expense-calendar-day--spent]:[background:rgba(var(--accent-rgb),.14)]`,
    "expense-budget-number": String.raw`
    tw:flex tw:gap-[.65rem] tw:flex-wrap tw:items-baseline tw:mb-[1rem] tw:[&_strong]:text-[length:1.8rem]
    tw:[&_strong]:[letter-spacing:-.045em] tw:[&_span]:text-secondary tw:[&_span]:text-[length:.8rem]
    tw:[@media(max-width:600px)]:[&_strong]:text-[length:1.55rem]
`,
    "expense-import-help": String.raw`
    tw:m-[.5rem_0_1rem] tw:ui-border-strong tw:rounded-[12px] tw:ui-fill-panel tw:[&_summary]:p-[.8rem_1rem]
    tw:[&_summary]:text-main tw:[&_summary]:text-[length:.82rem] tw:[&_summary]:[font-weight:650]
    tw:[&_summary]:cursor-pointer
`,
    "expense-import-help__content": String.raw`
    tw:p-[0_1rem_.9rem] tw:text-secondary tw:text-[length:.78rem] tw:[line-height:1.6] tw:[&_p]:m-[.55rem_0]
    tw:[&_ul]:m-[.5rem_0] tw:[&_ul]:pl-[1.25rem] tw:[&_li]:m-[.4rem_0] tw:[&_strong]:text-main
`,
    "expense-export-menu": String.raw`
    tw:relative tw:text-[length:.85rem] tw:[&_summary]:ui-row tw:[&_summary]:gap-[.4rem] tw:[&_summary]:p-[.7rem]
    tw:[&_summary]:min-h-[42px] tw:[&_summary]:[list-style:none] tw:[&_summary]:cursor-pointer
    tw:[&_summary]:text-secondary tw:[&_summary::-webkit-details-marker]:hidden tw:[&_>_div]:absolute
    tw:[&_>_div]:top-[100%] tw:[&_>_div]:right-[0] tw:[&_>_div]:z-[5] tw:[&_>_div]:w-[260px]
    tw:[&_>_div]:ui-fill-surface tw:[&_>_div]:ui-border-strong tw:[&_>_div]:rounded-[14px] tw:[&_>_div]:p-[.4rem]
    tw:[&_>_div]:[box-shadow:var(--shadow-lg)] tw:[&_button]:block tw:[&_button]:w-full tw:[&_button]:min-h-[44px]
    tw:[&_button]:p-[.7rem] tw:[&_button]:[border:0] tw:[&_button]:ui-fill-transparent tw:[&_button]:text-main
    tw:[&_button]:[font-family:inherit] tw:[&_button]:[font-size:inherit] tw:[&_button]:[font-weight:inherit]
    tw:[&_button]:[font-style:inherit] tw:[&_button]:[font-variant:inherit] tw:[&_button]:[font-stretch:inherit]
    tw:[&_button]:[line-height:inherit] tw:[&_button]:text-left tw:[&_button]:rounded-[9px] tw:[&_button]:cursor-pointer
    tw:[&_button:hover]:ui-fill-muted tw:[@media(max-width:600px)]:[&_>_div]:left-[0]
    tw:[@media(max-width:600px)]:[&_>_div]:right-[auto]
`
} as const;

export function expenseRecordClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
