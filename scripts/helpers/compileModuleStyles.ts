import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compile } from 'tailwindcss';

const require = createRequire(import.meta.url);
const cache = new Map<string, Promise<string>>();

/** Structural style checks inspect the generated CSS, independent of @apply spelling. */
export function compileModuleStyles(file: string): Promise<string> {
    if (!cache.has(file)) cache.set(file, (async () => {
        const filename = fileURLToPath(new URL('../../' + file, import.meta.url));
        const compiler = await compile(await readFile(filename, 'utf8'), {
            base: dirname(filename),
            polyfills: 0,
            loadStylesheet: async (id, base) => {
                const path = id.startsWith('.') ? resolve(base, id) : require.resolve(id, { paths: [base] });
                return { path, base: dirname(path), content: await readFile(path, 'utf8') };
            },
        });
        return compiler.build([]);
    })());
    return cache.get(file)!;
}
