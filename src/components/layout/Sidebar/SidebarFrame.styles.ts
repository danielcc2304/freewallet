import { cn } from '../../../utils/cn';
const styles = {
    sidebar: String.raw`
        tw:fixed tw:top-[0] tw:left-[0] tw:w-[var(--sidebar-width)] tw:h-[100vh] tw:h-[100dvh] tw:max-h-[100dvh]
        tw:ui-fill-surface tw:[border-right:1px_solid_var(--border-primary)] tw:ui-stack tw:z-[100]
        tw:[transition:transform_var(--transition-base)] tw:[[data-theme="light"]_&]:[background:#eaf4f0]
        tw:[[data-theme="light"]_&]:[border-right:1px_solid_rgba(16,_185,_129,_0.08)]
        tw:[@media(max-width:1024px)]:[transform:translateX(-100%)] tw:[@media(max-width:1024px)]:w-[280px]
        tw:[@media(max-width:1024px)]:h-[100svh] tw:[@media(max-width:1024px)]:h-[100dvh]
        tw:[@media(max-width:1024px)]:max-h-[100dvh]
    `,
    'sidebar-overlay': String.raw`
        tw:hidden tw:[@media(max-width:1024px)]:block tw:[@media(max-width:1024px)]:fixed
        tw:[@media(max-width:1024px)]:top-[0] tw:[@media(max-width:1024px)]:left-[0]
        tw:[@media(max-width:1024px)]:right-[0] tw:[@media(max-width:1024px)]:bottom-[0]
        tw:[@media(max-width:1024px)]:[background:rgba(0,_0,_0,_0.5)]
        tw:[@media(max-width:1024px)]:[backdrop-filter:blur(4px)] tw:[@media(max-width:1024px)]:z-[99]
    `,
    sidebar__header: String.raw`
        tw:shrink-[0] tw:p-ui-lg tw:[border-bottom:1px_solid_var(--border-primary)] tw:ui-row tw:justify-between
    `,
    sidebar__nav: String.raw`
        tw:flex-[1] tw:min-h-[0] tw:p-ui-md tw:ui-stack tw:gap-ui-xs tw:overflow-y-auto
    `,
    'sidebar__account-status': String.raw`
        tw:text-[length:var(--font-size-xs)] tw:[line-height:1.4] tw:[font-weight:400] tw:text-secondary
        tw:wrap-anywhere
    `,
    'sidebar__account-status--warning': String.raw`
        tw:[&.sidebar\_\_account-status--warning]:[color:var(--color-warning)]
    `,
    sidebar__group: String.raw`
        tw:ui-stack tw:shrink-[0]
    `,
    'sidebar__sub-nav': String.raw`
        tw:grid tw:grid-rows-[0fr] tw:[transition:grid-template-rows_0.4s_cubic-bezier(0.4,_0,_0.2,_1)]
        tw:overflow-hidden
    `,
    'sidebar__sub-nav--open': String.raw`
        tw:[&.sidebar\_\_sub-nav--open]:grid-rows-[1fr] tw:[&_.sidebar\_\_sub-nav-inner]:visible
        tw:[&_.sidebar\_\_sub-nav-inner]:opacity-[1] tw:[&_.sidebar\_\_sub-nav-inner]:[transform:translateY(0)]
        tw:[&_.sidebar\_\_sub-nav-inner]:[transition-delay:0.1s]
    `,
    'sidebar__sub-nav-inner': String.raw`
        tw:min-h-[0] tw:invisible tw:opacity-[0] tw:[transform:translateY(-10px)]
        tw:[transition:opacity_0.3s_ease,_transform_0.3s_ease,_visibility_0.3s_ease]
    `,
    'sidebar__sub-group': String.raw`
        tw:mt-[0.35rem]
    `,
    'sidebar__sub-group-title': String.raw`
        tw:p-[0.45rem_0.75rem_0.2rem_2.75rem] tw:text-[length:0.65rem] tw:[text-transform:uppercase]
        tw:[letter-spacing:0.08em] tw:text-muted tw:[font-weight:700]
    `,
    sidebar__toggle: String.raw`
        tw:ui-fill-muted tw:ui-border tw:rounded-control tw:text-secondary tw:p-ui-sm tw:ui-row tw:justify-center
        tw:cursor-pointer
        tw:[transition:background-color_var(--transition-fast),_border-color_var(--transition-fast),_box-shadow_var(--transition-fast),_color_var(--transition-fast),_transform_var(--transition-fast)]
        tw:[&:hover]:[background:var(--bg-card-hover)] tw:[&:hover]:text-main
    `,
    'sidebar__toggle--mobile': String.raw`
        tw:[&.sidebar\_\_toggle--mobile]:hidden tw:[@media(max-width:1024px)]:[&.sidebar\_\_toggle--mobile]:flex
    `,
    'sidebar__toggle--fixed': String.raw`
        tw:[&.sidebar\_\_toggle--fixed]:fixed tw:[&.sidebar\_\_toggle--fixed]:top-[var(--spacing-md)]
        tw:[&.sidebar\_\_toggle--fixed]:left-[var(--spacing-md)] tw:[&.sidebar\_\_toggle--fixed]:z-[99]
        tw:[&.sidebar\_\_toggle--fixed]:hidden tw:[@media(max-width:1024px)]:[&.sidebar\_\_toggle--fixed]:flex
    `,
    'sidebar--open': String.raw`
        tw:[@media(max-width:1024px)]:[&.sidebar--open]:[transform:translateX(0)]
    `,
} as const;
export function sidebarFrameStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
