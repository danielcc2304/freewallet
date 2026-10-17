import { useEffect, useSyncExternalStore } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { expenseStore } from '../../services/expenseStore';
import { hasPendingFinancialChanges } from '../../services/pendingChanges';
import './PendingChangesGuard.css';

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
    return <aside className="pending-changes" role="status">
        <span>Hay gastos pendientes de guardar.</span>
        <Link to="/academy/expenses">Revisar o exportar</Link>
    </aside>;
}
