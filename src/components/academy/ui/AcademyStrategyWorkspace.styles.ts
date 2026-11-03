import { cn } from '../../../utils/cn';

const styles = {
    'strategy-section-heading': String.raw`
        tw:flex tw:justify-between tw:items-start tw:flex-wrap tw:gap-[1rem] tw:mb-[1rem] tw:[&_p]:text-muted
        tw:[&_p]:text-[length:.85rem] tw:[&_p]:m-[.35rem_0] tw:[&_>_span]:text-muted
        tw:[&_>_span]:text-[length:.85rem]
    `,
    'strategy-filter-group': String.raw`
        tw:[border:0] tw:m-[1rem_0] tw:p-[0] tw:min-w-[0] tw:[&_legend]:text-[length:.85rem]
        tw:[&_legend]:text-secondary tw:[&_legend]:[font-weight:600] tw:[&_legend]:mb-[.5rem]
    `,
    'portfolio-builder__filter-options': String.raw`
        tw:flex tw:flex-wrap tw:gap-[0.5rem]
        tw:[html[data-appearance='liquid-glass']_.strategy-page_&]:ui-fill-transparent
        tw:[html[data-appearance='liquid-glass']_.strategy-page_&]:[border:0]
        tw:[html[data-appearance='liquid-glass']_.strategy-page_&]:[box-shadow:none]
        tw:[html[data-appearance='liquid-glass']_.strategy-page_&]:[backdrop-filter:none]
        tw:[html[data-appearance='liquid-glass']_.strategy-page_&]:[-webkit-backdrop-filter:none]
    `,
    'strategy-capital': String.raw`
        tw:grid tw:gap-[.5rem] tw:max-w-[320px] tw:text-main tw:text-[length:.9rem]
    `,
    'strategy-table-scroll': String.raw`
        tw:overflow-x-auto tw:max-w-full tw:ui-border tw:rounded-[12px] tw:[&_table]:w-full
        tw:[&_table]:min-w-[480px] tw:[&_table]:border-collapse tw:[&_table]:text-[length:.85rem]
        tw:[&_th]:p-[.8rem] tw:[&_th]:text-left tw:[&_th]:[border-bottom:1px_solid_var(--border-primary)]
        tw:[&_th]:text-main tw:[&_th]:max-w-[210px] tw:[&_th]:wrap-anywhere tw:[&_td]:p-[.8rem] tw:[&_td]:text-left
        tw:[&_td]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_td]:text-main tw:[&_td]:max-w-[210px]
        tw:[&_td]:wrap-anywhere tw:[&_th]:ui-fill-muted
    `,
    'portfolio-builder__empty': String.raw`
        tw:ui-fill-surface tw:[border:1px_dashed_var(--border-color)] tw:rounded-[16px] tw:p-[1.25rem]
        tw:[&_h3]:m-[0_0_0.35rem] tw:[&_h3]:text-[length:1rem] tw:[&_h3]:text-main tw:[&_p]:m-[0]
        tw:[&_p]:text-secondary
    `,
    'strategy-filter-note': String.raw`
        tw:text-muted tw:text-[length:.85rem] tw:m-[.35rem_0]
    `,
    'strategy-help': String.raw`
        tw:text-muted tw:text-[length:.85rem] tw:m-[.35rem_0]
    `,
    'strategy-model-note': String.raw`
        tw:p-[.85rem] tw:ui-fill-muted tw:rounded-[12px] tw:text-secondary tw:text-[length:.85rem]
    `,
    'strategy-error': String.raw`
        tw:text-negative tw:text-[length:.85rem]
    `,
    'strategy-plan__total': String.raw`
        tw:ui-row tw:justify-between tw:gap-[.75rem] tw:flex-wrap tw:mb-[1rem]
    `,
} as const;
export function strategyWorkspaceStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
