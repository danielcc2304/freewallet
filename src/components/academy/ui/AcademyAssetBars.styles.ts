import { cn } from '../../../utils/cn';

const styles = {
    'duration-bar': String.raw`
        tw:ui-row tw:gap-[1.5rem]
    `,
    'duration-bar__label': String.raw`
        tw:w-[80px] tw:text-[length:0.9rem] tw:[font-weight:700]
    `,
    'duration-bar__track': String.raw`
        tw:flex-[1] tw:h-[12px] tw:ui-fill-muted tw:rounded-[100px] tw:overflow-hidden
    `,
    'duration-bar__fill': String.raw`
        tw:h-full tw:rounded-[100px]
    `,
    'duration-bar__value': String.raw`
        tw:w-[60px] tw:text-[length:0.9rem] tw:[font-weight:800] tw:text-right
    `,
    'inflation-bar': String.raw`
        tw:ui-row tw:gap-[1.5rem] tw:[@media(max-width:768px)]:gap-[0.75rem]
    `,
    'inflation-bar__label': String.raw`
        tw:w-[70px] tw:text-[length:0.9rem] tw:[font-weight:700] tw:[@media(max-width:768px)]:w-[50px]
        tw:[@media(max-width:768px)]:text-[length:0.8rem]
    `,
    'inflation-bar__track': String.raw`
        tw:flex-[1] tw:h-[12px] tw:ui-fill-muted tw:rounded-[100px] tw:overflow-hidden
    `,
    'inflation-bar__fill': String.raw`
        tw:h-full tw:[background:#ef4444] tw:rounded-[100px]
    `,
    'inflation-bar__value': String.raw`
        tw:w-[80px] tw:text-[length:0.9rem] tw:[font-weight:800] tw:text-right tw:[color:#ef4444]
        tw:[@media(max-width:768px)]:w-[60px] tw:[@media(max-width:768px)]:text-[length:0.8rem]
    `,
    'duration-mix__row': String.raw`
        tw:grid tw:grid-cols-[50px_1fr_52px] tw:items-center tw:gap-[0.6rem] tw:[&_span]:text-[length:0.78rem]
        tw:[&_span]:[font-weight:700] tw:[&_span]:text-secondary tw:[&_strong]:text-[length:0.78rem]
        tw:[&_strong]:text-right
    `,
    'duration-mix__track': String.raw`
        tw:h-[10px] tw:[background:rgba(100,_116,_139,_0.15)] tw:rounded-[999px] tw:overflow-hidden
    `,
    'duration-mix__fill': String.raw`
        tw:h-full tw:rounded-[999px]
    `,
    'duration-mix__fill--short': String.raw`
        tw:[&.duration-mix\_\_fill--short]:[background:#10b981]
    `,
    'duration-mix__fill--mid': String.raw`
        tw:[&.duration-mix\_\_fill--mid]:[background:#3b82f6]
    `,
    'duration-mix__fill--long': String.raw`
        tw:[&.duration-mix\_\_fill--long]:[background:#ef4444]
    `,
    'rating-row': String.raw`
        tw:ui-row tw:gap-[1.5rem] tw:mb-[0.75rem] tw:[@container(max-width:620px)]:[.asset-page_&]:gap-[.5rem]
        tw:[@container(max-width:620px)]:[.asset-page_&]:flex-wrap
    `,
    'rating-row__badge': String.raw`
        tw:w-[60px] tw:p-[0.3rem_0] tw:rounded-[6px] tw:[color:white] tw:[font-weight:800] tw:text-center
        tw:text-[length:0.85rem] tw:[.asset-page_&]:flex-[0_0_60px]
    `,
    'rating-row__bar-container': String.raw`
        tw:flex-[1] tw:h-[8px] tw:[background:rgba(0,_0,_0,_0.05)] tw:rounded-[100px]
        tw:[.asset-page_&]:min-w-[40px] tw:[.asset-page_&]:ui-fill-surface
    `,
    'rating-row__bar': String.raw`
        tw:h-full tw:rounded-[100px] tw:opacity-[0.7]
    `,
    'rating-row__info': String.raw`
        tw:w-[180px] tw:ui-stack tw:[@media(max-width:768px)]:w-[auto] tw:[@media(max-width:768px)]:flex-[1]
        tw:[@container(max-width:620px)]:[.asset-page_&]:w-[auto]
        tw:[@container(max-width:620px)]:[.asset-page_&]:flex-[1_1_100%]
    `,
    'rating-row__label': String.raw`
        tw:text-[length:0.85rem] tw:[font-weight:700]
    `,
    'rating-row__example': String.raw`
        tw:text-[length:0.7rem] tw:text-muted
    `,
    'rating-scale__divider': String.raw`
        tw:flex tw:justify-between tw:pt-[1rem] tw:[border-top:1px_dashed_var(--border-color)] tw:mt-[1rem]
        tw:text-[length:0.75rem] tw:[font-weight:800] tw:text-muted
        tw:[@container(max-width:620px)]:[.asset-page_&]:gap-[.75rem]
        tw:[@container(max-width:620px)]:[.asset-page_&]:flex-wrap
    `,
} as const;
export function assetBarStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
