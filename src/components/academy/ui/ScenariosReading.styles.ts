import { cn } from '../../../utils/cn';
const styles = {
    scenarios: String.raw`
        tw:max-w-[900px] tw:m-[0_auto] tw:p-[0_1.5rem_4rem] tw:overflow-x-hidden
    `,
    scenarios__header: String.raw`
        tw:mb-[3rem] tw:text-center
    `,
    scenarios__title: String.raw`
        tw:text-[length:2.5rem] tw:[font-weight:800] tw:text-main tw:mb-[1rem]
        tw:[@media(max-width:768px)]:text-[length:1.85rem] tw:[@media(max-width:480px)]:[&&]:text-[length:1.6rem]
    `,
    scenarios__subtitle: String.raw`
        tw:text-[length:1.125rem] tw:text-secondary tw:[line-height:1.6] tw:max-w-[600px] tw:m-[0_auto]
    `,
    'scenario-card': String.raw`
        tw:[transition:all_0.3s_ease] tw:[&:hover]:[border-color:var(--accent-primary)]
        tw:[&:hover]:[box-shadow:var(--shadow-md)] tw:[@media(max-width:768px)]:p-[1.5rem]
    `,
    'scenario-actions': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(240px,_1fr))] tw:gap-[1rem] tw:mt-[1rem]
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
} as const;
export function ScenariosReadingStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
