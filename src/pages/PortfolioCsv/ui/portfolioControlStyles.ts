import { cn } from '../../../utils/cn';

// Styles belong to the structured components; theme hooks remain stable.
const styles = {
    "portfolio-csv-controls-table__row": String.raw`
    tw:grid tw:grid-cols-[minmax(220px,_2fr)_minmax(90px,_0.7fr)_minmax(180px,_1fr)] tw:items-center tw:gap-[0.75rem]
    tw:ui-border tw:rounded-[10px] tw:p-[0.7rem_0.75rem] tw:ui-fill-muted tw:[@media(max-width:700px)]:grid-cols-[1fr]
`,
    "portfolio-csv-controls-table__asset": String.raw`tw:grid tw:gap-[0.2rem] tw:[&_small]:text-muted tw:[&_small]:text-[length:var(--font-size-xs)]`,
    "portfolio-csv-targets__item": String.raw`tw:grid tw:gap-[0.35rem] tw:text-secondary tw:text-[length:var(--font-size-sm)]`,
    "portfolio-csv-targets__total": String.raw`tw:mt-[0.9rem] tw:ui-row tw:justify-between tw:gap-[1rem] tw:ui-border tw:rounded-[10px] tw:p-[0.75rem] tw:ui-fill-muted`,
    "portfolio-csv-targets__total--warn": String.raw`
    tw:[&.portfolio-csv-targets\_\_total--warn]:[border-color:rgba(245,_158,_11,_0.45)]
    tw:[&.portfolio-csv-targets\_\_total--warn]:[background:rgba(245,_158,_11,_0.1)]
`
} as const;

export function portfolioControlClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
