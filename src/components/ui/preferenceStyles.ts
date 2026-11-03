import { cn } from '../../utils/cn';

// Styles belong to the structured components; theme hooks remain stable.
const styles = {
    "theme-option": String.raw`
    tw:ui-stack tw:items-center tw:gap-ui-sm tw:p-ui-lg tw:ui-fill-muted tw:[border:2px_solid_transparent]
    tw:rounded-panel tw:cursor-pointer tw:[transition:all_var(--transition-base)] tw:relative
    tw:[&:hover]:ui-fill-canvas tw:[&:hover]:[border-color:var(--border-secondary)]
    tw:[@media(max-width:640px)]:flex-row tw:[@media(max-width:640px)]:p-ui-md
`,
    "theme-option--active": String.raw`
    tw:[&.theme-option--active]:[background:linear-gradient(135deg,_rgba(139,_92,_246,_0.1),_rgba(59,_130,_246,_0.1))]
    tw:[&.theme-option--active]:[border-color:var(--accent-primary)]
    tw:[&_.theme-option\_\_icon]:[background:var(--accent-primary)] tw:[&_.theme-option\_\_icon]:[color:white]
`,
    "theme-option__icon": String.raw`
    tw:w-[48px] tw:h-[48px] tw:ui-row tw:justify-center tw:ui-fill-surface tw:rounded-control tw:text-secondary
    tw:[@media(max-width:640px)]:w-[40px] tw:[@media(max-width:640px)]:h-[40px]
`,
    "theme-option__label": String.raw`tw:[font-weight:500] tw:text-main tw:[@media(max-width:640px)]:flex-[1] tw:[@media(max-width:640px)]:text-left`,
    "theme-option__check": String.raw`tw:absolute tw:top-[var(--spacing-sm)] tw:right-[var(--spacing-sm)] tw:text-accent tw:[font-weight:600]`,
    "appearance-option": String.raw`
    tw:relative tw:ui-row tw:gap-ui-md tw:min-w-[0] tw:p-ui-md tw:ui-border tw:rounded-panel tw:ui-fill-muted
    tw:text-main tw:text-left tw:[transition:all_var(--transition-base)]
    tw:[&:hover]:[border-color:var(--border-secondary)] tw:[&:hover]:[background:var(--bg-card-hover)]
    tw:[&:hover]:[transform:translateY(-1px)]
`,
    "appearance-option--active": String.raw`
    tw:[&.appearance-option--active]:[border-color:var(--accent-primary)]
    tw:[&.appearance-option--active]:[box-shadow:0_0_0_1px_var(--accent-primary),_var(--shadow-sm)]
`,
    "appearance-option__visual": String.raw`
    tw:relative tw:grid tw:flex-[0_0_52px] tw:gap-[4px] tw:w-[52px] tw:h-[42px] tw:p-[6px] tw:overflow-hidden
    tw:rounded-[10px] tw:[&_span]:block tw:[&_span]:rounded-[4px]
`,
    "appearance-option__visual--standard": String.raw`
    tw:ui-fill-surface tw:ui-border-strong tw:[&_span:first-child]:w-[75%] tw:[&_span:first-child]:ui-fill-muted
    tw:[&_span:last-child]:w-[52%] tw:[&_span:last-child]:[background:var(--accent-primary)]
`,
    "appearance-option__visual--glass": String.raw`
    tw:[background:radial-gradient(circle_at_15%_20%,_rgba(16,_185,_129,_.8),_transparent_48%),_radial-gradient(circle_at_90%_80%,_rgba(59,_130,_246,_.8),_transparent_50%),_#172334]
    tw:[border:1px_solid_rgba(255,_255,_255,_.22)] tw:[&_span]:relative tw:[&_span]:z-[1]
    tw:[&_span]:[background:rgba(255,_255,_255,_.7)]
`,
    "appearance-option__copy": String.raw`
    tw:grid tw:gap-[2px] tw:min-w-[0] tw:[&_strong]:text-[length:var(--font-size-sm)] tw:[&_small]:text-muted
    tw:[&_small]:text-[length:var(--font-size-xs)] tw:[&_small]:[line-height:1.4]
`,
    "appearance-option__check": String.raw`tw:absolute tw:top-[var(--spacing-sm)] tw:right-[var(--spacing-sm)] tw:text-accent tw:[font-weight:700]`,
    "settings__toggle-card": String.raw`
    tw:ui-row tw:justify-between tw:gap-ui-md tw:p-ui-md tw:ui-surface tw:[@media(max-width:640px)]:flex-col
    tw:[@media(max-width:640px)]:items-stretch
`,
    "settings__toggle-copy": String.raw`tw:ui-stack tw:gap-ui-xs`,
    "settings__toggle-title": String.raw`tw:ui-row tw:gap-ui-sm tw:[font-weight:600] tw:text-main`,
    "settings__toggle": String.raw`
    tw:relative tw:inline-flex tw:items-center tw:justify-start tw:shrink-[0] tw:w-[66px] tw:min-w-[66px]
    tw:min-h-[44px] tw:p-[7px] tw:ui-border-strong tw:rounded-[999px] tw:ui-fill-muted tw:text-muted tw:cursor-pointer
    tw:[transition:all_var(--transition-base)] tw:[@media(max-width:640px)]:self-end
`,
    "settings__toggle--active": String.raw`
    tw:[&.settings\_\_toggle--active]:[background:rgba(59,_130,_246,_0.14)]
    tw:[&.settings\_\_toggle--active]:[border-color:rgba(59,_130,_246,_0.35)]
    tw:[&.settings\_\_toggle--active]:text-accent tw:[&_.settings\_\_toggle-thumb]:[transform:translateX(26px)]
    tw:[&_.settings\_\_toggle-thumb]:[background:var(--accent-primary)]
`,
    "settings__toggle-thumb": String.raw`
    tw:w-[24px] tw:h-[24px] tw:rounded-[50%] tw:[background:var(--text-primary)] tw:[transform:translateX(0)]
    tw:[transition:transform_var(--transition-base),_background_var(--transition-base)]
`
} as const;

export function preferenceClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
