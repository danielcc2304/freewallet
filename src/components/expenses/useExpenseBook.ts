import { useEffect, useSyncExternalStore } from 'react';
import { useAccount } from '../../context/AccountContext';
import { expenseStore } from '../../services/expenseStore';
import { isNativeFilePickerOpen } from '../../services/nativeFilePicker';
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
                !isNativeFilePickerOpen() &&
                expenseStore.getSnapshot().status === 'ready'
            )
                void expenseStore.load();
        };
        window.addEventListener('focus', refresh);
        window.addEventListener('online', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('online', refresh);
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
