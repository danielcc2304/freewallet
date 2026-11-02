import { cn } from '../../../utils/cn';
const styles = {
    settings: String.raw`
        tw:w-full tw:max-w-[var(--content-max-width,_100%)] tw:m-[0_auto]
        tw:[animation:fadeIn_var(--transition-base)_ease-out]
    `,
    settings__header: String.raw`
        tw:mb-ui-xl
    `,
    settings__title: String.raw`
        tw:text-[length:var(--font-size-3xl)] tw:[font-weight:700] tw:m-[0]
        tw:[background:linear-gradient(135deg,_var(--text-primary)_0%,_var(--text-secondary)_100%)]
        tw:[-webkit-background-clip:text] tw:[-webkit-text-fill-color:transparent] tw:[background-clip:text]
    `,
    settings__subtitle: String.raw`
        tw:text-muted tw:m-[var(--spacing-xs)_0_0]
    `,
    settings__section: String.raw`
        tw:mb-ui-lg
    `,
    'settings__theme-options': String.raw`
        tw:grid tw:grid-cols-[repeat(3,_1fr)] tw:gap-ui-md tw:mb-ui-md
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    settings__hint: String.raw`
        tw:text-[length:var(--font-size-sm)] tw:text-muted tw:m-[0]
    `,
    settings__appearance: String.raw`
        tw:grid tw:gap-ui-md tw:mt-ui-xl tw:pt-ui-lg tw:[border-top:1px_solid_var(--border-primary)]
    `,
    'settings__appearance-copy': String.raw`
        tw:grid tw:gap-ui-xs
    `,
    'settings__appearance-title': String.raw`
        tw:ui-row tw:gap-ui-sm tw:text-main tw:[font-weight:600] tw:[&_svg]:text-accent
    `,
    'settings__appearance-options': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-ui-md
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'settings__data-info': String.raw`
        tw:mb-ui-lg
    `,
    'data-stat': String.raw`
        tw:ui-row tw:gap-ui-sm tw:text-secondary
    `,
    settings__actions: String.raw`
        tw:flex tw:gap-ui-md tw:flex-wrap tw:[@media(max-width:640px)]:[&&]:flex-col
        tw:[@media(max-width:640px)]:[&&_button]:w-full
    `,
    settings__about: String.raw`
        tw:ui-stack tw:gap-ui-md
    `,
    'about-item': String.raw`
        tw:ui-row tw:gap-ui-sm tw:text-accent tw:[font-weight:500]
    `,
    'about-item--link': String.raw`
        tw:[&.about-item--link]:self-start tw:[&.about-item--link]:[text-decoration:none]
        tw:[&.about-item--link]:[transition:color_var(--transition-fast)]
        tw:[&:hover]:[color:var(--accent-secondary)]
    `,
    'about-description': String.raw`
        tw:m-[0] tw:text-muted tw:text-[length:var(--font-size-sm)] tw:[line-height:1.6]
    `,
    'about-api': String.raw`
        tw:m-[0] tw:text-muted tw:text-[length:var(--font-size-sm)] tw:[line-height:1.6]
    `,
    'about-links': String.raw`
        tw:mt-ui-sm tw:pt-ui-sm tw:[border-top:1px_solid_var(--border-primary)]
    `,
    'settings__terms-link': String.raw`
        tw:text-accent tw:[text-decoration:none] tw:text-[length:var(--font-size-sm)] tw:[font-weight:500]
        tw:[transition:all_var(--transition-fast)] tw:[&:hover]:[color:var(--accent-secondary)]
        tw:[&:hover]:[text-decoration:underline]
    `,
    'settings__api-config': String.raw`
        tw:ui-stack tw:gap-ui-lg
    `,
    'settings__input-group': String.raw`
        tw:ui-stack tw:gap-ui-xs tw:[&_label]:[font-weight:600] tw:[&_label]:text-[length:var(--font-size-sm)]
        tw:[&_label]:text-secondary
    `,
} as const;
export function SettingsStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
