import { cn } from '../../../utils/cn';
const styles = {
    'glossary-page': String.raw`
        tw:max-w-[1000px] tw:m-[0_auto] tw:p-[0_1.5rem_4rem] tw:overflow-x-hidden
    `,
    'glossary-page__header': String.raw`
        tw:text-center tw:mb-[3rem]
    `,
    'glossary-page__title': String.raw`
        tw:text-[length:2.5rem] tw:[font-weight:800] tw:mb-[1rem] tw:[@media(max-width:768px)]:text-[length:1.85rem]
        tw:[@media(max-width:480px)]:[&&]:text-[length:1.6rem]
    `,
    'glossary-page__subtitle': String.raw`
        tw:text-[length:1.125rem] tw:text-secondary
    `,
    'glossary-controls': String.raw`
        tw:ui-stack tw:gap-[1rem] tw:mb-[1.5rem] tw:sticky tw:top-[1rem] tw:z-[10] tw:ui-fill-canvas tw:p-[1rem_0]
        tw:[@media(max-width:768px)]:static tw:[@media(max-width:768px)]:gap-[.75rem]
        tw:[@media(max-width:768px)]:mb-[.75rem] tw:[@media(max-width:768px)]:p-[.75rem]
        tw:[@media(max-width:768px)]:rounded-[16px]
    `,
    'glossary-filters': String.raw`
        tw:flex tw:justify-center tw:gap-[0.75rem] tw:flex-wrap tw:[@media(max-width:768px)]:gap-[.5rem]
    `,
    'glossary-empty': String.raw`
        tw:text-center tw:p-[4rem] tw:text-secondary tw:col-span-full
    `,
    'glossary-grid': String.raw`
        tw:[@media(max-width:768px)]:grid-cols-[1fr] tw:[@media(max-width:768px)]:gap-[.75rem]
    `,
} as const;
export function GlossaryReadingStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
