import { cn } from '../../utils/cn';

const styles = {
    'add-investment__form-card': String.raw`
        tw:ui-border-strong tw:[box-shadow:0_18px_50px_rgba(0,_0,_0,_0.12)] tw:[&_.card\_\_header]:mb-ui-lg
        tw:[&_.card\_\_title]:text-[length:clamp(1.25rem,_2vw,_1.5rem)] tw:[&_.card\_\_subtitle]:[line-height:1.5]
    `,
    'add-investment__form': String.raw`
        tw:ui-stack tw:gap-[1.35rem]
    `,
    'form-row': String.raw`
        tw:grid tw:grid-cols-[minmax(0,_1fr)_minmax(0,_0.9fr)_minmax(0,_1.12fr)] tw:gap-ui-md tw:[align-items:end]
        tw:[&_>_.form-group]:min-w-[0] tw:[&_>_.input-wrapper]:min-w-[0]
        tw:[@media(max-width:768px)]:grid-cols-[1fr] tw:[@media(max-width:768px)]:items-stretch
    `,
    'position-availability': String.raw`
        tw:m-[-0.45rem_0_-0.8rem] tw:text-muted tw:text-[length:var(--font-size-sm)] tw:[&_strong]:text-main
    `,
    'search-container': String.raw`
        tw:relative
    `,
    'search-results': String.raw`
        tw:absolute tw:top-[100%] tw:left-[0] tw:right-[0] tw:ui-fill-surface tw:ui-border-strong tw:rounded-control
        tw:mt-ui-xs tw:max-h-[320px] tw:p-[0.4rem] tw:overflow-y-auto tw:z-[50] tw:[list-style:none]
        tw:[box-shadow:var(--shadow-lg)]
    `,
    'search-loading': String.raw`
        tw:absolute tw:top-[100%] tw:left-[0] tw:right-[0] tw:p-ui-sm tw:ui-fill-surface tw:ui-border-strong
        tw:rounded-control tw:mt-ui-xs tw:ui-row tw:justify-center tw:gap-[0.5rem] tw:text-muted
    `,
    'add-investment--success': String.raw`
        tw:[&.add-investment--success]:ui-row tw:[&.add-investment--success]:justify-center
        tw:[&.add-investment--success]:min-h-[50vh]
    `,
    'success-card': String.raw`
        tw:max-w-[400px] tw:text-center
    `,
    'success-content': String.raw`
        tw:ui-stack tw:items-center tw:gap-ui-md tw:p-ui-xl tw:[&_h2]:m-[0] tw:[&_h2]:text-positive
        tw:[&_p]:text-secondary tw:[&_p]:m-[0]
    `,
    'success-content__icon': String.raw`
        tw:w-[80px] tw:h-[80px] tw:ui-row tw:justify-center tw:[background:var(--color-positive-bg)]
        tw:text-positive tw:rounded-[50%] tw:[animation:scaleIn_0.3s_ease-out]
    `,
} as const;
export function investmentFormStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
