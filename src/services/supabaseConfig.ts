/** Public-key classification only; this does not verify JWT signatures. */
export function isPublicSupabaseKey(key: string): boolean {
    if (key.startsWith('sb_publishable_')) return true;
    try {
        const parts = key.split('.');
        if (parts.length !== 3) return false;
        const payload: unknown = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return typeof payload === 'object' && payload !== null && 'role' in payload && payload.role === 'anon';
    } catch { return false; }
}

/** Called by Vite BEFORE environment values can be emitted into browser bundles. */
export function assertPublicSupabaseEnvironment(env: Record<string, string | undefined>) {
    for (const [name, value] of Object.entries(env)) {
        if (!name.startsWith('VITE_') || !name.includes('SUPABASE') || !value?.trim()) continue;
        if (/SECRET|SERVICE_ROLE|PASSWORD|TOKEN/.test(name)) throw new Error('No se permiten secretos Supabase en variables VITE_.');
        if (['VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY'].includes(name)
            && !/sb_publishable_xxx|eyj\.\.\./i.test(value) && !isPublicSupabaseKey(value.trim())) {
            throw new Error('La clave Supabase del frontend debe ser publicable o anon, nunca privada.');
        }
    }
}

/** Reject private keys before any client is created. */
export function publicSupabaseConfig(url?: string, key?: string): { url: string; key: string } | null {
    const normalizedKey = key?.trim();
    if (!url || !normalizedKey || /tu-proyecto|sb_publishable_xxx|eyj\.\.\./i.test(url + normalizedKey)) return null;
    try {
        const parsed = new URL(url.trim());
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
        if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) return null;
        if (parsed.username || parsed.password || parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) return null;
        if (!isPublicSupabaseKey(normalizedKey)) return null;
        return { url: parsed.origin, key: normalizedKey };
    } catch { return null; }
}
