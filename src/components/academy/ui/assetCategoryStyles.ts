import { cn } from '../../../utils/cn';

// Component-owned styles; BEM hooks remain for material and theme contexts.
const styles = {
    "subtype-card": String.raw`
    tw:[transition:transform_0.2s] tw:[&&]:[border-top:3px_solid_var(--subtype-color)]
    tw:[&:hover]:[transform:translateY(-4px)] tw:[&:hover]:[box-shadow:0_10px_20px_rgba(0,_0,_0,_0.05)]
    tw:[&_h3]:text-[length:1.1rem] tw:[&_h3]:[font-weight:700] tw:[&_h3]:m-[0]
`,
    "subtype-card__header": String.raw`tw:ui-row tw:gap-[0.75rem] tw:mb-[1rem]`,
    "subtype-card__dot": String.raw`tw:w-[8px] tw:h-[8px] tw:rounded-[50%] tw:[background:var(--subtype-color)]`,
    "subtype-card__desc": String.raw`tw:text-[length:0.9rem] tw:text-secondary tw:[line-height:1.5] tw:mb-[1.25rem]`,
    "subtype-card__examples": String.raw`tw:pt-[1rem] tw:[border-top:1px_solid_var(--border-color)] tw:mb-[1rem]`,
    "subtype-card__tag-label": String.raw`tw:text-[length:0.75rem] tw:[text-transform:uppercase] tw:[font-weight:700] tw:text-muted tw:block tw:mb-[0.5rem]`,
    "subtype-card__tags": String.raw`tw:flex tw:flex-wrap tw:gap-[0.5rem]`,
    "subtype-card__tag": String.raw`tw:text-[length:0.75rem] tw:ui-fill-muted tw:p-[0.25rem_0.6rem] tw:rounded-[6px] tw:text-secondary`,
    "subtype-card__footer": String.raw`tw:flex tw:justify-between tw:text-[length:0.85rem] tw:text-muted tw:[&_strong]:text-main`,
    "bond-subtype": String.raw`tw:[&_p]:text-[length:0.85rem] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.5] tw:[&_p]:m-[0]`,
    "bond-subtype__header": String.raw`tw:ui-row tw:justify-between tw:[&_h4]:text-[length:1.05rem] tw:[&_h4]:[font-weight:700] tw:[&_h4]:m-[0]`,
    "bond-subtype__risk": String.raw`tw:text-[length:0.7rem] tw:p-[0.2rem_0.6rem] tw:rounded-[100px] tw:[font-weight:800] tw:[text-transform:uppercase]`,
    "bond-subtype__risk--mnimo": String.raw`tw:[background:rgba(16,_185,_129,_0.1)] tw:[color:#10b981]`,
    "bond-subtype__risk--muybajo": String.raw`tw:[background:rgba(16,_185,_129,_0.05)] tw:[color:#10b981]`,
    "bond-subtype__risk--bajo": String.raw`tw:[background:rgba(59,_130,_246,_0.1)] tw:[color:#3b82f6]`,
    "bond-subtype__risk--bajomedio": String.raw`tw:[background:rgba(99,_102,_241,_0.1)] tw:[color:#6366f1]`,
    "bond-subtype__risk--medio": String.raw`tw:[background:rgba(245,_158,_11,_0.1)] tw:[color:#f59e0b]`,
    "bond-subtype__risk--alto": String.raw`tw:[background:rgba(239,_68,_68,_0.1)] tw:[color:#ef4444]`,
    "bond-subtype__risk--muyalto": String.raw`tw:[background:#fee2e2] tw:[color:#991b1b]`,
    "bond-subtype__duration": String.raw`tw:ui-row tw:gap-[0.4rem] tw:text-[length:0.75rem] tw:[font-weight:700] tw:text-muted`
} as const;

export function assetCategoryClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
