import { cn } from '../../../utils/cn';

const styles = {
    'bond-anatomy': String.raw`
        tw:ui-fill-muted tw:p-[2rem] tw:rounded-[20px] tw:mt-[2rem] tw:[&_h3]:text-center tw:[&_h3]:mb-[1.5rem]
        tw:[&_h3]:text-[length:1.25rem]
    `,
    'duration-visual': String.raw`
        tw:ui-fill-surface tw:p-[2rem] tw:rounded-[24px] tw:ui-border-default tw:m-[2rem_0]
    `,
    'duration-bars': String.raw`
        tw:ui-stack tw:gap-[1.25rem] tw:mt-[1.5rem]
    `,
    'inflation-visual': String.raw`
        tw:ui-fill-surface tw:p-[2.5rem] tw:rounded-[24px] tw:ui-border-default tw:m-[2rem_0] tw:[&_h3]:text-center
        tw:[&_h3]:mb-[2rem] tw:[&_h3]:text-[length:1.25rem]
    `,
    'inflation-bars': String.raw`
        tw:ui-stack tw:gap-[1.25rem]
    `,
    'convexity-explainer': String.raw`
        tw:ui-fill-surface tw:p-[2.5rem] tw:rounded-[24px] tw:ui-border-default tw:m-[2rem_0] tw:[&_h3]:text-center
        tw:[&_h3]:mb-[2rem] tw:[&_h3]:text-[length:1.25rem]
    `,
    'convexity-content': String.raw`
        tw:ui-row tw:gap-[3rem] tw:[@media(max-width:768px)]:flex-col tw:[@media(max-width:768px)]:gap-[2rem]
        tw:[@media(max-width:850px)]:flex-col tw:[@media(max-width:850px)]:gap-[2rem]
    `,
    'convexity-text': String.raw`
        tw:flex-[1] tw:[&_p]:text-[length:1rem] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.6]
        tw:[&_p]:mb-[1rem] tw:[&_ul]:[list-style:none] tw:[&_ul]:p-[0] tw:[&_ul]:m-[1.5rem_0] tw:[&_ul]:ui-stack
        tw:[&_ul]:gap-[0.75rem] tw:[&_li]:text-[length:0.95rem] tw:[&_li]:text-main tw:[&_li]:[font-weight:600]
        tw:[&_li]:pl-[1.5rem] tw:[&_li]:relative tw:[&_li::before]:[content:'★'] tw:[&_li::before]:absolute
        tw:[&_li::before]:left-[0] tw:[&_li::before]:[color:#10b981]
    `,
    'convexity-chart': String.raw`
        tw:flex-[1] tw:min-w-[300px] tw:[@media(max-width:768px)]:w-full tw:[@media(max-width:768px)]:min-w-[0]
        tw:[.asset-page_&]:min-w-[0]
    `,
    'convexity-chart__visual': String.raw`
        tw:ui-fill-muted tw:p-[1.5rem] tw:rounded-[20px] tw:relative tw:pt-[2.5rem]
    `,
    'convexity-chart__label': String.raw`
        tw:absolute tw:text-[length:0.75rem] tw:[font-weight:700] tw:text-muted
    `,
    'convexity-chart__label--top': String.raw`
        tw:[&.convexity-chart\_\_label--top]:top-[1rem] tw:[&.convexity-chart\_\_label--top]:left-[50%]
        tw:[&.convexity-chart\_\_label--top]:[transform:translateX(-50%)]
    `,
    'convexity-chart__label--bottom': String.raw`
        tw:[&.convexity-chart\_\_label--bottom]:bottom-[0.5rem]
        tw:[&.convexity-chart\_\_label--bottom]:right-[1.5rem]
    `,
    'convexity-svg': String.raw`
        tw:w-full tw:h-[auto]
    `,
    'yield-curve-card': String.raw`
        tw:[&&]:[border-top:4px_solid_var(--curve-color)] tw:[&_h4]:m-[0]
    `,
    'yield-curve-card__signal': String.raw`
        tw:text-[length:0.8rem] tw:[font-weight:700] tw:p-[0.2rem_0.6rem] tw:rounded-[100px] tw:mt-[0.5rem]
        tw:inline-block
    `,
    'mini-curve': String.raw`
        tw:flex tw:items-end tw:gap-[1rem] tw:mt-[2rem] tw:h-[120px] tw:pb-[2rem]
        tw:[border-bottom:2px_solid_var(--border-color)]
    `,
    'mini-curve__bar-group': String.raw`
        tw:flex-[1] tw:ui-stack tw:items-center tw:relative
    `,
    'mini-curve__bar': String.raw`
        tw:w-full tw:min-w-[15px] tw:rounded-[4px_4px_0_0] tw:[transition:height_0.3s_ease]
    `,
    'mini-curve__label': String.raw`
        tw:absolute tw:bottom-[-20px] tw:text-[length:0.7rem] tw:[font-weight:700] tw:text-muted
    `,
    'mini-curve__val': String.raw`
        tw:absolute tw:top-[-20px] tw:text-[length:0.7rem] tw:[font-weight:800]
    `,
    'bond-ladder__step': String.raw`
        tw:ui-fill-surface tw:ui-border-default tw:rounded-[14px] tw:p-[1rem] tw:[&&]:[border-top:4px_solid_#10b981]
        tw:[&&:nth-child(2)]:[border-top-color:#3b82f6] tw:[&&:nth-child(3)]:[border-top-color:#8b5cf6]
        tw:[&&:nth-child(4)]:[border-top-color:#f59e0b] tw:[&&:nth-child(5)]:[border-top-color:#ef4444]
        tw:[&_h4]:m-[0.35rem_0] tw:[&_h4]:text-[length:1rem] tw:[&_h4]:[font-weight:700] tw:[&_p]:m-[0]
        tw:[&_p]:text-[length:0.85rem] tw:[&_p]:text-secondary
    `,
    'bond-ladder__rung': String.raw`
        tw:text-[length:0.72rem] tw:[text-transform:uppercase] tw:[font-weight:800] tw:text-muted
        tw:[letter-spacing:0.04em]
    `,
    'bond-ladder__hint': String.raw`
        tw:inline-block tw:mt-[0.7rem] tw:text-[length:0.75rem] tw:[color:#065f46] tw:[background:#ecfdf5]
        tw:rounded-[999px] tw:p-[0.2rem_0.55rem] tw:[font-weight:700]
        tw:[.asset-page_&]:[background:var(--guide-tint)] tw:[.asset-page_&]:text-main
    `,
    'duration-input-card': String.raw`
        tw:ui-fill-muted tw:ui-border-default tw:rounded-[12px] tw:p-[0.9rem] tw:[&_h4]:m-[0_0_0.8rem]
        tw:[&_h4]:text-[length:0.95rem] tw:[&_label]:ui-stack tw:[&_label]:gap-[0.45rem] tw:[&_label]:mb-[0.65rem]
        tw:[&_label:last-child]:mb-[0] tw:[&_label_span]:text-[length:0.8rem] tw:[&_label_span]:text-secondary
        tw:[&_label_span]:[font-weight:700] tw:[&_input[type='range']]:w-full
    `,
    'duration-summary-card': String.raw`
        tw:ui-fill-muted tw:ui-border-default tw:rounded-[12px] tw:p-[0.75rem] tw:[&_span]:block
        tw:[&_span]:text-[length:0.74rem] tw:[&_span]:text-muted tw:[&_span]:[text-transform:uppercase]
        tw:[&_span]:[font-weight:800] tw:[&_span]:mb-[0.2rem] tw:[&_strong]:text-[length:1.1rem]
        tw:[&_strong]:[font-weight:800] tw:[&_.is-negative]:[color:#ef4444] tw:[&_.is-positive]:[color:#10b981]
    `,
    'duration-mix': String.raw`
        tw:mt-[1rem] tw:ui-fill-muted tw:ui-border-default tw:rounded-[12px] tw:p-[0.85rem]
        tw:[&_h4]:m-[0_0_0.75rem] tw:[&_h4]:text-[length:0.88rem]
    `,
    'duration-mix__bars': String.raw`
        tw:ui-stack tw:gap-[0.5rem]
    `,
    'spread-sim__control': String.raw`
        tw:ui-stack tw:gap-[0.5rem] tw:[&_span]:text-[length:0.82rem] tw:[&_span]:[font-weight:700]
        tw:[&_span]:text-secondary tw:[&_input[type='range']]:w-full
    `,
    'spread-sim__metric': String.raw`
        tw:ui-fill-muted tw:ui-border-default tw:rounded-[12px] tw:p-[0.8rem] tw:[&_strong]:text-[length:1.1rem]
        tw:[&_strong]:[font-weight:800] tw:[&_strong.is-negative]:[color:#ef4444]
        tw:[&_strong.is-positive]:[color:#10b981]
    `,
    'spread-sim__metric-label': String.raw`
        tw:block tw:text-[length:0.72rem] tw:[text-transform:uppercase] tw:[letter-spacing:0.03em] tw:text-muted
        tw:mb-[0.25rem]
    `,
    'spread-sim__mode-btn': String.raw`
        tw:[border:0] tw:ui-fill-transparent tw:text-secondary tw:rounded-[999px] tw:p-[0.35rem_0.75rem]
        tw:text-[length:0.78rem] tw:[font-weight:700] tw:cursor-pointer tw:[&.is-active]:ui-fill-surface
        tw:[&.is-active]:text-main tw:[&.is-active]:[box-shadow:0_1px_2px_rgba(0,_0,_0,_0.08)]
    `,
    'spread-sim__preset': String.raw`
        tw:ui-border-default tw:ui-fill-muted tw:text-main tw:rounded-[10px] tw:p-[0.45rem_0.8rem]
        tw:text-[length:0.82rem] tw:[font-weight:700] tw:cursor-pointer
        tw:[&.is-active]:[border-color:var(--accent-primary)] tw:[&.is-active]:text-accent
        tw:[&.is-active]:[background:rgba(var(--accent-rgb),_0.08)]
    `,
    'spread-sim__stress-btn': String.raw`
        tw:[border:1px_solid_#fecaca] tw:[background:#fff5f5] tw:[color:#991b1b] tw:rounded-[8px]
        tw:p-[0.32rem_0.58rem] tw:text-[length:0.76rem] tw:[font-weight:700] tw:cursor-pointer
        tw:[&.is-active]:[background:#ef4444] tw:[&.is-active]:[border-color:#ef4444] tw:[&.is-active]:[color:#fff]
        tw:[.asset-page_&]:ui-fill-muted tw:[.asset-page_&]:text-main
        tw:[.asset-page_&]:[border-color:var(--border-color)]
        tw:[.asset-page_&.is-active]:[background:var(--text-primary)]
        tw:[.asset-page_&.is-active]:[color:var(--bg-primary)]
    `,
    'cta-box': String.raw`
        tw:ui-fill-surface tw:ui-border-default tw:rounded-[24px] tw:p-[3rem] tw:text-center tw:relative
        tw:overflow-hidden tw:[&&]:[border-top:4px_solid_var(--accent-primary)] tw:m-[2rem_0]
        tw:[.asset-page_&]:p-[1.5rem]
    `,
    'cta-box__content': String.raw`
        tw:[&_h3]:text-[length:1.5rem] tw:[&_h3]:[font-weight:800] tw:[&_h3]:mb-[1rem] tw:[&_h3]:text-main
        tw:[&_p]:text-secondary tw:[&_p]:text-[length:1.1rem] tw:[&_p]:mb-[2rem] tw:[&_p]:max-w-[600px]
        tw:[&_p]:ml-[auto] tw:[&_p]:mr-[auto]
    `,
    'cta-box__button': String.raw`
        tw:inline-flex tw:items-center tw:justify-center tw:gap-[0.75rem] tw:[background:var(--accent-primary)]
        tw:[color:white]! tw:p-[1rem_2rem] tw:rounded-[12px] tw:[font-weight:700] tw:[text-decoration:none]
        tw:[transition:all_0.2s_ease] tw:[box-shadow:0_4px_12px_rgba(var(--accent-rgb),_0.2)]
        tw:[&:hover]:[transform:translateY(-2px)] tw:[&:hover]:[background:var(--accent-secondary)]
        tw:[&:hover]:[box-shadow:0_6px_16px_rgba(var(--accent-rgb),_0.3)] tw:[.asset-page_&]:max-w-full
        tw:[.asset-page_&]:box-border tw:[.asset-page_&]:[line-height:1.5] tw:[.asset-page_&]:text-center
    `,
} as const;
export function bondPartStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
