import { createClient } from 'npm:@supabase/supabase-js@2.112.4';
import { fetchMarketPrice } from './providers.ts';
import type { MarketPrice } from './providers.ts';

const finectKey = Deno.env.get('FINECT_API_KEY') || 'OgcqanUxQ4S6Y5VVvnwlJayUuxeg8Ah5';
Deno.serve(async (request: Request) => {
    if (request.method !== 'POST') return new Response('POST required', { status: 405 });
    const secret = request.headers.get('x-job-secret');
    if (!secret) return new Response('Unauthorized', { status: 401 });
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: run, error } = await client.rpc('begin_daily_market_refresh', { job_secret: secret });
    if (error) return new Response('Unauthorized', { status: 401 });
    if (!run) return Response.json({ status: 'already-running' });
    const prices: MarketPrice[] = [], failures: Array<{ instrument: string; reason: string }> = [];
    const instruments = run.instruments as string[];
    const fxCache = new Map();
    let next = 0;
    const deadline = Date.now() + 110000;
    async function worker() {
        while (next < instruments.length) {
            const instrument = instruments[next++];
            if (Date.now() > deadline) { failures.push({ instrument, reason: 'Tiempo de ejecución agotado' }); continue; }
            try { prices.push(await fetchMarketPrice(instrument, finectKey, fxCache)); }
            catch (error) { failures.push({ instrument, reason: error instanceof Error ? error.message : 'Proveedor no disponible' }); }
        }
    }
    await Promise.all(Array.from({ length: Math.min(4, instruments.length) }, worker));
    const result = await client.rpc('finish_daily_market_refresh', { run_id: run.id, prices, failures });
    if (result.error) {
        console.error('Market batch publication failed', result.error.code);
        return Response.json({ status: 'failed' }, { status: 500 });
    }
    return Response.json({ status: failures.length ? 'partial' : 'success', updated: prices.length, failed: failures.length });
});
