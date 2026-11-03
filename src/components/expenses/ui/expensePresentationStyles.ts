import { cn } from '../../../utils/cn';
const styles = {
    'expense-manager': String.raw`
        tw:w-full tw:min-w-[0] tw:p-[1.5rem] tw:text-main tw:[--expense-income:#34d399] tw:[--expense-spend:#818cf8]
        tw:[&_button:disabled]:opacity-[.45] tw:[&_button:disabled]:cursor-not-allowed
        tw:[&_button:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_button:focus-visible]:[outline-offset:3px]
        tw:[&_summary:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_summary:focus-visible]:[outline-offset:3px]
        tw:[&_input:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_input:focus-visible]:[outline-offset:3px]
        tw:[&_select:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_select:focus-visible]:[outline-offset:3px] tw:[@media(max-width:600px)]:p-[1rem_.75rem]
    `,
    'expense-header': String.raw`
        tw:ui-row tw:justify-between tw:gap-[1rem] tw:[&_h1]:[letter-spacing:-.04em] tw:[&_p]:text-secondary
        tw:[@media(max-width:850px)]:flex-col tw:[@media(max-width:850px)]:items-start
    `,
    'expense-toolbar': String.raw`
        tw:ui-row tw:justify-between tw:gap-[1rem] tw:m-[1.4rem_0] tw:flex-wrap
        tw:[@media(max-width:600px)]:gap-[.7rem]
    `,
    'expense-form': String.raw`
        tw:[&_button:disabled]:opacity-[.45] tw:[&_button:disabled]:cursor-not-allowed
        tw:[&_input:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_input:focus-visible]:[outline-offset:3px]
        tw:[&_select:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_select:focus-visible]:[outline-offset:3px]
        tw:[&_button:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_button:focus-visible]:[outline-offset:3px]
        tw:[&_textarea:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_textarea:focus-visible]:[outline-offset:3px] tw:[&_h3]:text-[length:.95rem] tw:[&_h3]:m-[1rem_0_.6rem]
    `,
    'expense-import': String.raw`
        tw:[&_select:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_select:focus-visible]:[outline-offset:3px]
    `,
    'expense-metrics--three': String.raw`
        tw:grid-cols-[repeat(3,minmax(0,1fr))]
    `,
    'expense-stat--hero': String.raw`
        tw:[&&]:[background:linear-gradient(135deg,rgba(var(--accent-rgb),.17),rgba(56,189,248,.04)),var(--bg-card)]
        tw:[&&]:[border-color:var(--border-accent)]
    `,
    'expense-panel': String.raw`
        tw:[&_h3]:text-[length:.95rem] tw:[&_h3]:[line-height:1.5] tw:[@media(max-width:600px)]:p-[1rem]
        tw:[@media(max-width:600px)]:rounded-[16px]
    `,
    'expense-panel-title': String.raw`
        tw:[&_>_span]:text-[length:.78rem] tw:[&_>_span]:text-secondary
        tw:[@media(max-width:600px)]:[&_h2]:text-[length:.97rem]
    `,
    'expense-panel-title-actions': String.raw`
        tw:[&_>_span]:text-[length:.78rem] tw:[&_>_span]:text-secondary tw:[@media(max-width:600px)]:w-full
        tw:[@media(max-width:600px)]:justify-between
    `,
    'expense-hint': String.raw`
        tw:text-[length:.78rem] tw:text-secondary tw:[line-height:1.6] tw:m-[.65rem_0]
    `,
    'expense-insight': String.raw`
        tw:p-[.8rem_1rem] tw:[border-left:3px_solid_#fbbf24] tw:[background:rgba(251,191,36,.05)] tw:text-secondary
        tw:text-[length:.8rem] tw:[line-height:1.6] tw:rounded-[0_9px_9px_0]
    `,
    'expense-upcoming': String.raw`
        tw:[&_.expense-row]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_.expense-row]:p-[.95rem_0]
    `,
    'expense-row': String.raw`
        tw:[.expense-allocation_&_>_span]:text-[length:.82rem] tw:[.expense-mobile-entry_>_&]:items-start
        tw:[.expense-mobile-entry_&_>_strong]:shrink-[0]
    `,
    'expense-rule-row': String.raw`
        tw:[border-bottom:1px_solid_var(--border-primary)] tw:p-[.95rem_0] tw:[@media(max-width:600px)]:items-start
        tw:[@media(max-width:600px)]:flex-wrap
    `,
    'expense-row-actions': String.raw`
        tw:[&_button:hover]:text-accent tw:[&_button:hover]:ui-fill-muted
    `,
    'expense-icon-btn': String.raw`
        tw:[&:hover]:text-accent tw:[&:hover]:ui-fill-muted
    `,
    'expense-positive': String.raw`
        tw:[color:var(--accent-primary)]!
    `,
    'expense-negative': String.raw`
        tw:[color:#fb7185]!
    `,
    'expense-fold': String.raw`
        tw:[&_>_summary]:cursor-pointer tw:[&_>_summary]:min-h-[44px] tw:[&_>_summary]:ui-row
        tw:[&_>_summary]:gap-[.6rem] tw:[&_>_summary]:text-[length:.92rem] tw:[&_>_summary]:[font-weight:650]
        tw:[&_>_summary]:[list-style:none] tw:[&_>_summary::after]:[content:'+'] tw:[&_>_summary::after]:ml-[auto]
        tw:[&_>_summary::after]:text-[length:1.2rem] tw:[&_>_summary::after]:text-secondary
        tw:[&[open]_>_summary::after]:[content:'−'] tw:[&_summary::-webkit-details-marker]:hidden
    `,
    'expense-calendar': String.raw`
        tw:grid tw:grid-cols-[repeat(7,minmax(0,1fr))] tw:gap-[.5rem] tw:mt-[1rem]
        tw:[@media(max-width:850px)]:grid-cols-[repeat(5,minmax(0,1fr))]
        tw:[@media(max-width:600px)]:[&&]:grid-cols-[repeat(4,minmax(0,1fr))]
    `,
    'expense-filters': String.raw`
        tw:flex tw:flex-wrap tw:gap-[.6rem] tw:[&_.expense-field]:flex-[1_1_125px] tw:[&_.expense-field]:m-[0]
    `,
    'expense-field': String.raw``,
    'expense-import__category-cell': String.raw`
        tw:min-w-[170px]
    `,
    'expense-entry-name': String.raw`
        tw:flex tw:gap-[.65rem] tw:items-start
    `,
    'expense-kind': String.raw`
        tw:inline-flex tw:shrink-[0] tw:items-center tw:justify-center tw:w-[32px] tw:h-[32px] tw:rounded-[10px]
        tw:[background:rgba(129,140,248,.12)] tw:[color:#818cf8]
    `,
    'expense-kind--income': String.raw`
        tw:[&&]:[background:rgba(var(--accent-rgb),.12)] tw:[&&]:text-accent
    `,
    'expense-kind--refund': String.raw`
        tw:[&&]:[background:rgba(var(--accent-rgb),.12)] tw:[&&]:text-accent
    `,
    'expense-kind--transfer': String.raw`
        tw:[&&]:text-secondary tw:[&&]:ui-fill-muted
    `,
    'expense-allocation': String.raw`
        tw:m-[1rem_0]
    `,
    'expense-due-row': String.raw`
        tw:flex-wrap tw:[&_>_div:first-child]:flex-[1]
    `,
    'expense-spinner': String.raw`
        tw:[animation:expense-spin_1s_linear_infinite] tw:[@media(prefers-reduced-motion:reduce)]:[animation:none]
    `,
    'expense-footer': String.raw`
        tw:text-secondary tw:text-[length:.72rem] tw:text-center tw:[line-height:1.7] tw:p-[1rem_.5rem]
    `,
    'expense-sr': String.raw`
        tw:[position:absolute]! tw:w-[1px] tw:h-[1px] tw:p-[0] tw:m-[-1px] tw:overflow-hidden tw:[clip:rect(0,0,0,0)]
        tw:whitespace-nowrap tw:[border:0]
    `,
    'expense-accounts': String.raw`
        tw:[@media(max-width:1150px)]:grid-cols-[repeat(2,minmax(0,1fr))]
        tw:[@media(max-width:600px)]:grid-cols-[1fr]
    `,
    'expense-goals': String.raw`
        tw:[@media(max-width:1150px)]:grid-cols-[repeat(2,minmax(0,1fr))]
        tw:[@media(max-width:600px)]:grid-cols-[1fr]
    `,
    'expense-category-grid': String.raw`
        tw:[@media(max-width:1150px)]:grid-cols-[repeat(2,minmax(0,1fr))] tw:[@media(max-width:600px)]:gap-[.6rem]
    `,
    'expense-metrics': String.raw`
        tw:[@media(max-width:850px)]:grid-cols-[repeat(2,minmax(0,1fr))] tw:[@media(max-width:600px)]:gap-[.65rem]
    `,
    'expense-two-col': String.raw`
        tw:[@media(max-width:850px)]:grid-cols-[1fr] tw:[@media(max-width:850px)]:gap-[0]
    `,
    'expense-toolbar-actions': String.raw`
        tw:[@media(max-width:600px)]:w-full tw:[@media(max-width:600px)]:justify-between
        tw:[@media(max-width:600px)]:[&_>_.expense-btn]:flex-[1]
    `,
    'expense-btn': String.raw``,
    'expense-stat': String.raw`
        tw:[@media(max-width:600px)]:p-[1rem_.8rem] tw:[@media(max-width:600px)]:rounded-[15px]
        tw:[@media(max-width:600px)]:[&_>_strong]:text-[length:1.5rem]
        tw:[@media(max-width:600px)]:[&_>_span]:text-[length:.72rem]
        tw:[@media(max-width:600px)]:[&_>_small]:text-[length:.69rem]
    `,
    'expense-tabs': String.raw`
        tw:[@media(max-width:600px)]:[&_button]:text-[length:.8rem]
        tw:[@media(max-width:600px)]:[&_button]:p-[.65rem_.75rem]
    `,
    'expense-form-grid': String.raw`
        tw:[@media(max-width:600px)]:grid-cols-[1fr]
    `,
    'expense-progress': String.raw`
        tw:[@media(prefers-reduced-motion:reduce)]:[&_>_span]:[transition:none]
    `,
    'expense-mobile-entries': String.raw`
        tw:hidden tw:[@media(max-width:600px)]:block
    `,
    'expense-mobile-entry': String.raw`
        tw:p-[1rem_0] tw:[border-bottom:1px_solid_var(--border-primary)] tw:[&_>_small]:text-secondary
        tw:[&_>_small]:text-[length:.72rem]
    `,
    'expense-entry-table': String.raw`
        tw:[@media(max-width:600px)]:hidden
    `,
    'expense-btn--secondary': String.raw``,
    'expense-btn--quiet': String.raw``,
    'expense-export-menu': String.raw``,
    'expense-progress--over': String.raw``,
} as const;
export type expensePresentationStylePart = keyof typeof styles;
export function expensePresentationStyle(part: expensePresentationStylePart, className?: string) {
    return cn(part, styles[part], className);
}
export function expensePresentationStyleClasses(className?: string) {
    if (!className) return className;
    let changed = false;
    const resolved = className.split(/\s+/).map((part) => {
        if (Object.hasOwn(styles, part)) {
            changed = true;
            return [part, styles[part as expensePresentationStylePart]];
        }
        return part;
    });
    return changed ? cn(resolved) : className;
}
