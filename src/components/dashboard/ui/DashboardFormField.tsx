import type { ReactNode } from 'react';

/** Implicit native label for transfer controls and their explanatory hints. */
export function DashboardFormField({ label, children }: { label: ReactNode; children: ReactNode }) {
    return <label className="fund-transfer__field tw:grid tw:gap-[.4rem] tw:text-main tw:font-semibold tw:[&_:is(input,select)]:w-full tw:[&_:is(input,select)]:min-h-[2.75rem] tw:[&_:is(input,select)]:p-[.65rem_.75rem] tw:[&_:is(input,select)]:ui-border-default tw:[&_:is(input,select)]:rounded-control tw:[&_:is(input,select)]:ui-fill-surface tw:[&_:is(input,select)]:text-main tw:[&_:is(input,select)]:[font-family:inherit] tw:[&_:is(input,select)]:[font-size:inherit] tw:[&_:is(input,select)]:[font-style:inherit] tw:[&_:is(input,select)]:[font-variant:inherit] tw:[&_:is(input,select)]:[font-stretch:inherit] tw:[&_:is(input,select)]:[line-height:inherit] tw:[&_:is(input,select)]:font-normal tw:[&_input:disabled]:opacity-[.65] tw:[&_small]:text-secondary tw:[&_small]:text-[.8rem] tw:[&_small]:font-normal tw:[&_small]:leading-[1.45]">
        <span>{label}</span>{children}
    </label>;
}
