import type { ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

/** Keep the chart's dimensions while showing its loading state at its centre. */
export function BenchmarkChartFrame({ busy, message, children }: { busy: boolean; message: string; children: ReactNode }) {
    return <div role="region" aria-label="Gráfico comparativo" aria-busy={busy} className="tw:relative tw:min-h-[260px]">
        {busy&&<div role="status" aria-live="polite" className="tw:absolute tw:inset-0 tw:z-10 tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:text-center tw:text-main tw:p-6 tw:rounded-control tw:ui-fill-surface tw:glass:[background:var(--glass-content)]">
            <LoaderCircle size={28} aria-hidden="true" className="tw:animate-spin tw:motion-reduce:animate-none tw:text-accent"/>
            <span>{message}</span>
        </div>}
        <div aria-hidden={busy} className={busy?'tw:invisible':undefined}>{children}</div>
    </div>;
}
