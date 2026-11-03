import { cn } from '../../../utils/cn';

const styles = {
    'timeline__crisis': String.raw`
        tw:[background:rgba(239,_68,_68,_0.05)] tw:[border:2px_solid_var(--error-color,_#ef4444)] tw:rounded-[16px]
        tw:p-[2rem] tw:mb-[3rem] tw:[@media(max-width:768px)]:p-[1.5rem]
    `,
    'timeline__crisis-header': String.raw`
        tw:ui-row tw:gap-[1rem] tw:mb-[1.5rem]
    `,
    'timeline__crisis-icon': String.raw`
        tw:[color:var(--error-color,_#ef4444)]
    `,
    'timeline__crisis-title': String.raw`
        tw:text-[length:1.5rem] tw:[font-weight:700] tw:text-main tw:m-[0]
    `,
    'timeline__crisis-subtitle': String.raw`
        tw:text-[length:0.95rem] tw:text-secondary tw:m-[0.25rem_0_0]
    `,
    'timeline__crisis-content': String.raw`
        tw:ui-stack tw:gap-[1.5rem]
    `,
    'timeline__crisis-objective': String.raw`
        tw:[line-height:1.7] tw:text-secondary tw:[&_strong]:block tw:[&_strong]:mb-[0.5rem] tw:[&_strong]:text-main
    `,
    'timeline__crisis-actions': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] tw:gap-[1.5rem]
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    'timeline__crisis-column': String.raw`
        tw:[&_h4]:text-[length:1.125rem] tw:[&_h4]:[font-weight:600] tw:[&_h4]:text-main tw:[&_h4]:m-[0_0_1rem_0]
        tw:[&_ul]:[list-style:none] tw:[&_ul]:p-[0] tw:[&_ul]:m-[0] tw:[&_li]:relative
        tw:[&_li]:p-[0.5rem_0_0.5rem_1.25rem] tw:[&_li]:text-secondary tw:[&_li]:[line-height:1.6]
        tw:[&_li::before]:[content:"•"] tw:[&_li::before]:absolute tw:[&_li::before]:left-[0]
        tw:[&_li::before]:text-main tw:[&_li::before]:[font-weight:700] tw:[&_a]:text-accent
        tw:[&_a]:[text-decoration:none] tw:[&_a:hover]:[text-decoration:underline]
    `,
    'timeline__crisis-errors': String.raw`
        tw:[&_strong]:block tw:[&_strong]:mb-[0.5rem] tw:[&_strong]:text-main tw:[&_ul]:[list-style:none]
        tw:[&_ul]:p-[0] tw:[&_ul]:m-[0] tw:[&_li]:relative tw:[&_li]:pl-[1.25rem] tw:[&_li]:mb-[0.4rem]
        tw:[&_li]:text-secondary tw:[&_li::before]:[content:"•"] tw:[&_li::before]:absolute
        tw:[&_li::before]:left-[0] tw:[&_li::before]:[color:var(--error-color,_#ef4444)]
        tw:[&_li::before]:[font-weight:bold]
    `,
    'timeline__next': String.raw`
        tw:ui-fill-surface tw:rounded-[12px] tw:p-[2rem] tw:ui-border-default tw:[&_h3]:text-[length:1.375rem]
        tw:[&_h3]:[font-weight:600] tw:[&_h3]:text-main tw:[&_h3]:m-[0_0_0.5rem_0] tw:[&_p]:text-secondary
        tw:[&_p]:m-[0_0_1.5rem_0] tw:[&_p]:[line-height:1.6] tw:[@media(max-width:768px)]:p-[1.5rem]
    `,
    'timeline__next-links': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))] tw:gap-[1rem]
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    'timeline__next-link': String.raw`
        tw:p-[1rem_1.25rem] tw:ui-fill-muted tw:rounded-[8px] tw:text-main tw:[text-decoration:none]
        tw:[transition:all_0.2s_ease] tw:[font-weight:500] tw:text-center
        tw:[&:hover]:[background:rgba(var(--accent-rgb),_0.1)] tw:[&:hover]:text-accent
        tw:[&:hover]:[transform:translateY(-2px)]
    `,
    'timeline__guide-next': String.raw`
        tw:mt-[1.5rem] tw:ui-fill-surface tw:ui-border-default tw:rounded-[12px] tw:p-[2rem]
        tw:[&_h3]:text-[length:1.375rem] tw:[&_h3]:[font-weight:600] tw:[&_h3]:text-main tw:[&_h3]:m-[0_0_0.5rem_0]
        tw:[&_p]:text-secondary tw:[&_p]:m-[0_0_1.5rem_0] tw:[&_p]:[line-height:1.6]
        tw:[@media(max-width:768px)]:p-[1.5rem]
    `,
    'timeline__guide-links': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))] tw:gap-[1rem]
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
} as const;
export function journeySupportStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
