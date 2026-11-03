import { cn } from '../../../utils/cn';

const styles = {
    'fundamentos__section-head': String.raw`
        tw:[&_h2]:m-[0_0_0.55rem] tw:[&_h2]:text-[length:1.4rem] tw:[&_h2]:text-main tw:[&_p]:m-[0]
        tw:[&_p]:[line-height:1.65] tw:[&_p]:text-secondary tw:mb-[var(--academy-space-stack)]
    `,
    'fundamentos__section-head-row': String.raw`
        tw:ui-row tw:justify-between tw:gap-[0.75rem]
    `,
    'fundamentos__collapse-toggle': String.raw`
        tw:w-[34px] tw:h-[34px] tw:ui-border-default tw:rounded-[10px] tw:ui-fill-muted tw:text-secondary
        tw:inline-flex tw:items-center tw:justify-center tw:cursor-pointer tw:[transition:all_0.2s_ease]
        tw:shrink-[0] tw:[&:hover]:text-main tw:[&:hover]:[border-color:var(--accent-primary)]
    `,
    'fundamentos__goal-card': String.raw`
        tw:ui-border-default tw:rounded-[14px] tw:ui-fill-muted tw:p-[var(--academy-space-card)] tw:[&_h3]:m-[0]
        tw:[&_h3]:text-main tw:[&&]:[border:0] tw:rounded-[0] tw:ui-fill-transparent tw:p-[0] tw:[&_p]:m-[0_0_1rem]
        tw:[&_p]:text-secondary tw:[&_h3]:pl-[0.2rem]
    `,
    'fundamentos__goal-links': String.raw`
        tw:grid tw:gap-[0.65rem]
    `,
} as const;
export function learningStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
