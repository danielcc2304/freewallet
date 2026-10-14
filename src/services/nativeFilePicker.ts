let resetTimer: number | undefined;

/** Keep focus-triggered cloud refreshes from remounting the page while a native file picker is active. */
export function markNativeFilePickerOpen() {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.freewalletFilePickerOpen = 'true';
    if (resetTimer !== undefined) window.clearTimeout(resetTimer);
    // Fallback for browsers that do not dispatch the file input's cancel event.
    resetTimer = window.setTimeout(finishNativeFilePicker, 5 * 60 * 1000);
}

export function finishNativeFilePicker() {
    if (typeof document !== 'undefined')
        delete document.documentElement.dataset.freewalletFilePickerOpen;
    if (resetTimer !== undefined && typeof window !== 'undefined') {
        window.clearTimeout(resetTimer);
        resetTimer = undefined;
    }
}

export function isNativeFilePickerOpen() {
    return (
        typeof document !== 'undefined' &&
        document.documentElement.dataset.freewalletFilePickerOpen === 'true'
    );
}
