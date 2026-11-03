import { cn } from '../../../utils/cn';
const styles = {
    'underlying-detail': String.raw`
        tw:grid tw:gap-[1rem] tw:min-w-[0]
    `,
    'underlying-detail__context': String.raw`
        tw:grid tw:gap-[0.85rem] tw:p-[1rem] tw:[border:1px_solid_rgba(16,_185,_129,_0.3)] tw:rounded-[12px]
        tw:[background:rgba(16,_185,_129,_0.07)]
    `,
    'underlying-detail__context-heading': String.raw`
        tw:flex tw:items-start tw:gap-[0.65rem] tw:text-accent tw:[&_strong]:block tw:[&_strong]:text-main
        tw:[&_strong]:text-[length:0.95rem] tw:[&_p]:m-[0.2rem_0_0] tw:[&_p]:text-secondary
        tw:[&_p]:[line-height:1.4] tw:[&_p]:wrap-anywhere
    `,
    'underlying-detail__context-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[0.6rem]
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr_1fr]
        tw:[@media(max-width:640px)]:[&&_>_div:last-child]:col-span-full
    `,
    'underlying-detail__context-note': String.raw`
        tw:m-[0] tw:text-muted tw:text-[length:0.72rem] tw:[line-height:1.45]
    `,
    'underlying-detail__loading': String.raw`
        tw:ui-row tw:justify-center tw:gap-[0.6rem] tw:min-h-[7rem] tw:p-[1rem]
        tw:[border:1px_dashed_var(--border-color)] tw:rounded-[12px] tw:text-secondary tw:text-center
    `,
    'underlying-detail__unavailable': String.raw`
        tw:ui-row tw:justify-center tw:gap-[0.6rem] tw:min-h-[7rem] tw:p-[1rem]
        tw:[border:1px_dashed_var(--border-color)] tw:rounded-[12px] tw:text-secondary tw:text-center tw:grid
        tw:gap-[0.45rem] tw:[justify-items:center] tw:[&_strong]:text-main tw:[&_p]:m-[0] tw:[&_p]:text-muted
        tw:[&_p]:[line-height:1.45] tw:[&_small]:m-[0] tw:[&_small]:text-muted tw:[&_small]:[line-height:1.45]
    `,
} as const;
export function UnderlyingAssetDetailDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
