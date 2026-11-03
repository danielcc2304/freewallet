import { cn } from '../../../utils/cn';
const styles = {
    'alloc-sim': String.raw`
        tw:[--academy-space-section:2rem] tw:[--academy-space-card:1.5rem] tw:[--academy-space-card-lg:2rem]
        tw:[--academy-space-stack:1.5rem] tw:max-w-[1200px] tw:m-[0_auto]
        tw:[@media(max-width:768px)]:[--academy-space-section:1.5rem]
        tw:[@media(max-width:768px)]:[--academy-space-card:1.25rem]
        tw:[@media(max-width:768px)]:[--academy-space-card-lg:1.5rem]
        tw:[@media(max-width:768px)]:[--academy-space-stack:1.1rem] tw:min-w-[0]
        tw:[&_input:not([type='range'])]:min-w-[0] tw:[&_input:not([type='range'])]:w-full
        tw:[&_input:not([type='range'])]:min-h-[44px] tw:[&_input:not([type='range'])]:p-[.6rem]
        tw:[&_input:not([type='range'])]:ui-border-strong tw:[&_input:not([type='range'])]:rounded-[10px]
        tw:[&_input:not([type='range'])]:ui-fill-muted tw:[&_input:not([type='range'])]:text-main
        tw:[&_input:not([type='range'])]:[font-family:inherit] tw:[&_input:not([type='range'])]:[font-size:inherit]
        tw:[&_input:not([type='range'])]:[font-weight:inherit] tw:[&_input:not([type='range'])]:[font-style:inherit]
        tw:[&_input:not([type='range'])]:[font-variant:inherit]
        tw:[&_input:not([type='range'])]:[font-stretch:inherit]
        tw:[&_input:not([type='range'])]:[line-height:inherit] tw:[&_select]:min-w-[0] tw:[&_select]:w-full
        tw:[&_select]:min-h-[44px] tw:[&_select]:p-[.6rem] tw:[&_select]:ui-border-strong
        tw:[&_select]:rounded-[10px] tw:[&_select]:ui-fill-muted tw:[&_select]:text-main
        tw:[&_select]:[font-family:inherit] tw:[&_select]:[font-size:inherit] tw:[&_select]:[font-weight:inherit]
        tw:[&_select]:[font-style:inherit] tw:[&_select]:[font-variant:inherit] tw:[&_select]:[font-stretch:inherit]
        tw:[&_select]:[line-height:inherit] tw:[&_.calc\_\_input-wrapper]:min-w-[0] tw:[&_label]:text-[length:.9rem]
        tw:[&_label]:text-main tw:[&_input[type='range']]:w-full tw:[&_input[type='range']]:min-h-[44px]
        tw:[&_:is(input,select,button,a,summary):focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_:is(input,select,button,a,summary):focus-visible]:[outline-offset:3px]
        tw:[&_details_summary]:cursor-pointer tw:[&_details_summary]:min-h-[44px] tw:[&_details_summary]:ui-row
        tw:[&_details_summary]:[font-weight:600]
    `,
    'alloc-sim__content': String.raw`
        tw:ui-stack tw:gap-[var(--academy-space-section)]
    `,
    'alloc-sim__stat-card': String.raw`
        tw:[&_.label]:[font-weight:700] tw:[&_.label]:[text-transform:uppercase] tw:[&_.value]:[font-weight:800]
        tw:min-w-[0] tw:[&_.value]:text-[length:1.7rem] tw:[&_.desc]:[line-height:1.5] tw:[&_.desc]:wrap-anywhere
    `,
    label: String.raw``,
    value: String.raw``,
    'alloc-sim__chart-box': String.raw`
        tw:[@media(max-width:640px)]:[&&]:p-[1rem_0.5rem]
    `,
    'box-title': String.raw`
        tw:text-[length:1rem] tw:[font-weight:700] tw:mb-[1.5rem]
    `,
    'alloc-sim__top-section': String.raw`
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    'alloc-sim__top-section--three': String.raw`
        tw:[&.alloc-sim\_\_top-section--three]:grid-cols-[repeat(3,minmax(0,1fr))]
        tw:[@media(max-width:800px)]:[&.alloc-sim\_\_top-section--three]:grid-cols-[1fr]
    `,
    desc: String.raw``,
    'calc__input-wrapper': String.raw``,
    'alloc-sim__shock-grid': String.raw`
        tw:[&_label]:grid tw:[&_label]:gap-[.5rem] tw:[@media(max-width:800px)]:grid-cols-[repeat(2,minmax(0,1fr))]
        tw:[@media(max-width:400px)]:[&&]:grid-cols-[1fr]
    `,
    'alloc-sim__back': String.raw`
        tw:inline-flex tw:items-center tw:gap-[.6rem] tw:min-h-[44px] tw:text-accent tw:[font-weight:600]
    `,
    'alloc-sim__inputs-area': String.raw`
        tw:[@media(max-width:400px)]:[&&]:p-[1rem]
    `,
    'alloc-sim__info-box': String.raw``,
    'alloc-sim__disclaimer': String.raw``,
} as const;
export function AssetAllocationSimFrameStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
