import { cn } from '../../../utils/cn';

const styles = {
    'risk-mgmt__takeaway': String.raw`
        tw:mt-[auto] tw:pt-[1rem] tw:text-[length:.85rem] tw:[line-height:1.6] tw:text-secondary tw:[&_strong]:block
        tw:[&_strong]:text-main tw:[&_strong]:pt-[.9rem] tw:[&_strong]:[border-top:1px_solid_var(--border-color)]
        tw:[&_strong]:mb-[.3rem]
    `,
    'risk-mgmt__action': String.raw`
        tw:[border-top:1px_solid_var(--border-color)] tw:mt-[1.25rem] tw:pt-[.9rem] tw:[&_strong]:block
        tw:[&_strong]:mb-[.3rem] tw:[&_strong]:text-[length:.85rem] tw:[&&_p]:text-[length:.9rem]
    `,
} as const;
export function riskParts(part: keyof typeof styles) { return cn(part, styles[part]); }
