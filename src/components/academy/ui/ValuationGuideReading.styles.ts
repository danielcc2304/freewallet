import { cn } from '../../../utils/cn';
const styles = {
    'valuation-guide': String.raw`
        tw:max-w-[1000px] tw:m-[0_auto] tw:p-[0_1.5rem_5rem] tw:overflow-x-hidden
    `,
    'valuation-guide__back': String.raw`
        tw:inline-flex tw:items-center tw:gap-[0.5rem] tw:text-secondary tw:[text-decoration:none]
        tw:[font-weight:500] tw:mb-[2rem] tw:[transition:color_0.2s] tw:[&:hover]:text-accent
    `,
    'valuation-guide__hero': String.raw`
        tw:[background:linear-gradient(135deg,_#3b82f6_0%,_#1d4ed8_100%)] tw:rounded-[24px] tw:p-[3rem]
        tw:[color:white] tw:mb-[3rem] tw:text-center tw:[&_h1]:text-[length:2.5rem] tw:[&_h1]:[font-weight:800]
        tw:[&_h1]:mb-[1rem] tw:[&_p]:text-[length:1.125rem] tw:[&_p]:opacity-[0.9] tw:[&_p]:max-w-[600px]
        tw:[&_p]:m-[0_auto] tw:[@media(max-width:768px)]:p-[2rem_1.5rem]
        tw:[@media(max-width:768px)]:[&_h1]:text-[length:1.85rem]
        tw:[@media(max-width:480px)]:[&_h1]:text-[length:1.6rem]
    `,
    'valuation-guide__hero-icon': String.raw`
        tw:w-[80px] tw:h-[80px] tw:[background:rgba(255,_255,_255,_0.2)] tw:rounded-[20px] tw:ui-row
        tw:justify-center tw:m-[0_auto_1.5rem]
    `,
    'valuation-guide__section': String.raw`
        tw:mb-[4rem] tw:[&_h2]:ui-row tw:[&_h2]:gap-[0.75rem] tw:[&_h2]:text-[length:1.75rem]
        tw:[&_h2]:[font-weight:700] tw:[&_h2]:mb-[1.5rem] tw:[&_h2]:text-main
    `,
    'metric-card': String.raw`
        tw:[transition:all_0.2s_ease] tw:[&:hover]:[border-color:var(--accent-primary)]
        tw:[&:hover]:[transform:translateY(-2px)] tw:[&:hover]:[box-shadow:var(--shadow-md)]
    `,
    'checklist-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] tw:gap-[1rem]
    `,
    'valuation-guide__next-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))] tw:gap-[1rem]
    `,
    'valuation-guide__next-card': String.raw`
        tw:[text-decoration:none] tw:text-main tw:ui-fill-muted tw:ui-border-default tw:rounded-[14px] tw:p-[1.1rem]
        tw:[transition:transform_0.2s_ease,_border-color_0.2s_ease,_background_0.2s_ease]
        tw:[&:hover]:[transform:translateY(-2px)] tw:[&:hover]:[border-color:rgba(var(--accent-rgb),_0.35)]
        tw:[&:hover]:[background:rgba(var(--accent-rgb),_0.06)] tw:[&_strong]:block tw:[&_strong]:mb-[0.45rem]
        tw:[&_p]:m-[0] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.55]
    `,
    'valuation-guide__grid': String.raw`
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
} as const;
export function ValuationGuideReadingStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
