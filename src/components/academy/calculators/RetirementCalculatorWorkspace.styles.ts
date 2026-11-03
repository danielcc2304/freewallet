import { cn } from '../../../utils/cn';
const styles = {
    retirement: String.raw`
        tw:max-w-[1200px] tw:m-[0_auto]
    `,
    retirement__header: String.raw`
        tw:mb-[2.5rem] tw:pb-[2rem] tw:[border-bottom:1px_solid_var(--border-color)] tw:flex tw:justify-between
        tw:items-start tw:gap-[2rem] tw:[@media(max-width:768px)]:flex-col tw:[@media(max-width:768px)]:items-start
        tw:[@media(max-width:768px)]:gap-[1.5rem]
    `,
    'retirement__summary-badge': String.raw`
        tw:ui-fill-surface tw:ui-border-default tw:rounded-[12px] tw:p-[0.75rem_1.25rem] tw:ui-stack tw:items-end
        tw:[@media(max-width:768px)]:items-start tw:[@media(max-width:768px)]:w-full
        tw:[@media(max-width:768px)]:mt-[0.5rem]
    `,
    'retirement__summary-label': String.raw`
        tw:text-[length:0.75rem] tw:[font-weight:600] tw:text-secondary tw:[text-transform:uppercase]
    `,
    'retirement__summary-value': String.raw`
        tw:text-[length:1.5rem] tw:[font-weight:800] tw:text-accent
    `,
    retirement__grid: String.raw`
        tw:grid tw:grid-cols-[320px_1fr] tw:gap-[2.5rem] tw:[@media(max-width:1024px)]:grid-cols-[1fr]
    `,
    retirement__inputs: String.raw`
        tw:ui-stack tw:gap-[2rem]
    `,
    'retirement__input-section': String.raw`
        tw:[--calculator-card-padding:1.75rem] tw:[--calculator-card-radius:16px]
    `,
    'retirement__section-header': String.raw`
        tw:text-[length:1.375rem] tw:[font-weight:600] tw:text-main tw:m-[0_0_1.5rem_0]
    `,
    'retirement__input-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem] tw:[align-items:end]
        tw:[&:not(.retirement\_\_input-grid--stacked)_.calc\_\_input-group_label]:block
        tw:[&:not(.retirement\_\_input-grid--stacked)_.calc\_\_input-group_label]:min-h-[2.2rem]
        tw:[&:not(.retirement\_\_input-grid--stacked)_.calc\_\_input-group_label]:[line-height:1.1]
    `,
    'retirement__input-grid--stacked': String.raw`
        tw:[&_.calc\_\_input-wrapper]:min-w-[0] tw:[&.retirement\_\_input-grid--stacked]:grid-cols-[1fr]
        tw:[&.retirement\_\_input-grid--stacked]:gap-[0]
    `,
    retirement__metrics: String.raw`
        tw:grid tw:grid-cols-[1fr_1fr] tw:gap-[1.5rem] tw:mb-[2rem] tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
} as const;
export function RetirementCalculatorWorkspaceStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
