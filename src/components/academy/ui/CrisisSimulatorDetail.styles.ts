import { cn } from '../../../utils/cn';
const styles = {
    crisis: String.raw`
        tw:max-w-[1100px] tw:m-[0_auto] tw:pb-[3rem] tw:[container-type:inline-size] tw:text-main tw:wrap-anywhere
        tw:[&_:is(h2,_h3,_h4)]:text-main tw:[&_:is(h2,_h3,_h4)]:[line-height:1.35]
        tw:[&_h2]:text-[length:clamp(1.2rem,_2.2vw,_1.6rem)] tw:[&_h2]:m-[0_0_1rem]
        tw:[&_.crisis\_\_tab--active]:[border-color:var(--accent-primary)]
        tw:[&_.crisis\_\_tab--active]:[box-shadow:inset_0_0_0_1px_var(--accent-primary)]
        tw:[&_:is(a,_button,_input,_[tabindex]):focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_:is(a,_button,_input,_[tabindex]):focus-visible]:[outline-offset:4px]
        tw:[&_.crisis\_\_scenario--selected]:[border-color:var(--accent-primary)]
        tw:[&_.crisis\_\_scenario--selected]:[box-shadow:inset_0_0_0_1px_var(--accent-primary)]
    `,
    'crisis__header-tags': String.raw`
        tw:flex tw:flex-wrap tw:gap-[.65rem_1.25rem] tw:mt-[1.25rem] tw:[&_span]:inline-flex tw:[&_span]:items-center
        tw:[&_span]:gap-[.45rem] tw:[&_span]:text-secondary tw:[&_span]:text-[length:.8rem]
    `,
    crisis__selector: String.raw`
        tw:m-[2rem_0_1.25rem] tw:[&&_h2]:text-[length:1rem]
    `,
    'crisis__tab--active': String.raw`
        tw:[&_.crisis\_\_tab-name]:[color:inherit]
        tw:[@container(max-width:700px)]:[&_.crisis\_\_tab-name]:[color:inherit]
    `,
    'crisis__tab-name': String.raw``,
    crisis__eyebrow: String.raw`
        tw:block tw:text-[length:.75rem] tw:[font-weight:700] tw:text-secondary tw:mb-[.5rem]
    `,
    crisis__copy: String.raw`
        tw:text-secondary tw:text-[length:.95rem] tw:[line-height:1.7] tw:m-[0_0_1.25rem]
    `,
    crisis__stat: String.raw`
        tw:[align-content:start] tw:[&_>_svg]:text-accent
        tw:[&:first-child_>_svg]:[color:var(--error-color,_#ef4444)] tw:[&_>_span]:[line-height:1.5]
        tw:[@container(max-width:700px)]:grid-cols-[20px_minmax(0,_1fr)_auto]
        tw:[@container(max-width:700px)]:items-center tw:[@container(max-width:700px)]:gap-[.65rem]
        tw:[@container(max-width:700px)]:[&_strong]:text-[length:1.05rem]
        tw:[@container(max-width:360px)]:grid-cols-[20px_minmax(0,_1fr)]
        tw:[@container(max-width:360px)]:[&_strong]:col-[2]
    `,
    crisis__footnote: String.raw`
        tw:text-[length:.8rem] tw:text-secondary tw:[line-height:1.65] tw:m-[1rem_0_0]
    `,
    'crisis__input-group': String.raw`
        tw:[&_label]:[font-weight:600] tw:[&_label]:[line-height:1.5]
    `,
    'crisis__input-wrapper': String.raw`
        tw:[&:focus-within]:[border-color:var(--accent-primary)] tw:[&_input]:[font-family:inherit]
        tw:[&_input]:[font-size:inherit] tw:[&_input]:[font-weight:inherit] tw:[&_input]:[font-style:inherit]
        tw:[&_input]:[font-variant:inherit] tw:[&_input]:[font-stretch:inherit] tw:[&_input]:[line-height:inherit]
        tw:[&_input]:[border:0]
    `,
    crisis__impact: String.raw`
        tw:p-[1.25rem] tw:rounded-[12px] tw:ui-fill-muted tw:[&_>_p]:text-[length:.9rem]
        tw:[&_>_p]:[line-height:1.65] tw:[&_>_p]:text-secondary tw:[&_>_p]:m-[0] tw:[&_>_p_strong]:text-main
        tw:[@container(max-width:700px)]:p-[1rem]
    `,
    'crisis__impact-row--low': String.raw`
        tw:[&_.crisis\_\_bar_>_span]:[background:#e11d48]
    `,
    crisis__bar: String.raw``,
    'crisis__decision-title': String.raw`
        tw:m-[1.5rem_0_1rem] tw:text-[length:1.1rem]
    `,
    'crisis__scenario--selected': String.raw``,
    crisis__comparison: String.raw`
        tw:mt-[2.5rem]
    `,
    crisis__next: String.raw`
        tw:mt-[2.5rem]
    `,
    'crisis__table-wrapper': String.raw`
        tw:overflow-x-auto tw:ui-border-default tw:rounded-[14px] tw:ui-fill-surface
    `,
    crisis__table: String.raw`
        tw:w-full tw:min-w-[600px] tw:border-collapse tw:text-left tw:[&_caption]:p-[1rem]
        tw:[&_caption]:text-[length:.8rem] tw:[&_caption]:text-secondary tw:[&_caption]:text-left
        tw:[&_:is(th,_td)]:p-[1rem] tw:[&_:is(th,_td)]:[border-top:1px_solid_var(--border-color)]
        tw:[&_:is(th,_td)]:text-[length:.85rem] tw:[&_thead_th]:ui-fill-muted tw:[&_thead_th]:[font-weight:600]
        tw:[&_td]:text-secondary tw:[&_tbody_th_span]:block tw:[&_tbody_th_span]:text-[length:.8rem]
        tw:[&_tbody_th_span]:[font-weight:400] tw:[&_tbody_th_span]:text-secondary tw:[&_tbody_th_span]:mt-[.25rem]
        tw:[&_tbody_th_small]:block tw:[&_tbody_th_small]:text-[length:.7rem] tw:[&_tbody_th_small]:mt-[.25rem]
    `,
    'crisis__table-row--selected': String.raw`
        tw:[&.crisis\_\_table-row--selected]:[background:rgba(var(--accent-rgb),_.06)]
    `,
    'crisis__next-links': String.raw`
        tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[1rem]
        tw:[@container(max-width:700px)]:grid-cols-[1fr]
    `,
    crisis__stats: String.raw`
        tw:[@container(max-width:700px)]:grid-cols-[1fr]
    `,
    crisis__inputs: String.raw`
        tw:[@container(max-width:700px)]:grid-cols-[1fr]
    `,
    crisis__scenarios: String.raw`
        tw:[@container(max-width:700px)]:grid-cols-[1fr]
    `,
} as const;
export function CrisisSimulatorDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
