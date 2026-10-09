import { useEffect, useSyncExternalStore } from 'react';
import { useAccount } from '../../context/AccountContext';
import { expenseStore } from '../../services/expenseStore';
export function useExpenseBook() {
    const { user, enabled } = useAccount();
    const owner = enabled ? (user?.id ?? null) : null;
    const snapshot = useSyncExternalStore(
        expenseStore.subscribe,
        expenseStore.getSnapshot,
        expenseStore.getSnapshot,
    );
    useEffect(() => {
        void expenseStore.select(owner);
    }, [owner]);
    useEffect(() => {
        const refresh = () => {
            if (
                document.visibilityState === 'visible' &&
                navigator.onLine &&
                !document.activeElement?.matches('input,select,textarea') &&
                !document.querySelector('[role=dialog]') &&
                expenseStore.getSnapshot().status === 'ready'
            )
                void expenseStore.load();
        };
        const unload = (event: BeforeUnloadEvent) => {
            if (
                expenseStore.hasPending ||
                expenseStore.getSnapshot().status === 'saving'
            ) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('focus', refresh);
        window.addEventListener('online', refresh);
        window.addEventListener('beforeunload', unload);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('online', refresh);
            window.removeEventListener('beforeunload', unload);
        };
    }, []);
    return {
        ...snapshot,
        status:
            snapshot.owner !== owner ? ('loading' as const) : snapshot.status,
        book: snapshot.owner !== owner ? null : snapshot.book,
        store: expenseStore,
    };
}
