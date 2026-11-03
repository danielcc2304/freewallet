import { cn } from '../../../utils/cn';

const styles = {
    'alloc-sim__inputs-header': String.raw`
        tw:ui-row tw:justify-between tw:mb-[var(--academy-space-section)] tw:pb-[var(--academy-space-stack)]
        tw:[border-bottom:1px_solid_var(--border-color)] tw:[@media(max-width:768px)]:flex-col
        tw:[@media(max-width:768px)]:gap-[var(--academy-space-stack)] tw:[@media(max-width:768px)]:items-start
    `,
    'alloc-sim__total': String.raw`
        tw:text-[length:1.1rem] tw:[font-weight:700] tw:text-main
    `,
    'alloc-sim__capital': String.raw`
        tw:grid tw:gap-[.5rem] tw:max-w-[320px] tw:mb-[1rem]
    `,
    'alloc-sim__validation': String.raw`
        tw:p-[.75rem] tw:[border:1px_solid_var(--color-negative)] tw:rounded-[12px] tw:text-negative
        tw:text-[length:.85rem] tw:[line-height:1.5]
    `,
    'alloc-sim__help': String.raw`
        tw:text-[length:.85rem] tw:text-muted tw:[line-height:1.6]
    `,
    'alloc-sim__disclaimer': String.raw`
        tw:ui-fill-muted tw:ui-border-default tw:p-[1.25rem] tw:rounded-[12px] tw:text-[length:0.85rem]
        tw:text-secondary tw:[line-height:1.5]
    `,
    'alloc-sim__legend': String.raw`
        tw:[list-style:none] tw:flex tw:flex-wrap tw:gap-[.75rem] tw:p-[0] tw:text-secondary tw:text-[length:.8rem]
        tw:[&_li]:ui-row tw:[&_li]:gap-[.4rem] tw:[&_span]:w-[9px] tw:[&_span]:h-[9px] tw:[&_span]:rounded-[50%]
        tw:[&_span]:shrink-[0]
    `,
    'alloc-sim__table-scroll': String.raw`
        tw:max-w-full tw:overflow-x-auto tw:m-[1rem_0] tw:[&_table]:border-collapse tw:[&_table]:w-full
        tw:[&_table]:min-w-[470px] tw:[&_table]:text-[length:.85rem] tw:[&_th]:text-left tw:[&_th]:p-[.65rem]
        tw:[&_th]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_th]:text-main tw:[&_td]:text-left
        tw:[&_td]:p-[.65rem] tw:[&_td]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_td]:text-main
        tw:[&_input]:max-w-[170px]
    `,
    'alloc-sim__correlation': String.raw`
        tw:grid tw:gap-[.5rem]
    `,
    'alloc-sim__inputs-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))] tw:gap-[var(--academy-space-section)]
        tw:grid-cols-[repeat(3,minmax(0,1fr))] tw:m-[1rem_0]
        tw:[@media(max-width:800px)]:grid-cols-[repeat(2,minmax(0,1fr))]
        tw:[@media(max-width:400px)]:[&&]:grid-cols-[1fr]
    `,
    'alloc-sim__visuals': String.raw`
        tw:grid tw:grid-cols-[1.2fr_1fr] tw:gap-[var(--academy-space-stack)]
        tw:[@media(max-width:1024px)]:grid-cols-[1fr]
    `,
} as const;
export function allocationWorkspaceStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
