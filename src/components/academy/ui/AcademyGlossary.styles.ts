import { cn } from '../../../utils/cn';

const styles = {
    'glossary-search': String.raw`
        tw:relative tw:max-w-[600px] tw:m-[0_auto] tw:w-full tw:[&_.icon]:absolute tw:[&_.icon]:left-[1.25rem]
        tw:[&_.icon]:top-[50%] tw:[&_.icon]:[transform:translateY(-50%)] tw:[&_.icon]:text-secondary
        tw:[&_input]:w-full tw:[&_input]:p-[1rem_1rem_1rem_3.5rem] tw:[&_input]:rounded-[16px]
        tw:[&_input]:ui-border-default tw:[&_input]:ui-fill-surface tw:[&_input]:text-main
        tw:[&_input]:text-[length:1.1rem] tw:[&_input]:[outline:none] tw:[&_input]:[transition:all_0.2s]
        tw:[&_input:focus]:[border-color:var(--accent-primary)]
        tw:[&_input:focus]:[box-shadow:0_0_0_4px_rgba(var(--accent-rgb),_0.1)]
    `,
    'filter-chip': String.raw`
        tw:p-[0.5rem_1.25rem] tw:rounded-[20px] tw:ui-border-default tw:ui-fill-surface tw:text-secondary
        tw:text-[length:0.9rem] tw:[font-weight:600] tw:cursor-pointer tw:[transition:all_0.2s]
        tw:[&:hover]:[border-color:var(--accent-primary)] tw:[&.active]:[background:var(--accent-primary)]
        tw:[&.active]:[color:white] tw:[&.active]:[border-color:var(--accent-primary)]
        tw:[@media(max-width:768px)]:min-h-[2.25rem] tw:[@media(max-width:768px)]:p-[.42rem_.78rem]
        tw:[@media(max-width:768px)]:text-[length:.78rem]
    `,
    'glossary-card': String.raw`
        tw:[transition:all_0.3s_ease] tw:[&:hover]:[transform:translateY(-4px)]
        tw:[&:hover]:[border-color:var(--accent-primary)] tw:[&:hover]:[box-shadow:var(--shadow-md)]
        tw:[@media(max-width:768px)]:gap-[.7rem] tw:[@media(max-width:768px)]:p-[1.2rem]
        tw:[@media(max-width:768px)]:rounded-[16px]
    `,
    'glossary-card__category': String.raw`
        tw:text-[length:0.75rem] tw:[text-transform:uppercase] tw:[letter-spacing:0.05em] tw:[font-weight:700]
        tw:text-accent tw:[background:rgba(var(--accent-rgb),_0.1)] tw:p-[2px_8px] tw:rounded-[4px]
        tw:w-[fit-content]
    `,
    'glossary-card__term': String.raw`
        tw:text-[length:1.5rem] tw:[font-weight:800] tw:m-[0] tw:text-main
        tw:[@media(max-width:768px)]:text-[length:1.3rem]
    `,
    'glossary-card__def': String.raw`
        tw:m-[0] tw:text-[length:0.95rem] tw:text-secondary tw:[line-height:1.6]
        tw:[@media(max-width:768px)]:text-[length:.88rem] tw:[@media(max-width:768px)]:[line-height:1.55]
    `,
    'glossary-card__related': String.raw`
        tw:mt-[auto] tw:pt-[1rem] tw:[border-top:1px_solid_var(--border-color)] tw:[&_h5]:text-[length:0.75rem]
        tw:[&_h5]:text-secondary tw:[&_h5]:m-[0_0_0.5rem] tw:[&_h5]:[text-transform:uppercase]
        tw:[@media(max-width:768px)]:pt-[.75rem]
    `,
    'related-tags': String.raw`
        tw:flex tw:flex-wrap tw:gap-[0.5rem]
    `,
    'tag': String.raw`
        tw:text-[length:0.75rem] tw:ui-fill-muted tw:text-secondary tw:p-[2px_8px] tw:rounded-[4px]
        tw:[@media(max-width:768px)]:max-w-full tw:[@media(max-width:768px)]:wrap-anywhere
    `,
} as const;
export function glossaryStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
