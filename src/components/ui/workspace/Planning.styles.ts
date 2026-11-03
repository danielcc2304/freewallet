import { cn } from '../../../utils/cn';
const styles = {
    'planning-page': String.raw`
        tw:grid tw:gap-[1.5rem]
    `,
    'planning-page__grid': String.raw`
        tw:grid tw:grid-cols-[1.5fr_1fr] tw:gap-[1rem] tw:[@media(max-width:980px)]:grid-cols-[1fr]
    `,
    'planning-page__checks': String.raw`
        tw:grid tw:gap-[1rem]
    `,
    'planning-page__summary': String.raw`
        tw:grid tw:gap-[1rem]
    `,
    'planning-section': String.raw`
        tw:grid tw:gap-[1rem]
    `,
    'planning-form': String.raw`
        tw:grid tw:gap-[1rem]
    `,
    'planning-list': String.raw`
        tw:grid tw:gap-[1rem]
    `,
    'planning-check': String.raw`
        tw:grid tw:grid-cols-[auto_1fr] tw:gap-[0.75rem] tw:p-[0.9rem_1rem] tw:rounded-control
        tw:[&_p]:m-[0.25rem_0_0] tw:[&_p]:text-secondary
    `,
    'planning-check--good': String.raw`
        tw:[&.planning-check--good]:[background:rgba(16,_185,_129,_0.08)]
        tw:[&.planning-check--good]:[color:inherit]
    `,
    'planning-check--warn': String.raw`
        tw:[&.planning-check--warn]:[background:rgba(245,_158,_11,_0.1)] tw:[&.planning-check--warn]:[color:inherit]
    `,
    'planning-check__icon': String.raw`
        tw:mt-[0.1rem]
    `,
    'planning-page__split': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem] tw:[@media(max-width:980px)]:grid-cols-[1fr]
    `,
    'planning-form__row': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[0.75rem]
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'planning-select': String.raw`
        tw:w-full tw:min-h-[48px] tw:p-[0.75rem_0.95rem] tw:ui-border-default tw:rounded-control tw:ui-fill-surface
        tw:text-main
    `,
    'planning-empty': String.raw`
        tw:m-[0] tw:text-secondary
    `,
    'planning-item': String.raw`
        tw:p-[1rem] tw:ui-border-default tw:rounded-panel tw:ui-fill-surface tw:grid tw:gap-[0.85rem]
    `,
    'planning-item__header': String.raw`
        tw:flex tw:justify-between tw:gap-[1rem] tw:[&_h3]:m-[0] tw:[&_h3]:text-[length:1rem]
        tw:[&_span]:text-secondary tw:[&_span]:text-[length:0.875rem]
    `,
    'planning-item__icon-button': String.raw`
        tw:[border:0] tw:ui-fill-transparent tw:text-secondary tw:cursor-pointer tw:p-[0.25rem]
        tw:[&:hover]:[color:var(--accent-danger,_#ef4444)]
    `,
    'planning-progress': String.raw`
        tw:grid tw:gap-[0.45rem]
    `,
    'planning-progress__bar': String.raw`
        tw:w-full tw:h-[10px] tw:rounded-[999px] tw:ui-fill-muted tw:overflow-hidden tw:[&_span]:block
        tw:[&_span]:h-full tw:[&_span]:[background:linear-gradient(90deg,_#10b981,_#3b82f6)]
    `,
    'planning-item__meta': String.raw`
        tw:flex tw:flex-wrap tw:gap-[0.75rem] tw:text-secondary tw:text-[length:0.875rem]
    `,
    'planning-item__notes': String.raw`
        tw:m-[0] tw:text-secondary
    `,
} as const;
export function PlanningStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
