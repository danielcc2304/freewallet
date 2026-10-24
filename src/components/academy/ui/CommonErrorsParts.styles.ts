import { cn } from '../../../utils/cn';

const styles = {
    'error-detail-card__header': String.raw`
        tw:ui-row tw:gap-[var(--academy-space-stack)] tw:[@media(max-width:480px)]:[&&]:gap-[0.8rem]
    `,
    'error-detail-card__emoji': String.raw`
        tw:text-[length:2.5rem] tw:ui-fill-muted tw:w-[64px] tw:h-[64px] tw:ui-row tw:justify-center
        tw:rounded-[16px] tw:[@media(max-width:480px)]:[&&]:w-[52px] tw:[@media(max-width:480px)]:[&&]:h-[52px]
        tw:[@media(max-width:480px)]:[&&]:text-[length:2rem]
    `,
    'error-detail-card__title': String.raw`
        tw:text-[length:1.5rem] tw:[font-weight:800] tw:m-[0] tw:text-main tw:wrap-anywhere
        tw:[@media(max-width:480px)]:[&&]:text-[length:1.2rem]
    `,
    'error-sub-box': String.raw`
        tw:[&.consequence]:[background:rgba(239,_68,_68,_0.05)]
        tw:[&.consequence]:[border:1px_solid_rgba(239,_68,_68,_0.1)]
        tw:[&.solution]:[background:rgba(16,_185,_129,_0.05)]
        tw:[&.solution]:[border:1px_solid_rgba(16,_185,_129,_0.1)] tw:[&_h5]:m-[0_0_0.5rem] tw:[&_h5]:ui-row
        tw:[&_h5]:gap-[0.5rem] tw:[&_h5]:text-[length:0.85rem] tw:[&_h5]:[text-transform:uppercase]
        tw:[&_h5]:[letter-spacing:0.05em] tw:[&.consequence_h5]:[color:#ef4444] tw:[&.solution_h5]:[color:#10b981]
        tw:[&_p]:m-[0] tw:[&_p]:text-[length:0.85rem] tw:[&_p]:[line-height:1.4] tw:[&_p]:text-secondary
        tw:[@media(max-width:480px)]:[&&]:p-[0.85rem]
    `,
    'error-detail-card__footer': String.raw`
        tw:mt-[auto] tw:pt-[1rem] tw:[border-top:1px_solid_var(--border-color)] tw:text-[length:0.8rem]
        tw:text-secondary tw:ui-row tw:gap-[0.5rem] tw:flex-wrap tw:[&_svg]:shrink-[0]
    `,
} as const;
export function errorParts(part: keyof typeof styles) { return cn(part, styles[part]); }
