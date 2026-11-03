import { cn } from '../../../utils/cn';
const styles = {
    'portfolio-health__grid': String.raw`
        tw:grid tw:grid-cols-[repeat(4,_minmax(0,_1fr))] tw:gap-[0.85rem]
        tw:[@media(max-width:900px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
        tw:[@media(max-width:540px)]:grid-cols-[1fr]
    `,
    'portfolio-health__checks': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(210px,_1fr))] tw:gap-[.65rem] tw:mt-[1rem] tw:[&_>_div]:grid
        tw:[&_>_div]:grid-cols-[auto_1fr_auto] tw:[&_>_div]:items-center tw:[&_>_div]:gap-[.5rem]
        tw:[&_>_div]:p-[.7rem_.8rem] tw:[&_>_div]:ui-border tw:[&_>_div]:rounded-[9px] tw:[&_>_div]:text-secondary
        tw:[&_>_div]:text-[length:.78rem] tw:[&_strong]:text-main tw:[&_.is-ok_svg]:text-positive
        tw:[&_.is-warning_svg]:[color:var(--color-warning)]
    `,
    'is-ok': String.raw``,
    'is-warning': String.raw``,
} as const;
export function PortfolioHealthDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
