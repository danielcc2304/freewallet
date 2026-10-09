import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
import {
    emptyExpenseBook,
    todayLocal,
    shiftMonth,
} from '../src/services/expensePlanner';
import type { ExpenseEntry } from '../src/types/expenses';
const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5255';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const appearance = process.env.FREEWALLET_TEST_APPEARANCE || 'standard';
assert.ok(['standard', 'liquid-glass'].includes(appearance));
const capturePrefix = appearance === 'liquid-glass' ? 'glass-' : '';
const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
});
const errors: string[] = [];
const today = todayLocal();
try {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'reduce' },
    ]);
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1100 });
    await page.evaluateOnNewDocument(
        ({ version, appearance }) => {
            localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
            localStorage.setItem('freewallet_last_seen_version', version);
            if (!localStorage.getItem('freewallet_theme_mode'))
                localStorage.setItem('freewallet_theme_mode', 'dark');
            localStorage.setItem('freewallet_appearance_mode', appearance);
        },
        { version, appearance },
    );
    await page.setRequestInterception(true);
    page.on('request', (r) => {
        const url = new URL(r.url());
        void (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)
            ? r.continue()
            : r.abort());
    });
    await page.goto(`${origin}/academy/expenses`, {
        waitUntil: 'networkidle2',
    });
    await page.waitForSelector('.expense-manager h1');
    const click = async (text: string, selector = 'button') => {
        await page.$$eval(
            selector,
            (nodes, text) => {
                const n = nodes.find((n) => n.textContent?.trim() === text);
                if (!n) throw Error(`Missing ${text}`);
                (n as HTMLElement).click();
            },
            text,
        );
    };
    const fill = async (name: string, value: string) => {
        const selector = `.expense-form [name="${name}"]`;
        if (
            await page.$eval(
                selector,
                (input) => (input as HTMLInputElement).type === 'date',
            )
        ) {
            await page.$eval(
                selector,
                (input, value) => {
                    (input as HTMLInputElement).value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                },
                value,
            );
            return;
        }
        await page.$eval(selector, (input) =>
            (input as HTMLInputElement).select(),
        );
        await page.focus(selector);
        await page.keyboard.press('Backspace');
        if (value) await page.type(selector, value);
    };
    const submit = async () => {
        await page.click('.expense-form button[type=submit]');
        await page.waitForFunction(
            () => !document.querySelector('.expense-form'),
        );
    };
    const data = () =>
        page.evaluate(() =>
            JSON.parse(localStorage.getItem('freewallet_expenses_v1')!),
        );
    const add = async (
        kind: string,
        description: string,
        amount: string,
        category = 'food',
    ) => {
        await click('Añadir movimiento');
        await page.waitForSelector('.expense-form');
        await click(kind, '.expense-segmented button');
        await fill('description', description);
        await fill('amount', amount);
        if (kind === 'Gasto' || kind === 'Reembolso')
            await page.select('.expense-form [name=category]', category);
        await submit();
    };
    await add('Ingreso', 'Nómina prueba', '1000');
    await add('Gasto', 'Supermercado prueba', '150');
    await add('Reembolso', 'Devolución prueba', '20');
    assert.match(
        await page.$eval('[data-testid=expense-net]', (n) => n.textContent!),
        /870,00/,
    );
    assert.match(
        await page.$eval('[data-testid=expense-spent]', (n) => n.textContent!),
        /130,00/,
    );
    await click('Cuentas y objetivos');
    await click('Añadir cuenta');
    await fill('name', 'Efectivo prueba');
    await fill('opening', '50');
    await fill('openingDate', '2000-01-01');
    await submit();
    const cash = (await data()).accounts.find(
        (a: { name: string }) => a.name === 'Efectivo prueba',
    ).id;
    await click('Añadir movimiento');
    await click('Transferencia', '.expense-segmented button');
    await fill('description', 'Transferencia prueba');
    await fill('amount', '100');
    await page.select('.expense-form [name=toAccount]', cash);
    await submit();
    assert.equal((await data()).entries.length, 4);
    await click('Añadir movimiento');
    await fill('description', 'Cancelado');
    await fill('amount', '999');
    await click('Cancelar', '.expense-form button');
    assert.equal((await data()).entries.length, 4);
    await click('Presupuestos');
    await click('Definir presupuesto');
    await fill('limit', '400');
    await fill('limit-food', '200');
    await submit();
    assert.equal((await data()).budgets[0].limitCents, 40000);
    await click('Recurrentes');
    await click('Añadir recurrente');
    await fill('title', 'Suscripción prueba');
    await fill('amount', '15.99');
    await submit();
    await click('Registrar', '.expense-due-row button');
    await page.waitForSelector('.expense-form');
    await submit();
    assert.equal(
        (await data()).entries.filter((e: ExpenseEntry) => e.recurrenceId)
            .length,
        1,
    );
    assert.equal(await page.$$('.expense-due-row').then((x) => x.length), 0);
    await click('Cuentas y objetivos');
    await click('Objetivo');
    await fill('name', 'Colchón prueba');
    await fill('target', '1000');
    await fill('saved', '100');
    await submit();
    assert.equal((await data()).goals[0].savedCents, 10000);
    await click('Movimientos');
    await page.click(
        '.expense-entry-table button[aria-label="Editar Supermercado prueba"]',
    );
    await fill('amount', '160');
    await submit();
    assert.equal(
        (await data()).entries.find(
            (e: ExpenseEntry) => e.description === 'Supermercado prueba',
        ).amountCents,
        16000,
    );
    await page.click(
        '.expense-entry-table button[aria-label="Eliminar Suscripción prueba"]',
    );
    await click('Confirmar', '.confirm-dialog button');
    await page.waitForFunction(
        () => !document.querySelector('.confirm-dialog'),
    );
    await click('Recurrentes');
    assert.equal(
        await page.$$('.expense-due-row').then((x) => x.length),
        1,
        'Deleting the posted payment restores its pending occurrence',
    );
    writeFileSync(
        '/tmp/freewallet-expense-test.csv',
        `Fecha;Concepto;Importe\n${today};Importado prueba;-12,50\n31/02/2026;Fecha imposible;10\n`,
    );
    await page.$eval('.expense-export-menu', (e) => {
        (e as HTMLDetailsElement).open = true;
    });
    await click('Importar CSV o copia JSON');
    await page
        .$('input[type=file]')
        .then((input) => input!.uploadFile('/tmp/freewallet-expense-test.csv'));
    await page.waitForSelector('.expense-import');
    assert.match(
        await page.$eval('.expense-import-summary', (n) => n.textContent!),
        /1 para importar/,
    );
    await click('Importar 1 movimientos', '.expense-import button');
    await page.waitForFunction(
        () => !document.querySelector('.expense-import'),
    );
    assert.equal(
        (await data()).entries.filter(
            (e: ExpenseEntry) => e.description === 'Importado prueba',
        ).length,
        1,
    );
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('.expense-manager h1');
    assert.equal((await data()).entries.length, 5);
    assert.match(
        await page.$eval('[data-testid=expense-spent]', (n) => n.textContent!),
        /152,50/,
    );
    // Check all sections and dialogs fit narrow viewports in both themes.
    for (const width of [320, 390, 768]) {
        await page.setViewport({ width, height: 900 });
        await page.waitForFunction(
            () =>
                parseFloat(
                    getComputedStyle(document.querySelector('.layout__main')!)
                        .marginLeft,
                ) < 1,
        );
        await page.waitForFunction(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
        );
        for (const tab of [
            'Resumen',
            'Movimientos',
            'Presupuestos',
            'Recurrentes',
            'Cuentas y objetivos',
        ]) {
            await click(tab, '.expense-tabs button');
            await page.waitForFunction(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
                { timeout: 5000 },
            );
            assert.equal(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                true,
                `${tab} fits ${width}px`,
            );
        }
        await click('Añadir movimiento');
        assert.equal(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            true,
        );
        await click('Cancelar', '.expense-form button');
    }
    // Captures use synthetic data only. No personal financial account is queried.
    const demo = emptyExpenseBook();
    demo.accounts[0].openingBalanceCents = 185000;
    demo.accounts.push({
        id: 'savings',
        name: 'Cuenta ahorro',
        type: 'bank',
        openingBalanceCents: 420000,
        openingDate: '2000-01-01',
        archived: false,
    });
    let sequence = 0;
    const push = (
        date: string,
        description: string,
        cents: number,
        kind: ExpenseEntry['kind'],
        categoryId?: string,
    ) =>
        demo.entries.push({
            id: `sample-${sequence++}`,
            date,
            description,
            amountCents: cents,
            kind,
            categoryId,
            accountId: 'main',
            tags: [],
            note: '',
        });
    for (let i = -5; i <= 0; i++) {
        const m = shiftMonth(today.slice(0, 7), i);
        push(`${m}-01`, 'Nómina', 245000, 'income');
        push(`${m}-02`, 'Alquiler', 72000, 'expense', 'home');
        push(
            `${m}-03`,
            'Compra semanal',
            Math.round(15000 - i * 850),
            'expense',
            'food',
        );
        push(`${m}-05`, 'Abono transporte', 4200, 'expense', 'transport');
        push(
            `${m}-07`,
            'Cena con amigos',
            Math.round(4500 - i * 600),
            'expense',
            'leisure',
        );
    }
    push(`${today.slice(0, 7)}-08`, 'Supermercado', 6240, 'expense', 'food');
    push(
        `${today.slice(0, 7)}-08`,
        'Suscripción música',
        1099,
        'expense',
        'subscriptions',
    );
    demo.budgets = [
        {
            month: 'default',
            limitCents: 150000,
            categoryLimits: [
                { categoryId: 'home', limitCents: 75000 },
                { categoryId: 'food', limitCents: 30000 },
                { categoryId: 'leisure', limitCents: 12000 },
            ],
        },
    ];
    demo.recurring = [
        {
            id: 'electricity',
            title: 'Factura de luz',
            kind: 'expense',
            accountId: 'main',
            categoryId: 'bills',
            amountCents: 6500,
            startDate: `${today.slice(0, 7)}-15`,
            frequency: 'monthly',
            paused: false,
            skippedDates: [],
        },
        {
            id: 'gym',
            title: 'Gimnasio',
            kind: 'expense',
            accountId: 'main',
            categoryId: 'health',
            amountCents: 3490,
            startDate: `${today.slice(0, 7)}-20`,
            frequency: 'monthly',
            paused: false,
            skippedDates: [],
        },
    ];
    demo.goals = [
        {
            id: 'buffer',
            name: 'Colchón de emergencia',
            targetCents: 1000000,
            savedCents: 420000,
            deadline: '2027-12-31',
        },
    ];
    mkdirSync('artifacts/expenses', { recursive: true });
    await page.evaluate(
        (book) =>
            localStorage.setItem(
                'freewallet_expenses_v1',
                JSON.stringify(book),
            ),
        demo,
    );
    await page.setViewport({ width: 1440, height: 1120 });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('.expense-donut');
    if (appearance === 'liquid-glass') {
        assert.equal(
            await page.evaluate(
                () => document.documentElement.dataset.appearance,
            ),
            'liquid-glass',
        );
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
        path: `artifacts/expenses/${capturePrefix}escritorio.png`,
    });
    await page.setViewport({ width: 390, height: 950 });
    await page.waitForFunction(
        () =>
            parseFloat(
                getComputedStyle(document.querySelector('.layout__main')!)
                    .marginLeft,
            ) < 1,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
        path: `artifacts/expenses/${capturePrefix}movil.png`,
        fullPage: true,
    });
    await click('Presupuestos', '.expense-tabs button');
    await page.screenshot({
        path: `artifacts/expenses/${capturePrefix}presupuestos.png`,
        fullPage: true,
    });
    await page.evaluate(() =>
        localStorage.setItem('freewallet_theme_mode', 'light'),
    );
    await page.setViewport({ width: 1440, height: 1120 });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('.expense-donut');
    assert.equal(
        await page.evaluate(() =>
            document.documentElement.getAttribute('data-theme'),
        ),
        'light',
    );
    await page.screenshot({
        path: `artifacts/expenses/${capturePrefix}tema-claro.png`,
    });
    if (appearance === 'liquid-glass') {
        await page.setViewport({ width: 390, height: 950 });
        await page.waitForFunction(
            () =>
                parseFloat(
                    getComputedStyle(document.querySelector('.layout__main')!)
                        .marginLeft,
                ) < 1,
        );
        await click('Añadir movimiento');
        await page.waitForSelector('.expense-form');
        await page.screenshot({
            path: 'artifacts/expenses/glass-formulario-movil.png',
        });
        await click('Cancelar', '.expense-form button');
    }
    assert.deepEqual(errors, []);
    console.log(
        `PASS (${appearance}): create/edit/cancel/delete, transfer/refund/income summaries, budgets, recurring confirmation/dedup, goals, CSV preview/import, persistence, mobile 320/390/768 layouts, light/dark captures.`,
    );
} finally {
    await browser.close();
}
