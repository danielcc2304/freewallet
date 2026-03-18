export function readStoredValue(key: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    try {
        return localStorage.getItem(key) || fallback;
    } catch {
        return fallback;
    }
}

export function readStoredMap<T extends string>(key: string): Record<string, T> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) as Record<string, T> : {};
    } catch {
        return {};
    }
}

export function readStoredNumberMap(key: string, fallback: Record<string, number>): Record<string, number> {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? { ...fallback, ...(JSON.parse(raw) as Record<string, number>) } : fallback;
    } catch {
        return fallback;
    }
}
