import { cn } from '../../utils/cn';
const styles = {
    academy: String.raw`
        tw:[--academy-surface-gap:1.25rem] tw:min-h-[calc(100vh_-_var(--header-height,_70px))] tw:ui-fill-canvas
        tw:overflow-x-hidden
    `,
    'academy--liquid-glass': String.raw`
        tw:[&.academy--liquid-glass]:[--academy-surface-gap:clamp(.75rem,_1.5vw,_1.25rem)]
        tw:[&_.academy\_\_content]:relative tw:[&_.academy\_\_content]:isolate
        tw:[@media(max-width:640px)]:[&&]:[--shadow-sm:inset_0_1px_0_var(--glass-edge-bright),_inset_0_-1px_0_rgba(0,_0,_0,_.045)]
        tw:[@media(max-width:640px)]:[&&]:[--shadow-md:inset_0_1px_0_var(--glass-edge-bright),_inset_0_-1px_0_rgba(0,_0,_0,_.055)]
        tw:[@media(max-width:640px)]:[&&]:[--shadow-lg:inset_0_1px_0_var(--glass-edge-bright),_inset_0_-1px_0_rgba(0,_0,_0,_.065)]
        tw:[@media(max-width:640px)]:[&&]:[--shadow-glow:inset_0_1px_0_var(--glass-edge-bright)]
    `,
    academy__content: String.raw`
        tw:w-full tw:m-[0_auto] tw:p-[0] tw:max-w-[var(--content-max-width,_100%)] tw:overflow-x-hidden
        tw:[&_>_*]:w-full tw:[&_>_*]:[max-width:var(--content-max-width,_100%)]! tw:[&_>_*]:ml-[auto]
        tw:[&_>_*]:mr-[auto] tw:[&_>_*]:[padding-left:0]! tw:[&_>_*]:[padding-right:0]! tw:[&_>_*]:box-border
        tw:[@media(max-width:1024px)]:p-[0] tw:[@media(max-width:640px)]:[&&]:p-[0]
    `,
} as const;
export function AcademyLayoutDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
