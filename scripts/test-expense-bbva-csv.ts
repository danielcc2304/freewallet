import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { readExpenseCsvDocument, guessCsvMapping, previewExpenseImport } from '../src/services/expenseImport';
import { readExpenseWorkbook } from '../src/services/expenseWorkbook';
import { emptyExpenseBook } from '../src/services/expensePlanner';

// Synthetic data reproduces BBVA's leading empty column and report preamble.
const raw =
    '\uFEFF,,,,,,,,,\r\n,,,,,,,,,\r\n,,Movimientos,,,,,,,\r\n,,Fecha de generación del informe: 03/11/2026,,,,,,,\r\n,Fecha valor,Fecha,Concepto,Movimiento,Importe,Divisa,Disponible,Divisa,Observaciones\r\n,30/10/2026,31/10/2026,"Tienda, ejemplo",Pago con tarjeta,-16.99,EUR,100,EUR,\r\n,29/10/2026,30/10/2026,Bizum,Recibido: ejemplo,2.4,EUR,100,EUR,\r\n,29/10/2026,30/10/2026,Tienda,Pago con tarjeta,5.25,EUR,100,EUR,\r\n';
const sheet = readExpenseCsvDocument(raw, 'extracto.csv').sheets[0];
assert.equal(sheet.bank, 'bbva');
assert.deepEqual(sheet.sourceLines, [5, 6, 7, 8]);
const book = emptyExpenseBook();
const account = book.accounts[0].id;
const preview = previewExpenseImport(book, sheet.rows, guessCsvMapping(sheet.rows[0]), account, {
    sourceLines: sheet.sourceLines,
});
assert.ok(preview.every((row) => !row.error));
assert.deepEqual(
    preview.map((row) => [row.entry!.kind, row.entry!.amountCents]),
    [
        ['expense', 1699],
        ['income', 240],
        ['refund', 525],
    ],
);
assert.equal(preview[0].entry!.date, '2026-10-31', 'Use posting date, not value date');
assert.equal(preview[0].entry!.description, 'Tienda, ejemplo');
assert.equal(preview[1].entry!.description, 'Bizum · Recibido: ejemplo');
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
        sheet.rows[0].slice(0, -1),
        ['', '30/10/2026', '31/10/2026', 'Tienda, ejemplo', 'Pago con tarjeta', -16.99, 'EUR', 100, 'EUR', ''],
    ]),
    'BBVA',
);
const excel = (await readExpenseWorkbook(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }))).sheets[0];
const withEntries = { ...book, entries: preview.map((row) => row.entry!) };
assert.equal(
    previewExpenseImport(withEntries, excel.rows, guessCsvMapping(excel.rows[0]), account)[0].duplicate,
    true,
    'CSV and Excel share duplicate fingerprints',
);
const generic = readExpenseCsvDocument('fecha;concepto;importe\n2026-10-01;Ejemplo;-10', 'generic.csv').sheets[0];
assert.equal(generic.bank, undefined);
assert.equal(
    previewExpenseImport(book, generic.rows, guessCsvMapping(generic.rows[0]), account)[0].entry!.amountCents,
    1000,
);
const invalid = readExpenseCsvDocument(raw.replace('-16.99,EUR', '-16.99,USD'), 'invalid.csv').sheets[0];
assert.match(previewExpenseImport(book, invalid.rows, guessCsvMapping(invalid.rows[0]), account)[0].error!, /EUR/);
const multiline = readExpenseCsvDocument(
    'fecha,concepto,importe\r\n2026-10-01,"Dos\r\nlíneas",-1\r\n2026-10-02,Otro,-2',
    'multiline.csv',
).sheets[0];
assert.deepEqual(multiline.sourceLines, [1, 2, 4]);
console.log(
    'PASS: BBVA CSV report headers, physical row numbers, posting dates, signed cents, refunds, Excel deduplication, generic CSV and currency validation.',
);
