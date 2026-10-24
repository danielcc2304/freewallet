import { cn } from '../../../utils/cn';

const styles = {
    'strategies__tool-card': String.raw`
        tw:[.strategies_&_h3]:text-[length:1.2rem] tw:[.strategies_&_h3]:[line-height:1.35]
        tw:[.strategies_&_h3]:m-[0_0_.75rem] tw:[.strategies_&_p]:text-[length:.95rem]
        tw:[.strategies_&_p]:[line-height:1.7] tw:[.strategies_&_p]:text-secondary tw:[.strategies_&_p]:m-[0]
        tw:[.strategies_&]:ui-stack tw:[.strategies_&]:gap-[.75rem] tw:[.strategies_&]:[text-decoration:none]
        tw:[.strategies_&]:text-main tw:[&_>_svg]:text-accent tw:[.strategies_&&_h3]:m-[0]
        tw:[.strategies_&&_h3]:text-[length:1.05rem] tw:[&_>_span]:mt-[auto] tw:[&_>_span]:pt-[.5rem]
        tw:[&_>_span]:min-h-[44px] tw:[&_>_span]:ui-row tw:[&_>_span]:gap-[.5rem] tw:[&_>_span]:[font-weight:700]
        tw:[&_>_span]:text-[length:.85rem] tw:[&_>_span]:text-accent tw:[&_>_span_svg]:shrink-[0]
        tw:[.strategies_&:hover]:[border-color:var(--accent-primary)]
    `,
} as const;
export function strategyTool(part: keyof typeof styles) { return cn(part, styles[part]); }
