import { cn } from '../../../utils/cn';

const styles = {
    'scenario-card__header': String.raw`
        tw:ui-row tw:gap-[1.5rem] tw:mb-[2rem] tw:[@media(max-width:768px)]:flex-col
        tw:[@media(max-width:768px)]:text-center tw:[@media(max-width:768px)]:gap-[1rem]
    `,
    'scenario-card__emoji': String.raw`
        tw:text-[length:3rem] tw:ui-fill-muted tw:w-[80px] tw:h-[80px] tw:ui-row tw:justify-center tw:rounded-[20px]
        tw:[@media(max-width:768px)]:m-[0_auto]
    `,
    'scenario-card__title': String.raw`
        tw:text-[length:1.75rem] tw:[font-weight:800] tw:m-[0] tw:text-main
    `,
    'scenario-section': String.raw`
        tw:mb-[2rem] tw:[&:last-child]:mb-[0] tw:[&_h3]:text-[length:1.1rem] tw:[&_h3]:[font-weight:700]
        tw:[&_h3]:mb-[1rem] tw:[&_h3]:text-main tw:[&_h3]:ui-row tw:[&_h3]:gap-[0.5rem]
    `,
    'scenario-section__content': String.raw`
        tw:text-secondary tw:[line-height:1.6]
    `,
    'action-card': String.raw`
        tw:flex tw:gap-[1rem] tw:p-[1.25rem] tw:rounded-[12px] tw:ui-fill-muted tw:[border:1px_solid_transparent]
        tw:[&.do]:[border-left:4px_solid_#10b981] tw:[&.do]:[background:rgba(16,_185,_129,_0.05)]
        tw:[&.dont]:[border-left:4px_solid_#ef4444] tw:[&.dont]:[background:rgba(239,_68,_68,_0.05)]
        tw:[&.do::after]:[content:"✓"] tw:[&.do::after]:absolute tw:[&.do::after]:top-[10px]
        tw:[&.do::after]:right-[12px] tw:[&.do::after]:[background:#10b981] tw:[&.do::after]:[color:white]
        tw:[&.do::after]:text-[length:0.8rem] tw:[&.do::after]:[font-weight:800] tw:[&.do::after]:w-[20px]
        tw:[&.do::after]:h-[20px] tw:[&.do::after]:rounded-[999px] tw:[&.do::after]:inline-flex
        tw:[&.do::after]:items-center tw:[&.do::after]:justify-center tw:[&.dont::after]:[content:"✕"]
        tw:[&.dont::after]:absolute tw:[&.dont::after]:top-[10px] tw:[&.dont::after]:right-[12px]
        tw:[&.dont::after]:[background:#ef4444] tw:[&.dont::after]:[color:white]
        tw:[&.dont::after]:text-[length:0.8rem] tw:[&.dont::after]:[font-weight:800] tw:[&.dont::after]:w-[20px]
        tw:[&.dont::after]:h-[20px] tw:[&.dont::after]:rounded-[999px] tw:[&.dont::after]:inline-flex
        tw:[&.dont::after]:items-center tw:[&.dont::after]:justify-center tw:relative tw:ui-border-default
        tw:[transition:transform_0.2s_ease] tw:[&:hover]:[transform:translateX(4px)]
        tw:[&.do_.action-card\_\_icon]:[color:#10b981] tw:[&.dont_.action-card\_\_icon]:[color:#ef4444]
    `,
    'action-card__icon': String.raw`
        tw:pt-[2px]
    `,
    'action-card__text': String.raw`
        tw:[&_h4]:m-[0_0_0.25rem] tw:[&_h4]:text-[length:0.95rem] tw:[&_h4]:[font-weight:700] tw:[&_h4]:text-main
        tw:[&_h4]:pr-[40px] tw:[&_p]:m-[0] tw:[&_p]:text-[length:0.85rem] tw:[&_p]:text-secondary
        tw:[&_p]:[line-height:1.4]
    `,
} as const;
export function scenarioParts(part: keyof typeof styles) { return cn(part, styles[part]); }
