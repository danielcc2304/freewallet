import { cn } from '../../../utils/cn';

const styles = {
    'tax-info__tool-card': String.raw`
        tw:[text-decoration:none] tw:[transition:border-color_.2s] tw:[&:hover]:[border-color:var(--accent-primary)]
        tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&:focus-visible]:[outline-offset:4px]
        tw:[&_h3]:m-[0] tw:[&_h3]:text-[length:1.2rem] tw:[&_h3]:[line-height:1.35] tw:[&_p]:m-[0_0_.25rem]
        tw:[&_p]:text-secondary tw:[&_p]:text-[length:.95rem] tw:[&_p]:[line-height:1.65]
        tw:[@container(max-width:620px)]:p-[1.25rem]
    `,
    'tax-info__tool-icon': String.raw`
        tw:grid tw:place-items-center tw:w-[44px] tw:h-[44px] tw:rounded-[12px] tw:text-accent
        tw:[background:rgba(var(--accent-rgb),_.1)]
    `,
    'tax-info__tool-category': String.raw`
        tw:text-[length:.8rem] tw:[font-weight:600] tw:text-secondary
    `,
    'tax-info__tool-action': String.raw`
        tw:ui-row tw:gap-[.5rem] tw:min-h-[44px] tw:mt-[auto] tw:text-accent tw:text-[length:.9rem]
        tw:[font-weight:700] tw:[&_svg]:shrink-[0]
    `,
    'comparison-card': String.raw`
        tw:[.tax-info_&]:ui-fill-surface tw:[.tax-info_&]:ui-border-default tw:[.tax-info_&]:rounded-[20px]
        tw:[.tax-info_&]:p-[2rem] tw:[.tax-info_&_.header]:ui-row tw:[.tax-info_&_.header]:gap-[1rem]
        tw:[.tax-info_&_.header]:mb-[1.5rem] tw:[.tax-info_&_.header]:text-accent tw:[.tax-info_&_.header_h3]:m-[0]
        tw:[.tax-info_&_.header_h3]:text-[length:1.35rem] tw:[.tax-info_&_.header_h3]:[font-weight:800]
        tw:[.tax-info_&_.header_h3]:text-main tw:[.tax-info_&_ul]:[list-style:none] tw:[.tax-info_&_ul]:p-[0]
        tw:[.tax-info_&_ul]:m-[0] tw:[.tax-info_&_ul]:ui-stack tw:[.tax-info_&_ul]:gap-[1rem]
        tw:[.tax-info_&_li]:text-[length:0.95rem] tw:[.tax-info_&_li]:text-secondary
        tw:[.tax-info_&_li]:[line-height:1.5] tw:[.tax-info_&_li_strong]:text-main tw:[.tax-info_&_li_strong]:block
        tw:[.tax-info_&_li_strong]:mb-[0.25rem]
        tw:[.tax-info_:is(.tax-info\_\_card,_&)]:p-[clamp(1rem,_2.5vw,_1.5rem)]
        tw:[.tax-info_:is(.tax-info\_\_card-header,_&_.header)]:items-start
        tw:[.tax-info_:is(.tax-info\_\_card-header,_&_.header)_>_svg]:shrink-[0]
    `,
} as const;
export function taxTool(part: keyof typeof styles) { return cn(part, styles[part]); }
