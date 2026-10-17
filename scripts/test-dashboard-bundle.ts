import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';

const dist = resolve('dist');
const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
const entry = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1];
assert.ok(entry, 'Build must expose the application entry');
const startup = new Set<string>();
function visit(path: string) {
    if (startup.has(path)) return;
    startup.add(path);
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
    source.statements.forEach(statement => {
        if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
            const specifier = statement.moduleSpecifier.text;
            if (specifier.startsWith('.')) visit(resolve(dirname(path), specifier));
        }
    });
}
const entryPath = resolve(dist, entry.replace(/^\//, ''));
visit(entryPath);
for (const preload of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) visit(resolve(dist, preload[1].replace(/^\//, '')));
const sdkChunks = readdirSync(resolve(dist, 'assets')).filter(name => name.endsWith('.js') && readFileSync(resolve(dist, 'assets', name), 'utf8').includes('supabaseUrl is required'));
assert.ok(sdkChunks.length > 0, 'Editorial SDK remains available on demand');
assert.ok(sdkChunks.every(name => !startup.has(resolve(dist, 'assets', name))), 'Editorial SDK must not be an initial import or preload');
const app = readFileSync(resolve('src/App.tsx'), 'utf8');
assert.match(app, /\blazy\s*\(/, 'Screens load on demand while the shell remains available');
const academy = readFileSync(resolve('src/app/routes/academyRoutes.tsx'), 'utf8');
assert.match(academy, /const SalaryCalculator = lazy\(/);
const salaryChunks = readdirSync(resolve(dist, 'assets')).filter(name => /^SalaryCalculator-.*\.js$/.test(name));
assert.equal(salaryChunks.length, 1, 'The salary calculator has a separate chunk');
assert.ok(!startup.has(resolve(dist, 'assets', salaryChunks[0])), 'Unvisited calculators do not enter startup');
const startupBytes = [...startup].reduce((total, file) => total + statSync(file).size, 0);
assert.ok(startupBytes < 700000, `Startup JS grew to ${startupBytes} bytes`);
console.log(`Dashboard build passed: editorial SDK and calculators outside startup, lazy screens, initial JS ${(startupBytes / 1000).toFixed(2)} kB.`);
