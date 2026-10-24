import { cn } from '../../utils/cn';

// Styles belong to the structured components; theme hooks remain stable.
const styles = {
    "portfolio-csv-select": String.raw`tw:w-full tw:min-h-[40px] tw:ui-border-strong tw:rounded-[10px] tw:ui-fill-surface tw:text-main tw:p-[0.45rem_0.65rem]`
} as const;

export function portfolioInputClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
