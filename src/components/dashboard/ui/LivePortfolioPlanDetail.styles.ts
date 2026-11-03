import { cn } from '../../../utils/cn';
const styles = {
    'live-plan-stack': String.raw`
        tw:grid tw:gap-[1.25rem] tw:min-w-[0]
    `,
    'live-plan': String.raw`
        tw:min-w-[0] tw:[&_p]:text-secondary tw:[&_p]:text-[length:.85rem] tw:[&_table]:w-full
        tw:[&_table]:border-collapse tw:[&_table]:text-[length:.85rem] tw:[&_caption]:text-left
        tw:[&_caption]:text-[length:1rem] tw:[&_caption]:[font-weight:600] tw:[&_caption]:p-[.75rem_0]
        tw:[&_th]:text-right tw:[&_th]:p-[.85rem] tw:[&_th]:[border-bottom:1px_solid_var(--border-primary)]
        tw:[&_th]:whitespace-nowrap tw:[&_td]:text-right tw:[&_td]:p-[.85rem]
        tw:[&_td]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_td]:whitespace-nowrap
        tw:[&_th:first-child]:text-left tw:[&_th:first-child]:whitespace-normal tw:[&_th:first-child]:min-w-[160px]
        tw:[&_small]:block tw:[&_small]:text-muted tw:[&_small]:[font-weight:normal] tw:[&_small]:mt-[.25rem]
        tw:[&_input]:w-[85px] tw:[&_input]:p-[.5rem] tw:[&_input]:ui-border tw:[&_input]:rounded-[8px]
        tw:[&_input]:ui-fill-muted tw:[&_input]:text-main tw:[&_.is-positive]:text-positive
        tw:[&_.is-negative]:text-negative tw:[&_input]:min-h-[44px] tw:[&_input]:box-border
    `,
    'live-plan__summary': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(180px,_1fr))] tw:gap-[1rem] tw:[&_>_div]:grid
        tw:[&_>_div]:gap-[.5rem] tw:[&_>_div]:p-[1rem] tw:[&_>_div]:ui-fill-muted tw:[&_>_div]:rounded-[12px]
        tw:[&_span]:text-secondary tw:[&_span]:text-[length:.85rem]
    `,
    'live-plan__scroll': String.raw`
        tw:max-w-full tw:overflow-x-auto tw:m-[1rem_0] tw:relative tw:[overscroll-behavior-x:contain]
        tw:[&_th:first-child]:sticky tw:[&_th:first-child]:left-[0] tw:[&_th:first-child]:z-[1]
        tw:[&_th:first-child]:ui-fill-surface tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)]
    `,
    'live-plan__budget': String.raw`
        tw:ui-row tw:flex-wrap tw:gap-[1rem] tw:mt-[1.5rem] tw:[&_input]:w-[140px]
    `,
    'live-plan__use-weights': String.raw`
        tw:max-w-full tw:min-h-[44px] tw:mt-[.75rem] tw:whitespace-normal tw:text-center
        tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&:focus-visible]:[outline-offset:3px]
    `,
    'is-positive': String.raw``,
    'is-negative': String.raw``,
    'live-plan__mobile-positions': String.raw`
        tw:hidden tw:[@media(max-width:640px)]:[&&]:grid tw:[@media(max-width:640px)]:[&&]:gap-[.75rem]
        tw:[@media(max-width:640px)]:[&&]:m-[1rem_0]
    `,
    'live-plan__desktop-positions': String.raw`
        tw:[@media(max-width:640px)]:[&&]:hidden
    `,
    'live-plan__position': String.raw`
        tw:[@media(max-width:640px)]:[&&]:p-[1rem] tw:[@media(max-width:640px)]:[&&]:ui-border
        tw:[@media(max-width:640px)]:[&&]:rounded-[12px] tw:[@media(max-width:640px)]:[&&]:min-w-[0]
        tw:[@media(max-width:640px)]:[&&_h3]:text-[length:.9rem]
        tw:[@media(max-width:640px)]:[&&_h3]:[line-height:1.5] tw:[@media(max-width:640px)]:[&&_h3]:wrap-anywhere
        tw:[@media(max-width:640px)]:[&&_h3]:m-[0] tw:[@media(max-width:640px)]:[&&_summary]:text-[length:.8rem]
        tw:[@media(max-width:640px)]:[&&_summary]:cursor-pointer
        tw:[@media(max-width:640px)]:[&&_summary]:min-h-[44px] tw:[@media(max-width:640px)]:[&&_summary]:ui-row
        tw:[@media(max-width:640px)]:[&&_summary]:text-secondary
        tw:[@media(max-width:640px)]:[&&_summary::before]:[content:'+']
        tw:[@media(max-width:640px)]:[&&_summary::before]:mr-[.5rem]
        tw:[@media(max-width:640px)]:[&&_details[open]_summary::before]:[content:'−']
        tw:[@media(max-width:640px)]:[&&_summary:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[@media(max-width:640px)]:[&&_summary:focus-visible]:[outline-offset:2px]
        tw:[@media(max-width:640px)]:[html[data-appearance='liquid-glass']_&]:[background:var(--glass-content)]
        tw:[@media(max-width:640px)]:[html[data-appearance='liquid-glass']_&]:[border-color:var(--glass-edge-soft)]
    `,
    'live-plan__position-main': String.raw`
        tw:[@media(max-width:640px)]:[&&]:grid
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[repeat(3,_minmax(0,_1fr))]
        tw:[@media(max-width:640px)]:[&&]:[align-items:start] tw:[@media(max-width:640px)]:[&&]:gap-[.5rem]
        tw:[@media(max-width:640px)]:[&&]:m-[.75rem_0] tw:[@media(max-width:640px)]:[&&_>_div]:grid
        tw:[@media(max-width:640px)]:[&&_>_div]:gap-[.4rem] tw:[@media(max-width:640px)]:[&&_>_div]:min-w-[0]
        tw:[@media(max-width:640px)]:[&&_>_div]:text-[length:.75rem]
        tw:[@media(max-width:640px)]:[&&_>_div]:text-secondary tw:[@media(max-width:640px)]:[&&_>_label]:grid
        tw:[@media(max-width:640px)]:[&&_>_label]:gap-[.4rem] tw:[@media(max-width:640px)]:[&&_>_label]:min-w-[0]
        tw:[@media(max-width:640px)]:[&&_>_label]:text-[length:.75rem]
        tw:[@media(max-width:640px)]:[&&_>_label]:text-secondary tw:[@media(max-width:640px)]:[&&_strong]:text-main
        tw:[@media(max-width:640px)]:[&&_strong]:text-[length:.85rem]
        tw:[@media(max-width:640px)]:[&&_strong]:wrap-anywhere tw:[@media(max-width:640px)]:[&&_strong]:min-h-[44px]
        tw:[@media(max-width:640px)]:[&&_strong]:ui-row tw:[@media(max-width:640px)]:[&&_input]:w-full
        tw:[@media(max-width:640px)]:[&&_input]:min-w-[0]
    `,
} as const;
export function LivePortfolioPlanDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
