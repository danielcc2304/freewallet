import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import axios from 'axios';
import { createServer, resolveConfig, type ProxyOptions } from 'vite';
import { getFinancialTimesFundHistory } from '../src/services/funds/fundHistory';
import { readFinancialTimesIdentity } from '../supabase/functions/_shared/financialTimesHistory';

// Reproduce FT's real relative redirect. A mocked 200 at the original URL hid
// the bug: /data/... was falling through to FreeWallet's SPA on Vercel.
const canonicalPath = '/data/funds/tearsheet/summary';
const proxyPath = '/__market/ft/funds/tearsheet/summary';
const classes = new Map([
    ['LU0329355670', { currency: 'EUR', symbol: '535675774', name: 'Robeco QI Emerging Markets Active Equities D €' }],
    ['LU0000000001', { currency: 'USD', symbol: '42', name: 'Synthetic Fund USD' }],
    ['LU0000000002', { currency: 'GBP', symbol: '43', name: 'Synthetic Fund GBP' }],
]);
const upstreamRequests: string[] = [];
const upstream = createHttpServer((request, response) => {
    const url = new URL(request.url!, 'http://provider.test');
    upstreamRequests.push(request.url!);
    if (url.pathname === canonicalPath) {
        const [isin, currency] = (url.searchParams.get('s') ?? '').split(':');
        const fund = classes.get(isin);
        if (fund && !currency) {
            response.writeHead(302, { Location: `${canonicalPath}?s=${isin}:${fund.currency}` });
            response.end();
            return;
        }
        if (fund && currency === fund.currency) {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(`<h1>${fund.name}</h1><div data-mod-config='${JSON.stringify({ symbol: `${isin}:${currency}`, xid: fund.symbol, assetClass: 'Fund' })}'></div>`);
            return;
        }
    }
    if (request.method === 'POST' && url.pathname === '/data/chartapi/series') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(readFileSync('scripts/fixtures/fund-history/robeco-ft.json'));
        return;
    }
    response.writeHead(404).end();
});
upstream.listen(0, '127.0.0.1');
await once(upstream, 'listening');
const upstreamOrigin = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;
const previousBase = axios.defaults.baseURL;
let server: Awaited<ReturnType<typeof createServer>> | undefined;
try {
    const config = await resolveConfig({}, 'serve', 'test');
    const proxy = Object.fromEntries(Object.entries(config.server.proxy ?? {}).map(([path, value]) => [
        path, { ...(value as ProxyOptions), target: upstreamOrigin, agent: undefined },
    ]));
    // Exercise the real Vite proxy definitions with an isolated local provider.
    // No credentials, external provider calls or development server are reused.
    server = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent',
        server: { host: '127.0.0.1', port: 0, proxy },
        optimizeDeps: { noDiscovery: true, include: [] },
    });
    await server.listen();
    const origin = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}`;
    axios.defaults.baseURL = origin;
    for (const [isin, fund] of classes) {
        const response = await axios.get(proxyPath, { params: { s: isin }, timeout: 5000, proxy: false });
        const identity = readFinancialTimesIdentity(response.data, isin);
        assert.equal(identity.currency, fund.currency, 'Keep FT’s resolved native currency, never force EUR');
        assert.equal(identity.symbol, fund.symbol);
        assert(upstreamRequests.includes(`${canonicalPath}?s=${isin}:${fund.currency}`), 'The redirected query must reach FT unchanged');
    }
    const rows = await getFinancialTimesFundHistory('LU0329355670', '3M', new AbortController().signal, {
        startDate: Date.UTC(2026, 6, 18), endDate: Date.UTC(2026, 9, 18), forceRefresh: true,
    });
    assert.equal(rows.length, 29);
    assert.equal(rows.at(-1)?.close, 399.92);
    assert.equal(rows.at(-1)?.date, '2026-10-15');
    assert(rows.every(row => row.currency === 'EUR' && row.source === 'Financial Times'));

    const { routes } = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const firstMatch = routes.find((route: { src?: string; handle?: string }) =>
        route.handle === 'filesystem' || (route.src && new RegExp(`^(?:${route.src})$`).test(canonicalPath)));
    assert.equal(firstMatch?.dest, 'https://markets.ft.com/data/funds/tearsheet/summary',
        'Vercel must route the canonical FT endpoint before filesystem/SPA fallback');
    assert(!routes.some((route: { src?: string }) => route.src === '/data/(.*)'),
        'Expose only the required FT endpoint, not a catch-all provider proxy');
    console.log('PASS: actual relative FT 302 through Vite, EUR/USD/GBP identities, Robeco 3M history and matching Vercel route before SPA fallback.');
} finally {
    axios.defaults.baseURL = previousBase;
    await server?.close();
    upstream.closeAllConnections();
    await new Promise<void>((resolve, reject) => upstream.close(error => error ? reject(error) : resolve()));
}
