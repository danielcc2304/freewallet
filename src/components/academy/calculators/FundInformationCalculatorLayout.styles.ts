import { cn } from '../../../utils/cn';

const styles = {
    'fund-info__metric-grid': String.raw`
        tw:grid tw:gap-ui-md
    `,
    'fund-info__metric-grid--summary': String.raw`
        tw:[&.fund-info\_\_metric-grid--summary]:grid-cols-[repeat(auto-fit,_minmax(170px,_1fr))]
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'fund-info__data-grid': String.raw`
        tw:grid tw:gap-ui-md tw:grid-cols-[repeat(3,_minmax(0,_1fr))]
        tw:[@media(max-width:900px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'fund-info__fee-grid': String.raw`
        tw:grid tw:gap-ui-md tw:grid-cols-[repeat(4,_minmax(0,_1fr))]
        tw:[@media(max-width:900px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'fund-info__breakdown-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-ui-lg
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'fund-info__documents': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-ui-sm
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'fund-info__holdings-list': String.raw`
        tw:ui-stack tw:gap-ui-sm
    `,
} as const;
export function FundInformationCalculatorLayout(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
