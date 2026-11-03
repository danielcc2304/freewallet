import { cn } from '../../../utils/cn';

const styles = {
    'salary-calc__layout': String.raw`
        tw:grid tw:grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)] tw:[align-items:start] tw:gap-[1.5rem]
        tw:[@media(max-width:800px)]:grid-cols-[1fr] tw:[@media(max-width:800px)]:gap-[1.25rem]
    `,
    'salary-calc__fields': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem] tw:[.salary-calc\_\_person_&]:grid-cols-[1fr]
        tw:[.salary-calc\_\_person_&]:gap-[.25rem] tw:[@media(max-width:1100px)]:grid-cols-[1fr]
        tw:[@media(max-width:1100px)]:gap-[.35rem]
        tw:[@media(max-width:800px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
        tw:[@media(max-width:480px)]:[&&]:grid-cols-[1fr]
    `,
    'salary-calc__payment-comparison': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,1fr))] tw:gap-[.7rem] tw:mt-[1rem]
        tw:[@media(max-width:480px)]:[&&_strong]:text-[length:1.1rem]
    `,
    'salary-calc__scenario-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(3,_minmax(0,1fr))] tw:gap-[1rem] tw:mt-[1rem]
        tw:[@media(max-width:800px)]:grid-cols-[1fr]
    `,
    'salary-calc__scales': String.raw`
        tw:grid tw:gap-[1rem]
    `,
} as const;
export function SalaryCalculatorLayout(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
