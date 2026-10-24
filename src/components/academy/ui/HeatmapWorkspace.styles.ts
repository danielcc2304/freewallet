import { cn } from '../../../utils/cn';

const styles = {
    'market-heatmap__workspace': String.raw`
        tw:min-w-[0] tw:p-[clamp(1rem,_2.4vw,_1.75rem)] tw:ui-border tw:rounded-[18px] tw:ui-fill-surface
        tw:[@media(max-width:520px)]:p-[0.8rem] tw:[@media(max-width:520px)]:rounded-[14px]
    `,
    'market-heatmap__toolbar': String.raw`
        tw:ui-row tw:justify-between tw:gap-[1rem] tw:items-end tw:mb-[1.5rem]
        tw:[@media(max-width:820px)]:items-stretch tw:[@media(max-width:820px)]:flex-col
    `,
    'market-heatmap__toolbar-label': String.raw`
        tw:block tw:mb-[0.45rem] tw:text-muted tw:text-[length:var(--font-size-xs)] tw:[font-weight:700]
        tw:[letter-spacing:0.07em] tw:[text-transform:uppercase]
        tw:[.market-heatmap\_\_sector-summary-header_&]:mb-[0.25rem]
    `,
    'market-heatmap__metrics': String.raw`
        tw:grid tw:grid-cols-[1.35fr_repeat(3,_1fr)] tw:m-[1rem_0] tw:[border-block:1px_solid_var(--border-primary)]
        tw:[@media(max-width:820px)]:grid-cols-[repeat(2,_1fr)] tw:[@media(max-width:520px)]:[&&]:grid-cols-[1fr_1fr]
    `,
    'market-heatmap__metric': String.raw`
        tw:[&_+_.market-heatmap\_\_metric]:[border-left:1px_solid_var(--border-primary)]
        tw:[@media(max-width:820px)]:[&:nth-child(3)]:[border-left:0]
        tw:[@media(max-width:820px)]:[&:nth-child(n_+_3)]:[border-top:1px_solid_var(--border-primary)]
        tw:[@media(max-width:520px)]:p-[0.7rem]
        tw:[@media(max-width:520px)]:[&_strong]:text-[length:var(--font-size-base)]
    `,
    'market-heatmap__canvas': String.raw`
        tw:relative tw:w-full tw:h-[clamp(600px,_68vw,_800px)] tw:min-w-[0] tw:overflow-hidden tw:ui-border
        tw:rounded-[12px] tw:[background:#111827] tw:[&_.recharts-wrapper]:[outline:none] tw:[&_svg]:[outline:none]
        tw:[@media(max-width:520px)]:h-[580px]
    `,
    'market-heatmap__loading': String.raw`
        tw:absolute tw:inset-[0] tw:ui-stack tw:items-center tw:justify-center tw:gap-[0.75rem] tw:p-[2rem]
        tw:[color:#cbd5e1] tw:text-center
    `,
    'market-heatmap__error': String.raw`
        tw:[&_button]:[border:0] tw:[&_button]:[font-family:inherit] tw:[&_button]:[font-size:inherit]
        tw:[&_button]:[font-weight:inherit] tw:[&_button]:[font-style:inherit] tw:[&_button]:[font-variant:inherit]
        tw:[&_button]:[font-stretch:inherit] tw:[&_button]:[line-height:inherit] tw:[&_button]:cursor-pointer
        tw:[&_button]:[transition:color_var(--transition-fast),_background_var(--transition-fast),_border-color_var(--transition-fast),_transform_var(--transition-fast)]
        tw:absolute tw:inset-[0] tw:ui-stack tw:items-center tw:justify-center tw:gap-[0.75rem] tw:p-[2rem]
        tw:[color:#cbd5e1] tw:text-center tw:[&_svg]:[color:var(--color-warning)] tw:[&_strong]:[color:#f8fafc]
        tw:[&_span]:max-w-[30rem] tw:[&_span]:[color:#cbd5e1] tw:[&_span]:text-[length:var(--font-size-sm)]
        tw:[&_button]:p-[0.65rem_0.9rem] tw:[&_button]:rounded-[8px] tw:[&_button]:[color:#052e21]
        tw:[&_button]:[background:var(--accent-primary)] tw:[&_button]:[font-weight:700]
    `,
    'market-heatmap__completion-status': String.raw`
        tw:m-[-0.25rem_0_0.85rem] tw:text-muted tw:text-[length:var(--font-size-xs)] tw:text-center
    `,
    'market-heatmap__details': String.raw`
        tw:ui-row tw:justify-between tw:gap-[1rem] tw:min-h-[70px] tw:p-[0.85rem_1rem]
        tw:[border-block:1px_solid_var(--border-primary)] tw:[@media(max-width:820px)]:items-stretch
        tw:[@media(max-width:820px)]:flex-col
    `,
    'market-heatmap__selection-hint': String.raw`
        tw:m-[0] tw:text-muted tw:text-[length:var(--font-size-sm)]
    `,
    'market-heatmap__extremes': String.raw`
        tw:grid tw:gap-[0.25rem] tw:text-muted tw:text-[length:var(--font-size-xs)] tw:[&_span]:ui-row
        tw:[&_span]:gap-[0.35rem] tw:[&_strong]:text-secondary
    `,
    'market-heatmap__sector-summary': String.raw`
        tw:m-[1.25rem_0_0] tw:p-[1rem_clamp(0.75rem,_1.8vw,_1.25rem)] tw:ui-border tw:rounded-[14px]
    `,
    'market-heatmap__sector-summary-header': String.raw`
        tw:flex tw:items-end tw:justify-between tw:gap-[1rem] tw:mb-[0.75rem] tw:[&_p]:m-[0] tw:[&_p]:text-muted
        tw:[&_p]:text-[length:var(--font-size-xs)] tw:[&_>_span]:flex-[0_0_auto] tw:[&_>_span]:text-muted
        tw:[&_>_span]:text-[length:var(--font-size-xs)] tw:[&_>_span]:[font-weight:600]
        tw:[@media(max-width:820px)]:items-stretch tw:[@media(max-width:820px)]:flex-col
    `,
    'market-heatmap__sector-list': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(180px,_1fr))] tw:gap-[0.45rem]
        tw:[@media(max-width:820px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
        tw:[@media(max-width:520px)]:[&&]:grid-cols-[1fr]
    `,
    'market-heatmap__footer': String.raw`
        tw:ui-row tw:justify-between tw:gap-[1rem] tw:[&_>_div]:ui-row tw:[&_>_div]:justify-between
        tw:[&_>_div]:gap-[1rem] tw:items-start tw:mt-[1rem] tw:[&_p]:max-w-[680px] tw:[&_p]:m-[0]
        tw:[&_p]:text-muted tw:[&_p]:text-[length:var(--font-size-xs)] tw:[&_p]:[line-height:1.55]
        tw:[&_>_div]:flex-wrap tw:[&_>_div]:justify-end tw:[&_>_div]:text-muted
        tw:[&_>_div]:text-[length:var(--font-size-xs)] tw:[&_a]:inline-flex tw:[&_a]:items-center
        tw:[&_a]:gap-[0.25rem] tw:[@media(max-width:820px)]:items-stretch tw:[@media(max-width:820px)]:flex-col
        tw:[@media(max-width:820px)]:[&_>_div]:justify-start
    `,
    'market-heatmap__floating-actions': String.raw`
        tw:fixed tw:right-[max(1.25rem,_env(safe-area-inset-right))]
        tw:bottom-[max(1.25rem,_env(safe-area-inset-bottom))] tw:z-[900] tw:ui-stack tw:items-center
        tw:gap-[0.65rem] tw:[@media(max-width:520px)]:right-[max(0.85rem,_env(safe-area-inset-right))]
        tw:[@media(max-width:520px)]:bottom-[max(0.85rem,_env(safe-area-inset-bottom))]
    `,
    'market-heatmap__floating-refresh': String.raw`
        tw:w-[2.8rem] tw:h-[2.8rem] tw:p-[0] tw:rounded-[999px] tw:ui-fill-surface
        tw:[box-shadow:0_10px_28px_rgba(0,_0,_0,_0.2)] tw:[&:hover:not(:disabled)]:[transform:translateY(-2px)]
    `,
} as const;
export function heatmapWorkspaceStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
