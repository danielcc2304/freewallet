import { cn } from '../../../utils/cn';

const styles = {
    'alloc-sim__reset': String.raw`
        tw:p-[0.75rem_1.5rem] tw:ui-fill-muted tw:ui-border-default tw:rounded-[12px] tw:text-secondary
        tw:[font-weight:600] tw:cursor-pointer tw:[transition:all_0.2s] tw:[&:hover]:ui-fill-canvas
        tw:[&:hover]:text-main tw:[&:hover]:[border-color:var(--accent-primary)] tw:inline-flex tw:items-center
        tw:justify-center tw:gap-[.5rem] tw:min-h-[44px] tw:whitespace-normal tw:[&:disabled]:opacity-[.5]
        tw:[&:disabled]:cursor-not-allowed
    `,
} as const;
export function allocationStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
