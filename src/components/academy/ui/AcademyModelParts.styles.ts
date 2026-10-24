import { cn } from '../../../utils/cn';

const styles = {
    'portfolio-builder__filter-chip': String.raw`
        tw:ui-border-default tw:ui-fill-muted tw:text-secondary tw:rounded-[999px] tw:p-[0.35rem_0.75rem]
        tw:text-[length:0.85rem] tw:cursor-pointer tw:[transition:all_0.2s_ease]
        tw:[&:hover]:[border-color:var(--accent-primary)] tw:[&:hover]:text-main
    `,
    'portfolio-builder__filter-chip--active': String.raw`
        tw:[&.portfolio-builder\_\_filter-chip--active]:[border-color:var(--accent-primary)]
        tw:[&.portfolio-builder\_\_filter-chip--active]:[background:rgba(var(--accent-rgb),_0.13)]
        tw:[&.portfolio-builder\_\_filter-chip--active]:text-main
    `,
    'strategy-model__meta': String.raw`
        tw:flex tw:flex-wrap tw:justify-between tw:gap-[.5rem] tw:text-[length:.75rem] tw:text-muted
    `,
    'strategy-model__mix': String.raw``,
    'strategy-model__actions': String.raw`
        tw:flex tw:flex-wrap tw:gap-[.5rem] tw:mt-[auto] tw:[&_>_*]:flex-[1]
        tw:[@media(max-width:640px)]:[&&_>_*]:min-w-[0]
    `,
    'strategy-bar': String.raw`
        tw:flex tw:w-full tw:h-[12px] tw:overflow-hidden tw:rounded-[12px] tw:ui-fill-muted tw:[&_>_span]:shrink-[0]
    `,
} as const;
export function modelStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
