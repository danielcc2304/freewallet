import { cn } from '../../../utils/cn';
const styles = {
    'asset-detail': String.raw`
        tw:grid tw:gap-[1.5rem] tw:text-main tw:min-h-[max-content] tw:min-w-[0] tw:w-full tw:max-w-full
        tw:box-border tw:overflow-x-hidden tw:[&_.positive]:text-positive tw:[&_.negative]:text-negative
        tw:[&_button:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_button:focus-visible]:[outline-offset:2px]
    `,
    'asset-detail-loading': String.raw`
        tw:ui-stack tw:items-center tw:justify-center tw:p-[3rem] tw:gap-[1rem] tw:text-secondary
    `,
    'asset-detail__position-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(4,_minmax(0,_1fr))] tw:gap-[0.75rem] tw:min-w-[0] tw:w-full tw:box-border
        tw:[@media(max-width:768px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
    `,
    positive: String.raw``,
    negative: String.raw``,
    'section-title': String.raw`
        tw:ui-row tw:gap-[0.5rem] tw:text-[length:1.125rem] tw:[font-weight:700] tw:mb-[1rem]
    `,
    'metrics-loading': String.raw`
        tw:ui-stack tw:items-center tw:justify-center tw:p-[3rem] tw:gap-[1rem] tw:text-secondary
    `,
    'metrics-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(4,_minmax(0,_1fr))] tw:gap-[1rem]
        tw:[@media(max-width:1024px)]:grid-cols-[repeat(3,_1fr)]
        tw:[@media(max-width:768px)]:grid-cols-[repeat(2,_1fr)]
    `,
    'asset-detail__metrics-note': String.raw`
        tw:ui-row tw:justify-between tw:flex-wrap tw:gap-[.5rem] tw:mt-[.75rem] tw:text-muted
        tw:[&_.btn]:min-h-[44px]
    `,
    btn: String.raw``,
    'asset-detail__metric-date': String.raw`
        tw:block tw:mt-[.3rem] tw:text-muted tw:text-[length:.7rem]
    `,
    'metrics-empty': String.raw`
        tw:col-span-full tw:p-[1rem] tw:[border:1px_dashed_var(--border-color)] tw:rounded-[10px] tw:text-muted
    `,
    spinner: String.raw`
        tw:w-[2rem] tw:h-[2rem] tw:[border:3px_solid_rgba(255,_255,_255,_0.1)]
        tw:[border-top-color:var(--accent-primary)] tw:rounded-[50%] tw:[animation:spin_1s_linear_infinite]
    `,
    'spinner-sm': String.raw`
        tw:w-[1.5rem] tw:h-[1.5rem] tw:[border:2px_solid_rgba(255,_255,_255,_0.1)]
        tw:[border-top-color:var(--accent-primary)] tw:rounded-[50%] tw:[animation:spin_1s_linear_infinite]
    `,
    'asset-detail__quote-market': String.raw`
        tw:grid tw:gap-[.5rem] tw:m-[1rem_0] tw:[&_select]:w-full tw:[&_select]:min-w-[0] tw:[&_select]:min-h-[44px]
        tw:[&_select]:p-[.6rem] tw:[&_select]:ui-border tw:[&_select]:rounded-[var(--radius-sm)]
        tw:[&_select]:ui-fill-surface tw:[&_select]:text-main tw:[&_select]:[font-family:inherit]
        tw:[&_select]:[font-size:inherit] tw:[&_select]:[font-weight:inherit] tw:[&_select]:[font-style:inherit]
        tw:[&_select]:[font-variant:inherit] tw:[&_select]:[font-stretch:inherit] tw:[&_select]:[line-height:inherit]
        tw:[&_p]:m-[0] tw:[&_p]:text-muted tw:[&_p]:text-[length:var(--font-size-sm)]
    `,
    'asset-detail__purchases': String.raw`
        tw:m-[1rem_0] tw:[&_h3]:text-[length:var(--font-size-base)] tw:[&_h3]:mb-[.75rem] tw:[&_table]:w-full
        tw:[&_table]:border-collapse tw:[&_table]:text-[length:var(--font-size-sm)] tw:[&_th]:p-[.65rem_.5rem]
        tw:[&_th]:text-right tw:[&_th]:whitespace-nowrap tw:[&_th]:[border-bottom:1px_solid_var(--border-primary)]
        tw:[&_td]:p-[.65rem_.5rem] tw:[&_td]:text-right tw:[&_td]:whitespace-nowrap
        tw:[&_td]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_th]:text-secondary
        tw:[&_th]:[font-weight:500] tw:[&_th:first-child]:text-left tw:[&_td:first-child]:text-left
    `,
    'asset-detail__purchases-scroll': String.raw`
        tw:overflow-x-auto
    `,
} as const;
export function AssetDetailDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
