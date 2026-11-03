import { cn } from '../../../utils/cn';

const styles = {
    'alloc-sim__header': String.raw`
        tw:mb-[var(--academy-space-section)] tw:pb-[var(--academy-space-section)]
        tw:[border-bottom:1px_solid_var(--border-color)]
    `,
    'alloc-sim__title-group': String.raw`
        tw:ui-row tw:gap-[1.5rem]
    `,
    'alloc-sim__title-icon': String.raw`
        tw:min-w-[54px] tw:w-[54px] tw:h-[54px] tw:p-[10px] tw:[background:rgba(14,_165,_233,_0.1)]
        tw:[color:#0ea5e9] tw:rounded-[12px]
    `,
    'alloc-sim__title': String.raw`
        tw:text-[length:1.85rem] tw:[font-weight:800] tw:m-[0] tw:text-main
    `,
    'alloc-sim__subtitle': String.raw`
        tw:m-[0.25rem_0_0_0] tw:text-secondary tw:text-[length:1rem]
    `,
} as const;
export function allocationHeaderStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
