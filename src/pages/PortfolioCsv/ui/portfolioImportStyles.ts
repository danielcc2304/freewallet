import { cn } from '../../../utils/cn';

const styles = {
    'portfolio-csv-chart': String.raw`
        tw:w-full tw:h-[320px] tw:[&_.recharts-default-legend]:[margin:0]!
        tw:[&_.recharts-default-legend]:[padding:0.45rem_0]! tw:[@media(max-width:700px)]:h-[276px]
        tw:[@media(max-width:700px)]:[&_.recharts-responsive-container]:[margin:0]!
    `,
    'portfolio-csv-chart--composition': String.raw`
        tw:[&.portfolio-csv-chart--composition]:mb-[0.55rem]
    `,
    'portfolio-csv-chart--benchmark': String.raw`
        tw:[&.portfolio-csv-chart--benchmark]:h-[330px]
        tw:[@media(max-width:700px)]:[&.portfolio-csv-chart--benchmark]:h-[360px]
    `,
    'portfolio-csv-chart--risk-map': String.raw`
        tw:[@media(max-width:700px)]:[&.portfolio-csv-chart--risk-map]:ml-[0]
    `,
    'portfolio-csv-notice': String.raw`
        tw:ui-stack tw:items-center tw:gap-[1rem] tw:p-[.5rem_0] tw:text-secondary tw:text-center
        tw:[line-height:1.65] tw:wrap-anywhere tw:[&_h2]:m-[0] tw:[&_h2]:text-[length:clamp(1.35rem,_4vw,_1.85rem)]
        tw:[&_h2]:[line-height:1.25] tw:[&_h2]:[font-weight:800] tw:[&_h2]:text-main tw:[&_p]:max-w-[430px]
        tw:[&_p]:m-[0] tw:[&_p]:text-[length:1rem] tw:[&_strong]:text-main tw:[&_strong]:[font-weight:600]
        tw:[&_.portfolio-csv-notice\_\_note]:text-[length:.85rem] tw:[@media(max-width:480px)]:[&&]:gap-[.85rem]
        tw:[@media(max-width:480px)]:[&&_p]:text-[length:.9rem]
        tw:[@media(max-width:480px)]:[&&_.portfolio-csv-notice\_\_note]:text-[length:.8rem]
    `,
    'portfolio-csv-notice__icon': String.raw`
        tw:grid tw:place-items-center tw:w-[96px] tw:h-[96px] tw:rounded-[50%] tw:text-accent
        tw:[background:rgba(var(--accent-rgb),_.1)] tw:[border:1px_solid_rgba(var(--accent-rgb),_.18)]
        tw:[@media(max-width:480px)]:[&&]:w-[72px] tw:[@media(max-width:480px)]:[&&]:h-[72px]
        tw:[@media(max-width:480px)]:[&&_svg]:w-[34px] tw:[@media(max-width:480px)]:[&&_svg]:h-[34px]
    `,
    'portfolio-csv-notice__note': String.raw``,
    'portfolio-csv-notice__dashboard': String.raw`
        tw:inline-flex tw:items-center tw:justify-center tw:gap-[.65rem] tw:min-h-[48px] tw:w-full
        tw:p-[.75rem_1rem] tw:ui-border-default tw:rounded-[12px] tw:ui-fill-muted tw:text-main
        tw:[text-decoration:none] tw:[font-weight:600] tw:[&_svg]:shrink-[0]
        tw:[&:hover]:[border-color:var(--accent-primary)]
        tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&:focus-visible]:[outline-offset:3px]
    `,
} as const;
export function portfolioImportStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
