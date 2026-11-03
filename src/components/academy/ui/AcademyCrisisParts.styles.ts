import { cn } from '../../../utils/cn';

const styles = {
    'crisis__tab': String.raw`
        tw:ui-stack tw:items-start tw:gap-[.25rem] tw:min-h-[76px] tw:p-[1rem] tw:ui-border-default
        tw:rounded-[14px] tw:ui-fill-surface tw:text-main tw:cursor-pointer tw:text-left
        tw:[&:hover]:[border-color:var(--accent-primary)] tw:[@container(max-width:700px)]:p-[.8rem_.65rem]
    `,
    'crisis__tab-year': String.raw`
        tw:text-[length:1.3rem] tw:[font-weight:800] tw:[@container(max-width:700px)]:text-[length:1.15rem]
    `,
    'crisis__tab-name': String.raw`
        tw:text-[length:.8rem] tw:[line-height:1.4] tw:text-secondary
    `,
    'crisis__insight': String.raw`
        tw:flex tw:items-start tw:gap-[.75rem] tw:p-[1rem] tw:m-[1.25rem_0_2rem]
        tw:[border-left:3px_solid_var(--accent-primary)] tw:rounded-[0_12px_12px_0]
        tw:[background:rgba(var(--accent-rgb),_.05)] tw:[&_svg]:flex-[0_0_20px] tw:[&_svg]:mt-[.15rem]
        tw:[&_svg]:text-accent tw:[&_p]:m-[0] tw:[&_p]:text-[length:.9rem] tw:[&_p]:text-secondary
        tw:[&_p]:[line-height:1.65] tw:[&_strong]:text-main
    `,
    'crisis__section-heading': String.raw`
        tw:flex tw:items-start tw:gap-[.85rem] tw:mb-[1.5rem] tw:[&&_h2]:m-[0_0_.4rem] tw:[&_p]:text-secondary
        tw:[&_p]:text-[length:.9rem] tw:[&_p]:[line-height:1.6] tw:[&_p]:m-[0]
    `,
    'crisis__icon': String.raw`
        tw:grid tw:place-items-center tw:flex-[0_0_44px] tw:h-[44px] tw:rounded-[12px] tw:text-accent
        tw:[background:rgba(var(--accent-rgb),_.08)]
    `,
    'crisis__impact-row': String.raw`
        tw:grid tw:grid-cols-[minmax(0,_1fr)_auto] tw:gap-[.5rem_1rem] tw:mb-[1rem] tw:items-baseline
        tw:[&_>_span]:text-[length:.85rem] tw:[&_>_span]:text-secondary tw:[&_>_span]:[line-height:1.5]
        tw:[&_>_strong]:text-[length:1.1rem] tw:[@container(max-width:700px)]:grid-cols-[1fr]
    `,
    'crisis__bar': String.raw`
        tw:col-span-full tw:h-[12px] tw:rounded-[6px] tw:overflow-hidden
        tw:[background:color-mix(in_srgb,_var(--text-primary)_8%,_transparent)] tw:[&_>_span]:block
        tw:[&_>_span]:h-full tw:[&_>_span]:[background:#2563eb] tw:[&_>_span]:rounded-[inherit]
        tw:[@container(max-width:700px)]:col-[auto]
    `,
    'crisis__scenario': String.raw`
        tw:ui-stack tw:items-start tw:gap-[.75rem] tw:min-w-[0] tw:p-[1rem] tw:ui-border-default tw:rounded-[12px]
        tw:ui-fill-muted tw:text-main tw:[font-family:inherit] tw:[font-size:inherit] tw:[font-weight:inherit]
        tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit]
        tw:text-left tw:cursor-pointer tw:[&:hover]:[border-color:var(--accent-primary)]
        tw:[&_>_span:not(.crisis\_\_scenario-title)]:text-[length:.8rem]
        tw:[&_>_span:not(.crisis\_\_scenario-title)]:[line-height:1.6]
        tw:[&_>_span:not(.crisis\_\_scenario-title)]:text-secondary tw:[&_>_strong]:text-[length:1.35rem]
    `,
    'crisis__scenario-title': String.raw`
        tw:text-[length:.95rem] tw:[font-weight:700]
    `,
    'crisis__scenario-label': String.raw`
        tw:mt-[auto]
    `,
    'crisis__explanation': String.raw`
        tw:mt-[1rem] tw:p-[1rem] tw:[border-left:3px_solid_var(--accent-primary)]
        tw:[background:rgba(var(--accent-rgb),_.05)] tw:rounded-[0_10px_10px_0] tw:[&_>_strong]:text-[length:.95rem]
        tw:[&_p]:text-secondary tw:[&_p]:text-[length:.9rem] tw:[&_p]:[line-height:1.7] tw:[&_p]:m-[.5rem_0_0]
    `,
} as const;
export function crisisStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
