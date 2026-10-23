import { cn } from '../../../utils/cn';

const styles = {
    "fund-info__search-card": String.raw`tw:ui-panel tw:[box-shadow:var(--shadow-sm)] tw:p-ui-xl tw:mb-ui-xl tw:[@media(max-width:640px)]:p-ui-lg`,
    "fund-info__search-title": String.raw`
    tw:flex tw:items-start tw:gap-ui-sm tw:text-accent tw:mb-ui-lg tw:[&_svg]:mt-[0.2rem] tw:[&_svg]:shrink-[0]
    tw:[&_h2]:text-[length:var(--font-size-xl)] tw:[&_h2]:m-[0_0_var(--spacing-xs)] tw:[&_p]:m-[0]
    tw:[&_p]:text-secondary tw:[&_p]:text-[length:var(--font-size-sm)]
`,
    "fund-info__form": String.raw`
    tw:grid tw:grid-cols-[minmax(0,_1fr)_auto] tw:[align-items:end] tw:gap-ui-md tw:[&_.btn]:min-h-[48px]
    tw:[&_.btn]:whitespace-nowrap tw:[@media(max-width:640px)]:grid-cols-[1fr]
    tw:[@media(max-width:640px)]:[&_.btn]:w-full
`,
    "fund-info__sample": String.raw`
    tw:ui-row tw:flex-wrap tw:gap-ui-sm tw:mt-ui-md tw:text-muted tw:text-[length:var(--font-size-sm)]
    tw:[&_button]:p-[0.2rem_0.45rem] tw:[&_button]:text-accent tw:[&_button]:[background:rgba(var(--accent-rgb),_0.08)]
    tw:[&_button]:[border:1px_solid_rgba(var(--accent-rgb),_0.18)] tw:[&_button]:rounded-[var(--radius-sm)]
    tw:[&_button]:[font-family:'JetBrains_Mono',_monospace] tw:[&_button]:text-[length:var(--font-size-sm)]
    tw:[&_button:hover]:[background:rgba(var(--accent-rgb),_0.15)]
`,
    "fund-info__result-footnote": String.raw`
    tw:flex tw:items-start tw:gap-ui-sm tw:text-muted tw:text-[length:var(--font-size-xs)] tw:[line-height:1.55]
    tw:[&_svg]:[color:var(--accent-secondary)] tw:[&_svg]:shrink-[0] tw:[&_svg]:mt-[0.15rem] tw:p-[0_var(--spacing-sm)]
`,
    "fund-info__alert": String.raw`
    tw:ui-row tw:gap-ui-sm tw:p-[var(--spacing-md)_var(--spacing-lg)] tw:rounded-control tw:mb-ui-lg
    tw:text-[length:var(--font-size-sm)] tw:text-negative tw:[background:var(--color-negative-bg)]
    tw:[border:1px_solid_rgba(239,_68,_68,_0.25)]
`,
    "fund-info__loading": String.raw`
    tw:ui-row tw:gap-ui-sm tw:p-[var(--spacing-md)_var(--spacing-lg)] tw:rounded-control tw:mb-ui-lg
    tw:text-[length:var(--font-size-sm)] tw:text-secondary tw:ui-fill-surface tw:ui-border
`,
    "fund-info__loading-spinner": String.raw`
    tw:w-[17px] tw:h-[17px] tw:[border:2px_solid_var(--border-secondary)] tw:[border-top-color:var(--accent-primary)]
    tw:rounded-[50%] tw:[animation:fundInfoSpin_0.8s_linear_infinite]
`,
    "fund-info__empty-state": String.raw`
    tw:ui-panel tw:[box-shadow:var(--shadow-sm)] tw:p-[3rem_var(--spacing-xl)] tw:text-center
    tw:[&_h2]:m-[0_0_var(--spacing-sm)] tw:[&_h2]:text-[length:var(--font-size-xl)] tw:[&_p]:max-w-[620px]
    tw:[&_p]:m-[0_auto] tw:[&_p]:text-secondary
`,
    "fund-info__empty-icon": String.raw`
    tw:ui-row tw:justify-center tw:w-[64px] tw:h-[64px] tw:m-[0_auto_var(--spacing-lg)] tw:text-accent
    tw:[background:rgba(var(--accent-rgb),_0.1)] tw:[border:1px_solid_rgba(var(--accent-rgb),_0.18)] tw:rounded-[50%]
`,
    "fund-info__holding": String.raw`
    tw:ui-row tw:justify-between tw:gap-ui-md tw:p-[0.7rem_var(--spacing-md)] tw:ui-fill-muted
    tw:rounded-[var(--radius-sm)] tw:text-secondary tw:text-[length:var(--font-size-sm)] tw:[&_span]:wrap-anywhere
    tw:[&_strong]:shrink-[0] tw:[&_strong]:text-accent
`
} as const;

export function calculatorLookupClass(part: keyof typeof styles) { return cn(part, styles[part]); }
