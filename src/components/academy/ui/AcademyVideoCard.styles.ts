import { cn } from '../../../utils/cn';

const styles = {
    'resource-card': String.raw`
        tw:[&:has(.resource-card\_\_link:hover)]:[border-color:var(--accent-primary)]
        tw:[&:has(.resource-card\_\_link:focus-visible)]:[border-color:var(--accent-primary)]
    `,
    'resource-card__link': String.raw`
        tw:[text-decoration:none]
        tw:[&:is(:hover,_:focus-visible)_.resource-card\_\_preview_img]:[transform:scale(1.025)]
        tw:[@media(prefers-reduced-motion:reduce)]:[&:is(:hover,_:focus-visible)_.resource-card\_\_preview_img]:[transform:none]
    `,
    'resource-card__preview': String.raw`
        tw:[background:linear-gradient(135deg,_rgba(var(--accent-rgb),_.15),_rgba(59,_130,_246,_.16)),_var(--bg-tertiary)]
        tw:[&_img]:[transition:transform_.2s_ease] tw:[&::after]:[content:''] tw:[&::after]:absolute
        tw:[&::after]:inset-[0] tw:[&::after]:[background:linear-gradient(transparent_55%,_rgba(0,_0,_0,_.35))]
        tw:[&::after]:pointer-events-none tw:[@media(prefers-reduced-motion:reduce)]:[&_img]:[transition:none]
    `,
    'resource-card__play': String.raw`
        tw:[transform:translate(-50%,_-50%)] tw:[border:1px_solid_rgba(255,_255,_255,_.5)]
        tw:[background:rgba(0,_0,_0,_.7)] tw:[color:#fff] tw:[&_svg]:ml-[3px]
    `,
    'resource-card__video-label': String.raw`
        tw:[background:rgba(0,_0,_0,_.8)] tw:[color:#fff] tw:[font-weight:600]
    `,
    'resource-card__content': String.raw`
        tw:[&_h2]:[line-height:1.4] tw:[&_p]:[line-height:1.65]
    `,
    'resource-card__action': String.raw`
        tw:[font-weight:700] tw:[&_svg]:text-accent tw:[&_svg]:shrink-[0]
    `,
} as const;
export function videoStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
