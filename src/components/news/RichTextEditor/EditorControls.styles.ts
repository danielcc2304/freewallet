import { cn } from '../../../utils/cn';

const styles = {
    'rich-text-editor__toolbar': String.raw`
        tw:ui-row tw:gap-[0.2rem] tw:flex-wrap tw:p-[0.5rem] tw:[border-bottom:1px_solid_var(--border-primary)]
        tw:rounded-[var(--radius-md)_var(--radius-md)_0_0] tw:ui-fill-muted
        tw:[@media(max-width:640px)]:[&&]:items-start
    `,
    'rich-text-editor__group': String.raw`
        tw:inline-flex tw:items-center tw:gap-[0.15rem] tw:flex-wrap tw:min-w-[0]
    `,
    'rich-text-editor__format': String.raw`
        tw:min-h-[34px] tw:p-[0.35rem_2rem_0.35rem_0.65rem] tw:ui-border-strong tw:rounded-[var(--radius-sm)]
        tw:ui-fill-surface tw:text-main tw:[font-family:inherit] tw:[font-weight:inherit] tw:[font-style:inherit]
        tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit]
        tw:text-[length:var(--font-size-sm)] tw:cursor-pointer
        tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&:focus-visible]:[outline-offset:2px]
        tw:[&:disabled]:cursor-not-allowed tw:[&:disabled]:opacity-[0.45]
    `,
    'rich-text-editor__format--font-size': String.raw`
        tw:[&.rich-text-editor\_\_format--font-size]:min-w-[100px]
    `,
    'rich-text-editor__button': String.raw`
        tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&:focus-visible]:[outline-offset:2px]
        tw:inline-flex tw:items-center tw:justify-center tw:w-[34px] tw:h-[34px] tw:p-[0]
        tw:[border:1px_solid_transparent] tw:rounded-[var(--radius-sm)] tw:ui-fill-transparent tw:text-secondary
        tw:cursor-pointer
        tw:[transition:background_var(--transition-fast),_border-color_var(--transition-fast),_color_var(--transition-fast)]
        tw:[&:hover:not(:disabled)]:[border-color:var(--border-secondary)]
        tw:[&:hover:not(:disabled)]:[background:var(--bg-card-hover)] tw:[&:hover:not(:disabled)]:text-main
        tw:[&:disabled]:cursor-not-allowed tw:[&:disabled]:opacity-[0.45]
    `,
    'rich-text-editor__button--active': String.raw`
        tw:[&.rich-text-editor\_\_button--active]:[border-color:rgba(var(--accent-rgb),_0.35)]
        tw:[&.rich-text-editor\_\_button--active]:[background:rgba(var(--accent-rgb),_0.14)]
        tw:[&.rich-text-editor\_\_button--active]:text-accent
        tw:[&:hover:not(:disabled)]:[border-color:rgba(var(--accent-rgb),_0.35)]
        tw:[&:hover:not(:disabled)]:[background:rgba(var(--accent-rgb),_0.14)]
        tw:[&:hover:not(:disabled)]:text-accent
    `,
    'rich-text-editor__separator': String.raw`
        tw:w-[1px] tw:h-[24px] tw:m-[0_0.25rem] tw:[background:var(--border-secondary)]
        tw:[@media(max-width:640px)]:[&&]:hidden
    `,
    'rich-text-editor__link-panel': String.raw`
        tw:[&_input:focus]:[border-color:var(--accent-primary)]
        tw:[&_input:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_input:focus-visible]:[outline-offset:2px] tw:grid tw:grid-cols-[minmax(0,_1fr)_auto] tw:gap-ui-md
        tw:[align-items:end] tw:p-ui-md tw:[border-bottom:1px_solid_var(--border-primary)] tw:ui-fill-muted
        tw:[&_input]:w-full tw:[&_input]:min-h-[34px] tw:[&_input]:p-[0.45rem_0.65rem] tw:[&_input]:ui-border-strong
        tw:[&_input]:rounded-[var(--radius-sm)] tw:[&_input]:ui-fill-surface tw:[&_input]:text-main
        tw:[&_input]:[font-family:inherit] tw:[&_input]:[font-weight:inherit] tw:[&_input]:[font-style:inherit]
        tw:[&_input]:[font-variant:inherit] tw:[&_input]:[font-stretch:inherit] tw:[&_input]:[line-height:inherit]
        tw:[&_input]:text-[length:var(--font-size-sm)] tw:[&_input:disabled]:cursor-not-allowed
        tw:[&_input:disabled]:opacity-[0.65] tw:[@media(max-width:820px)]:grid-cols-[1fr]
    `,
    'rich-text-editor__link-fields': String.raw`
        tw:grid tw:grid-cols-[auto_minmax(0,_1fr)_auto_minmax(0,_1fr)] tw:gap-[0.45rem_0.65rem] tw:items-center
        tw:[&_label]:text-secondary tw:[&_label]:text-[length:var(--font-size-xs)] tw:[&_label]:[font-weight:700]
        tw:[@media(max-width:820px)]:grid-cols-[auto_minmax(0,_1fr)]
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'rich-text-editor__link-actions': String.raw`
        tw:ui-row tw:justify-end tw:gap-ui-xs tw:flex-wrap
        tw:[@media(max-width:640px)]:[&&]:[justify-content:stretch] tw:[@media(max-width:640px)]:[&&_>_*]:flex-[1]
    `,
    'rich-text-editor__link-button': String.raw`
        tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&:focus-visible]:[outline-offset:2px]
        tw:inline-flex tw:items-center tw:justify-center tw:gap-[0.35rem] tw:min-h-[34px] tw:p-[0.4rem_0.7rem]
        tw:ui-border-strong tw:rounded-[var(--radius-sm)] tw:ui-fill-surface tw:text-secondary
        tw:[font-family:inherit] tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit]
        tw:[line-height:inherit] tw:text-[length:var(--font-size-xs)] tw:[font-weight:700] tw:cursor-pointer
        tw:[&:hover]:[border-color:var(--border-accent)] tw:[&:hover]:text-main
    `,
    'rich-text-editor__link-close': String.raw`
        tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&:focus-visible]:[outline-offset:2px]
        tw:inline-flex tw:items-center tw:justify-center tw:gap-[0.35rem] tw:min-h-[34px] tw:p-[0.4rem_0.7rem]
        tw:ui-border-strong tw:rounded-[var(--radius-sm)] tw:ui-fill-surface tw:text-secondary
        tw:[font-family:inherit] tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit]
        tw:[line-height:inherit] tw:text-[length:var(--font-size-xs)] tw:[font-weight:700] tw:cursor-pointer
        tw:[&:hover]:[border-color:var(--border-accent)] tw:[&:hover]:text-main tw:w-[34px] tw:p-[0]
        tw:[&&]:[border-color:transparent] tw:ui-fill-transparent tw:[@media(max-width:640px)]:[&&&]:flex-[0_0_34px]
    `,
    'rich-text-editor__link-button--primary': String.raw`
        tw:[&.rich-text-editor\_\_link-button--primary]:[border-color:var(--accent-primary)]
        tw:[&.rich-text-editor\_\_link-button--primary]:[background:var(--accent-primary)]
        tw:[&.rich-text-editor\_\_link-button--primary]:[color:var(--text-on-accent,_#fff)]
        tw:[&.rich-text-editor\_\_link-button--primary:hover]:[background:var(--accent-secondary,_var(--accent-primary))]
        tw:[&.rich-text-editor\_\_link-button--primary:hover]:[color:var(--text-on-accent,_#fff)]
    `,
    'rich-text-editor__link-button--danger': String.raw`
        tw:[&.rich-text-editor\_\_link-button--danger]:[border-color:rgba(239,_68,_68,_0.3)]
        tw:[&.rich-text-editor\_\_link-button--danger]:[background:var(--color-negative-bg)]
        tw:[&.rich-text-editor\_\_link-button--danger]:text-negative
    `,
} as const;
export function editorControlStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
