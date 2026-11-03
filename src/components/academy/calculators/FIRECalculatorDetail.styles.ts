import { cn } from '../../../utils/cn';
const styles = {
    fire: String.raw`
        tw:max-w-[1200px] tw:m-[0_auto]
    `,
    'fire-tooltip': String.raw`
        tw:ui-fill-surface tw:ui-border-default tw:p-[1rem] tw:rounded-[8px] tw:[box-shadow:var(--shadow-lg)]
    `,
    'fire-tooltip__label': String.raw`
        tw:[font-weight:700] tw:mb-[0.5rem] tw:text-main
    `,
    'fire-tooltip__value': String.raw`
        tw:text-[length:0.9rem] tw:m-[0.25rem_0] tw:[&.balance]:text-accent tw:[&.balance]:[font-weight:600]
        tw:[&.target]:[color:#ffc107]
    `,
    balance: String.raw``,
    target: String.raw``,
} as const;
export function FIRECalculatorDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
