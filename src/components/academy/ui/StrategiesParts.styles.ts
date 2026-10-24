import { cn } from '../../../utils/cn';

const styles = {
    'strategies__facts': String.raw`
        tw:m-[1.25rem_0] tw:grid tw:gap-[.9rem] tw:[&_>_div]:[border-top:1px_solid_var(--border-color)]
        tw:[&_>_div]:pt-[.75rem] tw:[&_dt]:text-[length:.85rem] tw:[&_dt]:[font-weight:700] tw:[&_dt]:mb-[.3rem]
        tw:[&_dd]:text-[length:.9rem] tw:[&_dd]:[line-height:1.6] tw:[&_dd]:text-secondary tw:[&_dd]:m-[0]
    `,
    'strategies__entry-detail': String.raw`
        tw:mt-[1rem] tw:pt-[.9rem] tw:[border-top:1px_solid_var(--border-color)] tw:[&_strong]:text-[length:.85rem]
        tw:[&_strong]:block tw:[&_strong]:mb-[.3rem]
    `,
    'strategies__balance-stage': String.raw`
        tw:[&_h4]:m-[0_0_.75rem] tw:[&_h4]:text-[length:.9rem] tw:[&_p]:text-[length:.85rem]
        tw:[&_p]:[line-height:1.6] tw:[&_p]:text-secondary tw:[&_p]:m-[.65rem_0_0]
    `,
    'strategies__balance-bar': String.raw`
        tw:flex tw:rounded-[8px] tw:overflow-hidden tw:h-[42px] tw:[&_span]:grid tw:[&_span]:place-items-center
        tw:[&_span]:[background:#047857] tw:[&_span]:[color:#fff] tw:[&_span]:[font-weight:700]
        tw:[&_span]:text-[length:.85rem] tw:[&_span_+_span]:[background:#1d4ed8]
    `,
    'strategies__rules': String.raw`
        tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[1rem] tw:[list-style:none] tw:p-[1.25rem_0_0]
        tw:m-[1.25rem_0_0] tw:[border-top:1px_solid_var(--border-color)] tw:[&_li]:flex tw:[&_li]:items-start
        tw:[&_li]:gap-[.65rem] tw:[&_svg]:flex-[0_0_20px] tw:[&_svg]:mt-[.1rem] tw:[&_svg]:text-accent
        tw:[&_strong]:text-[length:.9rem] tw:[&_p]:m-[.4rem_0_0] tw:[&_p]:text-[length:.85rem]
        tw:[&_p]:[line-height:1.65] tw:[&_p]:text-secondary tw:[@container(max-width:680px)]:grid-cols-[1fr]
    `,
} as const;
export function strategyParts(part: keyof typeof styles) { return cn(part, styles[part]); }
