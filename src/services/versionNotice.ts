export const VERSION_NOTICE_KEY = 'freewallet_last_seen_version';

export function shouldShowVersionNotice(version: string, storage?: Pick<Storage, 'getItem'>): boolean {
    try { return (storage ?? window.localStorage).getItem(VERSION_NOTICE_KEY) !== version; }
    catch { return true; }
}

export function acknowledgeVersion(version: string, storage?: Pick<Storage, 'setItem'>): void {
    try { (storage ?? window.localStorage).setItem(VERSION_NOTICE_KEY, version); }
    catch { /* The notice still closes for this session if storage is unavailable. */ }
}
