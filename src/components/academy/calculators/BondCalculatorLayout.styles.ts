import { cn } from '../../../utils/cn';

const styles = {
    'bond-calc__grid': String.raw`
        tw:grid tw:grid-cols-[minmax(330px,_1.08fr)_minmax(0,_1.42fr)] tw:gap-[2rem] tw:mb-[3rem]
        tw:[@media(max-width:850px)]:grid-cols-[1fr]
    `,
    'bond-calc__maturity-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[0.625rem]
        tw:[@media(max-width:480px)]:[&&]:grid-cols-[1fr]
    `,
    'bond-calc__advanced-grid': String.raw`
        tw:grid tw:grid-cols-[1fr] tw:gap-[0.75rem] tw:mt-[0] tw:[&&_.calc\_\_input-group]:mb-[0]
        tw:[&_.calc\_\_input-wrapper]:min-h-[54px] tw:[&_.calc\_\_input-wrapper_input[type="date"]]:text-left
        tw:[&_.calc\_\_input-wrapper_select]:text-left
        tw:[&_.calc\_\_input-wrapper_input[type="date"]]:[color-scheme:dark]
        tw:[&_.calc\_\_input-wrapper_input[type="date"]]:cursor-pointer
        tw:[&_____.calc\_\_input-wrapper_____input[type="date"]::-webkit-calendar-picker-indicator]:cursor-pointer
        tw:[&_____.calc\_\_input-wrapper_____input[type="date"]::-webkit-calendar-picker-indicator]:opacity-[0.9]
        tw:[@media(max-width:850px)]:grid-cols-[1fr]
    `,
    'result-details': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(180px,_1fr))] tw:gap-[1rem] tw:flex-[1]
    `,
    'bond-calc-edu': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] tw:gap-[1.5rem] tw:mt-[2rem]
        tw:[@media(max-width:850px)]:gap-[1.25rem] tw:[@media(max-width:850px)]:mt-[1.5rem]
        tw:[@media(max-width:480px)]:[&&]:gap-[1rem]
    `,
} as const;
export function BondCalculatorLayout(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
