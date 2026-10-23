import { cn } from '../../../utils/cn';

// Component-owned styles; BEM hooks remain for material and theme contexts.
const toolDescription = String.raw`tw:text-[length:1.1rem] tw:text-secondary tw:m-[0.25rem_0_0_0] tw:[line-height:1.5]`;
const toolTitle = String.raw`tw:text-[length:2rem] tw:[font-weight:800] tw:text-main tw:m-[0]`;
const yearlyLabel = String.raw`
    tw:text-[length:0.8rem] tw:[text-transform:uppercase] tw:[letter-spacing:0.04em] tw:[color:var(--text-tertiary)]
    tw:[font-weight:700] tw:[@media(max-width:480px)]:[&&]:text-[length:0.72rem]
`;

const styles = {
    "compound__title-group": String.raw`
    tw:ui-row tw:gap-[1.5rem] tw:[@media(max-width:768px)]:items-start tw:[@media(max-width:768px)]:gap-[1rem]
    tw:[@media(max-width:480px)]:[&&]:flex-col tw:[&_.compound\_\_title-icon]:min-w-[54px]
    tw:[&_.compound\_\_title-icon]:w-[54px] tw:[&_.compound\_\_title-icon]:h-[54px]
    tw:[&_.compound\_\_title-icon]:p-[10px] tw:[&_.compound\_\_title-icon]:[background:rgba(16,_185,_129,_0.1)]
    tw:[&_.compound\_\_title-icon]:[color:#10b981] tw:[&_.compound\_\_title-icon]:rounded-[12px]
`,
    "compound__title": String.raw`tw:text-[length:2rem] tw:[font-weight:800] tw:text-main tw:m-[0] tw:[@media(max-width:768px)]:text-[length:2rem]`,
    "compound__description": toolDescription,
    "compound__mode-btn": String.raw`
    tw:ui-fill-surface tw:[border:2px_solid_var(--border-color)] tw:rounded-[12px] tw:p-[1rem_1.5rem] tw:cursor-pointer
    tw:[transition:all_0.2s_ease] tw:ui-row tw:justify-center tw:gap-[0.75rem] tw:[font-weight:500] tw:text-secondary
    tw:text-[length:0.95rem] tw:[&:hover]:[border-color:var(--accent-primary)] tw:[&:hover]:[transform:translateY(-2px)]
    tw:[&_svg]:shrink-[0]
`,
    "compound__mode-btn--active": String.raw`
    tw:[&.compound\_\_mode-btn--active]:[background:rgba(var(--accent-rgb),_0.1)]
    tw:[&.compound\_\_mode-btn--active]:[border-color:var(--accent-primary)]
    tw:[&.compound\_\_mode-btn--active]:text-accent
    tw:[&.compound\_\_mode-btn--active]:[box-shadow:0_0_0_3px_rgba(var(--accent-rgb),_0.1)]
`,
    "compound__radio": String.raw`
    tw:relative tw:ui-row tw:gap-[0.85rem] tw:cursor-pointer tw:text-main tw:text-[length:0.95rem] tw:[line-height:1.2]
    tw:p-[0.95rem_0.95rem_0.95rem_2.9rem] tw:ui-border-default tw:rounded-[12px] tw:ui-fill-muted
    tw:[transition:all_0.2s_ease] tw:min-h-[56px] tw:box-border tw:[&_>_:not(input[type="radio"])]:inline-flex
    tw:[&_>_:not(input[type="radio"])]:items-center tw:[&_>_:not(input[type="radio"])]:min-h-[18px]
    tw:[&_>_:not(input[type="radio"])]:[line-height:1.35] tw:[&:hover]:[border-color:var(--accent-primary)]
    tw:[&:hover]:[background:rgba(var(--accent-rgb),_0.06)] tw:[&::before]:[content:""] tw:[&::before]:absolute
    tw:[&::before]:left-[0.95rem] tw:[&::before]:top-[50%] tw:[&::before]:w-[18px] tw:[&::before]:h-[18px]
    tw:[&::before]:[border:2px_solid_rgba(var(--accent-rgb),_0.55)] tw:[&::before]:rounded-[50%]
    tw:[&::before]:[transform:translateY(-50%)] tw:[&::before]:box-border tw:[&::before]:[transition:all_0.2s_ease]
    tw:[&::after]:[content:""] tw:[&::after]:absolute tw:[&::after]:left-[calc(0.95rem_+_5px)] tw:[&::after]:top-[50%]
    tw:[&::after]:w-[8px] tw:[&::after]:h-[8px] tw:[&::after]:rounded-[50%]
    tw:[&::after]:[background:var(--accent-primary)] tw:[&::after]:[transform:translateY(-50%)_scale(0)]
    tw:[&::after]:[transition:transform_0.2s_ease] tw:[&_input[type="radio"]]:absolute
    tw:[&_input[type="radio"]]:opacity-[0] tw:[&_input[type="radio"]]:pointer-events-none
    tw:[&_input[type="radio"]]:m-[0] tw:[&:has(input[type="radio"]:checked)]:[border-color:var(--accent-primary)]
    tw:[&:has(input[type="radio"]:checked)]:[background:rgba(var(--accent-rgb),_0.1)]
    tw:[&:has(input[type="radio"]:checked)]:[box-shadow:0_0_0_2px_rgba(var(--accent-rgb),_0.08)]
    tw:[&:has(input[type="radio"]:checked)::before]:[border-color:var(--accent-primary)]
    tw:[&:has(input[type="radio"]:checked)::before]:[background:rgba(var(--accent-rgb),_0.12)]
    tw:[&:has(input[type="radio"]:checked)::after]:[transform:translateY(-50%)_scale(1)]
`,
    "compound__chart": String.raw`
    tw:[--calculator-card-padding:2rem] tw:[--calculator-card-radius:16px] tw:w-full tw:min-w-[0] tw:max-w-full
    tw:box-border tw:[@media(max-width:640px)]:p-[1rem_0.5rem] tw:[&_h4]:text-[length:1.125rem]
    tw:[&_h4]:[font-weight:600] tw:[&_h4]:text-main tw:[&_h4]:m-[0] tw:[@media(min-width:1025px)]:col-[2]
    tw:[@media(min-width:1025px)]:row-[1] tw:[@media(min-width:1025px)]:h-full tw:[@media(min-width:1025px)]:ui-stack
    tw:[@media(min-width:1025px)]:[&_.recharts-responsive-container]:flex-[1_1_auto]
    tw:[@media(max-width:768px)]:p-[1rem] tw:[@media(max-width:768px)]:[&_h4]:text-[length:1rem]
`,
    "compound__chart-header": String.raw`
    tw:ui-row tw:justify-between tw:gap-[1rem] tw:mb-[1rem] tw:[@media(max-width:768px)]:items-start
    tw:[@media(max-width:768px)]:flex-col
`,
    "compound__chart-legend": String.raw`
    tw:ui-row tw:justify-end tw:gap-[1rem] tw:flex-wrap tw:text-secondary tw:text-[length:0.9rem]
    tw:[@media(max-width:768px)]:justify-start
`,
    "compound__chart-legend-item": String.raw`tw:inline-flex tw:items-center tw:gap-[0.45rem] tw:whitespace-nowrap`,
    "compound__chart-legend-dot": String.raw`tw:w-[0.7rem] tw:h-[0.7rem] tw:rounded-[999px] tw:flex-[0_0_auto]`,
    "compound__chart-legend-dot--blue": String.raw`tw:[background:#3b82f6]`,
    "compound__chart-legend-dot--green": String.raw`tw:[background:#10b981]`,
    "compound__chart-canvas": String.raw`
    tw:w-full tw:h-[280px] tw:[@media(max-width:640px)]:h-[240px] tw:[@media(min-width:1025px)]:flex-[1_1_auto]
    tw:[@media(min-width:1025px)]:h-full tw:[@media(min-width:1025px)]:min-h-[320px]
`,
    "compound__detail-item": String.raw`tw:ui-border-default tw:rounded-[14px] tw:[background:rgba(var(--accent-rgb),_0.04)] tw:overflow-hidden`,
    "compound__detail-item--open": String.raw`
    tw:[&.compound\_\_detail-item--open]:[background:rgba(var(--accent-rgb),_0.06)]
    tw:[&.compound\_\_detail-item--open]:[border-color:rgba(var(--accent-rgb),_0.25)]
`,
    "compound__detail-summary": String.raw`
    tw:w-full tw:[border:none] tw:ui-fill-transparent tw:[color:inherit] tw:p-[1rem_1.1rem] tw:grid
    tw:grid-cols-[minmax(0,_1fr)_auto_auto] tw:items-center tw:gap-[1rem] tw:text-left tw:cursor-pointer
    tw:[@media(max-width:768px)]:grid-cols-[minmax(0,_1fr)_auto_auto] tw:[@media(max-width:768px)]:gap-[0.75rem]
    tw:[@media(max-width:768px)]:p-[0.9rem_1rem] tw:[@media(max-width:480px)]:[&&]:grid-cols-[minmax(0,_1fr)_auto_auto]
    tw:[@media(max-width:480px)]:[&&]:gap-[0.5rem] tw:[@media(max-width:480px)]:[&&]:p-[0.8rem_0.875rem]
`,
    "compound__detail-summary-main": String.raw`tw:min-w-[0] tw:ui-stack tw:gap-[0.2rem]`,
    "compound__detail-summary-side": String.raw`tw:min-w-[0] tw:ui-stack tw:gap-[0.2rem] tw:text-right`,
    "compound__detail-year": yearlyLabel,
    "compound__detail-total": String.raw`
    tw:text-[length:1.05rem] tw:text-main tw:[@media(max-width:768px)]:text-[length:0.98rem]
    tw:[@media(max-width:480px)]:[&&]:text-[length:0.9rem]
`,
    "compound__detail-yield": String.raw`
    tw:text-[length:1.05rem] tw:[color:#10b981] tw:[@media(max-width:768px)]:text-[length:0.98rem]
    tw:[@media(max-width:480px)]:[&&]:text-[length:0.9rem]
`,
    "compound__detail-yield-label": yearlyLabel,
    "compound__detail-body": String.raw`
    tw:p-[0_1.1rem_1.1rem] tw:[border-top:1px_solid_rgba(var(--accent-rgb),_0.12)]
    tw:[@media(max-width:480px)]:[&&]:p-[0_0.875rem_0.875rem]
`,
    "compound__detail-grid": String.raw`
    tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[0.85rem] tw:pt-[1rem]
    tw:[@media(max-width:768px)]:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:[@media(max-width:768px)]:gap-[0.7rem]
    tw:[@media(max-width:480px)]:[&&]:grid-cols-[repeat(2,_minmax(0,_1fr))]
    tw:[@media(max-width:480px)]:[&&]:gap-[0.55rem] tw:[@media(max-width:480px)]:[&&]:pt-[0.875rem]
`,
    "compound__disclaimer": String.raw`
    tw:[background:rgba(255,_193,_7,_0.1)] tw:[border-left:4px_solid_var(--warning-color,_#ffc107)] tw:p-[1.25rem]
    tw:rounded-[8px] tw:[line-height:1.7] tw:text-secondary tw:text-[length:0.95rem]
`,
    "compound__rate-equivalence": String.raw`
    tw:m-[0.75rem_0_0] tw:p-[0.8rem_0.9rem] tw:[border:1px_solid_rgba(var(--accent-rgb),_0.2)] tw:rounded-[10px]
    tw:[background:rgba(var(--accent-rgb),_0.06)] tw:text-secondary tw:text-[length:0.88rem] tw:[line-height:1.45]
    tw:[&_strong]:text-main tw:[&_strong]:[font-weight:700]
`,
    "fire__title-group": String.raw`
    tw:ui-row tw:gap-[1.5rem] tw:[&_.fire\_\_title-icon]:w-[54px] tw:[&_.fire\_\_title-icon]:h-[54px]
    tw:[&_.fire\_\_title-icon]:[color:#ff5722] tw:[&_.fire\_\_title-icon]:[background:rgba(255,_87,_34,_0.1)]
    tw:[&_.fire\_\_title-icon]:p-[10px] tw:[&_.fire\_\_title-icon]:rounded-[12px]
`,
    "fire__title": toolTitle,
    "fire__subtitle": String.raw`tw:text-[length:1.1rem] tw:text-secondary tw:m-[0.25rem_0_0_0]`,
    "fire__optional-toggle": String.raw`
    tw:relative tw:grid tw:grid-cols-[auto_minmax(0,_1fr)] tw:items-start tw:gap-[0.8rem] tw:p-[0.95rem_1rem]
    tw:rounded-[12px] tw:ui-border-default tw:ui-fill-muted tw:cursor-pointer tw:[transition:all_0.2s_ease]
    tw:box-border tw:min-h-[56px] tw:w-full tw:[&_input]:m-[0.15rem_0_0]
    tw:[&_input]:[accent-color:var(--accent-primary)] tw:[&_input]:w-[18px] tw:[&_input]:h-[18px]
    tw:[&_input]:shrink-[0] tw:[&:hover]:[border-color:var(--accent-primary)]
    tw:[&:hover]:[background:rgba(var(--accent-rgb),_0.06)]
    tw:[&:has(input:checked)]:[border-color:var(--accent-primary)]
    tw:[&:has(input:checked)]:[background:rgba(var(--accent-rgb),_0.1)]
    tw:[&:has(input:checked)]:[box-shadow:0_0_0_2px_rgba(var(--accent-rgb),_0.08)]
`,
    "fire__optional-copy": String.raw`
    tw:ui-stack tw:gap-[0.2rem] tw:min-w-[0] tw:[&_strong]:text-main tw:[&_strong]:text-[length:0.92rem]
    tw:[&_small]:text-secondary tw:[&_small]:text-[length:0.8rem] tw:[&_small]:[line-height:1.45]
`,
    "fire__projection-btn": String.raw`
    tw:ui-fill-muted tw:ui-border tw:rounded-[12px] tw:text-secondary tw:cursor-pointer tw:ui-stack tw:items-start
    tw:gap-[0.2rem] tw:text-[length:0.92rem] tw:[font-weight:600] tw:p-[0.85rem_1rem] tw:text-left
    tw:[transition:all_0.2s_ease] tw:[&_span]:text-[length:0.74rem] tw:[&_span]:[font-weight:500]
    tw:[&_span]:opacity-[0.9] tw:[&:hover]:[border-color:var(--accent-primary)] tw:[&:hover]:text-main
`,
    "fire__projection-btn--active": String.raw`
    tw:[&.fire\_\_projection-btn--active]:[background:rgba(var(--accent-rgb),_0.12)]
    tw:[&.fire\_\_projection-btn--active]:[border-color:var(--accent-primary)]
    tw:[&.fire\_\_projection-btn--active]:text-accent
    tw:[&.fire\_\_projection-btn--active]:[box-shadow:0_0_0_2px_rgba(var(--accent-rgb),_0.08)]
`,
    "fire__info-card": String.raw`
    tw:[background:rgba(59,_130,_246,_0.05)] tw:[border:1px_solid_rgba(59,_130,_246,_0.2)] tw:rounded-[12px] tw:p-[1rem]
    tw:flex tw:gap-[0.75rem] tw:mt-[auto] tw:[&_p]:text-[length:0.85rem] tw:[&_p]:text-secondary
    tw:[&_p]:[line-height:1.4] tw:[&_p]:m-[0] tw:[&_svg]:[color:#3b82f6] tw:[&_svg]:shrink-[0]
`,
    "fire__scenario-card": String.raw`tw:mt-[1.5rem] tw:ui-fill-surface tw:ui-border-default tw:rounded-[16px] tw:p-[1.5rem]`,
    "fire__scenario-title": String.raw`tw:m-[0_0_0.75rem_0] tw:text-[length:1rem] tw:[font-weight:700] tw:text-main`,
    "fire__scenario-text": String.raw`tw:m-[0] tw:text-[length:0.95rem] tw:[line-height:1.65] tw:text-secondary`,
    "fire__chart-container": String.raw`
    tw:ui-fill-surface tw:p-[2rem] tw:rounded-[20px] tw:ui-border-default tw:ui-stack
    tw:[@media(max-width:640px)]:p-[1rem_0.5rem] tw:[@media(min-width:1025px)]:flex-[1_1_auto]
`,
    "fire__chart-header": String.raw`
    tw:ui-row tw:justify-between tw:gap-[1rem] tw:mb-[1.5rem] tw:[@media(max-width:768px)]:flex-col
    tw:[@media(max-width:768px)]:items-start
`,
    "fire__chart-title": String.raw`tw:text-[length:1.1rem] tw:[font-weight:700] tw:m-[0] tw:text-main`,
    "fire__chart-badge": String.raw`
    tw:inline-flex tw:items-center tw:p-[0.45rem_0.8rem] tw:rounded-[999px]
    tw:[border:1px_solid_rgba(var(--accent-rgb),_0.25)] tw:[background:rgba(var(--accent-rgb),_0.1)] tw:text-accent
    tw:text-[length:0.78rem] tw:[font-weight:700] tw:[text-transform:uppercase] tw:[letter-spacing:0.04em]
    tw:whitespace-nowrap
`,
    "fire__chart-canvas": String.raw`
    tw:h-[300px] tw:[@media(max-width:640px)]:h-[280px] tw:[@media(min-width:1025px)]:flex-[1_1_auto]
    tw:[@media(min-width:1025px)]:min-h-[410px]
`,
    "fire__theory-card": String.raw`
    tw:ui-fill-surface tw:p-[2rem] tw:rounded-[20px] tw:ui-border-default tw:[&_h3]:text-[length:1.1rem]
    tw:[&_h3]:[font-weight:700] tw:[&_h3]:mb-[0.75rem] tw:[&_p]:text-[length:0.95rem] tw:[&_p]:text-secondary
    tw:[&_p]:[line-height:1.6] tw:[&_p]:m-[0]
`,
    "fire__theory-icon": String.raw`tw:text-accent tw:mb-[1rem]`,
    "retirement__title-group": String.raw`
    tw:ui-row tw:gap-[1.5rem] tw:[&_.retirement\_\_title-icon]:min-w-[54px] tw:[&_.retirement\_\_title-icon]:w-[54px]
    tw:[&_.retirement\_\_title-icon]:h-[54px] tw:[&_.retirement\_\_title-icon]:p-[10px]
    tw:[&_.retirement\_\_title-icon]:[background:rgba(139,_92,_246,_0.1)]
    tw:[&_.retirement\_\_title-icon]:[color:#8b5cf6] tw:[&_.retirement\_\_title-icon]:rounded-[12px]
`,
    "retirement__title": toolTitle,
    "retirement__subtitle": toolDescription,
    "retirement__note": String.raw`
    tw:[--calculator-card-bg:rgba(59,_130,_246,_0.05)] tw:[--calculator-card-border:rgba(59,_130,_246,_0.1)]
    tw:[--calculator-card-padding:0.95rem_1rem] tw:[--calculator-card-radius:12px] tw:flex tw:gap-[0.75rem]
    tw:items-start tw:[&_p]:text-[length:0.85rem] tw:[&_p]:m-[0] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.4]
    tw:[&_svg]:[color:#3b82f6] tw:[&_svg]:shrink-[0]
`,
    "retirement__insight": String.raw`
    tw:[--calculator-card-bg:var(--bg-tertiary)] tw:[--calculator-card-padding:1.25rem]
    tw:[--calculator-card-radius:16px] tw:ui-row tw:gap-[1.25rem]
`,
    "retirement__insight-icon": String.raw`tw:[color:#10b981] tw:w-[24px] tw:h-[24px] tw:shrink-[0]`,
    "retirement__insight-content": String.raw`
    tw:[&_h4]:m-[0_0_0.5rem_0] tw:[&_h4]:text-[length:1rem] tw:[&_h4]:[font-weight:700] tw:[&_p]:m-[0]
    tw:[&_p]:text-[length:0.9rem] tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.5]
`,
    "retirement__chart-box": String.raw`
    tw:[--calculator-card-padding:1.75rem] tw:[--calculator-card-radius:16px] tw:mb-[2rem]
    tw:[@media(max-width:640px)]:p-[1rem_0.5rem]
`,
    "retirement__chart-title": String.raw`tw:text-[length:1.1rem] tw:[font-weight:700] tw:m-[0]`,
    "retirement__chart-legend": String.raw`tw:flex tw:gap-[1.5rem] tw:mb-[1.5rem]`,
    "legend-item": String.raw`tw:ui-row tw:gap-[0.5rem] tw:text-[length:0.85rem] tw:[font-weight:600] tw:text-secondary`,
    "dot": String.raw`tw:w-[10px] tw:h-[10px] tw:rounded-[50%] tw:[&.nominal]:[background:#3b82f6] tw:[&.real]:[background:#8b5cf6]`
} as const;

export function calculatorToolClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
