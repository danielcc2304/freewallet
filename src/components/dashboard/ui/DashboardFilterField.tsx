import type { ReactNode } from 'react';

/** Shared labelled controls; filtering and option data remain with the table. */
export function DashboardFilterField({ controlId, label, children }: { controlId: string; label: ReactNode; children: ReactNode }) {
    return <div className="tw:flex-[1_1_160px] tw:min-w-0 tw:[&_:is(input,select)]:w-full tw:[&_:is(input,select)]:min-w-0 tw:[&_:is(input,select)]:min-h-[44px] tw:[&_:is(input,select)]:p-[.65rem] tw:[&_:is(input,select)]:ui-border tw:[&_:is(input,select)]:rounded-control tw:[&_:is(input,select)]:text-main tw:[&_:is(input,select)]:ui-fill-surface tw:[&_:is(input,select)]:[font:inherit] tw:[[data-appearance=liquid-glass]_&]:[&_:is(input,select)]:[background:var(--glass-bg,var(--bg-secondary))] tw:[[data-appearance=liquid-glass]_&]:[&_:is(input,select)]:[border-color:var(--glass-border,var(--border-primary))]">
        <label htmlFor={controlId} className="tw:block tw:text-[length:var(--font-size-sm)] tw:text-secondary tw:mb-[.4rem]">{label}</label>{children}
    </div>;
}
