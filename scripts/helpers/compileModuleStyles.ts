import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compile } from 'tailwindcss';

const require = createRequire(import.meta.url);
const cache = new Map<string, Promise<string>>();

/** Structural style checks inspect the generated CSS, independent of @apply spelling. */
export function compileModuleStyles(file: string, candidates: readonly string[] = []): Promise<string> {
    const key = JSON.stringify([file, candidates]);
    if (!cache.has(key))
        cache.set(
            key,
            (async () => {
                const filename = fileURLToPath(new URL('../../' + file, import.meta.url));
                const compiler = await compile(await readFile(filename, 'utf8'), {
                    base: dirname(filename),
                    polyfills: 0,
                    loadStylesheet: async (id, base) => {
                        const path = id.startsWith('.') ? resolve(base, id) : require.resolve(id, { paths: [base] });
                        return { path, base: dirname(path), content: await readFile(path, 'utf8') };
                    },
                });
                return compiler.build([...candidates]);
            })(),
        );
    return cache.get(key)!;
}

/** Inspect generated utilities, including nested variant selectors. */
export async function recipeDeclarations(classes: string) {
    const { default: postcss } = await import('postcss');
    const css = await compileModuleStyles('src/styles/tailwind.css', classes.split(/\s+/).filter(Boolean));
    const declarations: { context: string; property: string; value: string }[] = [];
    postcss.parse(css).walkDecls((decl) => {
        let context = '';
        let parent = decl.parent;
        while (parent) {
            if (parent.type === 'rule') context += parent.selector.replace(/\\/g, '') + ' ';
            parent = parent.parent;
        }
        declarations.push({ context, property: decl.prop, value: decl.value });
    });
    return declarations;
}
