import { cn } from '../../utils/cn';

const styles = {
    'portfolio-composition__heatmap-details': String.raw`
        tw:min-w-[0] tw:p-ui-md tw:ui-border tw:rounded-control tw:[&_summary]:cursor-pointer
        tw:[&_summary]:min-h-[44px] tw:[&_summary]:[align-content:center] tw:[&_summary]:[font-weight:600]
        tw:[&_summary]:text-main tw:[&_summary:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_summary:focus-visible]:[outline-offset:2px] tw:[&_summary:focus-visible]:rounded-[var(--radius-sm)]
        tw:[&[open]_summary]:mb-ui-md
    `,
    'portfolio-composition__breakdown-groups': String.raw`
        tw:min-w-[0] tw:ui-border tw:rounded-control tw:ui-fill-muted tw:[&_summary]:cursor-pointer
        tw:[&_summary]:p-ui-md tw:[&_summary]:text-main tw:[&_summary]:[font-weight:600]
        tw:[&_summary]:wrap-anywhere tw:[&_summary_span]:block tw:[&_summary_span]:mt-ui-xs
        tw:[&_summary_span]:text-[length:var(--font-size-xs)] tw:[&_summary_span]:text-secondary
        tw:[&_summary_span]:[font-weight:400] tw:[&_summary:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_summary:focus-visible]:[outline-offset:2px] tw:[&_summary:focus-visible]:rounded-control
    `,
    'portfolio-composition__distribution-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(min(100%,_240px),_1fr))] tw:gap-ui-lg
        tw:p-[0_var(--spacing-md)_var(--spacing-md)] tw:[&_section]:min-w-[0] tw:[&_h5]:m-[0_0_var(--spacing-sm)]
        tw:[&_h5]:text-main tw:[&_h5]:text-[length:var(--font-size-sm)] tw:[&_ul]:[list-style:none] tw:[&_ul]:p-[0]
        tw:[&_ul]:m-[0] tw:[&_ul]:grid tw:[&_ul]:gap-ui-xs tw:[&_li]:grid tw:[&_li]:grid-cols-[minmax(0,_1fr)_auto]
        tw:[&_li]:items-baseline tw:[&_li]:gap-ui-sm tw:[&_li]:[padding-block:var(--spacing-xs)]
        tw:[&_li]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_li]:text-secondary
        tw:[&_li]:text-[length:var(--font-size-sm)] tw:[&_li_span]:wrap-anywhere tw:[&_li_strong]:text-main
        tw:[&_li_strong]:[font-variant-numeric:tabular-nums] tw:[&_li_strong]:whitespace-nowrap
        tw:[&_p]:text-[length:var(--font-size-xs)] tw:[&_p]:text-muted
    `,
    'portfolio-composition__exposure-row': String.raw`
        tw:ui-row tw:justify-between tw:gap-ui-md tw:w-full tw:min-w-[0] tw:p-[0.65rem_0.7rem]
        tw:[border:1px_solid_transparent] tw:rounded-[var(--radius-sm)] tw:ui-fill-transparent tw:text-main
        tw:text-left tw:[font-family:inherit] tw:[font-size:inherit] tw:[font-weight:inherit]
        tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit]
        tw:cursor-pointer tw:[transition:background_var(--transition-fast),_border-color_var(--transition-fast)]
        tw:[&:hover:not(:disabled)]:[border-color:var(--border-secondary)] tw:[&:hover:not(:disabled)]:ui-fill-muted
        tw:[&:focus-visible:not(:disabled)]:[border-color:var(--border-secondary)]
        tw:[&:focus-visible:not(:disabled)]:ui-fill-muted tw:[&:disabled]:cursor-default
        tw:[&:disabled]:opacity-[0.78] tw:[@media(max-width:640px)]:[&&]:gap-ui-sm
        tw:[@media(max-width:640px)]:[&&]:[padding-inline:0.35rem]
    `,
    'portfolio-composition__exposure-row--residual': String.raw`
        tw:[&.portfolio-composition\_\_exposure-row--residual]:[background:rgba(255,_255,_255,_0.015)]
    `,
    'portfolio-composition__exposure-name': String.raw`
        tw:grid tw:min-w-[0] tw:gap-[0.15rem] tw:flex-[1_1_auto] tw:[&_strong]:overflow-hidden
        tw:[&_strong]:text-ellipsis tw:[&_strong]:whitespace-nowrap tw:[&_strong]:text-[length:var(--font-size-sm)]
        tw:[&_small]:wrap-anywhere tw:[&_small]:text-muted tw:[&_small]:text-[length:var(--font-size-xs)]
        tw:[@media(max-width:640px)]:[&&_strong]:whitespace-normal
        tw:[@media(max-width:640px)]:[&&_strong]:[display:-webkit-box]
        tw:[@media(max-width:640px)]:[&&_strong]:[-webkit-box-orient:vertical]
        tw:[@media(max-width:640px)]:[&&_strong]:[-webkit-line-clamp:2]
    `,
    'portfolio-composition__exposure-value': String.raw`
        tw:grid tw:min-w-[0] tw:gap-[0.15rem] tw:[&_small]:wrap-anywhere tw:[&_small]:text-muted
        tw:[&_small]:text-[length:var(--font-size-xs)] tw:flex-[0_0_auto] tw:[justify-items:end] tw:text-right
        tw:[&_strong]:text-accent tw:[&_strong]:text-[length:var(--font-size-sm)]
    `,
    'portfolio-composition__exposure-group-header': String.raw`
        tw:flex tw:items-baseline tw:justify-between tw:gap-ui-md tw:[&_h5]:m-[0] tw:[&_h5]:text-secondary
        tw:[&_h5]:text-[length:var(--font-size-xs)] tw:[&_h5]:[font-weight:700] tw:[&_h5]:[letter-spacing:.4px]
        tw:[&_h5]:[text-transform:uppercase] tw:[&_p]:m-[2px_0_0] tw:[&_p]:text-muted
        tw:[&_p]:text-[length:var(--font-size-xs)] tw:[&_>_span]:flex-[0_0_auto] tw:[&_>_span]:text-muted
        tw:[&_>_span]:text-[length:var(--font-size-xs)] tw:[&_>_span]:whitespace-nowrap
        tw:[.portfolio-composition\_\_exposure-group--residual_&_h5]:text-muted
        tw:[@media(max-width:640px)]:[&&]:items-start tw:[@media(max-width:640px)]:[&&_>_span]:whitespace-nowrap
    `,
} as const;
export function compositionStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
