import { cn } from '../../../utils/cn';

const styles = {
    'risk-mgmt__tool': String.raw`
        tw:[.risk-mgmt_&]:ui-stack tw:[.risk-mgmt_&]:gap-[.75rem] tw:[.risk-mgmt_&]:[text-decoration:none]
        tw:[.risk-mgmt_&]:text-main tw:[&_>_svg]:text-accent tw:[.risk-mgmt_&_h3]:m-[0]
        tw:[.risk-mgmt_&_h3]:text-[length:1.05rem] tw:[&_>_span]:ui-row tw:[&_>_span]:gap-[.5rem]
        tw:[&_>_span]:min-h-[44px] tw:[&_>_span]:mt-[auto] tw:[&_>_span]:pt-[.5rem]
        tw:[&_>_span]:text-[length:.85rem] tw:[&_>_span]:[font-weight:700] tw:[&_>_span]:text-accent
        tw:[&_>_span_svg]:shrink-[0] tw:[&:hover]:[border-color:var(--accent-primary)]
        tw:[html[data-appearance='liquid-glass']_&:hover]:[border-color:var(--accent-primary)]
    `,
} as const;
export function riskTool(part: keyof typeof styles) { return cn(part, styles[part]); }
