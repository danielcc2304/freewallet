import { cn } from '../../../utils/cn';
const styles = {
    'retirement-tooltip': String.raw`
        tw:ui-fill-surface tw:ui-border-default tw:p-[1rem] tw:rounded-[12px] tw:[box-shadow:var(--shadow-lg)]
    `,
    'retirement-tooltip__label': String.raw`
        tw:[font-weight:800] tw:mb-[0.75rem] tw:text-main
    `,
    'retirement-tooltip__value': String.raw`
        tw:text-[length:0.85rem] tw:m-[0.25rem_0] tw:[font-weight:600] tw:[&.nominal]:[color:#3b82f6]
        tw:[&.real]:[color:#8b5cf6]
    `,
    nominal: String.raw``,
    real: String.raw``,
} as const;
export function RetirementCalculatorDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
