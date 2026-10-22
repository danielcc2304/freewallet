import { DataTable } from '../ui/DataTable';
import { ExpenseField } from './ui/ExpenseField';
import { ExpenseCheckbox } from './ui/ExpenseCheckbox';
import { ExpenseGrid } from './ui/ExpenseGrid';
import { ExpenseButton } from './ui/ExpenseButton';
import { ExpenseActions } from './ui/ExpenseActions';
import { useMemo, useState } from 'react';
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
    const sheet = document.sheets[sheetIndex] ?? document.sheets[0];
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
    const [previousDocument, setPreviousDocument] = useState(document);
    if (previousDocument !== document) {
        setPreviousDocument(document);
        setSheetIndex(0);
        setOnlyCards(false);
        setMapping(guessCsvMapping(document.sheets[0].rows[0]));
        setCategoryOverrides({});
        setPreviewPage(0);
    }
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
                <ExpenseField label={<> Hoja del Excel </>} className="expense-field">

                    <select
                        value={sheetIndex}
                        onChange={(e) => {
                            const index = Number(e.target.value);
                            setSheetIndex(index);
                            setCategoryOverrides({});
                            setPreviewPage(0);
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
                </ExpenseField>
            )}
            <p className="expense-hint">
                Asocia cada columna con su dato. Fecha, Concepto e Importe son
                obligatorios.
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
                            mantienen la categoría por defecto. McDonald’s,
                            Burger King, KFC y otras cadenas rápidas se asignan
                            a Ocio.
                        </p>
                    )}
                    <ExpenseCheckbox className="expense-check">
                        <input
                            type="checkbox"
                            checked={onlyCards}
                            onChange={(e) => { setOnlyCards(e.target.checked); setPreviewPage(0); }}
                        />
                        Solo pagos de tarjeta
                    </ExpenseCheckbox>
                </>
            )}
            <ExpenseGrid variant="form" className="expense-form-grid">
                {CSV_FIELDS.map((field) => (
                    <ExpenseField label={<>
                            {labels[field]}
                            {['date', 'description', 'amount'].includes(field)
                                ? ' *'
                                : ''}
                         </>} key={field} className="expense-field">

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
                    </ExpenseField>
                ))}
                <ExpenseField label={<> Cuenta si no consta en el archivo </>} className="expense-field">

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
                </ExpenseField>
            </ExpenseGrid>
            <details className="expense-import-help">
                <summary>¿Qué significa cada dato de esta pantalla?</summary>
                <div className="expense-import-help__content">
                    {document.format === 'excel' && (
                        <p>
                            <strong>Hoja del Excel:</strong> elige la pestaña
                            que contiene los movimientos si el archivo tiene
                            varias.
                        </p>
                    )}
                    <p>
                        <strong>Columnas:</strong> cada selector indica de qué
                        columna leer ese dato; la selección se propone a partir
                        de los encabezados y puedes cambiarla. Fecha, Concepto e
                        Importe son obligatorios; las demás se pueden dejar en
                        «Sin columna».
                    </p>
                    <ul>
                        <li>
                            <strong>Fecha, Concepto e Importe:</strong> son el
                            día, la descripción del movimiento y su cantidad.
                            La fecha debe ser AAAA-MM-DD o DD/MM/AAAA.
                        </li>
                        <li>
                            <strong>Tipo e Importe:</strong> si asignas Tipo,
                            acepta Gasto, Ingreso, Transferencia o Reembolso y
                            ese tipo determina el movimiento. Si no hay columna
                            de Tipo, un importe negativo es gasto y uno positivo
                            es ingreso. La vista previa muestra el importe sin
                            signo; el Tipo indica su sentido.
                        </li>
                        <li>
                            <strong>Categoría:</strong> debe coincidir con una
                            categoría de tu cuenta. Si falta o no coincide, se
                            usa «Otros» (o la primera categoría disponible si
                            no existe «Otros»). En archivos BBVA, si no asignas
                            esta columna, se sugieren categorías que puedes
                            revisar en la tabla: «Sugerida» es automática,
                            «Revisada» la cambiaste tú y «Sin sugerencia» deja
                            la categoría por defecto.
                        </li>
                        <li>
                            <strong>Cuenta:</strong> si el archivo no indica
                            una, se usa la cuenta seleccionada en «Cuenta si no
                            consta en el archivo». Una cuenta escrita que no
                            exista genera un error en esa fila. Cuenta destino
                            solo se usa en transferencias y debe coincidir con
                            una cuenta existente.
                        </li>
                        <li>
                            <strong>Etiquetas:</strong> puedes separar varias
                            con el símbolo |. Solo se guardan como etiquetas,
                            no como categorías.
                        </li>
                    </ul>
                    {sheet.bank === 'bbva' && (
                        <p>
                            <strong>Solo pagos de tarjeta:</strong> deja solo
                            las filas cuyo movimiento sea «Pago con tarjeta».
                            En esas filas BBVA clasifica los importes positivos
                            como reembolsos y los negativos como gastos. Las
                            sugerencias de categoría se pueden cambiar antes de
                            importar.
                        </p>
                    )}
                    <p>
                        <strong>Moneda:</strong> si hay una columna cuyo
                        encabezado sea Divisa, Currency o Moneda, solo se
                        aceptan filas en EUR.
                    </p>
                    <p>
                        <strong>Resumen:</strong> «para importar» cuenta las
                        filas válidas, descontando las coincidencias si está
                        activado «Omitir». «Filas inválidas» indica filas que
                        no se pueden guardar y muestra el motivo en la tabla.
                        Las coincidencias comparan fecha, tipo, importe,
                        concepto y cuentas de origen/destino; se ignoran
                        mayúsculas y tildes en el concepto. Se buscan tanto en
                        los movimientos guardados como dentro del archivo.
                        Puedes desmarcar «Omitir» para incluirlas.
                    </p>
                    <p>
                        <strong>Vista previa:</strong> Fila indica la posición
                        del movimiento; «Concepto / error» muestra el concepto o
                        por qué no se importará; «Coincidencia» marca un posible
                        duplicado. Normalmente se muestran las primeras 50
                        filas; si revisas categorías BBVA puedes recorrer el
                        archivo en páginas de 50. Aún no se guarda nada hasta
                        pulsar
                        «Importar movimientos».
                    </p>
                </div>
            </details>
            <ExpenseCheckbox className="expense-check">
                <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                />
                Omitir duplicados ({duplicates.length})
            </ExpenseCheckbox>
            <p className="expense-hint">
                Se comparan fecha, tipo, importe, concepto y cuentas de origen y
                destino. Desmarca esta opción para incluir movimientos distintos
                con esos mismos datos.
            </p>
            <div className="expense-import-summary">
                <strong>{valid.length} para importar</strong>
                <span>
                    {invalid.length} filas inválidas ·{' '}
                    {skipDuplicates ? duplicates.length : 0} coincidencias
                    omitidas
                </span>
            </div>
            <DataTable appearance="expenses">
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
            </DataTable>
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
                    <ExpenseButton variant="secondary"
                        type="button"
                        className="expense-btn expense-btn--secondary"
                        disabled={activePreviewPage === 0}
                        onClick={() =>
                            setPreviewPage((page) => Math.max(0, page - 1))
                        }
                    >
                        Anterior
                    </ExpenseButton>
                    <ExpenseButton variant="secondary"
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
                    </ExpenseButton>
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
            <ExpenseActions variant="form" className="expense-form-actions">
                <ExpenseButton variant="secondary"
                    type="button"
                    className="expense-btn expense-btn--secondary"
                    onClick={onClose}
                    disabled={saving}
                >
                    Cancelar
                </ExpenseButton>
                <ExpenseButton
                    className="expense-btn"
                    type="button"
                    disabled={saving || !valid.length}
                    onClick={() => void save()}
                >
                    {saving
                        ? 'Importando…'
                        : `Importar ${valid.length} movimientos`}
                </ExpenseButton>
            </ExpenseActions>
        </div>
    );
}
