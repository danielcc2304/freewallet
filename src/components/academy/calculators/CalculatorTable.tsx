import type { ReactNode } from 'react';

/** Shared table structure; statistics fit mobile, payroll keeps native scrolling. */
export function CalculatorTable({ appearance, children }: { appearance: 'statistics' | 'compact'; children: ReactNode }) {
    const statistics = appearance === 'statistics';
    return <div className={statistics ? 'fund-info__table-wrapper tw:overflow-x-auto tw:[@media(max-width:640px)]:overflow-x-clip' : 'salary-calc__table-wrap tw:w-full tw:overflow-x-auto'}>
        <table className={statistics
            ? 'fund-info__stats-table tw:w-full tw:min-w-[560px] tw:border-collapse tw:text-secondary tw:text-[length:var(--font-size-sm)] tw:[&_:is(th,td)]:p-[.8rem_var(--spacing-sm)] tw:[&_:is(th,td)]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_:is(th,td)]:text-right tw:[&_:is(th,td)]:whitespace-nowrap tw:[&_:is(th,td):first-child]:text-left tw:[&_thead_th]:text-muted tw:[&_thead_th]:text-[length:var(--font-size-xs)] tw:[&_thead_th]:uppercase tw:[&_thead_th]:tracking-[.03em] tw:[&_tbody_th]:text-main tw:[&_tbody_th]:font-semibold tw:[&_tbody_td]:text-accent tw:[&_tbody_td]:font-bold tw:[@media(max-width:640px)]:min-w-0 tw:[@media(max-width:640px)]:table-fixed tw:[@media(max-width:640px)]:text-[length:var(--font-size-xs)] tw:[@media(max-width:640px)]:[&_:is(th,td)]:p-[.65rem_.25rem] tw:[@media(max-width:640px)]:[&_:is(th,td)]:whitespace-normal tw:[@media(max-width:640px)]:[&_:is(th,td)]:wrap-anywhere tw:[@media(max-width:640px)]:[&_:is(th,td):first-child]:w-[32%]'
            : 'tw:w-full tw:border-collapse tw:text-[.77rem] tw:[&_:is(th,td)]:p-[.65rem_.45rem] tw:[&_:is(th,td)]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_:is(th,td)]:text-right tw:[&_:is(th,td)]:whitespace-nowrap tw:[&_:is(th,td):first-child]:text-left tw:[&_th]:font-[650] tw:[&_th]:text-secondary'}>{children}</table>
    </div>;
}
