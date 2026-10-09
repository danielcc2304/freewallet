import assert from 'node:assert/strict';
import { ExpenseStore } from '../src/services/expenseStore';
import type { ExpenseRecord } from '../src/services/expenseRepository';
import type { ExpenseTransport } from '../src/services/expenseStore';
import { emptyExpenseBook, EXPENSE_KEY } from '../src/services/expensePlanner';
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
    value: {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => storage.set(k, v),
    },
    configurable: true,
});
Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    configurable: true,
});
const local = new ExpenseStore();
await local.select(null);
const draft = emptyExpenseBook();
draft.accounts[0].openingBalanceCents = 12345;
await local.save(draft);
assert.equal(
    JSON.parse(storage.get(EXPENSE_KEY)!).accounts[0].openingBalanceCents,
    12345,
);
let resolveRead: ((r: ExpenseRecord | null) => void) | undefined;
let readMode = 'normal';
let lastOwner = '';
let fail = false;
const attempts: { id: string; owner: string }[] = [];
let resolveWrite: ((r: ExpenseRecord) => void) | undefined;
const api: ExpenseTransport = {
    read: async (owner) => {
        lastOwner = owner;
        if (readMode === 'slow')
            return new Promise((resolve) => {
                resolveRead = resolve;
            });
        return { revision: 0, book: emptyExpenseBook() };
    },
    write: async (owner, revision, id, book) => {
        attempts.push({ id, owner });
        if (fail) throw new Error('Transient');
        if (readMode === 'slow-write')
            return new Promise((resolve) => {
                resolveWrite = resolve;
            });
        return { revision: revision + 1, book };
    },
};
const store = new ExpenseStore(api);
await store.select('A');
assert.equal(lastOwner, 'A');
assert.equal(
    store.getSnapshot().book.accounts[0].openingBalanceCents,
    0,
    'Guest book is never copied into a signed-in account',
);
const before = storage.get(EXPENSE_KEY);
await store.save(draft);
assert.equal(
    storage.get(EXPENSE_KEY),
    before,
    'Signed-in financial data never enters localStorage',
);
fail = true;
await assert.rejects(
    store.save({
        ...draft,
        goals: [
            { id: 'goal', name: 'Pending', targetCents: 10000, savedCents: 0 },
        ],
    }),
);
assert.equal(store.getSnapshot().status, 'error');
const pendingId = attempts.at(-1)!.id;
assert.equal(store.exportBook.goals[0].name, 'Pending');
fail = false;
await store.retry();
assert.equal(attempts.at(-1)!.id, pendingId, 'Retry reuses its receipt ID');
assert.equal(store.getSnapshot().book.goals[0].name, 'Pending');
readMode = 'slow';
const selectingA = store.select('A-new');
readMode = 'normal';
await store.select('B');
resolveRead!({ revision: 50, book: draft });
await selectingA;
assert.equal(store.getSnapshot().owner, 'B');
assert.equal(
    store.getSnapshot().book.accounts[0].openingBalanceCents,
    0,
    'A late response cannot enter B',
);
readMode = 'slow-write';
const writing = store.save(draft);
await new Promise((resolve) => setTimeout(resolve, 0));
readMode = 'normal';
await store.select('C');
resolveWrite!({ revision: 1, book: draft });
await writing;
assert.equal(store.getSnapshot().owner, 'C');
assert.equal(store.getSnapshot().book.accounts[0].openingBalanceCents, 0);
assert.equal(
    attempts.at(-1)!.owner,
    'B',
    'Writer is pinned to the owner of the request',
);
await store.select('B');
assert.equal(
    store.getSnapshot().status,
    'error',
    'Pending changes survive an in-memory account change for recovery',
);
assert.equal(store.exportBook.accounts[0].openingBalanceCents, 12345);
await store.load(true);
assert.equal(store.getSnapshot().status, 'ready');
const conflict = new ExpenseStore({
    ...api,
    write: async () => {
        throw Object.assign(new Error('Conflict'), { code: '40001' });
    },
});
await conflict.select('A');
await assert.rejects(conflict.save(draft));
assert.equal(conflict.getSnapshot().status, 'conflict');
assert.equal(conflict.exportBook.accounts[0].openingBalanceCents, 12345);
await assert.rejects(conflict.save(emptyExpenseBook()));
storage.set(EXPENSE_KEY, '{broken');
const broken = new ExpenseStore();
await broken.select(null);
assert.equal(broken.getSnapshot().status, 'error');
assert.equal(storage.get(EXPENSE_KEY), '{broken');
console.log(
    'PASS: independent local/cloud persistence, guest isolation, no signed-in local balances, exact retry, conflict recovery, stale reads/writes, pending export, invalid local documents preserved.',
);

// Local multi-tab writes cannot silently replace a newer ledger.
storage.set(EXPENSE_KEY, JSON.stringify(emptyExpenseBook()));
const one = new ExpenseStore(),
    two = new ExpenseStore();
await one.select(null);
await two.select(null);
await one.save(draft);
await assert.rejects(
    two.save({
        ...draft,
        goals: [
            {
                id: 'local-goal',
                name: 'Keep pending',
                targetCents: 10000,
                savedCents: 0,
            },
        ],
    }),
);
assert.equal(two.getSnapshot().status, 'conflict');
assert.equal(two.exportBook.goals[0].name, 'Keep pending');
assert.equal(JSON.parse(storage.get(EXPENSE_KEY)!).goals.length, 0);
await two.load(true);
assert.equal(two.getSnapshot().book.accounts[0].openingBalanceCents, 12345);
broken.restoreLocal(emptyExpenseBook());
assert.equal(broken.getSnapshot().status, 'ready');
assert.equal(JSON.parse(storage.get(EXPENSE_KEY)!).version, 1);
storage.set(EXPENSE_KEY, '{broken-after-load');
await two.load();
assert.equal(two.getSnapshot().status, 'error');
assert.equal(two.getSnapshot().book.accounts[0].openingBalanceCents, 12345);
assert.equal(storage.get(EXPENSE_KEY), '{broken-after-load');
