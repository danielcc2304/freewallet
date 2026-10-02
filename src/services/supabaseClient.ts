import type { SupabaseClient } from '@supabase/supabase-js';
import { publicSupabaseConfig } from './supabaseConfig';

export const appBackendConfig = publicSupabaseConfig(import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY);
const config=appBackendConfig;
export const isAppBackendConfigured = config !== null;
let clientPromise: Promise<SupabaseClient> | undefined;

/** One Auth client; keep the existing key so editorial sessions are not discarded. */
export async function getAppSupabaseClient(): Promise<SupabaseClient> {
    if (!config) throw new Error('Configura la URL de Supabase y una clave publicable válida.');
    clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(config.url, config.key, {
        auth: { storageKey: 'freewallet-news-auth', autoRefreshToken: true, detectSessionInUrl: true, persistSession: true },
    })).catch(error => { clientPromise = undefined; throw error; });
    return clientPromise;
}
