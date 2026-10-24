import { cn } from '../../../utils/cn';

const styles = {
    'compound__advanced': String.raw`
        tw:[border-top:1px_solid_var(--border-color)] tw:pt-[1.5rem] tw:mt-[1.5rem]
    `,
    'compound__advanced-toggle': String.raw`
        tw:w-full tw:ui-fill-transparent tw:[border:none] tw:p-[0.75rem_0] tw:cursor-pointer tw:ui-row
        tw:justify-between tw:[font-weight:500] tw:text-accent tw:[transition:opacity_0.2s_ease]
        tw:[&:hover]:opacity-[0.8]
    `,
    'compound__advanced-content': String.raw`
        tw:mt-[1rem] tw:[animation:slideDown_0.3s_ease]
    `,
    'compound__goal-result': String.raw`
        tw:ui-fill-surface tw:ui-border-default tw:rounded-[24px] tw:p-[2.5rem] tw:text-center tw:relative
        tw:overflow-hidden tw:w-full tw:max-w-full tw:box-border tw:[&::before]:[content:''] tw:[&::before]:absolute
        tw:[&::before]:top-[0] tw:[&::before]:left-[0] tw:[&::before]:right-[0] tw:[&::before]:h-[4px]
        tw:[&::before]:[background:var(--accent-primary)] tw:[@media(min-width:1025px)]:col-span-full
    `,
    'compound__goal-result--achieved': String.raw`
        tw:[&.compound\_\_goal-result--achieved]:[background:linear-gradient(135deg,_rgba(16,_185,_129,_0.1)_0%,_rgba(16,_185,_129,_0.05)_100%)]
        tw:[&.compound\_\_goal-result--achieved]:[border-color:rgba(16,_185,_129,_0.3)]
        tw:[&::before]:[background:#10b981]
    `,
    'compound__goal-achieved': String.raw`
        tw:ui-stack tw:items-center tw:gap-[1rem] tw:[&_h3]:text-[length:1.75rem] tw:[&_h3]:[font-weight:800]
        tw:[&_h3]:[color:#10b981] tw:[&_h3]:m-[0]
    `,
    'compound__goal-badge': String.raw`
        tw:text-[length:4rem] tw:[line-height:1]
    `,
    'compound__goal-pending': String.raw`
        tw:ui-stack tw:items-center tw:gap-[1.5rem]
    `,
    'compound__goal-years-vibe': String.raw`
        tw:ui-stack tw:items-center tw:[&_.number]:text-[length:5rem] tw:[&_.number]:[font-weight:900]
        tw:[&_.number]:text-accent tw:[&_.number]:[line-height:1] tw:[&_.number]:[letter-spacing:-2px]
        tw:[&_.label]:text-[length:1rem] tw:[&_.label]:[font-weight:700] tw:[&_.label]:text-secondary
        tw:[&_.label]:[text-transform:uppercase] tw:[&_.label]:[letter-spacing:1px] tw:[&_.label]:mt-[0.5rem]
        tw:[@media(max-width:640px)]:[&&_.number]:text-[length:3.5rem]
    `,
    'compound__goal-text': String.raw`
        tw:max-w-[400px] tw:m-[0_auto] tw:[&_p]:text-[length:1.1rem] tw:[&_p]:text-secondary
        tw:[&_p]:[line-height:1.6] tw:[&_p]:m-[0] tw:[&_.highlight]:text-main tw:[&_.highlight]:[font-weight:700]
    `,
    'compound__goal-icon': String.raw`
        tw:text-[length:3rem] tw:mb-[1rem]
    `,
    'compound__goal-years': String.raw`
        tw:text-[length:3.5rem] tw:[font-weight:900] tw:text-accent tw:mb-[1rem] tw:[letter-spacing:-1px]
        tw:[@media(max-width:768px)]:text-[length:2.25rem]
    `,
    'compound__detail': String.raw`
        tw:[--calculator-card-padding:1.5rem] tw:[--calculator-card-radius:16px] tw:w-full tw:min-w-[0]
        tw:overflow-hidden tw:[@media(min-width:1025px)]:col-span-full tw:[@media(max-width:768px)]:p-[1rem]
        tw:[@media(max-width:480px)]:[&&]:p-[0.875rem]
    `,
    'compound__detail-header': String.raw`
        tw:flex tw:items-start tw:justify-between tw:gap-[1rem] tw:mb-[1rem] tw:[&_h4]:text-[length:1.125rem]
        tw:[&_h4]:[font-weight:600] tw:[&_h4]:text-main tw:[&_h4]:m-[0_0_0.35rem_0] tw:[&_p]:m-[0]
        tw:[&_p]:text-secondary tw:[&_p]:[line-height:1.5] tw:[@media(max-width:480px)]:[&&_p]:text-[length:0.9rem]
    `,
    'compound__detail-list': String.raw`
        tw:ui-stack tw:gap-[0.85rem]
    `,
} as const;
export function goalStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
