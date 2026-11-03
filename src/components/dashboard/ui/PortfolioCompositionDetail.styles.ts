import { cn } from '../../../utils/cn';
const styles = {
    'portfolio-composition__content': String.raw`
        tw:grid tw:grid-cols-[minmax(0,_1fr)_300px] tw:[grid-template-areas:"heatmap_donut"] tw:[align-items:start]
        tw:gap-ui-xl tw:[@media(max-width:1024px)]:grid-cols-[1fr]
        tw:[@media(max-width:1024px)]:[grid-template-areas:"donut"_"heatmap"]
    `,
    'portfolio-composition__heatmap': String.raw`
        tw:[grid-area:heatmap] tw:min-w-[0]
    `,
    'portfolio-composition__donut': String.raw`
        tw:[grid-area:donut] tw:min-w-[0] tw:[@media(max-width:1024px)]:order-[-1]
    `,
    'portfolio-composition__consolidated': String.raw`
        tw:col-span-full tw:min-w-[0] tw:grid tw:gap-ui-md tw:mt-[0] tw:p-ui-md tw:ui-border tw:rounded-control
        tw:[background:rgba(255,_255,_255,_0.02)]
    `,
    'portfolio-composition__distributions': String.raw`
        tw:col-span-full tw:grid tw:gap-ui-md tw:min-w-[0] tw:[&:empty]:hidden
    `,
    'portfolio-composition__section-title': String.raw`
        tw:text-[length:var(--font-size-base)] tw:[font-weight:600] tw:text-main tw:mb-ui-md
    `,
    'portfolio-composition__breakdown-status': String.raw`
        tw:m-[var(--spacing-sm)_0_0] tw:text-muted tw:text-[length:var(--font-size-xs)]
    `,
    'portfolio-composition__consolidated-header': String.raw`
        tw:flex tw:items-start tw:justify-between tw:gap-ui-md tw:[&_h4]:m-[0] tw:[&_h4]:text-main
        tw:[&_h4]:text-[length:var(--font-size-base)] tw:[&_p]:m-[var(--spacing-xs)_0_0] tw:[&_p]:text-muted
        tw:[&_p]:text-[length:var(--font-size-xs)] tw:[&_p]:[line-height:1.45] tw:[&_>_span]:flex-[0_0_auto]
        tw:[&_>_span]:text-accent tw:[&_>_span]:text-[length:var(--font-size-xs)] tw:[&_>_span]:[font-weight:700]
        tw:[&_>_span]:whitespace-nowrap tw:[@media(max-width:640px)]:[&&]:grid
        tw:[@media(max-width:640px)]:[&&_>_span]:whitespace-normal
    `,
    'portfolio-composition__consolidated-note': String.raw`
        tw:m-[var(--spacing-xs)_0_0] tw:text-muted tw:text-[length:var(--font-size-xs)] tw:[line-height:1.45]
        tw:m-[0]
    `,
    'portfolio-composition__exposure-list': String.raw`
        tw:grid tw:gap-[2px] tw:max-h-[27rem] tw:overflow-y-auto tw:pr-[2px]
    `,
    'portfolio-composition__exposure-sections': String.raw`
        tw:grid tw:gap-ui-md
    `,
    'portfolio-composition__exposure-group': String.raw`
        tw:grid tw:gap-ui-xs tw:[&_+_.portfolio-composition\_\_exposure-group]:pt-ui-md
        tw:[&_+_.portfolio-composition\_\_exposure-group]:[border-top:1px_solid_var(--border-primary)]
    `,
} as const;
export function PortfolioCompositionDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
