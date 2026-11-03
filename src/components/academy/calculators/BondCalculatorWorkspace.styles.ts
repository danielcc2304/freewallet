import { cn } from '../../../utils/cn';
const styles = {
    'bond-calc': String.raw`
        tw:max-w-[900px] tw:m-[0_auto] tw:pb-[4rem]
    `,
    'bond-calc__header': String.raw`
        tw:text-center tw:mb-[3rem]
    `,
    'bond-calc__title': String.raw`
        tw:text-[length:2.5rem] tw:[font-weight:800] tw:mb-[1rem]
    `,
    'bond-calc__subtitle': String.raw`
        tw:text-[length:1.125rem] tw:text-secondary
    `,
    'bond-calc__inputs': String.raw`
        tw:ui-fill-surface tw:ui-border-default tw:rounded-[16px] tw:p-[1.75rem] tw:ui-stack tw:gap-[1rem]
        tw:h-[fit-content] tw:sticky tw:top-[1rem] tw:[&_.calc\_\_input-group]:mb-[0.75rem]
        tw:[&_.calc\_\_input-group:last-child]:mb-[0] tw:[@media(max-width:850px)]:static
        tw:[@media(max-width:850px)]:top-[auto]
    `,
    'bond-calc__inputs-header': String.raw`
        tw:mb-[0] tw:[&_h3]:text-[length:1.375rem] tw:[&_h3]:[font-weight:600] tw:[&_h3]:text-main tw:[&_h3]:m-[0]
    `,
    'bond-calc__advanced': String.raw`
        tw:[border-top:1px_solid_var(--border-color)] tw:pt-[1.5rem] tw:mt-[1.5rem]
    `,
    'bond-calc__advanced-toggle': String.raw`
        tw:w-full tw:ui-fill-transparent tw:[border:none] tw:p-[0.75rem_0] tw:cursor-pointer tw:ui-row
        tw:justify-between tw:[font-weight:500] tw:text-accent tw:[transition:opacity_0.2s_ease]
        tw:[&:hover]:opacity-[0.8]
    `,
    'bond-calc__advanced-content': String.raw`
        tw:mt-[1rem] tw:[animation:slideDown_0.3s_ease]
    `,
    'bond-calc__results': String.raw`
        tw:ui-stack tw:gap-[1.5rem] tw:h-full
    `,
    'bond-calc__calculation-details': String.raw`
        tw:[&_dl]:grid tw:[&_dl]:grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)] tw:[&_dl]:gap-[0.6rem_1rem]
        tw:[&_dl]:m-[1rem_0] tw:[&_dt]:text-secondary tw:[&_dd]:m-[0] tw:[&_dd]:text-right tw:[&_dd]:wrap-anywhere
    `,
} as const;
export function BondCalculatorWorkspaceStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
