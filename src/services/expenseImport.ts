import type { ExpenseBook, ExpenseEntry, ExpenseKind } from '../types/expenses';
import {
    EXPENSE_LIMIT_BYTES,
    newExpenseId,
    parseExpenseAmount,
    validExpenseDay,
    validateExpenseBook,
} from './expensePlanner';

export const CSV_FIELDS = [
    'date',
    'description',
    'amount',
    'kind',
    'category',
    'account',
    'toAccount',
    'tags',
] as const;
export type CsvField = (typeof CSV_FIELDS)[number];
export type CsvMapping = Record<CsvField, number>;
export interface ExpenseImportRow {
    line: number;
    entry?: ExpenseEntry;
    error?: string;
    duplicate: boolean;
}
/** RFC 4180 quoting, including delimiters and line breaks inside quoted fields. */
export function readExpenseCsv(raw: string): string[][] {
    if (new TextEncoder().encode(raw).length > EXPENSE_LIMIT_BYTES)
        throw new Error('El CSV supera los 2 MB.');
    const text = raw.replace(/^\uFEFF/, '');
    const first = text.split(/\r?\n/)[0];
    const delimiter =
        (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0)
            ? ';'
            : ',';
    const rows: string[][] = [];
    let row: string[] = [],
        cell = '',
        quoted = false,
        closed = false;
    const pushCell = () => {
        if (row.length >= 100)
            throw new Error('El CSV supera las 100 columnas.');
        row.push(cell);
        cell = '';
        closed = false;
    };
    const pushRow = () => {
        pushCell();
        if (row.some((c) => c.trim())) rows.push(row);
        row = [];
        if (rows.length > 10001)
            throw new Error('El CSV supera los 10.000 movimientos.');
    };
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    quoted = false;
                    closed = true;
                }
            } else cell += char;
        } else if (char === '"') {
            if (cell || closed)
                throw new Error('Comillas no válidas en el CSV.');
            quoted = true;
        } else if (char === delimiter) pushCell();
        else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i++;
            pushRow();
        } else {
            if (closed && char.trim())
                throw new Error(
                    'Contenido después de unas comillas de cierre.',
                );
            if (!closed) cell += char;
        }
    }
    if (quoted) throw new Error('El CSV contiene una celda sin cerrar.');
    if (cell || row.length) pushRow();
    if (rows.length < 2)
        throw new Error(
            'El CSV necesita una cabecera y al menos un movimiento.',
        );
    return rows;
}
const normalized = (s: string) =>
    s
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/^'(?=[=+\-@\t\r])/, '');
export function guessCsvMapping(headers: string[]): CsvMapping {
    const names: Record<CsvField, string[]> = {
        date: ['fecha', 'date', 'fecha operacion'],
        description: ['concepto', 'descripcion', 'description', 'comercio'],
        amount: ['importe', 'amount', 'cantidad'],
        kind: ['tipo', 'kind', 'type'],
        category: ['categoria', 'category'],
        account: ['cuenta', 'account'],
        toAccount: ['cuenta destino', 'toaccount'],
        tags: ['etiquetas', 'tags'],
    };
    return Object.fromEntries(
        CSV_FIELDS.map((field) => [
            field,
            headers.findIndex((h) => names[field].includes(normalized(h))),
        ]),
    ) as CsvMapping;
}
function parseDate(input: string) {
    const s = input.trim();
    const parts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    const day = parts
        ? `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
        : s;
    if (!validExpenseDay(day))
        throw new Error('Fecha no válida. Usa AAAA-MM-DD o DD/MM/AAAA.');
    return day;
}
const fingerprint = (e: ExpenseEntry) =>
    JSON.stringify([
        e.date,
        e.kind,
        e.amountCents,
        e.accountId,
        e.toAccountId ?? '',
        normalized(e.description),
    ]);
export function previewExpenseImport(
    book: ExpenseBook,
    rows: string[][],
    mapping: CsvMapping,
    defaultAccount: string,
): ExpenseImportRow[] {
    const existing = new Set(book.entries.map(fingerprint));
    return rows.slice(1).map((row, index) => {
        try {
            const field = (key: CsvField) =>
                mapping[key] >= 0 ? (row[mapping[key]] ?? '').trim() : '';
            const rawAmount = parseExpenseAmount(field('amount'), true);
            if (!rawAmount) throw new Error('El importe no puede ser cero.');
            const types: Record<string, ExpenseKind> = {
                gasto: 'expense',
                expense: 'expense',
                ingreso: 'income',
                income: 'income',
                transferencia: 'transfer',
                transfer: 'transfer',
                reembolso: 'refund',
                refund: 'refund',
            };
            const kind = field('kind')
                ? types[normalized(field('kind'))]
                : rawAmount < 0
                  ? 'expense'
                  : 'income';
            if (!kind) throw new Error('Tipo de movimiento no reconocido.');
            const account = field('account')
                ? book.accounts.find(
                      (a) =>
                          normalized(a.name) === normalized(field('account')),
                  )
                : book.accounts.find((a) => a.id === defaultAccount);
            if (!account || account.archived)
                throw new Error('Cuenta no reconocida o archivada.');
            const category = field('category')
                ? book.categories.find(
                      (c) =>
                          normalized(c.name) === normalized(field('category')),
                  )
                : (book.categories.find((c) => c.id === 'other') ??
                  book.categories[0]);
            if (kind !== 'income' && kind !== 'transfer' && !category)
                throw new Error('Categoría no reconocida.');
            const entry: ExpenseEntry = {
                id: newExpenseId(),
                date: parseDate(field('date')),
                description: field('description').replace(
                    /^'(?=[=+\-@\t\r])/,
                    '',
                ),
                kind,
                amountCents: Math.abs(rawAmount),
                accountId: account.id,
                categoryId:
                    kind === 'income' || kind === 'transfer'
                        ? undefined
                        : category?.id,
                toAccountId:
                    kind === 'transfer'
                        ? book.accounts.find(
                              (a) =>
                                  normalized(a.name) ===
                                  normalized(field('toAccount')),
                          )?.id
                        : undefined,
                tags: field('tags')
                    .split('|')
                    .map((t) => t.trim())
                    .filter(Boolean),
                note: 'Importado desde CSV.',
            };
            validateExpenseBook({ ...book, entries: [entry] });
            const key = fingerprint(entry),
                duplicate = existing.has(key);
            existing.add(key);
            return { line: index + 2, entry, duplicate };
        } catch (error) {
            return {
                line: index + 2,
                error:
                    error instanceof Error ? error.message : 'Fila no válida.',
                duplicate: false,
            };
        }
    });
}
function csvCell(value: string) {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
}
export function exportExpenseCsv(book: ExpenseBook) {
    const headers = [
        'Fecha',
        'Concepto',
        'Importe',
        'Tipo',
        'Categoría',
        'Cuenta',
        'Cuenta destino',
        'Etiquetas',
    ];
    return (
        '\uFEFF' +
        [
            headers,
            ...book.entries.map((e) => [
                e.date,
                e.description,
                (e.amountCents / 100).toFixed(2).replace('.', ','),
                {
                    expense: 'gasto',
                    income: 'ingreso',
                    transfer: 'transferencia',
                    refund: 'reembolso',
                }[e.kind],
                book.categories.find((c) => c.id === e.categoryId)?.name ?? '',
                book.accounts.find((a) => a.id === e.accountId)?.name ?? '',
                book.accounts.find((a) => a.id === e.toAccountId)?.name ?? '',
                e.tags.join('|'),
            ]),
        ]
            .map((row) => row.map(csvCell).join(';'))
            .join('\r\n')
    );
}
export function downloadExpenseFile(
    content: string,
    name: string,
    type: string,
) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
