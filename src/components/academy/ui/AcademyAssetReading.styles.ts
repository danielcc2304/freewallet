import { cn } from '../../../utils/cn';

const styles = {
    'asset-page__back': String.raw`
        tw:inline-flex tw:items-center tw:gap-[0.5rem] tw:text-secondary tw:[text-decoration:none]
        tw:text-[length:0.9rem] tw:mb-[2rem] tw:[transition:color_0.2s] tw:[&:hover]:text-accent
        tw:[.asset-page_&]:min-h-[44px] tw:[.asset-page_&]:mb-[.75rem] tw:[.asset-page_&]:[font-weight:600]
    `,
    'asset-page__hero': String.raw`
        tw:[background:linear-gradient(135deg,_rgba(var(--accent-rgb),_0.1),_rgba(var(--accent-rgb),_0.05))]
        tw:ui-border-default tw:p-[var(--academy-space-card-lg)] tw:rounded-[24px] tw:text-center
        tw:mb-[var(--academy-space-section)] tw:relative tw:[border-top:4px_solid_var(--hero-color)]
        tw:[&_h1]:text-[length:2.5rem] tw:[&_h1]:[font-weight:800] tw:[&_h1]:mb-[1rem]
        tw:[@media(max-width:768px)]:p-[2rem_1rem] tw:[@media(max-width:768px)]:[&_h1]:text-[length:2rem]
        tw:[@media(max-width:850px)]:p-[2.5rem_1.5rem] tw:[@media(max-width:850px)]:rounded-[20px]
        tw:[@media(max-width:850px)]:mb-[2rem] tw:[@media(max-width:850px)]:[&_h1]:text-[length:2rem]
        tw:[@media(max-width:480px)]:[&&_h1]:text-[length:1.75rem]
        tw:[.academy\_\_content_>_.asset-page_>_&]:p-[1.5rem] tw:[.academy\_\_content_>_.asset-page_>_&]:text-left
        tw:[.academy\_\_content_>_.asset-page_>_&]:[border-top:3px_solid_var(--asset-color)]
        tw:[.academy\_\_content_>_.asset-page_>_&]:[background:linear-gradient(125deg,_var(--guide-tint),_var(--guide-surface))]
        tw:[.asset-page_&_.page-header\_\_eyebrow]:static tw:[.asset-page_&_.page-header\_\_eyebrow]:mb-[1rem]
        tw:[.academy\_\_content_>_.asset-page_>_&_h1]:text-[length:clamp(1.55rem,_3vw,_2.25rem)]
        tw:[.academy\_\_content_>_.asset-page_>_&_.asset-page\_\_hero-sub]:max-w-[70ch]
    `,
    'asset-page__hero-icon': String.raw`
        tw:w-[80px] tw:h-[80px] tw:[background:white] tw:rounded-[20px] tw:ui-row tw:justify-center
        tw:m-[0_auto_1.5rem] tw:[color:var(--hero-color)] tw:[box-shadow:0_10px_25px_rgba(0,_0,_0,_0.05)]
        tw:[.asset-page_&]:w-[52px] tw:[.asset-page_&]:h-[52px] tw:[.asset-page_&]:m-[.75rem_0_1rem]
        tw:[.asset-page_&]:rounded-[15px] tw:[.asset-page_&]:[background:var(--guide-surface)]
        tw:[.asset-page_&]:ui-border-default tw:[.asset-page_&]:[box-shadow:none] tw:[.asset-page_&_svg]:w-[28px]
        tw:[.asset-page_&_svg]:h-[28px] tw:[@container(max-width:620px)]:[.asset-page_&]:hidden
    `,
    'asset-page__hero-sub': String.raw`
        tw:text-[length:1.1rem] tw:text-secondary tw:max-w-[700px] tw:m-[0_auto_var(--academy-space-stack)]
        tw:[line-height:1.6]
    `,
    'asset-page__hero-stats': String.raw`
        tw:flex tw:justify-center tw:items-stretch tw:gap-[var(--academy-space-section)] tw:flex-wrap
        tw:[@media(max-width:768px)]:gap-[1.5rem] tw:[@media(max-width:850px)]:gap-[1.5rem]
        tw:[@media(max-width:850px)]:justify-center tw:[@media(max-width:480px)]:[&]:flex-col
        tw:[@media(max-width:480px)]:[&]:gap-[1rem] tw:[@media(max-width:480px)]:[&]:items-center
        tw:[.asset-page_&]:grid tw:[.asset-page_&]:grid-cols-[repeat(3,_minmax(0,_1fr))]
        tw:[.asset-page_&]:gap-[.75rem] tw:[.asset-page_&]:mt-[1.5rem]
        tw:[@container(max-width:620px)]:[.asset-page_&]:grid-cols-[1fr]
        tw:[@container(max-width:620px)]:[.asset-page_&]:gap-[.5rem]
    `,
    'hero-stat': String.raw`
        tw:[.asset-page_&]:min-w-[0] tw:[.asset-page_&]:text-left tw:[.asset-page_&]:p-[1rem]
        tw:[.asset-page_&]:ui-border-default tw:[.asset-page_&]:rounded-[12px]
        tw:[.asset-page_&]:[background:var(--guide-surface)] tw:[.asset-page_&]:justify-center
        tw:[@container(max-width:620px)]:[.asset-page_&]:flex-row
        tw:[@container(max-width:620px)]:[.asset-page_&]:justify-between
        tw:[@container(max-width:620px)]:[.asset-page_&]:items-center
        tw:[@container(max-width:620px)]:[.asset-page_&]:gap-[.75rem]
        tw:[@container(max-width:620px)]:[.asset-page_&]:p-[.75rem]
    `,
    'hero-stat__value': String.raw`
        tw:[font-weight:800] tw:[color:var(--hero-color)] tw:[@media(max-width:768px)]:text-[length:1.25rem]
        tw:[@media(max-width:480px)]:[&]:text-[length:1.25rem]
        tw:[.asset-page_&]:text-[length:clamp(1rem,_2.5vw,_1.4rem)] tw:[.asset-page_&]:text-main
    `,
    'hero-stat__label': String.raw`
        tw:[text-transform:uppercase] tw:[letter-spacing:0.05em] tw:[font-weight:600]
        tw:[.asset-page_&]:text-[length:.78rem] tw:[.asset-page_&]:[text-transform:none]
        tw:[.asset-page_&]:[letter-spacing:0] tw:[.asset-page_&]:[line-height:1.4] tw:[.asset-page_&]:text-secondary
        tw:[@container(max-width:620px)]:[.asset-page_&]:text-right
        tw:[@container(max-width:620px)]:[.asset-page_&]:max-w-[50%]
    `,
    'asset-page__text-block': String.raw`
        tw:text-[length:1.05rem] tw:[line-height:1.7] tw:text-secondary tw:ui-stack tw:gap-[1.25rem]
        tw:[&_strong]:text-main tw:[.asset-page_&]:text-[length:1rem] tw:[.asset-page_&]:[line-height:1.75]
        tw:[.asset-page_&]:gap-[.8rem] tw:[.asset-page_&_p]:m-[0]
    `,
    'asset-page__cta-link': String.raw`
        tw:inline-block tw:mt-[0.55rem] tw:text-accent tw:[font-weight:700] tw:[text-decoration:none]
        tw:[&:hover]:[text-decoration:underline]
    `,
    'asset-guide-nav': String.raw`
        tw:p-[1rem_0_1.5rem] tw:mb-[1.5rem] tw:[border-bottom:1px_solid_var(--border-color)] tw:[&_a]:inline-flex
        tw:[&_a]:items-center tw:[&_a]:min-h-[44px] tw:[&_a]:p-[.5rem_.85rem] tw:[&_a]:ui-border-default
        tw:[&_a]:rounded-[10px] tw:[&_a]:text-main tw:[&_a]:[background:var(--guide-surface)]
        tw:[&_a]:text-[length:.85rem] tw:[&_a]:[line-height:1.4] tw:[&_a]:[text-decoration:none]
        tw:[&_a:hover]:[background:var(--guide-tint)] tw:[&_a:hover]:[border-color:var(--asset-color)]
    `,
    'asset-guide-nav__label': String.raw`
        tw:block tw:text-[length:.8rem] tw:[font-weight:700] tw:text-secondary tw:mb-[.65rem]
    `,
    'asset-guide-nav__links': String.raw`
        tw:flex tw:flex-wrap tw:gap-[.5rem]
    `,
} as const;
export function assetReadingStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
