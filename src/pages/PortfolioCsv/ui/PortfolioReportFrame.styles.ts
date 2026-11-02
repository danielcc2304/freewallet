import { cn } from '../../../utils/cn';
const styles = {
    'portfolio-csv-page': String.raw`
        tw:w-full tw:max-w-[none] tw:m-[0_auto] tw:p-[0_0_3.5rem]
        tw:[animation:fadeIn_var(--transition-base)_ease-out]
        tw:[&_.recharts-cartesian-axis-tick-value]:[fill:var(--text-secondary)]!
        tw:[&_.recharts-legend-item-text]:[fill:var(--text-secondary)]!
        tw:[&_.recharts-legend-item-text]:[color:var(--text-secondary)]!
        tw:[&_.recharts-tooltip-label]:[color:var(--text-primary)]!
        tw:[&_.recharts-tooltip-item]:[color:var(--text-secondary)]! tw:[@media(max-width:700px)]:p-[0_0_2.3rem]
    `,
    'portfolio-csv-grid--workbook': String.raw`
        tw:[&.portfolio-csv-grid--workbook]:items-stretch
    `,
    'portfolio-csv-workbook-controls': String.raw`
        tw:grid tw:gap-[0.7rem] tw:mt-[1.1rem]
    `,
    'portfolio-csv-objectives': String.raw`
        tw:grid tw:gap-[0.7rem] tw:mt-[1.1rem]
    `,
    'portfolio-csv-movements__list': String.raw`
        tw:grid tw:gap-[0.7rem] tw:mt-[1.1rem] tw:[&_>_div]:ui-row tw:[&_>_div]:justify-between
        tw:[&_>_div]:gap-[1rem] tw:[&_>_div]:pb-[0.65rem]
        tw:[&_>_div]:[border-bottom:1px_solid_var(--border-secondary)] tw:[&_small]:text-muted tw:[&_span]:grid
        tw:[&_span]:gap-[0.2rem]
    `,
    'portfolio-csv-workbook-control': String.raw`
        tw:ui-row tw:justify-between tw:gap-[1rem] tw:pb-[0.65rem]
        tw:[border-bottom:1px_solid_var(--border-secondary)] tw:[&_span]:text-muted
    `,
    'portfolio-csv-objective': String.raw`
        tw:ui-row tw:justify-between tw:gap-[1rem] tw:pb-[0.65rem]
        tw:[border-bottom:1px_solid_var(--border-secondary)] tw:[&_small]:text-muted tw:[&_>_div]:grid
        tw:[&_>_div]:gap-[0.2rem]
    `,
    'portfolio-csv-workbook-control--ok': String.raw`
        tw:[&.portfolio-csv-workbook-control--ok]:[color:#34d399]
    `,
    'portfolio-csv-value--positive': String.raw`
        tw:[&.portfolio-csv-value--positive]:[color:#34d399]
    `,
    'portfolio-csv-workbook-control--warn': String.raw`
        tw:[&.portfolio-csv-workbook-control--warn]:[color:#f87171]
    `,
    'portfolio-csv-value--negative': String.raw`
        tw:[&.portfolio-csv-value--negative]:[color:#f87171]
    `,
    'portfolio-csv-objectives__total': String.raw`
        tw:flex tw:justify-between tw:pt-[0.25rem]
    `,
    'portfolio-csv-movements__summary': String.raw`
        tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[0.75rem] tw:mt-[1rem]
        tw:[@media(max-width:700px)]:grid-cols-[1fr]
    `,
    'portfolio-csv-upload': String.raw`
        tw:grid tw:grid-cols-[minmax(0,_1fr)] tw:gap-[0.9rem] tw:mb-[1rem]
        tw:[@media(max-width:980px)]:grid-cols-[1fr]
    `,
    'portfolio-csv-error': String.raw`
        tw:inline-flex tw:items-center tw:gap-[0.45rem] tw:p-[0.55rem_0.75rem] tw:rounded-[10px] tw:mb-[1rem]
        tw:[color:#ef4444] tw:[background:rgba(239,_68,_68,_0.08)] tw:[border:1px_solid_rgba(239,_68,_68,_0.35)]
    `,
    'portfolio-csv-kpis': String.raw`
        tw:grid tw:grid-cols-[repeat(6,_minmax(140px,_1fr))] tw:gap-[0.8rem] tw:mb-[1rem]
        tw:[@media(max-width:1180px)]:grid-cols-[repeat(3,_1fr)]
        tw:[@media(max-width:700px)]:grid-cols-[repeat(2,_1fr)]
    `,
    'portfolio-csv-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(280px,_1fr))] tw:gap-[0.9rem] tw:mb-[0.9rem]
        tw:[@media(max-width:980px)]:grid-cols-[1fr]
    `,
    'portfolio-csv-checks': String.raw`
        tw:grid tw:gap-[0.7rem]
    `,
    'portfolio-csv-controls-table': String.raw`
        tw:grid tw:gap-[0.55rem]
    `,
    'portfolio-csv-targets': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[0.75rem]
        tw:[@media(max-width:700px)]:grid-cols-[1fr]
    `,
    'portfolio-csv-plan-table': String.raw`
        tw:grid tw:gap-[0.55rem]
    `,
    'portfolio-csv-advanced': String.raw`
        tw:mb-[0.9rem]
    `,
    'portfolio-csv-advanced__grid': String.raw`
        tw:grid tw:grid-cols-[repeat(4,_minmax(0,_1fr))] tw:gap-[0.65rem]
        tw:[@media(max-width:1180px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
        tw:[@media(max-width:700px)]:grid-cols-[1fr]
    `,
    'portfolio-csv-advanced__daily': String.raw`
        tw:grid tw:grid-cols-[repeat(4,_minmax(0,_1fr))] tw:gap-[0.65rem] tw:mt-[0.65rem] tw:pt-[0.65rem]
        tw:[border-top:1px_solid_var(--border-primary)]
        tw:[@media(max-width:1180px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
        tw:[@media(max-width:700px)]:grid-cols-[1fr]
    `,
    'portfolio-csv-card--wide': String.raw`
        tw:[@media(max-width:980px)]:[&.portfolio-csv-card--wide]:col-[auto]
    `,
    'portfolio-csv-card': String.raw`
        tw:[@media(max-width:700px)]:p-[0.85rem_0.7rem]
    `,
} as const;
export function portfolioReportStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
