import { cn } from '../../../utils/cn';

const styles = {
    'spread-sim': String.raw`
        tw:mt-[2rem] tw:ui-fill-surface tw:ui-border-default tw:rounded-[20px] tw:p-[1.5rem]
        tw:[&_h3]:m-[0_0_0.6rem] tw:[&_h3]:text-[length:1.15rem] tw:[&_h3]:[font-weight:700]
        tw:[.asset-page_&_button]:min-h-[44px] tw:[.asset-page_&_button]:text-[length:.85rem]
        tw:[.asset-page_&_button]:[line-height:1.4]
    `,
    'spread-sim__intro': String.raw`
        tw:m-[0_0_1rem] tw:text-secondary tw:text-[length:0.9rem] tw:[line-height:1.5]
    `,
    'spread-sim__mode': String.raw`
        tw:inline-flex tw:gap-[0.4rem] tw:ui-fill-muted tw:ui-border-default tw:rounded-[999px] tw:p-[0.2rem]
        tw:mb-[1rem]
    `,
    'spread-sim__preset-buttons': String.raw`
        tw:flex tw:gap-[0.75rem] tw:flex-wrap tw:mb-[1rem]
    `,
    'spread-sim__stress-presets': String.raw`
        tw:flex tw:gap-[0.5rem] tw:flex-wrap tw:m-[0_0_1rem]
    `,
    'spread-sim__controls': String.raw`
        tw:grid tw:grid-cols-[1fr_1fr] tw:gap-[1rem] tw:mb-[1rem] tw:[@media(max-width:850px)]:grid-cols-[1fr]
        tw:[@container(max-width:620px)]:[.asset-page_&]:grid-cols-[1fr]
    `,
    'spread-sim__result': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] tw:gap-[0.75rem]
    `,
    'spread-sim__note': String.raw`
        tw:m-[0.85rem_0_0] tw:text-[length:0.78rem] tw:text-muted tw:[line-height:1.45]
    `,
    'bond-duration-calc': String.raw`
        tw:mt-[1.75rem] tw:ui-fill-surface tw:ui-border-default tw:rounded-[18px] tw:p-[1.25rem]
    `,
    'bond-duration-calc__inputs': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))] tw:gap-[1rem]
    `,
    'bond-duration-calc__summary': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(170px,_1fr))] tw:gap-[0.75rem] tw:mt-[1rem]
    `,
} as const;
export function experimentStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
