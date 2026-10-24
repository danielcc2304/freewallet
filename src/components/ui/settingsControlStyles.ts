import { cn } from '../../utils/cn';

// Styles belong to the structured components; theme hooks remain stable.
const styles = {
    "settings__input": String.raw`
    tw:p-ui-md tw:ui-fill-surface tw:ui-border-strong tw:rounded-control tw:text-main tw:[font-family:inherit]
    tw:text-[length:var(--font-size-base)] tw:[transition:all_var(--transition-base)] tw:[&:focus]:[outline:none]
    tw:[&:focus]:[border-color:var(--accent-primary)] tw:[&:focus]:ui-fill-muted
    tw:[&:focus]:[box-shadow:0_0_0_3px_rgba(139,_92,_246,_0.1)]
`
} as const;

export function settingsControlClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
