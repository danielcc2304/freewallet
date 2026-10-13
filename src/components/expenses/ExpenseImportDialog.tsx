import { useEffect, useMemo, useState } from 'react';
import type { ExpenseBook } from '../../types/expenses';
import {
    CSV_FIELDS,
    guessCsvMapping,
    previewExpenseImport,
    suggestBbvaExpenseCategory,
} from '../../services/expenseImport';
import type {
    CsvMapping,
    ExpenseImportDocument,
} from '../../services/expenseImport';
import { money } from '../../services/expensePlanner';
const labels = {
    date: 'Fecha',
    description: 'Concepto',
    amount: 'Importe',
    kind: 'Tipo',
    category: 'Categoría',
    account: 'Cuenta',
    toAccount: 'Cuenta destino',
    tags: 'Etiquetas',
};
export function ExpenseImportDialog({
    book,
    document,
    saving,
    onSave,
    onClose,
}: {
    book: ExpenseBook;
    document: ExpenseImportDocument;
    saving: boolean;
    onSave: (book: ExpenseBook) => Promise<void>;
    onClose: () => void;
}) {
    const [sheetIndex, setSheetIndex] = useState(0);
    const [onlyCards, setOnlyCards] = useState(false);
    const sheet = document.sheets[sheetIndex];
    const [mapping, setMapping] = useState<CsvMapping>(() =>
        guessCsvMapping(document.sheets[0].rows[0]),
    );
    const [account, setAccount] = useState(
        book.accounts.find((a) => !a.archived)?.id ?? '',
    );
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [error, setError] = useState('');
    const [categoryOverrides, setCategoryOverrides] = useState<
        Record<number, string>
    >({});
    const [previewPage, setPreviewPage] = useState(0);
    useEffect(() => {
        setCategoryOverrides({});
        setPreviewPage(0);
    }, [document, sheetIndex]);
    useEffect(() => setPreviewPage(0), [onlyCards]);
    const selected = useMemo(() => {
        const indices = sheet.rows
            .map((_, i) => i)
            .filter(
                (i) =>
                    i === 0 ||
                    !onlyCards ||
                    sheet.cardColumn === undefined ||
                    sheet.rows[i][sheet.cardColumn]?.trim().toLowerCase() ===
                        'pago con tarjeta',
            );
        return {
            rows: indices.map((i) => sheet.rows[i]),
            sourceLines: sheet.sourceLines
                ? indices.map((i) => sheet.sourceLines![i])
                : undefined,
        };
    }, [sheet, onlyCards]);
    const rows = selected.rows;
    const basePreview = useMemo(
        () =>
            previewExpenseImport(book, rows, mapping, account, {
                sourceLines: selected.sourceLines,
                sourceLabel: document.format === 'excel' ? 'Excel' : 'CSV',
            }),
        [book, rows, mapping, account, selected.sourceLines, document.format],
    );
    const reviewBbvaCategories =
        sheet.bank === 'bbva' &&
        sheet.movementColumn !== undefined &&
        mapping.category < 0;
    const categorySuggestions = useMemo(() => {
        const suggestions = new Map<number, string>();
        if (!reviewBbvaCategories || sheet.movementColumn === undefined)
            return suggestions;
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
            const line = selected.sourceLines?.[rowIndex] ?? rowIndex + 1;
            const description =
                mapping.description >= 0
                    ? (rows[rowIndex][mapping.description] ?? '')
                    : '';
            const movement = rows[rowIndex][sheet.movementColumn] ?? '';
            const categoryId = suggestBbvaExpenseCategory(
                book.categories,
                `${movement} ${description}`,
            );
            if (categoryId) suggestions.set(line, categoryId);
        }
        return suggestions;
    }, [
        book.categories,
        mapping.description,
        reviewBbvaCategories,
        rows,
        selected.sourceLines,
        sheet.movementColumn,
    ]);
    const preview = useMemo(
        () =>
            basePreview.map((row) => {
                if (
                    !row.entry ||
                    (row.entry.kind !== 'expense' && row.entry.kind !== 'refund')
                )
                    return row;
                const categoryId = reviewBbvaCategories
                    ? categoryOverrides[row.line] ??
                      categorySuggestions.get(row.line) ??
                      row.entry.categoryId
                    : row.entry.categoryId;
                if (!categoryId || categoryId === row.entry.categoryId)
                    return row;
                return { ...row, entry: { ...row.entry, categoryId } };
            }),
        [
            basePreview,
            categoryOverrides,
            categorySuggestions,
            reviewBbvaCategories,
        ],
    );
    const previewPageSize = 50;
    const previewPageCount = Math.max(
        1,
        Math.ceil(preview.length / previewPageSize),
    );
    const activePreviewPage = Math.min(previewPage, previewPageCount - 1);
    const previewStart = reviewBbvaCategories
        ? activePreviewPage * previewPageSize
        : 0;
    const visiblePreview = preview.slice(
        previewStart,
        previewStart + previewPageSize,
    );
    const valid = preview.filter(
        (row) => row.entry && (!skipDuplicates || !row.duplicate),
    );
    const invalid = preview.filter((row) => row.error);
    const duplicates = preview.filter((row) => row.duplicate);
    const save = async () => {
        setError('');
        try {
            await onSave({
                ...book,
                entries: [...book.entries, ...valid.map((row) => row.entry!)],
            });
            onClose();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'No se pudo importar.',
            );
        }
    };
    return (
        <div className="expense-import">
            {document.sheets.length > 1 && (
                <label className="expense-field">
                    <span>Hoja del Excel</span>
                    <select
                        value={sheetIndex}
                        onChange={(e) => {
                            const index = Number(e.target.value);
                            setSheetIndex(index);
                            setOnlyCards(false);
                            setMapping(
                                guessCsvMapping(document.sheets[index].rows[0]),
                            );
                            setError('');
                        }}
                    >
                        {document.sheets.map((s, i) => (
                            <option key={i} value={i}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            <p className="expense-hint">
                Asocia las columnas de tu banco. Sin columna de tipo, los
                importes negativos son gastos y los positivos ingresos.
            </p>
            {sheet.bank === 'bbva' && (
                <>
                    <p className="expense-hint">
                        Formato BBVA detectado. Se usa la fecha del movimiento;
                        los abonos de tarjeta se consideran reembolsos. Revisa
                        las transferencias entre tus propias cuentas.
                    </p>
                    {reviewBbvaCategories && (
                        <p className="expense-hint">
                            Se proponen categorías según palabras del movimiento
                            y del concepto. Revisa o cambia cada propuesta antes
                            de importar; las filas ambiguas o sin coincidencia
                            mantienen la categoría por defecto.
                        </p>
                    )}
                    <label className="expense-check">
                        <input
                            type="checkbox"
                            checked={onlyCards}
                            onChange={(e) => setOnlyCards(e.target.checked)}
                        />
                        Solo pagos de tarjeta
                    </label>
                </>
            )}
            <div className="expense-form-grid">
                {CSV_FIELDS.map((field) => (
                    <label key={field} className="expense-field">
                        <span>
                            {labels[field]}
                            {['date', 'description', 'amount'].includes(field)
                                ? ' *'
                                : ''}
                        </span>
                        <select
                            value={mapping[field]}
                            onChange={(e) =>
                                setMapping({
                                    ...mapping,
                                    [field]: Number(e.target.value),
                                })
                            }
                        >
                            <option value={-1}>Sin columna</option>
                            {rows[0].map((header, i) => (
                                <option key={i} value={i}>
                                    {header || `Columna ${i + 1}`}
                                </option>
                            ))}
                        </select>
                    </label>
                ))}
                <label className="expense-field">
                    <span>Cuenta si no consta en el archivo</span>
                    <select
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                    >
                        {book.accounts
                            .filter((a) => !a.archived)
                            .map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                    </select>
                </label>
            </div>
            <label className="expense-check">
                <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                />
                Omitir coincidencias de fecha, concepto, importe y cuenta (
                {duplicates.length})
            </label>
            <p className="expense-hint">
                Si son compras distintas pero iguales, desmarca esta opción para
                incluirlas.
            </p>
            <div className="expense-import-summary">
                <strong>{valid.length} para importar</strong>
                <span>
                    {invalid.length} filas inválidas ·{' '}
                    {skipDuplicates ? duplicates.length : 0} coincidencias
                    omitidas
                </span>
            </div>
            <div className="expense-table-scroll">
                <table className="expense-table">
                    <thead>
                        <tr>
                            <th>Fila</th>
                            <th>Concepto / error</th>
                            <th>Tipo</th>
                            <th>Importe</th>
                            {reviewBbvaCategories && <th>Categoría</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {visiblePreview.map((row) => (
                            <tr key={row.line}>
                                <td>{row.line}</td>
                                <td>
                                    {row.error ?? row.entry?.description}
                                    {row.duplicate && (
                                        <small>Coincidencia</small>
                                    )}
                                </td>
                                <td>
                                    {row.entry
                                        ? {
                                              expense: 'Gasto',
                                              income: 'Ingreso',
                                              refund: 'Reembolso',
                                              transfer: 'Transferencia',
                                          }[row.entry.kind]
                                        : '—'}
                                </td>
                                <td>
                                    {row.entry
                                        ? money(row.entry.amountCents)
                                        : '—'}
                                </td>
                                {reviewBbvaCategories && (
                                    <td className="expense-import__category-cell">
                                        {row.entry?.categoryId ? (
                                            <>
                                                <select
                                                    className="expense-import__category-select"
                                                    aria-label={`Categoría para la fila ${row.line}`}
                                                    value={row.entry.categoryId}
                                                    onChange={(event) =>
                                                        setCategoryOverrides(
                                                            (current) => ({
                                                                ...current,
                                                                [row.line]:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                >
                                                    {book.categories.map(
                                                        (category) => (
                                                            <option
                                                                key={category.id}
                                                                value={category.id}
                                                            >
                                                                {category.name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <small>
                                                    {categoryOverrides[row.line]
                                                        ? 'Revisada'
                                                        : categorySuggestions.has(
                                                                row.line,
                                                            )
                                                          ? 'Sugerida'
                                                          : 'Sin sugerencia'}
                                                </small>
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {reviewBbvaCategories && preview.length > previewPageSize && (
                <div
                    className="expense-import__pagination"
                    aria-label="Páginas de la importación"
                >
                    <span>
                        {previewStart + 1}–
                        {Math.min(previewStart + previewPageSize, preview.length)}{' '}
                        de {preview.length}
                    </span>
                    <button
                        type="button"
                        className="expense-btn expense-btn--secondary"
                        disabled={activePreviewPage === 0}
                        onClick={() =>
                            setPreviewPage((page) => Math.max(0, page - 1))
                        }
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        className="expense-btn expense-btn--secondary"
                        disabled={activePreviewPage >= previewPageCount - 1}
                        onClick={() =>
                            setPreviewPage((page) =>
                                Math.min(previewPageCount - 1, page + 1),
                            )
                        }
                    >
                        Siguiente
                    </button>
                </div>
            )}
            {!reviewBbvaCategories && preview.length > previewPageSize && (
                <p className="expense-hint">
                    Vista previa de las primeras 50 filas de {preview.length}.
                </p>
            )}
            {invalid.length > 0 && (
                <p className="expense-hint">
                    Las filas inválidas no se importan. Corrige el archivo si
                    quieres incluirlas.
                </p>
            )}
            {error && (
                <p className="expense-error" role="alert">
                    {error}
                </p>
            )}
            <div className="expense-form-actions">
                <button
                    type="button"
                    className="expense-btn expense-btn--secondary"
                    onClick={onClose}
                    disabled={saving}
                >
                    Cancelar
                </button>
                <button
                    className="expense-btn"
                    type="button"
                    disabled={saving || !valid.length}
                    onClick={() => void save()}
                >
                    {saving
                        ? 'Importando…'
                        : `Importar ${valid.length} movimientos`}
                </button>
            </div>
        </div>
    );
}
