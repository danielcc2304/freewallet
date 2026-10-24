import { cn } from '../../utils/cn';

const styles = {
    'feature-log__title-row': String.raw`
        tw:ui-row tw:gap-ui-md tw:[@media(max-width:640px)]:[&&]:items-start
    `,
    'feature-log__title-icon': String.raw`
        tw:w-[56px] tw:h-[56px] tw:ui-row tw:justify-center tw:text-accent
        tw:[background:rgba(var(--accent-rgb),_0.12)] tw:[border:1px_solid_rgba(var(--accent-rgb),_0.2)]
        tw:rounded-control tw:shrink-[0] tw:[@media(max-width:640px)]:[&&]:w-[48px]
        tw:[@media(max-width:640px)]:[&&]:h-[48px]
    `,
    'feature-log__eyebrow': String.raw`
        tw:text-accent tw:text-[length:var(--font-size-sm)] tw:[font-weight:700] tw:m-[0_0_var(--spacing-xs)]
    `,
    'feature-log__title': String.raw`
        tw:text-[length:var(--font-size-4xl)] tw:[font-weight:700] tw:m-[0]
        tw:[background:linear-gradient(135deg,_var(--text-primary)_0%,_var(--text-secondary)_100%)]
        tw:[-webkit-background-clip:text] tw:[-webkit-text-fill-color:transparent] tw:[background-clip:text]
        tw:[@media(max-width:640px)]:[&&]:text-[length:var(--font-size-3xl)]
    `,
    'feature-log__subtitle': String.raw`
        tw:text-muted tw:m-[var(--spacing-md)_0_0] tw:max-w-[680px]
    `,
    'feature-log__summary-item': String.raw`
        tw:inline-flex tw:items-center tw:gap-ui-sm tw:p-[0.65rem_0.8rem] tw:text-secondary tw:ui-fill-surface
        tw:ui-border tw:rounded-control tw:text-[length:var(--font-size-sm)] tw:[font-weight:600]
    `,
    'feature-log-entry': String.raw`
        tw:ui-panel tw:p-ui-xl tw:[box-shadow:var(--shadow-sm)] tw:[@media(max-width:640px)]:[&&]:p-ui-lg
    `,
    'feature-log-entry__meta': String.raw`
        tw:ui-row tw:mb-ui-sm tw:text-muted tw:text-[length:var(--font-size-sm)] tw:[font-weight:700]
    `,
    'feature-log-entry__title': String.raw`
        tw:text-[length:var(--font-size-2xl)] tw:m-[0_0_var(--spacing-lg)]
        tw:[@media(max-width:640px)]:[&&]:text-[length:var(--font-size-xl)]
    `,
    'feature-log-entry__section': String.raw`
        tw:mt-ui-lg tw:[.feature-log-entry\_\_files_&]:mt-ui-md
    `,
    'feature-log-entry__section-title': String.raw`
        tw:text-main tw:text-[length:var(--font-size-base)] tw:m-[0_0_var(--spacing-sm)]
        tw:[.feature-log-entry\_\_files_&]:hidden
    `,
    'feature-log-entry__list': String.raw`
        tw:[list-style:none] tw:ui-stack tw:gap-ui-sm
    `,
    'feature-log-entry__item': String.raw`
        tw:relative tw:pl-[calc(1.2rem_+_var(--feature-log-indent,_0rem))] tw:text-secondary
        tw:text-[length:var(--font-size-sm)] tw:[line-height:1.6] tw:[&::before]:[content:""]
        tw:[&::before]:absolute tw:[&::before]:top-[0.72em] tw:[&::before]:left-[var(--feature-log-indent,_0rem)]
        tw:[&::before]:w-[6px] tw:[&::before]:h-[6px] tw:[&::before]:[background:var(--accent-primary)]
        tw:[&::before]:rounded-[var(--radius-full)] tw:[&_code]:p-[0.1rem_0.35rem] tw:[&_code]:text-accent
        tw:[&_code]:[background:rgba(var(--accent-rgb),_0.1)]
        tw:[&_code]:[border:1px_solid_rgba(var(--accent-rgb),_0.18)] tw:[&_code]:rounded-[var(--radius-sm)]
        tw:[&_code]:text-[length:0.85em]
    `,
    'feature-log-entry__files': String.raw`
        tw:mt-ui-lg tw:[border-top:1px_solid_var(--border-primary)] tw:pt-ui-md tw:[&_summary]:text-accent
        tw:[&_summary]:text-[length:var(--font-size-sm)] tw:[&_summary]:[font-weight:700]
        tw:[&_summary]:cursor-pointer
    `,
} as const;
export function releaseStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
