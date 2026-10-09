import type {
    ExpenseBook,
    ExpenseBudget,
    ExpenseEntry,
    ExpenseRecurrence,
} from '../types/expenses';

export const EXPENSE_KEY = 'freewallet_expenses_v1';
export const EXPENSE_LIMIT_BYTES = 2_097_152;
const currencyFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
export const money = (cents: number) => currencyFormatter.format(cents / 100);
export const newExpenseId = () => crypto.randomUUID();
export const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dayFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'UTC' });
const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const dayLabel = (day: string) => dayFormatter.format(new Date(`${day}T12:00:00Z`));
export const monthLabel = (month: string) => monthFormatter.format(new Date(`${month}-01T12:00:00Z`));
export function validExpenseDay(day: unknown): day is string {
    return (
        typeof day === 'string' &&
        /^(20\d{2}|21\d{2})-\d{2}-\d{2}$/.test(day) &&
        Number.isFinite(Date.parse(day)) &&
        new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day
    );
}
export function monthBounds(month: string) {
    if (!/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(month))
        throw new Error('Mes no válido.');
    const [year, m] = month.split('-').map(Number);
    return {
        start: `${month}-01`,
        end: new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10),
        days: new Date(Date.UTC(year, m, 0)).getUTCDate(),
    };
}
export function shiftMonth(month: string, offset: number) {
    monthBounds(month);
    const [y, m] = month.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1 + offset, 1)).toISOString().slice(0, 7);
}
/** Decimal input is converted once to integer cents. Never accumulate floats. */
export function parseExpenseAmount(input: string, signed = false): number {
    let s = input.trim().replace(/\s|€/g, '');
    if (s.includes(',')) {
        if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(s))
            throw new Error('Importe inválido. Usa como máximo dos decimales.');
        s = s.replace(/\./g, '').replace(',', '.');
    }
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(s))
        throw new Error('Importe inválido. Usa como máximo dos decimales.');
    const negative = s.startsWith('-');
    const [whole, fraction = ''] = s.replace('-', '').split('.');
    const cents =
        (Number(whole) * 100 + Number(fraction.padEnd(2, '0'))) *
        (negative ? -1 : 1);
    if (
        !Number.isSafeInteger(cents) ||
        Math.abs(cents) > 100_000_000_000 ||
        (!signed && cents < 0)
    )
        throw new Error('El importe está fuera del rango permitido.');
    return cents;
}
export function emptyExpenseBook(): ExpenseBook {
    return {
        version: 1,
        accounts: [
            {
                id: 'main',
                name: 'Cuenta principal',
                type: 'bank',
                openingBalanceCents: 0,
                openingDate: '2000-01-01',
                archived: false,
            },
        ],
        categories: [
            { id: 'home', name: 'Vivienda', color: '#818cf8', group: 'needs' },
            {
                id: 'food',
                name: 'Alimentación',
                color: '#34d399',
                group: 'needs',
            },
            {
                id: 'transport',
                name: 'Transporte',
                color: '#38bdf8',
                group: 'needs',
            },
            {
                id: 'bills',
                name: 'Suministros',
                color: '#fbbf24',
                group: 'needs',
            },
            { id: 'health', name: 'Salud', color: '#fb7185', group: 'needs' },
            { id: 'leisure', name: 'Ocio', color: '#c084fc', group: 'wants' },
            {
                id: 'shopping',
                name: 'Compras',
                color: '#f97316',
                group: 'wants',
            },
            {
                id: 'subscriptions',
                name: 'Suscripciones',
                color: '#2dd4bf',
                group: 'wants',
            },
            {
                id: 'education',
                name: 'Formación',
                color: '#a3e635',
                group: 'needs',
            },
            { id: 'other', name: 'Otros', color: '#94a3b8', group: 'wants' },
        ],
        entries: [],
        budgets: [],
        recurring: [],
        goals: [],
    };
}
/** Validate files and remote documents before rendering; invalid data never becomes an empty book. */
export function validateExpenseBook(
    value: unknown,
): asserts value is ExpenseBook {
    const bad = (message: string): never => {
        throw new Error(message);
    };
    const object = (v: unknown): Record<string, unknown> =>
        v && typeof v === 'object' && !Array.isArray(v)
            ? (v as Record<string, unknown>)
            : bad('Formato de gastos no válido.');
    const root = object(value);
    if (
        root.version !== 1 ||
        new TextEncoder().encode(JSON.stringify(value)).length >
            EXPENSE_LIMIT_BYTES
    )
        bad('Formato o tamaño de gastos no compatible.');
    const arrays: Record<string, Record<string, unknown>[]> = {};
    for (const [key, limit] of Object.entries({
        accounts: 30,
        categories: 100,
        entries: 10000,
        budgets: 240,
        recurring: 200,
        goals: 100,
    })) {
        if (!Array.isArray(root[key]) || root[key].length > limit)
            bad(`Límite de ${key} excedido.`);
        arrays[key] = (root[key] as unknown[]).map(object);
        const ids = arrays[key].map((x) =>
            key === 'budgets' ? x.month : x.id,
        );
        if (
            ids.some((x) => typeof x !== 'string' || !x || x.length > 150) ||
            new Set(ids).size !== ids.length
        )
            bad('Hay identificadores duplicados o no válidos.');
    }
    for (const key of ['accounts', 'categories']) {
        const names = arrays[key].map((x) =>
            String(x.name)
                .trim()
                .toLocaleLowerCase('es')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, ''),
        );
        if (new Set(names).size !== names.length)
            bad('Los nombres de cuentas y categorías deben ser distintos.');
    }
    if (!arrays.accounts.length || !arrays.categories.length)
        bad('Necesitas al menos una cuenta y una categoría.');
    const text = (v: unknown, max = 200, empty = false) =>
        typeof v === 'string' && v.length <= max && (empty || !!v.trim());
    const amount = (v: unknown, positive = false, signed = false) =>
        typeof v === 'number' &&
        Number.isSafeInteger(v) &&
        Math.abs(v) <= 100_000_000_000 &&
        (signed || v >= 0) &&
        (!positive || v > 0);
    const ids = (key: string, id: unknown) =>
        arrays[key].some((x) => x.id === id);
    for (const a of arrays.accounts)
        if (
            !text(a.name, 80) ||
            !['bank', 'cash', 'credit'].includes(String(a.type)) ||
            !amount(a.openingBalanceCents, false, true) ||
            !validExpenseDay(a.openingDate) ||
            typeof a.archived !== 'boolean'
        )
            bad('Cuenta no válida.');
    for (const c of arrays.categories)
        if (
            !text(c.name, 60) ||
            typeof c.color !== 'string' ||
            !/^#[0-9a-f]{6}$/i.test(c.color) ||
            !['needs', 'wants', 'savings'].includes(String(c.group))
        )
            bad('Categoría no válida.');
    for (const e of arrays.entries) {
        if (
            !['income', 'expense', 'refund', 'transfer'].includes(
                String(e.kind),
            ) ||
            !validExpenseDay(e.date) ||
            !amount(e.amountCents, true) ||
            !ids('accounts', e.accountId) ||
            !text(e.description) ||
            !text(e.note, 1000, true) ||
            !Array.isArray(e.tags) ||
            e.tags.length > 8 ||
            e.tags.some((t) => !text(t, 40))
        )
            bad('Movimiento no válido.');
        if (
            e.kind === 'transfer'
                ? !ids('accounts', e.toAccountId) ||
                  e.accountId === e.toAccountId
                : e.kind !== 'income' && !ids('categories', e.categoryId)
        )
            bad('Revisa la cuenta de destino o la categoría.');
        for (const id of [
            e.accountId,
            ...(e.kind === 'transfer' ? [e.toAccountId] : []),
        ])
            if (
                String(e.date) <
                String(arrays.accounts.find((a) => a.id === id)!.openingDate)
            )
                bad('Un movimiento es anterior al saldo inicial de su cuenta.');
        if (
            e.recurrenceId !== undefined &&
            (!text(e.recurrenceId, 150) || !validExpenseDay(e.scheduledDate))
        )
            bad('Referencia recurrente no válida.');
    }
    const occurrenceKeys = arrays.entries
        .filter((e) => e.recurrenceId)
        .map((e) => `${e.recurrenceId}:${e.scheduledDate}`);
    if (new Set(occurrenceKeys).size !== occurrenceKeys.length)
        bad('Hay vencimientos recurrentes duplicados.');
    for (const b of arrays.budgets) {
        if (
            (b.month !== 'default' &&
                (typeof b.month !== 'string' ||
                    !/^\d{4}-\d{2}$/.test(b.month) ||
                    !validExpenseDay(`${b.month}-01`))) ||
            !amount(b.limitCents) ||
            !Array.isArray(b.categoryLimits)
        )
            bad('Presupuesto no válido.');
        const limits = (b.categoryLimits as unknown[]).map(object);
        if (
            limits.length > 100 ||
            new Set(limits.map((c) => c.categoryId)).size !== limits.length ||
            limits.some(
                (c) =>
                    !ids('categories', c.categoryId) || !amount(c.limitCents),
            )
        )
            bad('Límites por categoría no válidos.');
        if (
            limits.reduce((sum, c) => sum + Number(c.limitCents), 0) >
                Number(b.limitCents)
        )
            bad('Los límites por categoría superan el presupuesto total.');
    }
    for (const r of arrays.recurring) {
        if (
            !text(r.title) ||
            !['expense', 'income'].includes(String(r.kind)) ||
            !amount(r.amountCents, true) ||
            !ids('accounts', r.accountId) ||
            (r.kind === 'expense' && !ids('categories', r.categoryId)) ||
            !validExpenseDay(r.startDate) ||
            (r.endDate !== undefined &&
                (!validExpenseDay(r.endDate) || r.endDate < r.startDate)) ||
            !['weekly', 'monthly', 'yearly'].includes(String(r.frequency)) ||
            typeof r.paused !== 'boolean' ||
            !Array.isArray(r.skippedDates) ||
            r.skippedDates.length > 2000 ||
            r.skippedDates.some((d) => !validExpenseDay(d))
        )
            bad('Recurrente no válido.');
        if (
            String(r.startDate) <
            String(
                arrays.accounts.find((a) => a.id === r.accountId)!.openingDate,
            )
        )
            bad('El recurrente empieza antes del saldo inicial de su cuenta.');
    }
    for (const g of arrays.goals)
        if (
            !text(g.name, 80) ||
            !amount(g.targetCents, true) ||
            !amount(g.savedCents) ||
            (g.deadline !== undefined && !validExpenseDay(g.deadline))
        )
            bad('Objetivo no válido.');
}
export function parseExpenseBook(raw: string): ExpenseBook {
    if (new TextEncoder().encode(raw).length > EXPENSE_LIMIT_BYTES)
        throw new Error('La copia supera los 2 MB.');
    const value: unknown = JSON.parse(raw);
    validateExpenseBook(value);
    return value;
}
export function accountBalance(
    book: ExpenseBook,
    id: string,
    through = todayLocal(),
) {
    const a = book.accounts.find((a) => a.id === id);
    if (!a || through < a.openingDate) return 0;
    return book.entries
        .filter((e) => e.date <= through)
        .reduce(
            (balance, e) =>
                balance +
                (e.accountId === id
                    ? e.kind === 'income' || e.kind === 'refund'
                        ? e.amountCents
                        : -e.amountCents
                    : 0) +
                (e.kind === 'transfer' && e.toAccountId === id
                    ? e.amountCents
                    : 0),
            a.openingBalanceCents,
        );
}
export function budgetForMonth(
    book: ExpenseBook,
    month: string,
): ExpenseBudget | undefined {
    return (
        book.budgets.find((b) => b.month === month) ??
        book.budgets.find((b) => b.month === 'default')
    );
}
export function expenseSummary(
    book: ExpenseBook,
    month: string,
    today = todayLocal(),
) {
    const bounds = monthBounds(month);
    const until = bounds.end < today ? bounds.end : today;
    const entries = book.entries.filter(
        (e) => e.date >= bounds.start && e.date <= until,
    );
    const sum = (kind: string) =>
        entries
            .filter((e) => e.kind === kind)
            .reduce((s, e) => s + e.amountCents, 0);
    const income = sum('income'),
        refunds = sum('refund'),
        expenses = sum('expense') - refunds;
    const categories = book.categories
        .map((c) => ({
            ...c,
            cents: entries
                .filter((e) => e.categoryId === c.id)
                .reduce(
                    (s, e) =>
                        s +
                        (e.kind === 'expense'
                            ? e.amountCents
                            : e.kind === 'refund'
                              ? -e.amountCents
                              : 0),
                    0,
                ),
        }))
        .sort((a, b) => b.cents - a.cents);
    const budget = budgetForMonth(book, month);
    const remaining = budget ? budget.limitCents - expenses : null;
    const remainingDays =
        today >= bounds.start && today <= bounds.end
            ? bounds.days - Number(today.slice(8)) + 1
            : today < bounds.start
              ? bounds.days
              : 0;
    return {
        income,
        expenses,
        refunds,
        grossExpenses: sum('expense'),
        net: income - expenses,
        savingRate: income > 0 ? ((income - expenses) / income) * 100 : null,
        categories,
        budget,
        remaining,
        remainingDays,
        dailyAllowance:
            remaining === null || remainingDays === 0
                ? null
                : Math.max(0, remaining / remainingDays),
    };
}
/** Anchor to the original day: Jan 31 -> Feb 28 -> Mar 31; leap years included. */
export function recurrenceDates(
    rule: ExpenseRecurrence,
    start: string,
    end: string,
): string[] {
    if (
        rule.paused ||
        end < rule.startDate ||
        start > (rule.endDate ?? '2199-12-31')
    )
        return [];
    const stop = rule.endDate && rule.endDate < end ? rule.endDate : end;
    const dates: string[] = [];
    const [year, month, day] = rule.startDate.split('-').map(Number);
    if (rule.frequency === 'weekly') {
        const first = Date.parse(rule.startDate),
            delta = 7 * 86400000;
        for (
            let t =
                first +
                Math.max(0, Math.ceil((Date.parse(start) - first) / delta)) *
                    delta;
            t <= Date.parse(stop);
            t += delta
        )
            dates.push(new Date(t).toISOString().slice(0, 10));
    } else {
        const step = rule.frequency === 'yearly' ? 12 : 1;
        const monthIndex = year * 12 + month - 1;
        const [sy, sm] = start.split('-').map(Number);
        const [ey, em] = stop.split('-').map(Number);
        for (
            let index =
                monthIndex +
                Math.max(
                    0,
                    Math.floor((sy * 12 + sm - 1 - monthIndex) / step),
                ) *
                    step;
            index <= ey * 12 + em - 1;
            index += step
        ) {
            const y = Math.floor(index / 12),
                m = index % 12;
            const date = new Date(
                Date.UTC(
                    y,
                    m,
                    Math.min(day, new Date(Date.UTC(y, m + 1, 0)).getUTCDate()),
                ),
            )
                .toISOString()
                .slice(0, 10);
            if (date >= start && date >= rule.startDate && date <= stop)
                dates.push(date);
        }
    }
    return dates.filter((d) => !rule.skippedDates.includes(d));
}
export function pendingRecurrences(
    book: ExpenseBook,
    start: string,
    end: string,
) {
    const paid = new Set(
        book.entries
            .filter((e) => e.recurrenceId)
            .map((e) => `${e.recurrenceId}:${e.scheduledDate}`),
    );
    return book.recurring
        .flatMap((rule) =>
            recurrenceDates(rule, start, end)
                .filter((date) => !paid.has(`${rule.id}:${date}`))
                .map((date) => ({ rule, date })),
        )
        .sort((a, b) => a.date.localeCompare(b.date));
}
export function confirmRecurrence(
    book: ExpenseBook,
    ruleId: string,
    scheduledDate: string,
    actualDate = scheduledDate,
): ExpenseBook {
    const rule = book.recurring.find((r) => r.id === ruleId);
    if (!rule || !recurrenceDates(rule, scheduledDate, scheduledDate).length)
        throw new Error('Vencimiento no válido.');
    if (
        book.entries.some(
            (e) =>
                e.recurrenceId === ruleId && e.scheduledDate === scheduledDate,
        )
    )
        throw new Error('Este vencimiento ya está registrado.');
    const entry: ExpenseEntry = {
        id: newExpenseId(),
        kind: rule.kind,
        amountCents: rule.amountCents,
        date: actualDate,
        description: rule.title,
        accountId: rule.accountId,
        categoryId: rule.categoryId,
        recurrenceId: rule.id,
        scheduledDate,
        tags: [],
        note: 'Registrado desde un vencimiento recurrente.',
    };
    const next = { ...book, entries: [...book.entries, entry] };
    validateExpenseBook(next);
    return next;
}
export function activeRecurrence(
    rule: ExpenseRecurrence,
    today = todayLocal(),
) {
    return (
        !rule.paused &&
        rule.startDate <= today &&
        (!rule.endDate || rule.endDate >= today)
    );
}
export function monthlyRecurrenceCost(book: ExpenseBook, today = todayLocal()) {
    return book.recurring
        .filter((r) => activeRecurrence(r, today) && r.kind === 'expense')
        .reduce(
            (s, r) =>
                s +
                r.amountCents *
                    (r.frequency === 'weekly'
                        ? 52 / 12
                        : r.frequency === 'yearly'
                          ? 1 / 12
                          : 1),
            0,
        );
}
