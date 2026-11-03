import { cn } from '../../../utils/cn';
const styles = {
    'portfolio-builder': String.raw`
        tw:max-w-[1000px] tw:m-[0_auto] tw:p-[0_1.5rem_4rem] tw:overflow-x-hidden
    `,
    'portfolio-builder__section-title': String.raw`
        tw:text-[length:1.75rem] tw:[font-weight:700] tw:m-[3rem_0_1.5rem] tw:text-main
        tw:[.strategy-page_&]:text-[length:1.4rem] tw:[.strategy-page_&]:m-[0_0_.65rem]
    `,
    'portfolio-builder__filters': String.raw`
        tw:ui-fill-surface tw:ui-border-default tw:rounded-[18px] tw:p-[1.25rem] tw:mb-[2rem]
    `,
    'portfolio-builder__filters-reset': String.raw`
        tw:ui-border-default tw:ui-fill-transparent tw:text-secondary tw:rounded-[10px] tw:p-[0.45rem_0.75rem]
        tw:cursor-pointer tw:[&:hover]:text-main tw:[&:hover]:[border-color:var(--accent-primary)]
        tw:[.strategy-page_&]:min-h-[44px] tw:[.strategy-page_&]:p-[.65rem_.9rem]
    `,
    'strategy-page': String.raw`
        tw:min-w-[0] tw:overflow-visible tw:[&_section[id]]:[scroll-margin-top:5rem] tw:[&_h2]:text-[length:1.4rem]
        tw:[&_h2]:text-main tw:[&_h2]:m-[0_0_.65rem] tw:[&_p]:[line-height:1.6] tw:[&_p]:wrap-anywhere
        tw:[&_:is(button,a,input):focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_:is(button,a,input):focus-visible]:[outline-offset:3px]
        tw:[&_.portfolio-builder\_\_filter-chip]:min-h-[44px]
        tw:[&_.portfolio-builder\_\_filter-chip]:p-[.65rem_.9rem] tw:[&_input]:min-w-[0] tw:[&_input]:w-full
        tw:[&_input]:min-h-[44px] tw:[&_input]:ui-border-strong tw:[&_input]:rounded-[10px]
        tw:[&_input]:ui-fill-muted tw:[&_input]:text-main tw:[&_input]:p-[.65rem] tw:[&_input]:[font-family:inherit]
        tw:[&_input]:[font-size:inherit] tw:[&_input]:[font-weight:inherit] tw:[&_input]:[font-style:inherit]
        tw:[&_input]:[font-variant:inherit] tw:[&_input]:[font-stretch:inherit] tw:[&_input]:[line-height:inherit]
    `,
    'strategy-nav': String.raw`
        tw:flex tw:flex-wrap tw:gap-[.5rem] tw:m-[1rem_0_1.5rem] tw:[&_a]:inline-flex tw:[&_a]:items-center
        tw:[&_a]:justify-center tw:[&_a]:gap-[.5rem] tw:[&_a]:min-h-[44px] tw:[&_a]:p-[.65rem_.9rem]
        tw:[&_a]:ui-border tw:[&_a]:rounded-[12px] tw:[&_a]:text-main tw:[&_a]:ui-fill-surface
        tw:[&_a]:[font-family:inherit] tw:[&_a]:[font-style:inherit] tw:[&_a]:[font-variant:inherit]
        tw:[&_a]:[font-stretch:inherit] tw:[&_a]:[line-height:inherit] tw:[&_a]:text-[length:.85rem]
        tw:[&_a]:[font-weight:600] tw:[&_a]:[text-decoration:none] tw:[&_a]:cursor-pointer tw:[&_a]:whitespace-normal
        tw:[@media(max-width:640px)]:[&&_a]:flex-[1_1_40%]
    `,
    'strategy-button': String.raw`
        tw:inline-flex tw:items-center tw:justify-center tw:gap-[.5rem] tw:min-h-[44px] tw:p-[.65rem_.9rem]
        tw:ui-border tw:rounded-[12px] tw:text-main tw:ui-fill-surface tw:[font-family:inherit]
        tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit]
        tw:text-[length:.85rem] tw:[font-weight:600] tw:[text-decoration:none] tw:cursor-pointer tw:whitespace-normal
        tw:[&:disabled]:opacity-[.5] tw:[&:disabled]:cursor-not-allowed
    `,
    'strategy-links': String.raw`
        tw:[&_a]:inline-flex tw:[&_a]:items-center tw:[&_a]:justify-center tw:[&_a]:gap-[.5rem] tw:[&_a]:min-h-[44px]
        tw:[&_a]:p-[.65rem_.9rem] tw:[&_a]:ui-border tw:[&_a]:rounded-[12px] tw:[&_a]:text-main
        tw:[&_a]:ui-fill-surface tw:[&_a]:[font-family:inherit] tw:[&_a]:[font-style:inherit]
        tw:[&_a]:[font-variant:inherit] tw:[&_a]:[font-stretch:inherit] tw:[&_a]:[line-height:inherit]
        tw:[&_a]:text-[length:.85rem] tw:[&_a]:[font-weight:600] tw:[&_a]:[text-decoration:none]
        tw:[&_a]:cursor-pointer tw:[&_a]:whitespace-normal tw:flex tw:flex-wrap tw:gap-[.65rem] tw:mt-[1rem]
    `,
    'strategy-button--primary': String.raw`
        tw:[&.strategy-button--primary]:[background:var(--accent-primary)]
        tw:[&.strategy-button--primary]:[color:#062b22]
        tw:[&.strategy-button--primary]:[border-color:var(--accent-primary)] tw:[.strategy-plan_>_&]:mt-[1rem]
    `,
    'portfolio-builder__filter-chip': String.raw``,
    'strategy-model': String.raw`
        tw:ui-stack tw:gap-[.65rem] tw:[&_h3]:text-[length:1.1rem] tw:[&_h3]:text-main tw:[&_h3]:m-[0] tw:[&_p]:m-[0]
        tw:[&_p]:text-secondary tw:[&_p]:text-[length:.85rem] tw:[&_.strategy-model\_\_mix]:text-[length:.75rem]
        tw:[&_.strategy-model\_\_mix]:text-muted
    `,
    'strategy-model--selected': String.raw`
        tw:[&.strategy-model--selected]:[border-color:var(--accent-primary)]
    `,
    'strategy-model__mix': String.raw``,
    'strategy-show-more': String.raw`
        tw:m-[1rem_0_.5rem]
    `,
    'strategy-plan': String.raw`
        tw:mt-[2rem] tw:[@media(max-width:640px)]:[&&]:p-[1rem]
    `,
    'strategy-comparison': String.raw`
        tw:mt-[2rem] tw:[@media(max-width:640px)]:[&&]:p-[1rem]
    `,
    'strategy-profile': String.raw`
        tw:mt-[2rem] tw:[&_h3]:text-[length:1rem] tw:[&_h3]:m-[0] tw:[&_p]:text-secondary
        tw:[&_p]:text-[length:.9rem] tw:[&_p]:m-[0] tw:[@media(max-width:640px)]:[&&]:p-[1rem]
    `,
    'strategy-assets': String.raw`
        tw:mt-[2rem]
    `,
    'strategy-weight': String.raw`
        tw:[&&]:[border-top:3px_solid_var(--asset-color)]
    `,
    'strategy-profile__grid': String.raw`
        tw:m-[1.25rem_0] tw:[&_>_article]:p-[1rem] tw:[&_>_article]:rounded-[12px] tw:[&_>_article]:ui-fill-muted
        tw:[@media(max-width:900px)]:grid-cols-[repeat(2,minmax(0,1fr))]
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'strategy-asset': String.raw``,
    'strategy-model-grid': String.raw`
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'strategy-weight-grid': String.raw`
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[repeat(2,minmax(0,1fr))]
        tw:[@media(max-width:360px)]:grid-cols-[1fr]
    `,
} as const;
export function PortfolioBuilderFrameStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
