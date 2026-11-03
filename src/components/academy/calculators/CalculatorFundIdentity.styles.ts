import { cn } from '../../../utils/cn';

const styles = {
    'fund-info__fund-hero': String.raw`
        tw:flex tw:items-start tw:justify-between tw:gap-ui-lg tw:p-ui-xl
        tw:[background:radial-gradient(circle_at_10%_10%,_rgba(16,_185,_129,_0.14),_transparent_45%),_________radial-gradient(circle_at_90%_20%,_rgba(59,_130,_246,_0.14),_transparent_42%),_________var(--bg-secondary)]
        tw:ui-border tw:rounded-panel tw:[&_h2]:m-[var(--spacing-md)_0_var(--spacing-xs)]
        tw:[&_h2]:text-[length:clamp(1.35rem,_2.8vw,_2rem)] tw:[&_h2]:wrap-anywhere tw:[&_code]:text-accent
        tw:[&_code]:[font-family:'JetBrains_Mono',_monospace] tw:[&_code]:text-[length:var(--font-size-sm)]
        tw:[&_code]:[letter-spacing:0.02em] tw:[@media(max-width:640px)]:[&&]:flex-col
        tw:[@media(max-width:640px)]:[&&]:p-ui-lg
    `,
    'fund-info__fund-hero-copy': String.raw`
        tw:min-w-[0]
    `,
    'fund-info__badge-row': String.raw`
        tw:ui-row tw:flex-wrap tw:gap-ui-xs
    `,
    'fund-info__badge': String.raw`
        tw:inline-flex tw:items-center tw:min-h-[24px] tw:p-[0.2rem_0.55rem] tw:text-secondary tw:ui-fill-muted
        tw:ui-border-strong tw:rounded-[var(--radius-full)] tw:text-[length:var(--font-size-xs)]
        tw:[font-weight:700]
    `,
    'fund-info__badge--accent': String.raw`
        tw:[&.fund-info\_\_badge--accent]:text-accent
        tw:[&.fund-info\_\_badge--accent]:[background:rgba(var(--accent-rgb),_0.1)]
        tw:[&.fund-info\_\_badge--accent]:[border-color:rgba(var(--accent-rgb),_0.22)]
    `,
    'fund-info__risk-help': String.raw`
        tw:relative tw:inline-flex tw:[&:hover_.fund-info\_\_risk-tooltip]:opacity-[1]
        tw:[&:hover_.fund-info\_\_risk-tooltip]:visible
        tw:[&:hover_.fund-info\_\_risk-tooltip]:[transform:translateY(0)]
    `,
    'fund-info__risk-trigger': String.raw`
        tw:inline-flex tw:items-center tw:gap-[0.3rem] tw:min-h-[24px] tw:p-[0.2rem_0.55rem] tw:text-secondary
        tw:ui-fill-muted tw:ui-border-strong tw:rounded-[var(--radius-full)] tw:[font-family:inherit]
        tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit]
        tw:text-[length:var(--font-size-xs)] tw:[font-weight:700] tw:cursor-help tw:[&:hover]:text-accent
        tw:[&:hover]:[border-color:rgba(var(--accent-rgb),_0.45)] tw:[&:hover]:[outline:none]
        tw:[&:focus-visible]:text-accent tw:[&:focus-visible]:[border-color:rgba(var(--accent-rgb),_0.45)]
        tw:[&:focus-visible]:[outline:none] tw:[&:focus_+_.fund-info\_\_risk-tooltip]:opacity-[1]
        tw:[&:focus_+_.fund-info\_\_risk-tooltip]:visible
        tw:[&:focus_+_.fund-info\_\_risk-tooltip]:[transform:translateY(0)]
    `,
    'fund-info__risk-tooltip': String.raw`
        tw:absolute tw:z-[20] tw:top-[calc(100%_+_0.65rem)] tw:left-[0] tw:ui-stack tw:gap-[0.3rem]
        tw:w-[min(310px,_calc(100vw_-_2rem))] tw:p-[0.75rem_0.85rem] tw:text-secondary tw:ui-fill-panel
        tw:ui-border-strong tw:rounded-control tw:[box-shadow:var(--shadow-lg)] tw:text-[length:var(--font-size-xs)]
        tw:[line-height:1.45] tw:opacity-[0] tw:invisible tw:pointer-events-none tw:[transform:translateY(-4px)]
        tw:[transition:opacity_var(--transition-fast),_transform_var(--transition-fast),_visibility_var(--transition-fast)]
        tw:[&::before]:absolute tw:[&::before]:top-[-6px] tw:[&::before]:left-[1.2rem] tw:[&::before]:w-[10px]
        tw:[&::before]:h-[10px] tw:[&::before]:[content:''] tw:[&::before]:ui-fill-panel
        tw:[&::before]:[border-top:1px_solid_var(--border-secondary)]
        tw:[&::before]:[border-left:1px_solid_var(--border-secondary)] tw:[&::before]:[transform:rotate(45deg)]
        tw:[&_strong]:text-main tw:[&_strong]:text-[length:var(--font-size-sm)] tw:[&_small]:text-muted
        tw:[&_small]:text-[length:inherit] tw:[@media(max-width:640px)]:[&&]:right-[0]
        tw:[@media(max-width:640px)]:[&&]:left-[auto] tw:[@media(max-width:640px)]:[&&::before]:right-[1.2rem]
        tw:[@media(max-width:640px)]:[&&::before]:left-[auto]
    `,
    'fund-info__class-name': String.raw`
        tw:m-[0_0_var(--spacing-sm)] tw:text-secondary tw:wrap-anywhere
    `,
    'fund-info__source-link': String.raw`
        tw:inline-flex tw:items-center tw:gap-ui-xs tw:shrink-[0] tw:text-accent
        tw:text-[length:var(--font-size-sm)] tw:[font-weight:700] tw:whitespace-nowrap
        tw:[&:hover]:[color:var(--accent-secondary)] tw:[@media(max-width:640px)]:[&&]:whitespace-normal
    `,
    'fund-info__feature-list': String.raw`
        tw:flex tw:flex-wrap tw:gap-ui-sm tw:mt-ui-sm
    `,
    'fund-info__feature': String.raw`
        tw:inline-flex tw:items-center tw:gap-ui-xs tw:p-[0.4rem_0.6rem] tw:text-secondary
        tw:[background:rgba(var(--accent-rgb),_0.08)] tw:[border:1px_solid_rgba(var(--accent-rgb),_0.18)]
        tw:rounded-[var(--radius-full)] tw:text-[length:var(--font-size-xs)] tw:[&_svg]:text-accent
    `,
} as const;
export function fundIdentityStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
