import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

const appearances = {
    statistics: { wrapper: "fund-info__table-wrapper tw:overflow-x-auto tw:[@media(max-width:640px)]:overflow-x-clip", table: "fund-info__stats-table tw:w-full tw:min-w-[560px] tw:border-collapse tw:text-secondary tw:text-[length:var(--font-size-sm)] tw:[&_:is(th,td)]:p-[.8rem_var(--spacing-sm)] tw:[&_:is(th,td)]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_:is(th,td)]:text-right tw:[&_:is(th,td)]:whitespace-nowrap tw:[&_:is(th,td):first-child]:text-left tw:[&_thead_th]:text-muted tw:[&_thead_th]:text-[length:var(--font-size-xs)] tw:[&_thead_th]:uppercase tw:[&_thead_th]:tracking-[.03em] tw:[&_tbody_th]:text-main tw:[&_tbody_th]:font-semibold tw:[&_tbody_td]:text-accent tw:[&_tbody_td]:font-bold tw:[@media(max-width:640px)]:min-w-0 tw:[@media(max-width:640px)]:table-fixed tw:[@media(max-width:640px)]:text-[length:var(--font-size-xs)] tw:[@media(max-width:640px)]:[&_:is(th,td)]:p-[.65rem_.25rem] tw:[@media(max-width:640px)]:[&_:is(th,td)]:whitespace-normal tw:[@media(max-width:640px)]:[&_:is(th,td)]:wrap-anywhere tw:[@media(max-width:640px)]:[&_:is(th,td):first-child]:w-[32%]" },
    compact: { wrapper: "salary-calc__table-wrap tw:w-full tw:overflow-x-auto", table: "tw:w-full tw:border-collapse tw:text-[.77rem] tw:[&_:is(th,td)]:p-[.65rem_.45rem] tw:[&_:is(th,td)]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_:is(th,td)]:text-right tw:[&_:is(th,td)]:whitespace-nowrap tw:[&_:is(th,td):first-child]:text-left tw:[&_th]:font-[650] tw:[&_th]:text-secondary" },
    expenses: { wrapper: "expense-table-scroll tw:w-full tw:overflow-x-auto tw:[scrollbar-width:thin]", table: "expense-table tw:w-full tw:border-collapse tw:text-[.8rem] tw:[&_th]:text-secondary tw:[&_th]:font-medium tw:[&_th]:text-[.74rem] tw:[&_th]:p-[.8rem_.6rem] tw:[&_th]:text-left tw:[&_th]:[border-bottom:1px_solid_var(--border-secondary)] tw:[&_th]:whitespace-nowrap tw:[&_td]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_td]:p-[1rem_.6rem] tw:[&_td]:text-left tw:[&_td:first-child]:min-w-[200px] tw:[&_td:first-child]:max-w-[350px] tw:[&_td:first-child]:wrap-anywhere tw:[&_td:nth-child(5)]:whitespace-nowrap tw:[&_td:nth-child(5)]:font-[650] tw:[&_small]:block tw:[&_small]:text-secondary tw:[&_small]:text-[.72rem] tw:[&_small]:leading-[1.5] tw:[&_small]:mt-[.2rem]" },
};
interface DataTableProps extends HTMLAttributes<HTMLDivElement> {
    appearance: keyof typeof appearances;
    tableClassName?: string;
    children: ReactNode;
}

/** Native table structure shared across tools; column content and formatting stay with callers. */
export function DataTable({ appearance, children, className, tableClassName, ...props }: DataTableProps) {
    const styles = appearances[appearance];
    return <div {...props} className={cn(styles.wrapper, className)}>
        <table className={cn(styles.table, tableClassName)}>{children}</table>
    </div>;
}
