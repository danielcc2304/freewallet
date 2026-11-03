import { cn } from '../../../utils/cn';
const styles = {
    'fund-transfer': String.raw`
        tw:grid tw:gap-[1rem]
    `,
    'fund-transfer__notice': String.raw`
        tw:m-[0] tw:text-secondary tw:[line-height:1.5] tw:p-[.75rem] tw:rounded-control
        tw:[background:color-mix(in_srgb,_var(--accent-primary)_10%,_transparent)]
    `,
    'fund-transfer__disclaimer': String.raw`
        tw:m-[0] tw:text-secondary tw:[line-height:1.5] tw:text-[length:.85rem]
    `,
    'fund-transfer__source': String.raw`
        tw:m-[0] tw:text-secondary tw:[line-height:1.5]
    `,
    'fund-transfer__execution-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[.75rem]
        tw:[@media(max-width:560px)]:grid-cols-[minmax(0,_1fr)]
    `,
    'fund-transfer__full': String.raw`
        tw:flex tw:items-start tw:gap-[.6rem] tw:text-main tw:[line-height:1.45] tw:cursor-pointer
        tw:[&_input[type="checkbox"]]:flex-[0_0_1.125rem] tw:[&_input[type="checkbox"]]:w-[1.125rem]
        tw:[&_input[type="checkbox"]]:min-w-[1.125rem] tw:[&_input[type="checkbox"]]:h-[1.125rem]
        tw:[&_input[type="checkbox"]]:m-[.15rem_0_0] tw:[&_input[type="checkbox"]]:p-[0]
        tw:[&_input[type="checkbox"]]:[border:0] tw:[&_input[type="checkbox"]]:rounded-[.2rem]
        tw:[&_input[type="checkbox"]]:ui-fill-transparent tw:[&_input[type="checkbox"]]:[box-shadow:none]
        tw:[&_input[type="checkbox"]]:[accent-color:var(--accent-primary)]
        tw:[&_input[type="checkbox"]:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_input[type="checkbox"]:focus-visible]:[outline-offset:2px]
        tw:[html[data-appearance="liquid-glass"]_&_input[type="checkbox"]]:[border:0]
        tw:[html[data-appearance="liquid-glass"]_&_input[type="checkbox"]]:ui-fill-transparent
        tw:[html[data-appearance="liquid-glass"]_&_input[type="checkbox"]]:[box-shadow:none]
        tw:[html[data-appearance="liquid-glass"]_&_input[type="checkbox"]]:[backdrop-filter:none]
        tw:[html[data-appearance="liquid-glass"]_&_input[type="checkbox"]]:[-webkit-backdrop-filter:none]
    `,
    'fund-transfer__preview': String.raw`
        tw:grid tw:gap-[.65rem] tw:m-[0] tw:p-[.9rem] tw:ui-border-default tw:rounded-control tw:[&_div]:flex
        tw:[&_div]:justify-between tw:[&_div]:gap-[1rem] tw:[&_dt]:text-secondary tw:[&_dd]:m-[0] tw:[&_dd]:text-main
        tw:[&_dd]:[font-weight:600] tw:[&_dd]:text-right
    `,
    'fund-transfer__error': String.raw`
        tw:m-[0] tw:text-negative
    `,
    'fund-transfer__actions': String.raw`
        tw:flex tw:justify-end tw:gap-[.75rem] tw:pt-[.25rem]
    `,
    'fund-transfer__fieldset': String.raw`
        tw:[border:0] tw:p-[0] tw:m-[0] tw:min-w-[0] tw:grid tw:gap-[1rem]
    `,
    'fund-transfer__destination-mode': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[.5rem]
    `,
    'fund-transfer__new-fund': String.raw`
        tw:grid tw:gap-[.75rem] tw:p-[.9rem] tw:ui-border-default tw:rounded-control tw:[&_p]:m-[0]
        tw:[&_small]:text-secondary tw:[&_small]:[line-height:1.5]
    `,
} as const;
export function FundTransferDialogDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
