import { cn } from '../../../utils/cn';

const styles = {
    'portfolio-builder__header': String.raw`
        tw:mb-[3rem] tw:text-center tw:[.strategy-page_&]:mb-[1rem]
    `,
    'portfolio-builder__title': String.raw`
        tw:text-[length:2.5rem] tw:[font-weight:800] tw:text-main tw:mb-[1rem]
        tw:[@media(max-width:768px)]:text-[length:1.85rem] tw:[@media(max-width:480px)]:[&&]:text-[length:1.6rem]
    `,
    'portfolio-builder__subtitle': String.raw`
        tw:text-[length:1.125rem] tw:text-secondary tw:max-w-[700px] tw:m-[0_auto] tw:[line-height:1.6]
    `,
} as const;
export function strategyHeaderStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
