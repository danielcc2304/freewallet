import { cn } from '../../../utils/cn';

// Component-owned styles; BEM hooks remain for material and theme contexts.
const textSection = String.raw`tw:mb-[1.25rem] tw:[line-height:1.7] tw:text-secondary tw:[&_strong]:block tw:[&_strong]:mb-[0.5rem] tw:[&_strong]:text-main`;

const styles = {
    "timeline__phase": String.raw`tw:flex tw:gap-[2rem] tw:mb-[2rem] tw:[@media(max-width:768px)]:gap-[1rem]`,
    "timeline__phase--expanded": String.raw`
    tw:[&_.timeline\_\_phase-content]:[box-shadow:var(--shadow-lg)]
    tw:[&_.timeline\_\_phase-content]:[border-color:var(--accent-primary)]
`,
    "timeline__phase-marker": String.raw`tw:ui-stack tw:items-center tw:shrink-[0]`,
    "timeline__phase-number": String.raw`
    tw:w-[56px] tw:h-[56px] tw:rounded-[50%]
    tw:[background:linear-gradient(135deg,_var(--accent-primary),_var(--accent-secondary))] tw:[color:white] tw:ui-row
    tw:justify-center tw:text-[length:1.5rem] tw:[font-weight:700]
    tw:[box-shadow:0_4px_12px_rgba(var(--accent-rgb),_0.3)] tw:relative tw:z-[2] tw:[@media(max-width:768px)]:w-[48px]
    tw:[@media(max-width:768px)]:h-[48px] tw:[@media(max-width:768px)]:text-[length:1.25rem]
`,
    "timeline__phase-connector": String.raw`
    tw:w-[3px] tw:flex-[1] tw:[background:linear-gradient(180deg,_var(--accent-primary),_var(--border-color))]
    tw:mt-[0.5rem] tw:min-h-[40px]
`,
    "timeline__phase-content": String.raw`tw:[transition:all_0.3s_ease]`,
    "timeline__phase-header": String.raw`
    tw:w-full tw:p-[1.5rem] tw:ui-fill-transparent tw:[border:none] tw:cursor-pointer tw:ui-row tw:justify-between
    tw:gap-[1rem] tw:[transition:background_0.2s_ease] tw:[&:hover]:ui-fill-muted tw:[@media(max-width:768px)]:p-[1rem]
`,
    "timeline__phase-header-text": String.raw`tw:flex-[1] tw:text-left`,
    "timeline__phase-title": String.raw`tw:text-[length:1.375rem] tw:[font-weight:600] tw:text-main tw:m-[0_0_0.25rem_0]`,
    "timeline__phase-duration": String.raw`tw:text-[length:0.95rem] tw:text-accent tw:[font-weight:500]`,
    "timeline__phase-icon": String.raw`tw:text-accent tw:shrink-[0]`,
    "timeline__phase-details": String.raw`tw:p-[0_1.5rem_1.5rem] tw:[animation:slideDown_0.3s_ease] tw:[@media(max-width:768px)]:p-[0_1rem_1rem]`,
    "timeline__phase-objective": textSection,
    "timeline__phase-strategy": textSection,
    "timeline__phase-errors": String.raw`
    tw:mb-[1.25rem] tw:[line-height:1.7] tw:text-secondary tw:[&_strong]:block tw:[&_strong]:mb-[0.5rem]
    tw:[&_strong]:text-main tw:[&_ul]:[list-style:none] tw:[&_ul]:p-[0] tw:[&_ul]:m-[0] tw:[&_li]:relative
    tw:[&_li]:pl-[1.25rem] tw:[&_li]:mb-[0.25rem] tw:[&_li]:text-[length:0.9rem] tw:[&_li]:text-secondary
    tw:[&_li::before]:[content:"•"] tw:[&_li::before]:absolute tw:[&_li::before]:left-[0]
    tw:[&_li::before]:[color:var(--error-color,_#ef4444)] tw:[&_li::before]:[font-weight:bold]
`,
    "timeline__phase-checklist": String.raw`
    tw:mb-[1.25rem] tw:[&_strong]:block tw:[&_strong]:mb-[0.75rem] tw:[&_strong]:text-main tw:[&_ul]:[list-style:none]
    tw:[&_ul]:p-[0] tw:[&_ul]:m-[0] tw:[&_li]:flex tw:[&_li]:items-start tw:[&_li]:gap-[0.75rem] tw:[&_li]:p-[0.5rem_0]
    tw:[&_li]:text-secondary tw:[&_li]:[line-height:1.6]
`,
    "timeline__check-icon": String.raw`tw:[color:var(--success-color,_#10b981)] tw:shrink-[0] tw:mt-[2px]`,
    "timeline__phase-allocation": String.raw`
    tw:ui-fill-muted tw:p-[1rem] tw:rounded-[8px] tw:mb-[1.25rem] tw:[&_strong]:block tw:[&_strong]:mb-[0.75rem]
    tw:[&_strong]:text-main
`,
    "timeline__allocation-options": String.raw`tw:grid tw:gap-[0.5rem]`,
    "timeline__allocation-option": String.raw`tw:ui-row tw:justify-between tw:p-[0.5rem] tw:ui-fill-surface tw:rounded-[6px]`,
    "timeline__allocation-label": String.raw`tw:text-secondary tw:text-[length:0.95rem]`,
    "timeline__allocation-value": String.raw`tw:text-accent tw:[font-weight:600] tw:text-[length:0.95rem]`,
    "timeline__disclaimer": String.raw`
    tw:[background:rgba(255,_193,_7,_0.1)] tw:[border-left:4px_solid_var(--warning-color,_#ffc107)] tw:p-[1.25rem]
    tw:rounded-[8px] tw:mb-[3rem] tw:[line-height:1.7] tw:text-secondary
    tw:[&_strong]:[color:var(--warning-color,_#ffc107)]
`,
    "timeline__guide-link": String.raw`
    tw:p-[1rem_1.25rem] tw:ui-fill-muted tw:rounded-[8px] tw:text-main tw:[text-decoration:none]
    tw:[transition:all_0.2s_ease] tw:ui-stack tw:gap-[0.4rem] tw:[&:hover]:[background:rgba(var(--accent-rgb),_0.1)]
    tw:[&:hover]:text-accent tw:[&:hover]:[transform:translateY(-2px)] tw:[&_strong]:text-[length:1rem]
    tw:[&_span]:text-secondary tw:[&_span]:[line-height:1.5]
`
} as const;

export function journeyClass(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
