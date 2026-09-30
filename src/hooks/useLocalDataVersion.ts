import { useSyncExternalStore } from 'react';

let revision = 0;
const listeners = new Set<() => void>();
function notify() { revision++; listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) {
    if (!listeners.size) {
        window.addEventListener('storage', notify);
        window.addEventListener('freewallet-data-change', notify);
    }
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
        if (!listeners.size) {
            window.removeEventListener('storage', notify);
            window.removeEventListener('freewallet-data-change', notify);
        }
    };
}
/** Storage events cover other tabs; the app event covers writes in this tab. */
export function useLocalDataVersion() { return useSyncExternalStore(subscribe, () => revision, () => 0); }
export function notifyLocalDataChange() { window.dispatchEvent(new Event('freewallet-data-change')); }
