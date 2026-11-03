import { cn } from '../../../utils/cn';
const styles = {
    'risk-mgmt__card': String.raw`
        tw:[&_h3]:text-[length:1.15rem] tw:[&_h3]:[line-height:1.4] tw:[&_h3]:m-[0_0_.75rem]
        tw:[&_p]:text-[length:.95rem] tw:[&_p]:[line-height:1.7] tw:[&_p]:text-secondary tw:[&_p]:m-[0]
        tw:[html[data-appearance='liquid-glass']_&]:[background:linear-gradient(145deg,_rgba(255,_255,_255,_.035),_transparent_34%),_var(--glass-content)]
        tw:[html[data-appearance='liquid-glass']_&]:[border-color:var(--border-primary)]
        tw:[html[data-appearance='liquid-glass']_&]:[box-shadow:inset_0_1px_0_var(--glass-edge-soft)]
    `,
    'risk-mgmt__icon': String.raw`
        tw:grid tw:place-items-center tw:w-[44px] tw:h-[44px] tw:rounded-[12px]
        tw:[background:rgba(var(--accent-rgb),_.08)] tw:text-accent tw:mb-[1rem] tw:shrink-[0]
        tw:[.risk-mgmt\_\_comparison--loss_&]:[color:#fbbf24]
        tw:[.risk-mgmt\_\_comparison--loss_&]:[background:rgba(245,_158,_11,_.1)]
        tw:[html[data-theme='light']_.risk-mgmt\_\_comparison--loss_&]:[color:#92400e]
    `,
    'risk-mgmt__comparison': String.raw`
        tw:ui-stack tw:[&&]:[border-top-width:3px] tw:[&&]:[border-top-style:solid] tw:[&&&]:[border-top-color:var(--accent-primary)]
        tw:[html[data-appearance='liquid-glass']_&]:[border-top-color:var(--accent-primary)]
    `,
    'risk-mgmt__comparison--loss': String.raw`
        tw:[&&&&]:[border-top-color:#f59e0b]
        tw:[html[data-appearance='liquid-glass']_&&&&]:[border-top-color:var(--border-primary)]
    `,
    'risk-mgmt__correlations': String.raw`
        tw:mt-[1rem]
    `,
    'risk-mgmt__matrix-heading': String.raw`
        tw:flex tw:justify-between tw:items-baseline tw:flex-wrap tw:gap-[.5rem] tw:mb-[.75rem] tw:[&&_h3]:m-[0]
        tw:[&_>_span]:text-[length:.8rem] tw:[&_>_span]:text-secondary
    `,
    'risk-mgmt__matrix-scroll': String.raw`
        tw:overflow-x-auto tw:[overscroll-behavior-x:contain] tw:mt-[1.25rem] tw:rounded-[10px]
    `,
    'risk-mgmt__matrix': String.raw`
        tw:w-full tw:min-w-[560px] tw:border-separate tw:[border-spacing:4px] tw:[font-variant-numeric:tabular-nums]
        tw:[&_caption]:absolute tw:[&_caption]:w-[1px] tw:[&_caption]:h-[1px] tw:[&_caption]:p-[0]
        tw:[&_caption]:overflow-hidden tw:[&_caption]:[clip-path:inset(50%)] tw:[&_caption]:whitespace-nowrap
        tw:[&_:is(th,_td)]:p-[.7rem_.5rem] tw:[&_:is(th,_td)]:rounded-[7px] tw:[&_:is(th,_td)]:text-[length:.8rem]
        tw:[&_:is(th,_td)]:text-center tw:[&_th]:ui-fill-muted tw:[&_th]:text-secondary tw:[&_th]:[font-weight:600]
        tw:[&_th[scope='row']]:text-left tw:[&_th[scope='row']]:whitespace-nowrap
    `,
    'risk-mgmt__correlation': String.raw`
        tw:[font-weight:700]
    `,
    'risk-mgmt__correlation--high': String.raw`
        tw:[&.risk-mgmt\_\_correlation--high]:[background:rgba(239,_68,_68,_.12)]
        tw:[&.risk-mgmt\_\_correlation--high]:[color:#fca5a5] tw:[html[data-theme='light']_&]:[color:#b91c1c]
    `,
    'risk-mgmt__correlation--medium': String.raw`
        tw:[&.risk-mgmt\_\_correlation--medium]:[background:rgba(245,_158,_11,_.12)]
        tw:[&.risk-mgmt\_\_correlation--medium]:[color:#fcd34d] tw:[html[data-theme='light']_&]:[color:#92400e]
    `,
    'risk-mgmt__correlation--neutral': String.raw`
        tw:[&.risk-mgmt\_\_correlation--neutral]:ui-fill-muted
        tw:[&.risk-mgmt\_\_correlation--neutral]:text-secondary
    `,
    'risk-mgmt__correlation--low': String.raw`
        tw:[&.risk-mgmt\_\_correlation--low]:[background:rgba(16,_185,_129,_.12)]
        tw:[&.risk-mgmt\_\_correlation--low]:[color:#6ee7b7] tw:[html[data-theme='light']_&]:[color:#047857]
    `,
    'risk-mgmt__legend': String.raw`
        tw:flex tw:flex-wrap tw:gap-[.65rem_1.25rem] tw:m-[1rem_0_.75rem] tw:text-secondary tw:text-[length:.8rem]
        tw:[&_span]:ui-row tw:[&_span]:gap-[.5rem] tw:[&_i]:w-[9px] tw:[&_i]:h-[9px] tw:[&_i]:rounded-[3px]
        tw:[&_i]:shrink-[0]
    `,
    'risk-mgmt__swatch--high': String.raw`
        tw:[&.risk-mgmt\_\_swatch--high]:[background:#ef4444]
    `,
    'risk-mgmt__swatch--medium': String.raw`
        tw:[&.risk-mgmt\_\_swatch--medium]:[background:#f59e0b]
    `,
    'risk-mgmt__swatch--low': String.raw`
        tw:[&.risk-mgmt\_\_swatch--low]:[background:#10b981]
    `,
    'risk-mgmt__card-heading': String.raw`
        tw:ui-row tw:gap-[.85rem] tw:mb-[1.25rem] tw:[&_:is(h3,_.risk-mgmt\_\_icon)]:m-[0]
    `,
    'risk-mgmt__horizons': String.raw`
        tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[1.25rem]
        tw:[&_>_div]:[border-top:1px_solid_var(--border-color)] tw:[&_>_div]:pt-[1rem] tw:[&_h4]:text-[length:1rem]
        tw:[&_h4]:m-[0_0_.5rem] tw:[&&_p]:text-[length:.9rem] tw:[@container(max-width:680px)]:grid-cols-[1fr]
    `,
    'risk-mgmt__tag': String.raw`
        tw:block tw:text-secondary tw:text-[length:.8rem] tw:[line-height:1.5] tw:mb-[.5rem]
    `,
    'risk-mgmt__currency': String.raw`
        tw:[&_ul]:pl-[1.2rem] tw:[&_ul]:m-[1rem_0_0] tw:[&_ul]:text-secondary tw:[&_ul]:text-[length:.9rem]
        tw:[&_ul]:[line-height:1.65] tw:[&_li_+_li]:mt-[.4rem]
    `,
} as const;
export function riskReadingStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
