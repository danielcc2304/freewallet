import {cn} from '../../../utils/cn';

// Identical guide structures share one static recipe and keep their existing hooks.
const styles = {
    heading: String.raw`
        tw:flex tw:items-start tw:gap-[.85rem] tw:mb-[1.25rem] tw:[&_h2]:text-[length:clamp(1.2rem,_2.2vw,_1.6rem)]
        tw:[&_h2]:[line-height:1.35] tw:[&_h2]:m-[0_0_.4rem] tw:[&&_p]:m-[0] tw:[&&_p]:text-secondary
        tw:[&&_p]:text-[length:.95rem] tw:[&&_p]:[line-height:1.6]
    `,
    number: String.raw`
        tw:grid tw:place-items-center tw:flex-[0_0_38px] tw:h-[38px] tw:rounded-[11px]
        tw:[background:rgba(var(--accent-rgb),_.1)] tw:text-accent tw:text-[length:.85rem] tw:[font-weight:800]
    `,
    roadmap: String.raw`
        tw:flex tw:flex-wrap tw:gap-[.6rem] tw:mt-[1.5rem] tw:[&_a]:inline-flex tw:[&_a]:items-center
        tw:[&_a]:gap-[.5rem] tw:[&_a]:min-h-[44px] tw:[&_a]:p-[.5rem_.85rem] tw:[&_a]:ui-border-default
        tw:[&_a]:rounded-[10px] tw:[&_a]:text-main tw:[&_a]:ui-fill-surface tw:[&_a]:[text-decoration:none]
        tw:[&_a]:text-[length:.85rem] tw:[&_a:hover]:[border-color:var(--accent-primary)]
    `,
    insight: String.raw`
        tw:flex tw:items-start tw:gap-[.75rem] tw:p-[1rem] tw:mt-[1rem]
        tw:[border-left:3px_solid_var(--accent-primary)] tw:rounded-[0_10px_10px_0]
        tw:[background:rgba(var(--accent-rgb),_.05)] tw:[&_svg]:flex-[0_0_20px] tw:[&_svg]:mt-[.15rem]
        tw:[&_svg]:text-accent tw:[&&_p]:m-[0] tw:[&&_p]:text-[length:.9rem] tw:[&&_p]:[line-height:1.65]
        tw:[&&_p]:text-secondary
    `,
} as const;
export function guidePartStyle(part:keyof typeof styles, hook:string) {return cn(hook,styles[part]);}
