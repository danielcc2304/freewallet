import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { readExpenseWorkbook } from '../src/services/expenseWorkbook';
import { emptyExpenseBook } from '../src/services/expensePlanner';
import {
    guessCsvMapping,
    previewExpenseImport,
    readExpenseCsv,
} from '../src/services/expenseImport';

const headers = [
    'Fecha valor',
    'Fecha',
    'Concepto',
    'Movimiento',
    'Importe',
    'Divisa',
    'Disponible',
    'Divisa',
    'Observaciones',
];
const sheet = XLSX.utils.aoa_to_sheet([]);
XLSX.utils.sheet_add_aoa(
    sheet,
    [
        ['Movimientos'],
        ['Fecha de generación del informe: 09/10/2026'],
        headers,
        [
            '07/10/2026',
            '09/10/2026',
            'Tienda Ejemplo',
            'Pago con tarjeta',
            -42.5,
            'EUR',
            1000,
            'EUR',
            '',
        ],
        [
            '08/10/2026',
            '09/10/2026',
            'Tienda Ejemplo',
            'Pago con tarjeta',
            5,
            'EUR',
            1042.5,
            'EUR',
            '',
        ],
        [
            '09/10/2026',
            '09/10/2026',
            'Abono de nómina',
            'Empresa Ejemplo',
            2000,
            'EUR',
            1037.5,
            'EUR',
            '',
        ],
        [
            '09/10/2026',
            '09/10/2026',
            'Bizum',
            'ENVIADO: cena',
            -12,
            'EUR',
            100,
            'EUR',
            '',
        ],
        [],
        [],
    ],
    { origin: 'B3' },
);
sheet['!ref'] = 'B3:J11';
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, sheet, 'Informe BBVA');
const encode = (
    wb: XLSX.WorkBook,
    bookType: XLSX.BookType = 'xlsx',
): ArrayBuffer => XLSX.write(wb, { type: 'array', bookType });
const book = emptyExpenseBook();
for (const format of ['xlsx', 'xls'] as const) {
    const doc = await readExpenseWorkbook(encode(wb, format));
    assert.equal(doc.sheets.length, 1);
    const data = doc.sheets[0];
    assert.equal(data.bank, 'bbva');
    assert.equal(data.rows.length, 5, 'Empty tail rows are not imported');
    assert.deepEqual(data.sourceLines, [5, 6, 7, 8, 9]);
    const preview = previewExpenseImport(
        book,
        data.rows,
        guessCsvMapping(data.rows[0]),
        'main',
        { sourceLines: data.sourceLines, sourceLabel: 'Excel' },
    );
    assert.ok(preview.every((p) => p.entry && !p.error));
    assert.equal(preview[0].line, 6);
    assert.equal(
        preview[0].entry!.date,
        '2026-10-09',
        'Posting date, not value date',
    );
    assert.equal(preview[0].entry!.amountCents, 4250);
    assert.equal(preview[1].entry!.kind, 'refund');
    assert.equal(preview[2].entry!.kind, 'income');
    assert.equal(preview[3].entry!.description, 'Bizum · ENVIADO: cena');
    assert.equal(preview[0].entry!.note, 'Importado desde Excel.');
    const existing = { ...book, entries: preview.map((p) => p.entry!) };
    assert.equal(
        previewExpenseImport(
            existing,
            data.rows,
            guessCsvMapping(data.rows[0]),
            'main',
        ).filter((p) => p.duplicate).length,
        4,
    );
    const csv = readExpenseCsv(
        'Fecha;Concepto;Importe;Tipo\n09/10/2026;Tienda Ejemplo;-42,50;gasto\n09/10/2026;Tienda Ejemplo;5;reembolso\n',
    );
    assert.ok(
        previewExpenseImport(
            existing,
            csv,
            guessCsvMapping(csv[0]),
            'main',
        ).every((p) => p.duplicate),
        'Converted CSV and Excel share duplicate fingerprints',
    );
}

const textBook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
    textBook,
    XLSX.utils.aoa_to_sheet([
        [...headers, 'Tipo'],
        [
            '09/10/2026',
            '09/10/2026',
            'Text amount',
            'Pago con tarjeta',
            '-1.002,34',
            'EUR',
            0,
            'EUR',
            '',
            'Pago',
        ],
    ]),
    'BBVA text',
);
const textSheet = (await readExpenseWorkbook(encode(textBook))).sheets[0];
const textPreview = previewExpenseImport(
    book,
    textSheet.rows,
    guessCsvMapping(textSheet.rows[0]),
    'main',
);
assert.equal(textPreview[0].entry!.kind, 'expense');
assert.equal(textPreview[0].entry!.amountCents, 100234);

// Date serials and number formats must not change a money amount or date.
for (const date1904 of [false, true]) {
    const generic = XLSX.utils.book_new();
    generic.Workbook = { WBProps: { date1904 } };
    const serial =
        (Date.UTC(2026, 9, 9) -
            Date.UTC(
                date1904 ? 1904 : 1899,
                date1904 ? 0 : 11,
                date1904 ? 1 : 30,
            )) /
        86400000;
    const s = XLSX.utils.aoa_to_sheet([
        ['Date', 'Description', 'Amount', 'Currency'],
        [serial, 'Formatted purchase', -1234.56, 'EUR'],
        ['2026-02-31', 'Invalid date', -1, 'EUR'],
        [serial, 'Foreign currency', -10, 'USD'],
        [serial, 'Extra decimals', -1.234, 'EUR'],
    ]);
    s.A2.z = 'dd/mm/yyyy';
    s.C2.z = '#,##0.00 "€"';
    XLSX.utils.book_append_sheet(generic, s, 'Transactions');
    XLSX.utils.book_append_sheet(
        generic,
        XLSX.utils.aoa_to_sheet([['Notes']]),
        'Cover',
    );
    XLSX.utils.book_append_sheet(
        generic,
        XLSX.utils.aoa_to_sheet([
            ['Fecha', 'Concepto', 'Importe'],
            ['09/10/2026', 'Other sheet', -2],
        ]),
        'Second account',
    );
    const doc = await readExpenseWorkbook(encode(generic));
    assert.equal(doc.sheets.length, 2);
    const data = doc.sheets[0];
    const preview = previewExpenseImport(
        book,
        data.rows,
        guessCsvMapping(data.rows[0]),
        'main',
    );
    assert.equal(preview[0].entry!.date, '2026-10-09');
    assert.equal(preview[0].entry!.amountCents, 123456);
    assert.ok(preview[1].error);
    assert.match(preview[2].error!, /EUR/);
    assert.ok(preview[3].error);
}
await assert.rejects(readExpenseWorkbook(new ArrayBuffer(2097153)), /2 MB/);
const over = XLSX.utils.book_new();
const wide = XLSX.utils.aoa_to_sheet([Array(101).fill('Header'), [1, 2]]);
XLSX.utils.book_append_sheet(over, wide, 'Too wide');
await assert.rejects(readExpenseWorkbook(encode(over)), /100 columnas/);
const empty = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
    empty,
    XLSX.utils.aoa_to_sheet([['Empty']]),
    'Empty',
);
await assert.rejects(
    readExpenseWorkbook(encode(empty)),
    /tabla de movimientos/,
);
console.log(
    'PASS: BBVA xlsx/xls headers/offsets, posting dates, refunds, duplicate detection across Excel and CSV, Excel serial dates/1904, formatted amounts, multiple sheets, EUR validation and file limits.',
);
