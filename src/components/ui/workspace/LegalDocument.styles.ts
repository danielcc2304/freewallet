import { cn } from '../../../utils/cn';
const styles = {
    terms: String.raw`
        tw:min-h-[calc(100vh_-_var(--header-height,_70px))] tw:p-[2rem] tw:ui-fill-canvas
        tw:[@media(max-width:768px)]:p-[4.5rem_1rem_1rem]
    `,
    'terms__back-fab': String.raw`
        tw:fixed tw:top-[1rem] tw:left-[1rem] tw:z-[99] tw:w-[44px] tw:h-[44px] tw:inline-flex tw:items-center
        tw:justify-center tw:ui-border tw:rounded-[12px]
        tw:[background:color-mix(in_srgb,_var(--bg-secondary)_86%,_transparent)] tw:[backdrop-filter:blur(10px)]
        tw:text-main tw:[box-shadow:var(--shadow-md)] tw:cursor-pointer
        tw:[transition:transform_0.2s_ease,_border-color_0.2s_ease,_background_0.2s_ease,_color_0.2s_ease]
        tw:[&:hover]:[transform:translateY(-1px)] tw:[&:hover]:[border-color:var(--accent-primary)]
        tw:[&:hover]:text-accent tw:[&:hover]:ui-fill-muted tw:[@media(max-width:768px)]:top-[1rem]
        tw:[@media(max-width:768px)]:left-[1rem] tw:[@media(max-width:1024px)]:left-[1rem]
    `,
    terms__container: String.raw`
        tw:max-w-[900px] tw:m-[0_auto] tw:ui-fill-surface tw:rounded-[16px] tw:p-[3rem]
        tw:[box-shadow:var(--shadow-md)] tw:[@media(max-width:768px)]:p-[1.5rem]
    `,
    terms__title: String.raw`
        tw:text-[length:2.5rem] tw:[font-weight:700] tw:text-main tw:mb-[0.5rem]
        tw:[@media(max-width:768px)]:text-[length:1.875rem]
    `,
    terms__updated: String.raw`
        tw:text-secondary tw:text-[length:0.95rem] tw:mb-[2.5rem] tw:[font-style:italic]
    `,
    terms__section: String.raw`
        tw:mb-[2.5rem] tw:[&_h2]:text-[length:1.5rem] tw:[&_h2]:[font-weight:600] tw:[&_h2]:text-main
        tw:[&_h2]:mb-[1rem] tw:[&_h2]:pb-[0.5rem] tw:[&_h2]:[border-bottom:2px_solid_var(--accent-primary)]
        tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.7] tw:[&_p]:mb-[1rem] tw:[&_ul]:ml-[1.5rem]
        tw:[&_ul]:mb-[1rem] tw:[&_li]:text-secondary tw:[&_li]:[line-height:1.7] tw:[&_li]:mb-[0.5rem]
        tw:[@media(max-width:768px)]:[&_h2]:text-[length:1.25rem]
    `,
    terms__disclaimer: String.raw`
        tw:[background:rgba(255,_193,_7,_0.1)] tw:[border-left:4px_solid_var(--warning-color,_#ffc107)]
        tw:p-[1.25rem] tw:m-[1.5rem_0] tw:rounded-[8px] tw:[&_strong]:[color:var(--warning-color,_#ffc107)]
        tw:[&_strong]:block tw:[&_strong]:mb-[0.5rem] tw:[&_strong]:text-[length:1.05rem]
    `,
    terms__acknowledgment: String.raw`
        tw:[background:rgba(var(--accent-rgb),_0.1)] tw:[border:2px_solid_var(--accent-primary)] tw:rounded-[12px]
        tw:p-[1.5rem] tw:mt-[3rem] tw:text-center tw:[&_p]:text-main tw:[&_p]:text-[length:1.05rem] tw:[&_p]:m-[0]
    `,
} as const;
export function legalStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
