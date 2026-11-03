import { cn } from '../../utils/cn';
const styles = {
    layout: String.raw`
        tw:flex tw:min-h-[100vh] tw:ui-fill-canvas tw:overflow-x-hidden
    `,
    layout__main: String.raw`
        tw:flex-[1] tw:ml-[var(--sidebar-width)] tw:min-h-[100vh] tw:min-w-[0] tw:overflow-x-hidden
        tw:[transition:margin-left_var(--transition-base)] tw:[@media(max-width:1024px)]:ml-[0]
        tw:[@media(max-width:1024px)]:w-full
    `,
    layout__content: String.raw`
        tw:w-full tw:min-h-[100vh] tw:max-w-[none] tw:m-[0_auto] tw:p-ui-xl
        tw:[animation:fadeIn_var(--transition-base)_ease-out]
        tw:[@media(min-width:1025px)]:p-[var(--spacing-xl)_clamp(1.5rem,_2.5vw,_3rem)_var(--spacing-2xl)]
        tw:[@media(max-width:1024px)]:p-ui-lg tw:[@media(max-width:1024px)]:pt-[calc(var(--spacing-xl)_+_48px)]
        tw:[@media(max-width:640px)]:[&&]:p-ui-md
        tw:[@media(max-width:640px)]:[&&]:pt-[calc(var(--spacing-lg)_+_48px)]
    `,
} as const;
export function MainLayoutDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
