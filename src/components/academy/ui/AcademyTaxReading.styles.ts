import { cn } from '../../../utils/cn';
const styles = {
    'tax-info__header': String.raw`
        tw:mb-[3rem] tw:text-center
    `,
    'tax-info__title': String.raw`
        tw:text-[length:2.5rem] tw:[font-weight:800] tw:text-main tw:mb-[1rem]
        tw:[@media(max-width:768px)]:text-[length:1.85rem] tw:[@media(max-width:480px)]:[&&]:text-[length:1.6rem]
    `,
    'tax-info__subtitle': String.raw`
        tw:text-[length:1.125rem] tw:text-secondary tw:[line-height:1.6] tw:max-w-[700px] tw:m-[0_auto]
    `,
    'tax-info__section-title': String.raw`
        tw:text-[length:1.75rem] tw:[font-weight:700] tw:m-[3.5rem_0_1.5rem] tw:text-main
        tw:text-[length:clamp(1.2rem,_2.3vw,_1.6rem)] tw:[line-height:1.35] tw:mt-[2.5rem]
    `,
    'bracket-card': String.raw`
        tw:[&&]:ui-fill-surface tw:[&&]:ui-border-default tw:[&&]:p-[1.5rem] tw:[&&]:rounded-[12px]
        tw:[&&]:text-center tw:[&&]:[transition:transform_0.2s] tw:[&&:hover]:[transform:translateY(-4px)]
        tw:[&&:hover]:[border-color:var(--accent-primary)] tw:[&&.highlight_.bracket-range]:text-main
        tw:[&&.highlight_.bracket-range]:opacity-[0.85]
    `,
    'bracket-range': String.raw`
        tw:[&&]:block tw:[&&]:text-[length:0.8rem] tw:[&&]:text-secondary tw:[&&]:mb-[0.5rem]
        tw:[&&]:[font-weight:600]
    `,
    'bracket-rate': String.raw`
        tw:[&&]:text-[length:1.5rem] tw:[&&]:[font-weight:800] tw:[&&]:text-accent
    `,
    'tax-info__card-header': String.raw`
        tw:ui-row tw:gap-[1rem] tw:mb-[1rem] tw:[&_.icon]:text-accent tw:[&_h3]:m-[0]
        tw:[&_h3]:text-[length:1.25rem] tw:[&_h3]:[font-weight:700]
    `,
    'compensation-viz': String.raw`
        tw:[&&]:ui-row tw:[&&]:justify-center tw:[&&]:gap-[1.5rem] tw:[&&]:mt-[2rem] tw:[&&]:p-[1.5rem]
        tw:[&&]:ui-fill-muted tw:[&&]:rounded-[12px] tw:[@media(max-width:768px)]:[&&]:flex-col
        tw:[@media(max-width:768px)]:[&&]:gap-[1rem] tw:[@container(max-width:620px)]:[&&&]:flex-col
        tw:[@container(max-width:620px)]:[&&&]:gap-[.75rem] tw:[@container(max-width:620px)]:[&&&]:p-[1rem]
    `,
    'viz-item': String.raw`
        tw:[&&]:ui-stack tw:[&&]:items-center tw:[&&]:gap-[0.5rem] tw:[&&]:[font-weight:700]
        tw:[&&]:text-[length:1rem] tw:[&&.result]:[color:#10b981]
        tw:[&&.result]:[background:rgba(16,_185,_129,_0.1)] tw:[&&.result]:p-[0.75rem_1.25rem]
        tw:[&&.result]:rounded-[8px]
    `,
    'viz-operator': String.raw`
        tw:[&&]:text-[length:1.5rem] tw:[&&]:[font-weight:800] tw:[&&]:text-secondary
    `,
    'tax-info__two-cols': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1.5rem]
        tw:[@media(max-width:768px)]:grid-cols-[1fr] tw:[@container(max-width:620px)]:grid-cols-[1fr]
    `,
} as const;
export function taxReadingStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
