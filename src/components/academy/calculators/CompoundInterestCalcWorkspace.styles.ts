import { cn } from '../../../utils/cn';
const styles = {
    compound: String.raw`
        tw:max-w-[1200px] tw:m-[0_auto] tw:w-full tw:min-w-[0]
    `,
    compound__header: String.raw`
        tw:mb-[2.5rem] tw:pb-[2rem] tw:[border-bottom:1px_solid_var(--border-color)]
    `,
    'compound__mode-selector': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] tw:gap-[1rem] tw:mb-[2.5rem]
        tw:[@media(max-width:1024px)]:grid-cols-[1fr]
    `,
    compound__container: String.raw`
        tw:grid tw:grid-cols-[minmax(340px,_380px)_minmax(0,_1fr)] tw:gap-[2rem] tw:mb-[2rem] tw:w-full tw:min-w-[0]
        tw:[align-items:start] tw:[@media(min-width:1025px)]:items-stretch
        tw:[@media(max-width:1024px)]:grid-cols-[1fr]
    `,
    compound__inputs: String.raw`
        tw:[--calculator-card-padding:2rem] tw:[--calculator-card-radius:16px] tw:h-[fit-content] tw:sticky
        tw:top-[1rem] tw:w-full tw:min-w-[0] tw:max-w-full tw:box-border tw:[&_h3]:text-[length:1.375rem]
        tw:[&_h3]:[font-weight:600] tw:[&_h3]:text-main tw:[&_h3]:m-[0_0_1.5rem_0]
        tw:[@media(min-width:1025px)]:col-[1] tw:[@media(min-width:1025px)]:row-[1]
        tw:[@media(min-width:1025px)]:h-full tw:[@media(max-width:1024px)]:static
        tw:[@media(max-width:768px)]:p-[1rem]
    `,
    'compound__input-hint': String.raw`
        tw:block tw:mt-[0.65rem] tw:pl-[0.2rem] tw:text-secondary tw:opacity-[0.78] tw:text-[length:0.82rem]
        tw:[line-height:1.45] tw:[font-weight:400]
    `,
    'compound__radio-group': String.raw`
        tw:grid tw:gap-[0.65rem]
    `,
    compound__results: String.raw`
        tw:ui-stack tw:gap-[1.5rem] tw:w-full tw:min-w-[0] tw:max-w-full
        tw:[@media(min-width:1025px)]:[display:contents] tw:[@media(max-width:1024px)]:grid-cols-[1fr]
    `,
    'compound__result-cards': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(180px,_1fr))] tw:gap-[1.25rem] tw:w-full tw:min-w-[0]
        tw:[@media(min-width:1025px)]:col-span-full tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    compound__breakdown: String.raw`
        tw:[--calculator-card-padding:1.5rem] tw:[--calculator-card-radius:12px] tw:overflow-hidden tw:w-full
        tw:min-w-[0] tw:max-w-full tw:box-border tw:[@media(min-width:1025px)]:col-span-full
        tw:[@media(max-width:768px)]:p-[1rem]
    `,
    'compound__detail-positive': String.raw`
        tw:[color:#10b981] tw:[font-weight:700]
    `,
} as const;
export function CompoundInterestCalcWorkspaceStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
