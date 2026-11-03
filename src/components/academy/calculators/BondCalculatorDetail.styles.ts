import { cn } from '../../../utils/cn';
const styles = {
    'detail-box__value': String.raw`
        tw:text-[length:1.2rem] tw:[font-weight:700] tw:text-main tw:[line-height:1.3]
    `,
    'status-badge': String.raw`
        tw:p-[0.5rem_0.75rem] tw:rounded-[8px] tw:text-[length:0.9rem] tw:[font-weight:700] tw:text-center
    `,
    'status-badge--discount': String.raw`
        tw:[&.status-badge--discount]:[background:rgba(245,_158,_11,_0.15)]
        tw:[&.status-badge--discount]:[color:#f59e0b]
        tw:[&.status-badge--discount]:[border:1px_solid_rgba(245,_158,_11,_0.3)]
    `,
    'status-badge--premium': String.raw`
        tw:[&.status-badge--premium]:[background:rgba(139,_92,_246,_0.15)]
        tw:[&.status-badge--premium]:[color:#a78bfa]
        tw:[&.status-badge--premium]:[border:1px_solid_rgba(139,_92,_246,_0.3)]
    `,
    'status-badge--par': String.raw`
        tw:[&.status-badge--par]:[background:rgba(16,_185,_129,_0.15)] tw:[&.status-badge--par]:[color:#10b981]
        tw:[&.status-badge--par]:[border:1px_solid_rgba(16,_185,_129,_0.3)]
    `,
    'coupon-value': String.raw`
        tw:ui-row tw:gap-[0.5rem] tw:[&_.value]:text-[length:1.5rem] tw:[&_.value]:[font-weight:800]
        tw:[&_.value]:text-main
    `,
    'coupon-value__icon': String.raw`
        tw:text-accent
    `,
    value: String.raw``,
} as const;
export function BondCalculatorDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
