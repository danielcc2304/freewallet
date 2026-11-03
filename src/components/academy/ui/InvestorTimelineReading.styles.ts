import { cn } from '../../../utils/cn';
const styles = {
    timeline: String.raw`
        tw:max-w-[900px] tw:m-[0_auto] tw:p-[0_1.5rem_4rem] tw:overflow-x-hidden
    `,
    timeline__header: String.raw`
        tw:mb-[2rem] tw:text-center
    `,
    timeline__title: String.raw`
        tw:text-[length:2.5rem] tw:[font-weight:800] tw:text-main tw:m-[0_0_0.75rem_0]
        tw:[@media(max-width:768px)]:text-[length:1.85rem] tw:[@media(max-width:480px)]:[&&]:text-[length:1.6rem]
    `,
    timeline__description: String.raw`
        tw:text-[length:1.125rem] tw:text-secondary tw:[line-height:1.6] tw:m-[0_auto] tw:max-w-[700px]
    `,
    timeline__container: String.raw`
        tw:relative tw:mb-[3rem]
    `,
    'timeline__crisis-error': String.raw`
        tw:[line-height:1.7] tw:text-secondary
    `,
    'timeline__errors-cta': String.raw`
        tw:m-[2.2rem_0] tw:ui-fill-surface tw:ui-border-default tw:rounded-[12px] tw:p-[1.25rem]
        tw:[&_h3]:m-[0_0_0.35rem] tw:[&_p]:m-[0] tw:[&_p]:text-secondary
    `,
    'timeline__errors-link': String.raw`
        tw:inline-block tw:mt-[0.75rem] tw:[text-decoration:none] tw:[font-weight:700] tw:text-accent
        tw:[&:hover]:[text-decoration:underline]
    `,
} as const;
export function InvestorTimelineReadingStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
