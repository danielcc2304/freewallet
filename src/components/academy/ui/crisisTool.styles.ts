import { cn } from '../../../utils/cn';

const styles = {
    'crisis__next-card': String.raw`
        tw:[.crisis_&]:ui-stack tw:[.crisis_&]:items-start tw:[.crisis_&]:gap-[.75rem] tw:[.crisis_&]:text-main
        tw:[.crisis_&]:[text-decoration:none] tw:[&_>_svg]:text-accent tw:[&_h3]:text-[length:1.1rem]
        tw:[&_h3]:m-[0] tw:[&_p]:text-[length:.9rem] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.65]
        tw:[&_p]:m-[0] tw:[&_>_span]:ui-row tw:[&_>_span]:gap-[.5rem] tw:[&_>_span]:min-h-[44px]
        tw:[&_>_span]:mt-[auto] tw:[&_>_span]:pt-[.5rem] tw:[&_>_span]:text-[length:.85rem]
        tw:[&_>_span]:[font-weight:700] tw:[&_>_span_svg]:shrink-[0] tw:[&_>_span_svg]:text-accent
        tw:[.crisis_&:hover]:[border-color:var(--accent-primary)]
    `,
} as const;
export function crisisTool(part: keyof typeof styles) { return cn(part, styles[part]); }
