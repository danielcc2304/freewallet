import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';

const smoke = process.argv.includes('--smoke');
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7);
// The all-route audit checks the deployed CSS. Interactive suites retain Vite
// dev because their fixtures also import source services explicitly.
const preview = smoke && only === 'test-tailwind-modules-ui.ts' && process.env.FREEWALLET_VISUAL_PHASE !== 'before';
const output = resolve('test-results', (smoke ? 'smoke' : 'unit') + (only ? '-focused' : ''));
mkdirSync(output, { recursive: true });
const smokeTests = [
    'test-tailwind-foundation-ui.ts',
    'test-mfa-disable-ui.ts', 'test-academy-account-polish.ts',
    'test-account-feedback.ts',
    'test-application-audit-ui.ts', 'test-account-usernames-ui.ts',
    'test-dashboard-quality-ui.ts', 'test-live-market-quotes-ui.ts', 'test-bond-calculator-ui.ts',
    'test-expense-ui.ts', 'test-salary-calculator-ui.ts', 'test-fund-radar-ui.ts',
    'test-fund-chart-ui.ts',
    'test-news-layout-comments-ui.ts', 'test-news-article-editor-ui.ts', 'test-portfolio-ui.ts',
];
const available = smoke ? (only ? [...smokeTests, 'test-tailwind-modules-ui.ts'] : smokeTests) : readdirSync('scripts').filter(name =>
    /^test-.*\.(ts|mjs)$/.test(name) && name !== 'test-dashboard-bundle.ts' && !name.endsWith('-ui.ts') && !readFileSync(join('scripts', name), 'utf8').includes("from 'puppeteer'"),
).sort();
const files = only ? available.filter(name => name === only) : available;
if (!files.length) throw new Error('Unknown test: ' + only);
const results = [];
const children = new Set();
const separateGroups = process.platform !== 'win32';
function stop(child) {
    try { separateGroups ? process.kill(-child.pid, 'SIGKILL') : child.kill('SIGKILL'); } catch { /* Already stopped. */ }
}
let server;
let serverLog = '';
const env = { ...process.env };

async function run(name, command, args) {
    const started = Date.now();
    const result = await new Promise(resolve => {
        const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'], detached: separateGroups });
        children.add(child);
        let log = '', timedOut = false;
        child.stdout.on('data', data => { log += data; });
        child.stderr.on('data', data => { log += data; });
        const timeout = setTimeout(() => { timedOut = true; stop(child); }, smoke ? (name === 'test-tailwind-modules-ui.ts' ? 1200000 : 420000) : 180000);
        child.on('error', error => { log += String(error); });
        child.on('close', code => {
            clearTimeout(timeout);
            children.delete(child);
            writeFileSync(join(output, name + '.log'), log);
            resolve({ name, passed: code === 0 && !timedOut, code, timedOut, seconds: (Date.now() - started) / 1000, log });
        });
    });
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${name} (${result.seconds.toFixed(1)}s)`);
    if (!result.passed) console.error(result.log.slice(-7000));
    const { log: _log, ...summary } = result;
    results.push(summary);
    writeFileSync(join(output, 'results.json'), JSON.stringify(results, null, 2));
}

try {
    if (smoke) {
        // Always start an isolated dev server: no production credentials or real API calls.
        const socket = createServer();
        await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
        const port = socket.address().port;
        await new Promise(resolve => socket.close(resolve));
        env.FREEWALLET_TEST_URL = `http://127.0.0.1:${port}`;
        env.VITE_SUPABASE_URL = 'https://fixture.supabase.co';
        env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_synthetic_fixture';
        env.VITE_SUPABASE_ANON_KEY = '';
        env.VITE_PORTFOLIO_CLOUD_ENABLED = 'true';
        server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...(preview ? ['preview'] : []), '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { env, stdio: ['ignore', 'pipe', 'pipe'], detached: separateGroups });
        children.add(server);
        server.stdout.on('data', data => { serverLog += data; });
        server.stderr.on('data', data => { serverLog += data; });
        for (let attempt = 0; ; attempt++) {
            try { if ((await fetch(env.FREEWALLET_TEST_URL)).ok) break; } catch { /* Starting. */ }
            if (attempt >= 100 || server.exitCode !== null) throw new Error('Test server failed to start: ' + serverLog);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        if (!preview) {
            // Do not charge cold dependency/CSS compilation to a browser's
            // navigation deadline. No app code executes during these requests.
            await Promise.all(['/src/main.tsx', '/src/styles/tailwind.css'].map(async resource => {
                const response = await fetch(env.FREEWALLET_TEST_URL + resource, { signal: AbortSignal.timeout(120000) });
                if (!response.ok) throw new Error('Test compiler failed for ' + resource + ': ' + await response.text());
                await response.arrayBuffer();
            }));
        }
    } else {
        await run('verify-coreweave-independent', 'python3', ['scripts/verify-coreweave-bond.py', '--check']);
    }
    // Browser scripts are sequential; two independent database/unit workers bound memory use.
    // The FT proxy test starts Vite and a local upstream; keep its server work outside concurrent workers.
    const isolated = smoke ? [] : files.filter(name => name === 'test-fund-history-proxy.ts');
    for (const file of isolated)
        await run(file, process.execPath, file.endsWith('.ts') ? ['--import', 'tsx', join('scripts', file)] : [join('scripts', file)]);
    const queue = files.filter(name => !isolated.includes(name));
    await Promise.all(Array.from({ length: smoke ? 1 : 2 }, async () => {
        while (queue.length) {
            const file = queue.shift();
            await run(file, process.execPath, file.endsWith('.ts') ? ['--import', 'tsx', join('scripts', file)] : [join('scripts', file)]);
        }
    }));
} finally {
    for (const child of children) stop(child);
    if (smoke) writeFileSync(join(output, 'server.log'), serverLog);
}
const failures = results.filter(result => !result.passed);
console.log(`${results.length - failures.length}/${results.length} checks passed. Logs: ${output}`);
process.exitCode = failures.length ? 1 : 0;
