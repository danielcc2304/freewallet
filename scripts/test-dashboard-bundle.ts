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
assert.doesNotMatch(app, /\blazy\s*\(/, 'Do not reintroduce deferred routes');
console.log(`Dashboard build passed: editorial SDK outside startup imports, routes remain eager, entry ${(statSync(entryPath).size / 1000).toFixed(2)} kB.`);
