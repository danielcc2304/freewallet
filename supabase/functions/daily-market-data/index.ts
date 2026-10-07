import { createClient } from 'npm:@supabase/supabase-js@2.112.4';
import { fetchMarketPrice } from './providers.ts';
import type { MarketPrice, MarketInstrument } from './providers.ts';

const finectKey = Deno.env.get('FINECT_API_KEY') || 'OgcqanUxQ4S6Y5VVvnwlJayUuxeg8Ah5';
Deno.serve(async (request: Request) => {
    if (request.method !== 'POST') return new Response('POST required', { status: 405 });
    const secret = request.headers.get('x-job-secret');
    if (!secret) return new Response('Unauthorized', { status: 401 });
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: run, error } = await client.rpc('begin_daily_market_refresh', { job_secret: secret }).abortSignal(AbortSignal.timeout(10000));
    if (error) return new Response(error.code === '42501' ? 'Unauthorized' : 'Batch unavailable', { status: error.code === '42501' ? 401 : 503 });
    if (!run) return Response.json({ status: 'already-running' });
    const prices: MarketPrice[] = [], failures: Array<{ instrument: string; reason: string }> = [];
    const instruments = run.instrumentsV2 as MarketInstrument[];
    const fxCache = new Map();
    const providerSignal = AbortSignal.timeout(95000);
    let next = 0;
    async function worker() {
        while (next < instruments.length) {
            const instrument = instruments[next++];
            try { prices.push(await fetchMarketPrice(instrument, finectKey, fxCache, providerSignal)); }
            catch (error) { failures.push({ instrument: instrument.instrument, reason: providerSignal.aborted ? 'Tiempo de ejecución agotado' : error instanceof Error ? error.message : 'Proveedor no disponible' }); }
        }
    }
    await Promise.all(Array.from({ length: Math.min(4, instruments.length) }, worker));
    const result = await client.rpc('finish_daily_market_refresh', { run_id: run.id, prices, failures }).abortSignal(AbortSignal.timeout(12000));
    if (result.error) {
        console.error('Market batch publication failed', result.error.code);
        return Response.json({ status: 'failed' }, { status: 503 });
    }
    // Each capture has its own DB transaction and only locks that portfolio.
    // Providers stop early enough to reserve time for publication and captures.
    const portfolioIds = run.portfolioIds as string[];
    const snapshotSignal = AbortSignal.timeout(25000);
    let ownerIndex = 0, captured = 0, skipped = 0;
    async function snapshotWorker() {
        while (ownerIndex < portfolioIds.length && !snapshotSignal.aborted) {
            const owner = portfolioIds[ownerIndex++];
            const capture = await client.rpc('capture_market_snapshot', { run_id: run.id, portfolio_id: owner })
                .abortSignal(AbortSignal.any([snapshotSignal, AbortSignal.timeout(6000)]));
            if (!capture.error && capture.data === 'captured') captured++; else skipped++;
        }
    }
    await Promise.all(Array.from({ length: Math.min(4, portfolioIds.length) }, snapshotWorker));
    skipped += portfolioIds.length - ownerIndex;
    const status = failures.length ? prices.length ? 'partial' : 'failed' : 'success';
    console.info('Market batch completed', JSON.stringify({ runId: run.id, status, updated: prices.length, failed: failures.length, captured, skipped }));
    return Response.json({ status, updated: prices.length, failed: failures.length, captured, skipped }, { status: status === 'failed' ? 503 : 200 });
});
