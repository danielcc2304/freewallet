import { useEffect, useSyncExternalStore } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { expenseStore } from '../../services/expenseStore';
import { hasPendingFinancialChanges } from '../../services/pendingChanges';

/** Mounted for the entire application, including public and account routes. */
export function PendingChangesGuard() {
    useEffect(() => {
        const unload = (event: BeforeUnloadEvent) => {
            if (!hasPendingFinancialChanges()) return;
            event.preventDefault(); event.returnValue = '';
        };
        window.addEventListener('beforeunload', unload);
        return () => window.removeEventListener('beforeunload', unload);
    }, []);
    return null;
}
export function PendingExpenseNotice() {
    const expenses = useSyncExternalStore(expenseStore.subscribe, expenseStore.getSnapshot, expenseStore.getSnapshot);
    const { pathname } = useLocation();
    if (pathname === '/academy/expenses' || !expenseStore.hasPending && expenses.status !== 'saving') return null;
    return <aside className="pending-changes tw:fixed tw:z-[800] tw:bottom-[max(1rem,env(safe-area-inset-bottom))] tw:left-1/2 tw:[transform:translateX(-50%)] tw:ui-row tw:flex-wrap tw:gap-[.4rem_1rem] tw:w-max tw:max-w-[calc(100vw-2rem)] tw:p-[.7rem_1rem] tw:ui-border-default tw:rounded-[12px] tw:ui-fill-surface tw:text-main tw:shadow-ui-md tw:text-[.9rem]" role="status">
        <span>Hay gastos pendientes de guardar.</span>
        <Link className="tw:inline-flex tw:items-center tw:min-h-[44px] tw:text-accent tw:font-bold tw:focus-visible:[outline:2px_solid_var(--accent-primary)] tw:focus-visible:outline-offset-[3px]" to="/academy/expenses">Revisar o exportar</Link>
    </aside>;
}
