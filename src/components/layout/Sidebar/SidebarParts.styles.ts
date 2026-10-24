import { cn } from '../../../utils/cn';

const styles = {
    'sidebar__logo': String.raw`
        tw:ui-row tw:gap-ui-sm
    `,
    'sidebar__logo-icons': String.raw`
        tw:relative tw:ui-row tw:w-[32px] tw:h-[32px]
    `,
    'sidebar__logo-icon': String.raw`
        tw:text-accent tw:w-[24px] tw:h-[24px]
    `,
    'sidebar__logo-icon--wallet': String.raw`
        tw:[&.sidebar\_\_logo-icon--wallet]:z-[1]
    `,
    'sidebar__logo-icon--feather': String.raw`
        tw:[&.sidebar\_\_logo-icon--feather]:absolute tw:[&.sidebar\_\_logo-icon--feather]:top-[-4px]
        tw:[&.sidebar\_\_logo-icon--feather]:right-[-4px] tw:[&.sidebar\_\_logo-icon--feather]:w-[18px]
        tw:[&.sidebar\_\_logo-icon--feather]:h-[18px]
        tw:[&.sidebar\_\_logo-icon--feather]:[color:var(--accent-secondary)]
        tw:[&.sidebar\_\_logo-icon--feather]:[transform:rotate(15deg)] tw:[&.sidebar\_\_logo-icon--feather]:z-[2]
        tw:[&.sidebar\_\_logo-icon--feather]:[filter:drop-shadow(0_0_2px_rgba(0,_0,_0,_0.2))]
    `,
    'sidebar__logo-text': String.raw`
        tw:text-[length:var(--font-size-xl)] tw:[font-weight:700]
        tw:[background:linear-gradient(135deg,_var(--accent-primary),_var(--accent-secondary))]
        tw:[-webkit-background-clip:text] tw:[-webkit-text-fill-color:transparent] tw:[background-clip:text]
    `,
    'sidebar__link': String.raw`
        tw:flex tw:shrink-[0] tw:items-center tw:gap-ui-md tw:p-ui-md tw:rounded-control tw:text-secondary
        tw:[text-decoration:none] tw:[font-weight:500]
        tw:[transition:background-color_var(--transition-fast),_________border-color_var(--transition-fast),_________box-shadow_var(--transition-fast),_________color_var(--transition-fast),_________transform_var(--transition-fast)]
        tw:[border:none] tw:[background:none] tw:cursor-pointer tw:text-[length:inherit] tw:w-full tw:text-left
        tw:[&&:hover]:ui-fill-muted tw:[&&:hover]:text-main
    `,
    'sidebar__link--active': String.raw`
        tw:[&.sidebar\_\_link--active]:ui-fill-muted tw:[&.sidebar\_\_link--active]:text-accent
        tw:[&.sidebar\_\_link--active]:[box-shadow:inset_3px_0_0_var(--accent-primary)]
    `,
    'sidebar__link-icon': String.raw`
        tw:shrink-[0]
    `,
    'sidebar__account-label': String.raw`
        tw:ui-stack tw:gap-[0.2rem] tw:min-w-[0]
    `,
    'sidebar__group-toggle': String.raw`
        tw:relative
    `,
    'sidebar__chevron': String.raw`
        tw:ml-[auto] tw:shrink-[0] tw:[transition:transform_0.25s_ease] tw:text-muted
    `,
    'sidebar__chevron--open': String.raw`
        tw:[&.sidebar\_\_chevron--open]:[transform:rotate(180deg)]
    `,
    'sidebar__sub-link': String.raw`
        tw:ui-row tw:gap-ui-sm tw:p-[0.5rem_0.75rem_0.5rem_2.75rem] tw:text-secondary tw:[text-decoration:none]
        tw:text-[length:0.875rem] tw:[font-weight:400] tw:rounded-[var(--radius-sm)]
        tw:[transition:background-color_var(--transition-fast),_color_var(--transition-fast)] tw:whitespace-nowrap
        tw:overflow-hidden tw:text-ellipsis tw:[&&:hover]:ui-fill-muted tw:[&&:hover]:text-main
    `,
    'sidebar__sub-link--active': String.raw`
        tw:[&.sidebar\_\_sub-link--active]:text-accent
        tw:[&.sidebar\_\_sub-link--active]:[background:rgba(var(--accent-rgb,_99,_102,_241),_0.08)]
        tw:[&.sidebar\_\_sub-link--active]:[font-weight:500] tw:[&_.sidebar\_\_sub-icon]:opacity-[1]
    `,
    'sidebar__sub-icon': String.raw`
        tw:shrink-[0] tw:opacity-[0.7]
    `,
    'sidebar__sub-text': String.raw`
        tw:overflow-hidden tw:text-ellipsis
    `,
    'sidebar__footer': String.raw`
        tw:shrink-[0] tw:p-ui-md tw:pb-[calc(var(--spacing-md)_+_env(safe-area-inset-bottom,_0px))]
        tw:[border-top:1px_solid_var(--border-primary)]
    `,
    'sidebar__version': String.raw`
        tw:block tw:text-[length:var(--font-size-xs)] tw:text-muted tw:text-center tw:[text-decoration:none]
        tw:[transition:color_var(--transition-fast)] tw:[&&:hover]:text-accent
    `,
    'sidebar__terms-link': String.raw`
        tw:block tw:text-[length:10px] tw:text-muted tw:text-center tw:[text-decoration:none] tw:mb-[4px]
        tw:[transition:color_var(--transition-fast)] tw:[&&:hover]:text-accent
    `,
} as const;
export function sidebarStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
