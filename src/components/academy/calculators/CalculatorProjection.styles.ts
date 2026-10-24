import { cn } from '../../../utils/cn';

const styles = {
    fire__header: String.raw`
        tw:flex tw:justify-between tw:items-start tw:mb-[2.5rem] tw:[border-bottom:1px_solid_var(--border-color)]
        tw:pb-[2rem] tw:[@media(max-width:768px)]:flex-col tw:[@media(max-width:768px)]:gap-[1.5rem]
    `,
    'fire__years-badge': String.raw`
        tw:ui-fill-surface tw:ui-border-default tw:rounded-[16px] tw:p-[1rem_1.75rem] tw:text-center
        tw:[box-shadow:var(--shadow-sm)]
    `,
    'fire__years-value': String.raw`
        tw:block tw:text-[length:2.5rem] tw:[font-weight:800] tw:text-accent tw:[line-height:1]
    `,
    'fire__years-label': String.raw`
        tw:text-[length:0.85rem] tw:[font-weight:600] tw:text-secondary tw:[text-transform:uppercase]
        tw:[letter-spacing:0.05em]
    `,
    'fire__years-compare': String.raw`
        tw:mt-[0.75rem] tw:pt-[0.7rem] tw:[border-top:1px_solid_var(--border-primary)] tw:ui-stack tw:gap-[0.3rem]
        tw:text-left tw:[&_span]:text-[length:0.76rem] tw:[&_span]:[font-weight:600] tw:[&_span]:text-secondary
        tw:[&_span]:whitespace-nowrap
    `,
    'fire__section-title': String.raw`
        tw:text-[length:1.25rem] tw:[font-weight:700] tw:text-main tw:mb-[1.5rem]
    `,
    fire__inputs: String.raw`
        tw:ui-fill-surface tw:p-[2rem] tw:rounded-[20px] tw:ui-border-default tw:ui-stack
    `,
    'fire__input-hint': String.raw`
        tw:block tw:mt-[0.6rem] tw:text-secondary tw:text-[length:0.82rem] tw:[line-height:1.45]
    `,
    'fire__optional-card': String.raw`
        tw:mb-[1.5rem]
    `,
    'fire__optional-content': String.raw`
        tw:mt-[0.85rem] tw:pt-[1rem] tw:[border-top:1px_solid_var(--border-primary)]
    `,
    'fire__optional-group': String.raw`
        tw:mb-[0]
    `,
    fire__results: String.raw`
        tw:ui-stack tw:min-h-[100%] tw:[@media(min-width:1025px)]:min-h-[100%]
    `,
} as const;
export function projectionStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
