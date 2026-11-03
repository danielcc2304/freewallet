import { cn } from '../../../utils/cn';
const styles = {
    'fund-info': String.raw`
        tw:[--fund-info-gap:var(--spacing-lg)] tw:pb-[var(--spacing-2xl)]
        tw:[animation:fadeIn_var(--transition-base)_ease-out]
    `,
    'fund-info__header': String.raw`
        tw:block
    `,
    'fund-info__results': String.raw`
        tw:ui-stack tw:gap-[var(--fund-info-gap)]
    `,
    'fund-info__data-item': String.raw`
        tw:[&_code]:text-accent tw:[&_code]:[font-family:'JetBrains_Mono',_monospace]
        tw:[&_code]:text-[length:var(--font-size-sm)] tw:[&_code]:[letter-spacing:0.02em]
    `,
    'fund-info__subheading': String.raw`
        tw:block tw:text-muted tw:text-[length:var(--font-size-xs)] tw:[font-weight:700]
        tw:[text-transform:uppercase] tw:[letter-spacing:0.03em]
    `,
    'fund-info__features': String.raw`
        tw:pt-ui-lg tw:mt-ui-lg tw:[border-top:1px_solid_var(--border-primary)]
    `,
    'fund-info__table-note': String.raw`
        tw:m-[var(--spacing-md)_0_0] tw:text-muted tw:text-[length:var(--font-size-xs)]
    `,
    'fund-info__description': String.raw`
        tw:m-[0] tw:text-secondary tw:[line-height:1.7]
    `,
    'fund-info__long-text': String.raw`
        tw:ui-stack tw:gap-ui-md tw:pt-ui-lg tw:mt-ui-lg tw:[border-top:1px_solid_var(--border-primary)]
        tw:[&_p]:m-[0] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.7]
    `,
    'fund-info__sr-only': String.raw`
        tw:absolute tw:w-[1px] tw:h-[1px] tw:p-[0] tw:m-[-1px] tw:overflow-hidden tw:[clip:rect(0,_0,_0,_0)]
        tw:whitespace-nowrap tw:[border:0]
    `,
} as const;
export function fundSheetFrameStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
