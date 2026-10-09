import assert from 'node:assert/strict';
import {
    emptyExpenseBook,
    accountBalance,
    expenseSummary,
    parseExpenseAmount,
    recurrenceDates,
    pendingRecurrences,
    confirmRecurrence,
    validateExpenseBook,
} from '../src/services/expensePlanner';
import {
    exportExpenseCsv,
    guessCsvMapping,
    previewExpenseImport,
    readExpenseCsv,
} from '../src/services/expenseImport';
import type { ExpenseEntry, ExpenseRecurrence } from '../src/types/expenses';
const book = emptyExpenseBook();
book.accounts.push({
    id: 'cash',
    name: 'Efectivo',
    type: 'cash',
    openingBalanceCents: 5000,
    openingDate: '2000-01-01',
    archived: false,
});
const entry = (
    id: string,
    kind: ExpenseEntry['kind'],
    amountCents: number,
    date = '2026-10-05',
): ExpenseEntry => ({
    id,
    kind,
    amountCents,
    date,
    accountId: 'main',
    categoryId: kind === 'expense' || kind === 'refund' ? 'food' : undefined,
    description: id,
    tags: [],
    note: '',
});
book.entries = [
    entry('salary', 'income', 250000),
    entry('food', 'expense', 30000),
    entry('refund', 'refund', 5000),
    { ...entry('transfer', 'transfer', 50000), toAccountId: 'cash' },
    entry('future', 'expense', 10000, '2026-10-20'),
];
book.budgets = [
    {
        month: 'default',
        limitCents: 100000,
        categoryLimits: [{ categoryId: 'food', limitCents: 40000 }],
    },
];
validateExpenseBook(book);
const s = expenseSummary(book, '2026-10', '2026-10-09');
assert.equal(s.income, 250000);
assert.equal(s.expenses, 25000);
assert.equal(s.net, 225000);
assert.equal(s.refunds, 5000);
assert.equal(s.remaining, 75000);
assert.equal(s.remainingDays, 23);
assert.equal(s.savingRate, 90);
assert.equal(accountBalance(book, 'main', '2026-10-09'), 175000);
assert.equal(accountBalance(book, 'cash', '2026-10-09'), 55000);
assert.equal(
    book.accounts.reduce(
        (v, a) => v + accountBalance(book, a.id, '2026-10-09'),
        0,
    ),
    230000,
    'Internal transfers conserve total account balances',
);
assert.equal(expenseSummary(book, '2026-10', '2026-11-01').expenses, 35000);
assert.equal(expenseSummary(book, '2026-11', '2026-10-09').income, 0);
assert.equal(parseExpenseAmount('1.234,56'), 123456);
assert.equal(parseExpenseAmount('0.10'), 10);
assert.equal(parseExpenseAmount('-12,34', true), -1234);
for (const bad of ['0.001', '1e3', 'NaN', 'Infinity', '1,234', '1.23,45', '-1'])
    assert.throws(() => parseExpenseAmount(bad));
const monthly: ExpenseRecurrence = {
    id: 'rent',
    title: 'Alquiler',
    kind: 'expense',
    accountId: 'main',
    categoryId: 'home',
    amountCents: 75000,
    startDate: '2026-01-31',
    frequency: 'monthly',
    paused: false,
    skippedDates: [],
};
assert.deepEqual(recurrenceDates(monthly, '2026-02-01', '2026-04-30'), [
    '2026-02-28',
    '2026-03-31',
    '2026-04-30',
]);
assert.deepEqual(
    recurrenceDates(
        { ...monthly, startDate: '2024-02-29', frequency: 'yearly' },
        '2025-01-01',
        '2028-12-31',
    ),
    ['2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29'],
);
assert.deepEqual(
    recurrenceDates(
        { ...monthly, frequency: 'weekly', startDate: '2026-10-01' },
        '2026-10-02',
        '2026-10-16',
    ),
    ['2026-10-08', '2026-10-15'],
);
assert.deepEqual(
    recurrenceDates({ ...monthly, paused: true }, '2026-01-01', '2026-12-31'),
    [],
);
assert.deepEqual(
    recurrenceDates(
        { ...monthly, endDate: '2026-03-01' },
        '2026-02-01',
        '2026-12-31',
    ),
    ['2026-02-28'],
);
book.recurring = [monthly];
assert.equal(pendingRecurrences(book, '2026-10-01', '2026-10-31').length, 1);
const paid = confirmRecurrence(book, 'rent', '2026-10-31', '2026-10-09');
assert.equal(pendingRecurrences(paid, '2026-10-01', '2026-10-31').length, 0);
assert.equal(expenseSummary(paid, '2026-10', '2026-10-09').expenses, 100000);
assert.throws(() => confirmRecurrence(paid, 'rent', '2026-10-31'));
assert.throws(() => confirmRecurrence(book, 'rent', '2026-10-30'));
for (const change of [
    () => ({ ...book, entries: [...book.entries, book.entries[0]] }),
    () => ({ ...book, entries: [{ ...book.entries[0], amountCents: 1.1 }] }),
    () => ({ ...book, entries: [{ ...book.entries[3], toAccountId: 'main' }] }),
    () => ({
        ...book,
        entries: [{ ...book.entries[1], categoryId: 'missing' }],
    }),
    () => ({
        ...book,
        accounts: book.accounts.map((a) => ({
            ...a,
            openingDate: '2026-11-01',
        })),
    }),
    () => ({
        ...book,
        budgets: [
            {
                month: '2026-10',
                limitCents: 100,
                categoryLimits: [{ categoryId: 'food', limitCents: 101 }],
            },
        ],
    }),
])
    assert.throws(() => validateExpenseBook(change()));
const csv = exportExpenseCsv(book);
assert.throws(
    () => readExpenseCsv(`${Array(101).fill('columna').join(';')}\n1;2`),
    /100 columnas/,
);
const rows = readExpenseCsv(csv);
const mapping = guessCsvMapping(rows[0]);
const imported = previewExpenseImport(book, rows, mapping, 'main');
assert.equal(imported.length, 5);
assert.equal(imported.filter((r) => r.duplicate).length, 5);
assert.equal(imported.filter((r) => r.error).length, 0);
const bank = readExpenseCsv(
    'Fecha;Concepto;Importe\n09/10/2026;"Super; mercado";-12,34\n09/10/2026;Nómina;2000,00\n31/02/2026;Inválida;10\n',
);
const preview = previewExpenseImport(
    book,
    bank,
    guessCsvMapping(bank[0]),
    'main',
);
assert.equal(preview[0].entry?.kind, 'expense');
assert.equal(preview[0].entry?.description, 'Super; mercado');
assert.equal(preview[0].entry?.amountCents, 1234);
assert.equal(preview[1].entry?.kind, 'income');
assert.ok(preview[2].error);
const quote = readExpenseCsv(
    'Date,Description,Amount\n2026-10-01,"A quote ""and""\nnew line",12.50',
);
assert.equal(quote[1][1], 'A quote "and"\nnew line');
assert.throws(() => readExpenseCsv('A,B\n"Unclosed,1'));
const dangerous = exportExpenseCsv({
    ...book,
    entries: [
        {
            ...book.entries[0],
            description: '=HYPERLINK("https://example.test")',
        },
    ],
});
assert.ok(
    dangerous.includes("'=HYPERLINK"),
    'CSV exports escape spreadsheet formulas',
);
console.log(
    'PASS: cents, refunds, transfers, dates, budgets, recurrence anchors/leap years/dedup, CSV quoting/mapping/duplicates and formula safety.',
);
