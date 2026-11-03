import { cn } from '../../../utils/cn';

const styles = {
    'timing-goal': String.raw`
        tw:flex tw:items-start tw:gap-[.65rem] tw:p-[.9rem_1rem] tw:[background:rgba(16,_185,_129,_.08)]
        tw:[border:1px_solid_rgba(16,_185,_129,_.2)] tw:rounded-[12px] tw:text-main tw:[line-height:1.5]
        tw:[&_svg]:shrink-[0] tw:[&_svg]:mt-[.15rem] tw:[&_svg]:text-accent
        tw:[@media(max-width:700px)]:text-[length:.85rem]
    `,
    'timing-intro': String.raw`
        tw:max-w-[640px] tw:m-[1.5rem_auto_.5rem] tw:text-center tw:[&_h2]:text-[length:1.3rem] tw:[&_h2]:text-main
        tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.65] tw:[&_.btn]:mt-[.65rem]
    `,
    'timing-quote': String.raw`
        tw:ui-row tw:justify-between tw:gap-[.75rem] tw:mb-[.5rem] tw:text-secondary tw:text-[length:.8rem]
        tw:[&_strong]:text-main tw:[&_strong]:text-[length:1.25rem]
        tw:[&_strong]:[font-variant-numeric:tabular-nums]
    `,
    'timing-wallet': String.raw`
        tw:flex tw:flex-wrap tw:gap-[.45rem_1.25rem] tw:mb-[.9rem] tw:text-secondary tw:text-[length:.75rem]
        tw:[&_strong]:text-main tw:[&_strong]:[font-variant-numeric:tabular-nums]
    `,
    'timing-portions': String.raw`
        tw:flex tw:gap-[.4rem] tw:[border:0] tw:m-[0_0_.85rem] tw:p-[0] tw:[&_legend]:mb-[.4rem]
        tw:[&_legend]:text-[length:.7rem] tw:[&_legend]:text-secondary tw:[&_button]:min-w-[64px]
        tw:[&_button]:min-h-[44px] tw:[&_button]:ui-border-strong tw:[&_button]:rounded-[8px]
        tw:[&_button]:ui-fill-muted tw:[&_button]:text-secondary tw:[&_button]:[font-family:inherit]
        tw:[&_button]:[font-weight:inherit] tw:[&_button]:[font-style:inherit] tw:[&_button]:[font-variant:inherit]
        tw:[&_button]:[font-stretch:inherit] tw:[&_button]:[line-height:inherit] tw:[&_button]:text-[length:.85rem]
        tw:[&_button]:cursor-pointer tw:[&_button[aria-pressed='true']]:[border-color:var(--accent-primary)]
        tw:[&_button[aria-pressed='true']]:[background:rgba(16,_185,_129,_.12)]
        tw:[&_button[aria-pressed='true']]:text-accent tw:[&_button[aria-pressed='true']]:[font-weight:700]
        tw:[&:disabled_button]:opacity-[.5] tw:[&:disabled_button]:cursor-not-allowed
    `,
    'timing-round-result': String.raw`
        tw:grid tw:grid-cols-[.65fr_1fr_1fr_1fr] tw:gap-[.65rem] tw:items-center tw:p-[.75rem] tw:ui-fill-muted
        tw:ui-border tw:rounded-[10px] tw:text-[length:.75rem] tw:[&_>_*]:min-w-[0] tw:[&_>_*]:wrap-anywhere
        tw:[&_span]:text-secondary tw:[&_b]:block tw:[&_b]:mt-[.15rem] tw:[&_b]:text-main
        tw:[&_b]:[font-variant-numeric:tabular-nums] tw:[@media(max-width:700px)]:grid-cols-[1fr_1fr]
    `,
    'timing-rules': String.raw`
        tw:mt-[1rem] tw:p-[.9rem_1rem] tw:ui-fill-surface tw:ui-border tw:rounded-[12px] tw:text-secondary
        tw:text-[length:.85rem] tw:[&_summary]:cursor-pointer tw:[&_summary]:[font-weight:600]
        tw:[&_summary]:text-main tw:[&_summary]:min-h-[24px] tw:[&_p]:[line-height:1.65]
    `,
} as const;
export function timingStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
