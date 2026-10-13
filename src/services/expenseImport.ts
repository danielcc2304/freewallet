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
export interface ExpenseImportSheet {
    name: string;
    rows: string[][];
    sourceLines?: number[];
    bank?: 'bbva';
    movementColumn?: number;
    cardColumn?: number;
}
export interface ExpenseImportDocument {
    format: 'csv' | 'excel';
    sheets: ExpenseImportSheet[];
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
const normalizedPhrase = (s: string) =>
    normalized(s)
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
const includesPhrase = (normalizedText: string, phrase: string) => {
    const normalizedMatch = normalizedPhrase(phrase);
    return Boolean(
        normalizedMatch && ` ${normalizedText} `.includes(` ${normalizedMatch} `),
    );
};

const BBVA_CATEGORY_KEYWORDS: { categoryId: string; terms: string[] }[] = [
    {
        categoryId: 'home',
        terms: [
            'vivienda', 'alquiler', 'hipoteca', 'luz', 'electricidad',
            'recibo luz', 'agua', 'recibo agua', 'agua potable', 'basura',
            'basuras', 'tasa basura', 'residuos', 'tasa residuos',
            'recogida residuos', 'alcantarillado', 'saneamiento', 'gas natural',
            'gas propano', 'bombona de butano', 'suministros',
            'comunidad de propietarios', 'comunidad vecinos', 'cuota comunidad',
            'reparacion hogar', 'mantenimiento vivienda', 'fontanero',
            'calefaccion', 'internet', 'telefono', 'fibra', 'telecom', 'energia',
            'digi', 'movistar', 'vodafone', 'orange', 'jazztel', 'masmovil',
            'yoigo', 'lowi', 'pepephone', 'endesa', 'iberdrola', 'naturgy',
            'octopus energy', 'totalenergies', 'edp', 'aqualia', 'emasesa',
            'canal isabel ii', 'agbar', 'veolia',
        ],
    },
    {
        categoryId: 'food',
        terms: [
            'alimentacion', 'comida', 'cena', 'desayuno', 'almuerzo',
            'merienda', 'restaurante', 'cafeteria', 'panaderia', 'fruteria',
            'carniceria', 'pescaderia', 'supermercado', 'mercadona',
            'dia', 'lidl', 'aldi', 'carrefour', 'eroski', 'consum', 'ahorramas',
            'alcampo', 'al campo', 'hipercor', 'hiperdino', 'bonpreu', 'bonarea',
            'caprabo', 'gadis', 'froiz', 'spar', 'coviran', 'makro', 'masymas',
            'supercor', 'condis', 'veritas', 'unide', 'hiperber', 'superdumbo',
            'el jamon', 'la sirena', 'bm supermercados', 'sanchez romero',
            'glovo', 'just eat', 'uber eats', 'deliveroo', 'mcdonalds',
            'burger king', 'kfc', 'subway', 'dominos', 'telepizza', 'starbucks',
            'vips', '100 montaditos', 'pans company', 'goiko', 'food truck',
            'pizzeria', 'sushi',
        ],
    },
    {
        categoryId: 'transport',
        terms: [
            'transporte', 'taxi', 'uber', 'cabify', 'bolt', 'metro', 'autobus',
            'bus', 'tren', 'renfe', 'cercanias', 'emt', 'tmb', 'alsa', 'avanza',
            'gasolina', 'gasolinera', 'diesel', 'combustible', 'parking',
            'aparcamiento', 'peaje', 'repsol', 'cepsa', 'petroprix', 'plenoil',
            'ballenoil', 'shell', 'galp', 'bp', 'easypark', 'telpark', 'saba',
        ],
    },
    {
        categoryId: 'health',
        terms: [
            'salud', 'farmacia', 'parafarmacia', 'medico', 'hospital',
            'dentista', 'clinica', 'optica', 'fisioterapia', 'analisis clinicos',
            'sanitas', 'adeslas', 'asisa', 'dkv', 'veterinario', 'veterinaria',
        ],
    },
    {
        categoryId: 'leisure',
        terms: [
            'ocio', 'cine', 'cinema', 'cinesa', 'yelmo', 'kinepolis', 'ocine',
            'teatro', 'concierto', 'ticketmaster', 'entradas', 'festival',
            'museo', 'parque tematico', 'escape room', 'juego', 'deporte',
            'gimnasio', 'steam', 'playstation', 'xbox', 'nintendo',
            'parque de atracciones',
        ],
    },
    {
        categoryId: 'shopping',
        terms: [
            'compras', 'ropa', 'electronica', 'zara', 'h m', 'mango', 'primark',
            'decathlon', 'mediamarkt', 'media markt', 'fnac', 'ikea',
            'leroy merlin', 'el corte ingles', 'amazon', 'shein', 'temu',
            'zalando', 'pull and bear', 'bershka', 'stradivarius', 'lefties',
            'c and a', 'carrefour online', 'pccomponentes', 'apple store',
        ],
    },
    {
        categoryId: 'subscriptions',
        terms: [
            'suscripcion', 'netflix', 'spotify', 'disney plus', 'disney+',
            'hbo', 'hbo max', 'max', 'prime video', 'amazon prime', 'icloud',
            'youtube premium', 'google one', 'microsoft 365',
            'apple music', 'apple tv', 'adobe', 'dropbox', 'filmin', 'skyshowtime',
            'deezer', 'tidal', 'crunchyroll',
        ],
    },
    {
        categoryId: 'education',
        terms: [
            'formacion', 'educacion', 'curso', 'academia', 'universidad',
            'matricula', 'colegio', 'escuela',
        ],
    },
];

/** Suggest only an unambiguous BBVA category; keep uncertain rows editable in the import preview. */
export function suggestBbvaExpenseCategory(
    categories: ExpenseBook['categories'],
    text: string,
): string | undefined {
    const normalizedText = normalizedPhrase(text);
    const homeCategoryId = categories.find((category) => category.id === 'home')?.id;
    const categoryIds = new Set(
        categories
            .filter((category) =>
                includesPhrase(normalizedText, category.name),
            )
            .map((category) =>
                (category.id === 'bills' ||
                    normalizedPhrase(category.name) === 'suministros') &&
                homeCategoryId
                    ? homeCategoryId
                    : category.id,
            ),
    );
    const isUberEats = includesPhrase(normalizedText, 'uber eats');
    const isAmazonPrime =
        includesPhrase(normalizedText, 'amazon prime') ||
        includesPhrase(normalizedText, 'prime video');
    for (const rule of BBVA_CATEGORY_KEYWORDS) {
        if (!categories.some((category) => category.id === rule.categoryId))
            continue;
        if (
            rule.terms.some((term) => {
                if (isUberEats && rule.categoryId === 'transport' && term === 'uber')
                    return false;
                if (
                    isAmazonPrime &&
                    rule.categoryId === 'shopping' &&
                    term === 'amazon'
                )
                    return false;
                return includesPhrase(normalizedText, term);
            })
        )
            categoryIds.add(rule.categoryId);
    }
    return categoryIds.size === 1 ? [...categoryIds][0] : undefined;
}

export function guessCsvMapping(headers: string[]): CsvMapping {
    const names: Record<CsvField, string[]> = {
        date: [
            'fecha',
            'date',
            'fecha operacion',
            'fecha de operacion',
            'fecha contable',
            'fecha movimiento',
            'f. operacion',
            'f.operacion',
        ],
        description: [
            'concepto',
            'descripcion',
            'description',
            'comercio',
            'detalle',
            'descripcion del movimiento',
        ],
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
    options: { sourceLines?: number[]; sourceLabel?: 'CSV' | 'Excel' } = {},
): ExpenseImportRow[] {
    const existing = new Set(book.entries.map(fingerprint));
    const currencyColumn = rows[0].findIndex((h) =>
        ['divisa', 'currency', 'moneda'].includes(normalized(h)),
    );
    return rows.slice(1).map((row, index) => {
        const line = options.sourceLines?.[index + 1] ?? index + 2;
        try {
            if (
                currencyColumn >= 0 &&
                (row[currencyColumn] ?? '').trim().toUpperCase() !== 'EUR'
            )
                throw new Error('Solo se admiten movimientos en EUR.');
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
                note: `Importado desde ${options.sourceLabel ?? 'CSV'}.`,
            };
            validateExpenseBook({ ...book, entries: [entry] });
            const key = fingerprint(entry),
                duplicate = existing.has(key);
            existing.add(key);
            return { line, entry, duplicate };
        } catch (error) {
            return {
                line,
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
