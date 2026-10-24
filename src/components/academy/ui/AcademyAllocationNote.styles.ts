import { cn } from '../../../utils/cn';

const styles = {
    'alloc-sim__source': String.raw`
        tw:flex tw:items-start tw:gap-[.75rem] tw:text-secondary tw:text-[length:.85rem] tw:[&_svg]:shrink-[0]
        tw:[&_svg]:text-accent tw:[&_svg]:mt-[.2rem] tw:[&_p]:m-[0] tw:[&_p]:[line-height:1.6]
        tw:[&_p]:wrap-anywhere
    `,
    'info-content': String.raw`
        tw:ui-stack tw:gap-[1.25rem] tw:[.alloc-sim_&_p]:text-[length:.9rem] tw:[.alloc-sim_&_p]:[line-height:1.7]
        tw:[.alloc-sim_&_p]:text-secondary tw:[.alloc-sim_&_p]:m-[0]
    `,
} as const;
export function allocationNote(part: keyof typeof styles) { return cn(part, styles[part]); }
