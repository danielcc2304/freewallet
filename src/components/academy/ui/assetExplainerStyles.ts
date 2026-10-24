import { cn } from '../../../utils/cn';

// Styles belong to the structured components; theme hooks remain stable.
const styles = {
    "geo-card": String.raw`tw:[&&]:[border-left:4px_solid_var(--accent-primary)] tw:[&_h4]:mb-[0.4rem] tw:[&_h4]:[font-weight:700]`,
    "geo-card__region": String.raw`tw:text-[length:0.85rem] tw:[font-weight:600]`,
    "geo-card__weight": String.raw`tw:text-[length:0.8rem] tw:text-muted`,
    "bond-anatomy__label": String.raw`tw:text-[length:0.7rem] tw:[text-transform:uppercase] tw:text-muted tw:[letter-spacing:0.05em] tw:mb-[0.25rem]`,
    "bond-anatomy__value": String.raw`tw:text-[length:1.25rem] tw:[font-weight:800] tw:[color:#10b981] tw:mb-[0.25rem]`,
    "bond-anatomy__desc": String.raw`tw:text-[length:0.75rem] tw:text-secondary`,
    "inverse-card": String.raw`
    tw:flex-[1] tw:ui-row tw:justify-center tw:p-[2rem] tw:rounded-[20px] tw:gap-[1rem] tw:text-center tw:flex-wrap
    tw:ui-border-default tw:[&_p]:w-full tw:[&_p]:text-[length:0.9rem] tw:[&_p]:text-secondary tw:[&_p]:mt-[0.5rem]
`,
    "inverse-card--up": String.raw`tw:[&.inverse-card--up]:[background:rgba(239,_68,_68,_0.05)] tw:[&.inverse-card--up]:[color:#ef4444]`,
    "inverse-card--down": String.raw`tw:[&.inverse-card--down]:[background:rgba(16,_185,_129,_0.05)] tw:[&.inverse-card--down]:[color:#10b981]`,
    "inverse-card__arrow": String.raw`tw:text-[length:1.5rem] tw:[font-weight:900]`,
    "credit-spread-card": String.raw`
    tw:ui-fill-surface tw:ui-border-default tw:[&&]:[border-top:4px_solid_var(--spread-color)] tw:rounded-[18px]
    tw:p-[1.25rem] tw:[&_h3]:m-[0_0_0.5rem] tw:[&_h3]:text-[length:1.05rem] tw:[&_h3]:[font-weight:700]
    tw:[&_p]:m-[0_0_0.85rem] tw:[&_p]:text-[length:0.9rem] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.5]
`,
    "credit-spread-card__range": String.raw`
    tw:inline-block tw:[background:rgba(15,_23,_42,_0.06)] tw:rounded-[999px] tw:p-[0.2rem_0.6rem]
    tw:text-[length:0.75rem] tw:[font-weight:800] tw:text-main tw:mb-[0.75rem]
`,
    "credit-spread-card__implication": String.raw`
    tw:pt-[0.85rem] tw:[&&]:[border-top:1px_dashed_var(--border-color)] tw:text-[length:0.85rem] tw:text-secondary
    tw:[line-height:1.45]
`,
    "bond-checklist-item": String.raw`
    tw:ui-fill-surface tw:ui-border-default tw:[&&]:[border-left:4px_solid_var(--accent-primary)] tw:rounded-[14px]
    tw:p-[1rem_1.1rem] tw:[&_h4]:m-[0_0_0.4rem] tw:[&_h4]:text-[length:0.95rem] tw:[&_h4]:[font-weight:700]
    tw:[&_p]:m-[0] tw:[&_p]:text-[length:0.85rem] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.45]
`,
    "bond-mistake-card": String.raw`
    tw:ui-fill-surface tw:ui-border-default tw:[&&]:[border-left:4px_solid_#f59e0b] tw:rounded-[12px] tw:p-[1rem]
    tw:[&_h4]:m-[0_0_0.55rem] tw:[&_h4]:text-[length:0.95rem] tw:[&_h4]:[font-weight:700] tw:[&_p]:m-[0_0_0.45rem]
    tw:[&_p]:text-[length:0.84rem] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.45] tw:[&_p:last-child]:mb-[0]
`,
    "asset-page__final-tip": String.raw`
    tw:[background:linear-gradient(135deg,_rgba(var(--accent-rgb),_0.1),_rgba(var(--accent-rgb),_0.05))]
    tw:[border:1px_solid_var(--accent-primary)] tw:p-[3rem] tw:rounded-[24px] tw:ui-row tw:gap-[2rem] tw:mt-[6rem]
    tw:[&_svg]:text-accent tw:[&_h3]:text-[length:1.5rem] tw:[&_h3]:[font-weight:800] tw:[&_h3]:mb-[0.5rem]
    tw:[&_p]:text-[length:1.1rem] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.6] tw:[&_p]:m-[0]
    tw:gap-[var(--academy-space-section)] tw:ui-border-default tw:mt-[4rem] tw:[&_h3]:[font-weight:700]
    tw:[@media(max-width:850px)]:flex-col tw:[@media(max-width:850px)]:text-center tw:[@media(max-width:850px)]:p-[2rem]
`
} as const;

export function assetExplainerClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
