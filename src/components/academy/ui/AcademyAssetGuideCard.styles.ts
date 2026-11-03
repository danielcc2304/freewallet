import { cn } from '../../../utils/cn';

const styles = {
    'strategy-asset': String.raw`
        tw:ui-stack tw:gap-[1rem] tw:h-full tw:text-main tw:[text-decoration:none]
        tw:[transition:border-color_.2s_ease,box-shadow_.2s_ease,transform_.2s_ease] tw:[&_h3]:text-[length:1rem]
        tw:[&_h3]:m-[0] tw:[&_h3]:min-w-[0] tw:[&_h3]:[line-height:1.4] tw:[&_h3]:wrap-anywhere
        tw:[&_.strategy-asset\_\_description]:text-secondary
        tw:[&_.strategy-asset\_\_description]:text-[length:.9rem]
        tw:[&_.strategy-asset\_\_description]:[line-height:1.7] tw:[&_.strategy-asset\_\_description]:m-[0]
        tw:[&_.strategy-asset\_\_description]:flex-[1] tw:[@media(prefers-reduced-motion:reduce)]:[transition:none]
    `,
    'strategy-asset__header': String.raw`
        tw:ui-row tw:gap-[.8rem] tw:min-h-[48px]
    `,
    'strategy-asset__icon': String.raw`
        tw:grid tw:place-items-center tw:w-[44px] tw:h-[44px] tw:flex-[0_0_44px] tw:rounded-[14px]
        tw:[color:color-mix(in_srgb,var(--asset-color)_75%,var(--text-primary))]
        tw:[background:color-mix(in_srgb,var(--asset-color)_12%,transparent)]
        tw:[border:1px_solid_color-mix(in_srgb,var(--asset-color)_22%,var(--border-primary))]
    `,
    'strategy-asset__description': String.raw`
        
    `,
    'strategy-asset__footer': String.raw`
        tw:ui-row tw:justify-between tw:flex-wrap tw:gap-[.75rem] tw:min-h-[50px] tw:mt-[auto] tw:pt-[.85rem]
        tw:[border-top:1px_solid_var(--border-primary)]
    `,
    'strategy-asset__risk': String.raw`
        tw:grid tw:gap-[.25rem] tw:min-w-[0] tw:[&_>_span]:text-muted tw:[&_>_span]:text-[length:.7rem]
        tw:[&_>_span]:[letter-spacing:.04em] tw:[&_>_span]:[text-transform:uppercase]
        tw:[&_strong]:text-[length:.8rem] tw:[&_strong]:[font-weight:600] tw:[&_strong]:text-main
        tw:[&_strong]:[line-height:1.5] tw:[&_strong]:wrap-anywhere
    `,
    'strategy-asset__guide': String.raw`
        tw:inline-flex tw:items-center tw:gap-[.4rem] tw:min-h-[44px] tw:text-[length:.8rem] tw:[font-weight:600]
        tw:text-main tw:whitespace-nowrap tw:[&_svg]:shrink-[0] tw:[&_svg]:text-accent
    `,
    'strategy-asset--linked': String.raw`
        tw:[&:hover]:[border-color:color-mix(in_srgb,var(--asset-color)_50%,var(--border-primary))]
        tw:[&:hover]:[transform:translateY(-2px)] tw:[&:hover]:[box-shadow:var(--shadow-sm)]
        tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&:focus-visible]:[outline-offset:4px]
        tw:[@media(prefers-reduced-motion:reduce)]:[&:hover]:[transform:none]
    `,
} as const;
export function assetGuideStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
