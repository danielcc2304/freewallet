import { cn } from '../../../utils/cn';
const styles = {
    'errors-page': String.raw`
        tw:[--academy-space-section:2.25rem] tw:[--academy-space-card:1.5rem] tw:[--academy-space-stack:1.25rem]
        tw:max-w-[900px] tw:m-[0_auto] tw:p-[0_1.5rem_4rem] tw:overflow-x-hidden
        tw:[@media(max-width:768px)]:[--academy-space-section:1.75rem]
        tw:[@media(max-width:768px)]:[--academy-space-card:1.25rem]
        tw:[@media(max-width:768px)]:[--academy-space-stack:1rem]
        tw:[@media(max-width:480px)]:[&&]:[--academy-space-section:1.5rem]
        tw:[@media(max-width:480px)]:[&&]:[--academy-space-card:1rem]
        tw:[@media(max-width:480px)]:[&&]:[--academy-space-stack:0.8rem]
        tw:[@media(max-width:480px)]:[&&]:p-[0_1rem_3rem]
    `,
    'errors-page__header': String.raw`
        tw:mb-[var(--academy-space-section)] tw:text-center
    `,
    'errors-page__title': String.raw`
        tw:text-[length:2.5rem] tw:[font-weight:800] tw:text-main tw:mb-[1rem]
        tw:[@media(max-width:768px)]:text-[length:1.85rem] tw:[@media(max-width:480px)]:[&&]:text-[length:1.6rem]
    `,
    'errors-page__subtitle': String.raw`
        tw:text-[length:1.125rem] tw:text-secondary tw:[line-height:1.6] tw:max-w-[600px] tw:m-[0_auto]
    `,
    'error-detail-card': String.raw`
        tw:[transition:all_0.3s_ease] tw:[&:hover]:[transform:translateY(-4px)] tw:[&:hover]:[border-color:#ef4444]
        tw:[&:hover]:[box-shadow:0_10px_30px_rgba(239,_68,_68,_0.1)]
        tw:[@media(max-width:768px)]:p-[var(--academy-space-card)]
        tw:[@media(max-width:480px)]:[&&]:p-[var(--academy-space-card)]
        tw:[@media(max-width:480px)]:[&&]:gap-[var(--academy-space-stack)]
    `,
    'error-detail-card__desc': String.raw`
        tw:text-[length:1rem] tw:text-secondary tw:[line-height:1.5]
    `,
    'errors-page__grid': String.raw`
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    'error-detail-card__grid': String.raw`
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
} as const;
export function CommonErrorsReadingStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
