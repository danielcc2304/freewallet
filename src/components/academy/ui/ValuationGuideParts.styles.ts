import { cn } from '../../../utils/cn';

const styles = {
    'metric-card__header': String.raw`
        tw:ui-row tw:justify-between tw:mb-[1rem]
    `,
    'metric-card__title': String.raw`
        tw:text-[length:1.1rem] tw:[font-weight:700] tw:text-main
    `,
    'metric-card__formula': String.raw`
        tw:ui-fill-muted tw:p-[0.75rem] tw:rounded-[8px] tw:[font-family:'JetBrains_Mono',_monospace]
        tw:text-[length:0.85rem] tw:text-accent tw:mb-[1rem] tw:[border:1px_dashed_var(--border-color)]
    `,
    'metric-card__desc': String.raw`
        tw:text-[length:0.9rem] tw:text-secondary tw:[line-height:1.5] tw:mb-[1rem]
    `,
    'metric-card__benchmarks': String.raw`
        tw:ui-stack tw:gap-[0.5rem]
    `,
    'benchmark': String.raw`
        tw:flex tw:justify-between tw:text-[length:0.85rem] tw:p-[0.4rem_0.75rem] tw:rounded-[6px]
    `,
    'benchmark--good': String.raw`
        tw:[&.benchmark--good]:[background:rgba(16,_185,_129,_0.1)] tw:[&.benchmark--good]:[color:#10b981]
    `,
    'benchmark--neutral': String.raw`
        tw:[&.benchmark--neutral]:[background:rgba(245,_158,_11,_0.1)] tw:[&.benchmark--neutral]:[color:#f59e0b]
    `,
    'benchmark--bad': String.raw`
        tw:[&.benchmark--bad]:[background:rgba(239,_68,_68,_0.1)] tw:[&.benchmark--bad]:[color:#ef4444]
    `,
    'example-box': String.raw`
        tw:ui-fill-surface tw:rounded-[20px] tw:p-[2rem] tw:ui-border-default tw:mb-[2rem]
    `,
    'example-box--good': String.raw`
        tw:[&.example-box--good]:[border-left:6px_solid_#10b981]
    `,
    'example-box--bad': String.raw`
        tw:[&.example-box--bad]:[border-left:6px_solid_#ef4444]
    `,
    'example-box__header': String.raw`
        tw:ui-row tw:gap-[1rem] tw:mb-[1.5rem]
    `,
    'example-box__title': String.raw`
        tw:text-[length:1.25rem] tw:[font-weight:700]
    `,
    'example-box__grid': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] tw:gap-[1.5rem]
    `,
    'example-box__conclusion': String.raw`
        tw:mt-[1.5rem] tw:pt-[1.5rem] tw:[border-top:1px_solid_var(--border-color)] tw:[font-style:italic]
        tw:text-secondary
    `,
    'example-metric': String.raw`
        tw:ui-stack tw:gap-[0.25rem]
    `,
    'example-metric__label': String.raw`
        tw:text-[length:0.8rem] tw:[color:var(--text-tertiary)] tw:[text-transform:uppercase]
    `,
    'example-metric__value': String.raw`
        tw:text-[length:1.1rem] tw:[font-weight:600]
    `,
    'checklist-item': String.raw`
        tw:ui-fill-muted tw:p-[1rem] tw:rounded-[12px] tw:ui-row tw:gap-[0.75rem] tw:[font-weight:500]
        tw:[&_svg]:[color:#10b981]
    `,
} as const;
export function valuationParts(part: keyof typeof styles) { return cn(part, styles[part]); }
