import { cn } from '../../../utils/cn';
const styles = {
    dashboard: String.raw`
        tw:[animation:fadeIn_var(--transition-base)_ease-out] tw:pb-[4.5rem]
    `,
    dashboard__header: String.raw`
        tw:[&&]:mb-ui-xl tw:[&_.dashboard\_\_title]:m-[0]
    `,
    'dashboard__header-content': String.raw`
        tw:min-w-[0] tw:ui-row tw:justify-between tw:flex-wrap tw:gap-[.5rem_1rem]
    `,
    dashboard__title: String.raw`
        tw:text-[length:var(--font-size-3xl)] tw:[font-weight:700] tw:m-[0]
        tw:[background-image:linear-gradient(135deg,_var(--text-primary)_0%,_var(--text-secondary)_100%)]
        tw:[-webkit-background-clip:text] tw:[-webkit-text-fill-color:transparent] tw:[background-clip:text]
        tw:[@media(max-width:640px)]:text-[length:var(--font-size-2xl)]
    `,
    'dashboard__update-info': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[0.5rem_1rem] tw:m-[0.5rem_0_0] tw:[line-height:1.5]
        tw:wrap-anywhere tw:[&_dd]:m-[0] tw:[&_dd]:text-secondary tw:[@media(max-width:480px)]:[&&]:grid-cols-[1fr]
        tw:[@media(max-width:480px)]:[&&]:gap-[0.2rem] tw:[@media(max-width:480px)]:[&&_dd]:mb-[0.5rem]
    `,
    'dashboard__live-status': String.raw`
        tw:inline-flex tw:items-center tw:gap-[0.35rem] tw:p-[0.3rem_0.6rem] tw:ui-border-strong tw:rounded-[999px]
        tw:text-muted tw:text-[length:0.75rem] tw:[font-weight:600] tw:[.dashboard\_\_status-row_&]:[border:0]
        tw:[.dashboard\_\_status-row_&]:p-[.25rem_0] tw:[.dashboard\_\_status-row_&]:ui-fill-transparent
    `,
    'dashboard__live-status--active': String.raw`
        tw:[&.dashboard\_\_live-status--active]:[border-color:rgba(16,_185,_129,_0.35)]
        tw:[&.dashboard\_\_live-status--active]:[background:rgba(16,_185,_129,_0.08)]
        tw:[&.dashboard\_\_live-status--active]:text-accent
    `,
    'dashboard__updating-banner': String.raw`
        tw:ui-row tw:gap-ui-sm tw:p-[var(--spacing-sm)_var(--spacing-md)]
        tw:[background-image:linear-gradient(135deg,_rgba(59,_130,_246,_0.1),_rgba(139,_92,_246,_0.1))]
        tw:[border:1px_solid_rgba(59,_130,_246,_0.3)] tw:rounded-control tw:mb-ui-md tw:text-accent
        tw:text-[length:var(--font-size-sm)] tw:[animation:fadeIn_0.3s_ease-out]
    `,
    dashboard__notice: String.raw`
        tw:ui-stack tw:gap-ui-md tw:text-secondary tw:[line-height:1.6] tw:[&_p]:m-[0]
    `,
    'dashboard__notice--hero': String.raw`
        tw:[&.dashboard\_\_notice--hero]:items-center tw:[&.dashboard\_\_notice--hero]:text-center
        tw:[&.dashboard\_\_notice--hero]:gap-[1.25rem] tw:[&.dashboard\_\_notice--hero]:p-[0.5rem_0]
    `,
    'dashboard__notice-title': String.raw`
        tw:m-[0] tw:text-[length:2rem] tw:[font-weight:800] tw:text-main
        tw:[@media(max-width:640px)]:[&&]:text-[length:1.6rem]
    `,
    'dashboard__notice-description': String.raw`
        tw:max-w-[420px] tw:text-[length:1.05rem] tw:[@media(max-width:640px)]:[&&]:text-[length:1rem]
    `,
    'dashboard__notice-links': String.raw`
        tw:grid tw:gap-ui-sm tw:w-full tw:[&_a]:w-full tw:[&_a]:inline-flex tw:[&_a]:items-center
        tw:[&_a]:justify-center tw:[&_a]:gap-[0.75rem] tw:[&_a]:p-[1rem_1.25rem] tw:[&_a]:rounded-[12px]
        tw:[&_a]:ui-fill-muted tw:[&_a]:text-main tw:[&_a]:ui-border-default tw:[&_a]:[text-decoration:none]
        tw:[&_a]:[font-weight:600] tw:[&_a]:[transition:all_0.2s_ease] tw:[&_a:hover]:ui-fill-surface
        tw:[&_a:hover]:[border-color:var(--accent-primary)] tw:[&_a:hover]:[transform:translateY(-2px)]
        tw:[@media(max-width:640px)]:[&&_a]:p-[0.9rem_1rem]
    `,
    'dashboard__notice-icon': String.raw`
        tw:ui-row tw:justify-center tw:w-[120px] tw:h-[120px] tw:rounded-[999px]
        tw:[background:rgba(59,_130,_246,_0.1)] tw:[border:1px_solid_rgba(59,_130,_246,_0.18)]
        tw:[box-shadow:0_10px_30px_rgba(59,_130,_246,_0.12)] tw:[color:#3b82f6] tw:m-[0_auto] tw:self-center
        tw:[animation:dashboardNoticeFloat_2s_infinite] tw:[@media(max-width:640px)]:[&&]:w-[96px]
        tw:[@media(max-width:640px)]:[&&]:h-[96px]
    `,
    dashboard__section: String.raw`
        tw:[&&]:mb-ui-xl
    `,
    dashboard__performers: String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-ui-md tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    'dashboard--loading': String.raw`
        tw:[&.dashboard--loading]:ui-stack tw:[&.dashboard--loading]:gap-ui-lg
    `,
    'skeleton--large': String.raw`
        tw:[&.skeleton--large]:h-[200px]
    `,
    'skeleton--medium': String.raw`
        tw:[&.skeleton--medium]:h-[120px]
    `,
    'dashboard--empty': String.raw`
        tw:[&.dashboard--empty]:ui-row tw:[&.dashboard--empty]:justify-center tw:[&.dashboard--empty]:min-h-[60vh]
    `,
    dashboard__welcome: String.raw`
        tw:max-w-[600px] tw:text-center
    `,
    'welcome-content': String.raw`
        tw:ui-stack tw:items-center tw:gap-ui-lg tw:p-ui-xl tw:[@media(max-width:640px)]:[&&]:p-ui-md
    `,
    'welcome-content__icons': String.raw`
        tw:relative tw:inline-flex tw:items-center tw:justify-center tw:mb-ui-lg
    `,
    'welcome-content__icon': String.raw`
        tw:text-accent
    `,
    'welcome-content__icon-feather': String.raw`
        tw:absolute tw:top-[-10px] tw:right-[-10px] tw:[color:var(--accent-secondary)] tw:[transform:rotate(15deg)]
        tw:[filter:drop-shadow(0_4px_6px_rgba(0,_0,_0,_0.1))]
    `,
    'welcome-content__title': String.raw`
        tw:text-[length:var(--font-size-3xl)] tw:[font-weight:700] tw:m-[0]
        tw:[background-image:linear-gradient(135deg,_var(--accent-primary),_var(--accent-secondary))]
        tw:[-webkit-background-clip:text] tw:[-webkit-text-fill-color:transparent] tw:[background-clip:text]
        tw:[@media(max-width:640px)]:text-[length:var(--font-size-2xl)]
    `,
    'welcome-content__description': String.raw`
        tw:text-secondary tw:max-w-[450px] tw:[line-height:1.7]
    `,
    'welcome-content__actions': String.raw`
        tw:ui-stack tw:gap-ui-md tw:w-full tw:max-w-[300px] tw:[&_a]:w-full tw:[&_.btn]:w-full
    `,
    'dashboard__quote-status': String.raw`
        tw:m-[.75rem_0] tw:p-[.75rem_1rem] tw:ui-border tw:rounded-[12px] tw:ui-fill-surface tw:wrap-anywhere
        tw:[&_summary]:cursor-pointer tw:[&_summary]:min-h-[44px] tw:[&_summary]:[display:list-item]
        tw:[&_summary]:[align-content:center] tw:[&_summary:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_summary:focus-visible]:[outline-offset:3px] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.5]
        tw:[&_li]:text-secondary tw:[&_li]:[line-height:1.5]
    `,
    'dashboard__automatic-status': String.raw`
        tw:m-[0] tw:text-muted tw:text-[length:var(--font-size-sm)] tw:[line-height:1.5]
    `,
    'dashboard__status-row': String.raw`
        tw:ui-row tw:gap-[.15rem]
    `,
} as const;
export function dashboardWorkspaceStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
