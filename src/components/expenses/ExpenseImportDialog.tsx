import { useMemo, useState } from 'react';
import type { ExpenseBook } from '../../types/expenses';
import {
    CSV_FIELDS,
    guessCsvMapping,
    previewExpenseImport,
} from '../../services/expenseImport';
import type { CsvMapping } from '../../services/expenseImport';
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
    rows,
    saving,
    onSave,
    onClose,
}: {
    book: ExpenseBook;
    rows: string[][];
    saving: boolean;
    onSave: (book: ExpenseBook) => Promise<void>;
    onClose: () => void;
}) {
    const [mapping, setMapping] = useState<CsvMapping>(() =>
        guessCsvMapping(rows[0]),
    );
    const [account, setAccount] = useState(
        book.accounts.find((a) => !a.archived)?.id ?? '',
    );
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [error, setError] = useState('');
    const preview = useMemo(
        () => previewExpenseImport(book, rows, mapping, account),
        [book, rows, mapping, account],
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
            <p className="expense-hint">
                Asocia las columnas de tu banco. Sin columna de tipo, los
                importes negativos son gastos y los positivos ingresos.
            </p>
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
                            <th>Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {preview.slice(0, 50).map((row) => (
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
                                        ? money(row.entry.amountCents)
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {preview.length > 50 && (
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
