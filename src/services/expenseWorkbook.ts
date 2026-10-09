import type { CellObject, WorkBook } from 'xlsx';
import { EXPENSE_LIMIT_BYTES, parseExpenseAmount } from './expensePlanner';
import { guessCsvMapping } from './expenseImport';
import type {
    ExpenseImportDocument,
    ExpenseImportSheet,
} from './expenseImport';

const MAX_ROWS = 10101; // 10,000 entries + up to 100 introductory rows + header.
const clean = (v: string) =>
    v
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

/** Excel is loaded only on import. Read cached values; never evaluate formulas. */
export async function readExpenseWorkbook(
    bytes: ArrayBuffer,
): Promise<ExpenseImportDocument> {
    if (bytes.byteLength > EXPENSE_LIMIT_BYTES)
        throw new Error('El Excel supera los 2 MB.');
    const XLSX = await import('xlsx');
    let workbook: WorkBook;
    try {
        const metadata = XLSX.read(bytes, { type: 'array', bookSheets: true });
        if (!metadata.SheetNames.length || metadata.SheetNames.length > 20)
            throw new Error('El Excel debe tener entre 1 y 20 hojas.');
        workbook = XLSX.read(bytes, {
            type: 'array',
            sheetRows: MAX_ROWS + 1,
            cellDates: false,
            cellNF: true,
        });
    } catch {
        throw new Error(
            'No se pudo abrir el Excel. Usa un archivo .xlsx o .xls válido, sin contraseña y con un máximo de 20 hojas.',
        );
    }
    const sheets: ExpenseImportSheet[] = [];
    for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        if (!sheet?.['!ref']) continue;
        const range = XLSX.utils.decode_range(
            sheet['!fullref'] ?? sheet['!ref'],
        );
        if (
            range.e.r - range.s.r + 1 > MAX_ROWS ||
            range.e.c - range.s.c + 1 > 100
        )
            throw new Error(
                `La hoja «${name}» supera las 10.101 filas o las 100 columnas. Reduce el intervalo del extracto.`,
            );
        const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
            header: 1,
            raw: true,
            defval: '',
            blankrows: true,
        });
        const asText = (value: unknown) =>
            value === null || value === undefined ? '' : String(value);
        let headerIndex = raw.findIndex((row) => {
            const mapping = guessCsvMapping(row.map(asText));
            return (
                mapping.date >= 0 &&
                mapping.description >= 0 &&
                mapping.amount >= 0
            );
        });
        if (headerIndex < 0)
            headerIndex = raw.findIndex(
                (row) => row.filter((v) => asText(v).trim()).length >= 2,
            );
        if (headerIndex < 0) continue;
        const headers = raw[headerIndex].map(asText);
        const mapping = guessCsvMapping(headers);
        const isBbva = [
            'fecha valor',
            'fecha',
            'concepto',
            'movimiento',
            'importe',
            'divisa',
        ].every((h) => headers.some((v) => clean(v) === h));
        const movementColumn = isBbva
            ? headers.findIndex((h) => clean(h) === 'movimiento')
            : -1;
        const date1904 = !!workbook.Workbook?.WBProps?.date1904;
        const value = (
            cell: CellObject | undefined,
            column: number,
        ): string => {
            if (!cell || cell.v === undefined || cell.v === null) return '';
            if (cell.t === 'e')
                return `Error de Excel: ${asText(cell.w || cell.v)}`;
            if (cell.v instanceof Date)
                return cell.v.toISOString().slice(0, 10);
            if (typeof cell.v === 'number') {
                if (
                    column === mapping.date ||
                    clean(headers[column] ?? '').startsWith('fecha') ||
                    (cell.z && XLSX.SSF.is_date(cell.z))
                ) {
                    const d = XLSX.SSF.parse_date_code(cell.v, { date1904 });
                    if (d)
                        return `${String(d.y).padStart(4, '0')}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
                }
                if (column === mapping.amount) {
                    const cents = Math.round(cell.v * 100);
                    if (
                        Number.isSafeInteger(cents) &&
                        Math.abs(cents / 100 - cell.v) < 1e-8
                    )
                        return (cents / 100).toFixed(2);
                }
            }
            return asText(cell.v);
        };
        const rows = [headers];
        const sourceLines = [range.s.r + headerIndex + 1];
        // Derived BBVA columns share fingerprints with the CSV conversion.
        const typeColumn = isBbva ? headers.length : -1;
        if (isBbva) {
            if (mapping.kind >= 0) headers[mapping.kind] += ' BBVA';
            headers.push('Tipo');
        }
        for (let i = headerIndex + 1; i < raw.length; i++) {
            if (!raw[i].some((v) => asText(v).trim())) continue;
            const row = Array.from({ length: headers.length }, (_, c) =>
                value(
                    sheet[
                        XLSX.utils.encode_cell({
                            r: range.s.r + i,
                            c: range.s.c + c,
                        })
                    ],
                    c,
                ),
            );
            if (isBbva) {
                const movement = row[movementColumn].trim();
                const card = clean(movement) === 'pago con tarjeta';
                try {
                    const amount = parseExpenseAmount(
                        row[mapping.amount],
                        true,
                    );
                    row[typeColumn] =
                        amount < 0 ? 'gasto' : card ? 'reembolso' : 'ingreso';
                } catch {
                    // Invalid amounts remain visible as errors in the preview.
                    row[typeColumn] = '';
                }
                const concept = row[mapping.description].trim();
                row[mapping.description] =
                    movement && !card ? `${concept} · ${movement}` : concept;
            }
            rows.push(row);
            sourceLines.push(range.s.r + i + 1);
        }
        if (rows.length <= 1) continue;
        if (rows.length > 10001)
            throw new Error(`La hoja «${name}» supera los 10.000 movimientos.`);
        sheets.push({
            name,
            rows,
            sourceLines,
            bank: isBbva ? 'bbva' : undefined,
            cardColumn: isBbva ? movementColumn : undefined,
        });
    }
    if (!sheets.length)
        throw new Error(
            'El Excel no contiene una tabla de movimientos. Incluye una fila de cabeceras y al menos un movimiento.',
        );
    return { format: 'excel', sheets };
}
