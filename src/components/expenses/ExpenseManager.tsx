import { ExpenseCalendarDay } from './ui/ExpenseRecords';

import { ExpenseMonthPicker, ExpenseExportMenu, ExpenseRecordRow, ExpenseBudgetNumber, ExpenseSearch } from './ui/ExpenseRecords';

import { DataTable } from '../ui/DataTable';
import { ExpenseProgress as Progress } from './ui/ExpenseProgress';
import { ExpenseEmptyState as Empty } from './ui/ExpenseEmptyState';
import { ExpensePanelHeading, ExpensePanelTitle, ExpensePanel, ExpenseCard } from './ui/ExpensePanel';
import { ExpenseSegments } from './ui/ExpenseSegments';
import { ExpenseMetric } from './ui/ExpenseMetric';
import { ExpenseField } from './ui/ExpenseField';
import { ExpenseActions } from './ui/ExpenseActions';
import { ExpenseButton, ExpenseIconButton } from './ui/ExpenseButton';
import { ExpenseGrid } from './ui/ExpenseGrid';
import { ExpenseCheckbox } from './ui/ExpenseCheckbox';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowDownLeft,
    ArrowRightLeft,
    ArrowUpRight,
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    Download,
    FileUp,
    LayoutDashboard,
    List,
    LoaderCircle,
    Pencil,
    Plus,
    Repeat2,
    Search,
    Settings2,
    Target,
    Trash2,
    WalletCards,
    X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AcademyPageHeader } from '../academy/layout/AcademyPageHeader';
import { ConfirmDialog, Modal } from '../ui/Modal';
import type { ExpenseBook, ExpenseKind } from '../../types/expenses';
import {
    accountBalance,
    activeRecurrence,
    budgetForMonth,
    confirmRecurrence,
    dayLabel,
    expenseSummary,
    EXPENSE_KEY,
    EXPENSE_LIMIT_BYTES,
    money,
    monthBounds,
    monthLabel,
    monthlyRecurrenceCost,
    parseExpenseBook,
    pendingRecurrences,
    shiftMonth,
    todayLocal,
} from '../../services/expensePlanner';
import {
    downloadExpenseFile,
    exportExpenseCsv,
    readExpenseCsv,
} from '../../services/expenseImport';
import type { ExpenseImportDocument } from '../../services/expenseImport';
import { readExpenseWorkbook } from '../../services/expenseWorkbook';
import {
    finishNativeFilePicker,
    markNativeFilePickerOpen,
} from '../../services/nativeFilePicker';
import { ExpenseEditors } from './ExpenseEditors';
import type { ExpenseEditor } from './ExpenseEditors';
import { ExpenseImportDialog } from './ExpenseImportDialog';
import { useExpenseBook } from './useExpenseBook';
import './ExpenseManager.css';

const tabs = [
    { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
    { id: 'entries', label: 'Movimientos', icon: List },
    { id: 'budgets', label: 'Presupuestos', icon: Target },
    { id: 'recurring', label: 'Recurrentes', icon: Repeat2 },
    { id: 'accounts', label: 'Cuentas y objetivos', icon: WalletCards },
] as const;
type Tab = (typeof tabs)[number]['id'];
const kindLabels: Record<ExpenseKind, string> = {
    expense: 'Gasto',
    income: 'Ingreso',
    transfer: 'Transferencia',
    refund: 'Reembolso',
};
const groupLabels = {
    needs: 'Necesidades',
    wants: 'Deseos',
    savings: 'Ahorro e inversión',
};
const editorTitles = {
    entry: 'Registrar movimiento',
    account: 'Cuenta',
    budget: 'Presupuesto mensual',
    recurring: 'Movimiento recurrente',
    goal: 'Objetivo de ahorro',
    category: 'Categoría',
};


export default function ExpenseManager() {
    const {
        book,
        status,
        cloud,
        owner,
        error: syncError,
        store,
    } = useExpenseBook();
    const [month, setMonth] = useState(() => todayLocal().slice(0, 7));
    const [tab, setTab] = useState<Tab>('overview');
    const [editor, setEditor] = useState<ExpenseEditor | null>(null);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState<{
        title: string;
        message: string;
        confirmText?: string;
        next?: ExpenseBook;
        reload?: boolean;
        resetEntryFilters?: boolean;
    } | null>(null);
    const [importDocument, setImportDocument] =
        useState<ExpenseImportDocument | null>(null);
    const [readingFile, setReadingFile] = useState(false);
    const fileTask = useRef(0);
    useEffect(() => {
        finishNativeFilePicker();
        setImportDocument(null);
        setEditor(null);
        setConfirmation(null);
        setReadingFile(false);
        fileTask.current++;
    }, [owner]);
    const fileRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const input = fileRef.current;
        if (!input) return;
        const handleCancel: EventListener = () => finishNativeFilePicker();
        input.addEventListener('cancel', handleCancel);
        return () => input.removeEventListener('cancel', handleCancel);
    }, []);
    const [query, setQuery] = useState('');
    const [kindFilter, setKindFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [accountFilter, setAccountFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('');
    const [page, setPage] = useState(0);
    const [allDates, setAllDates] = useState(false);
    const today = todayLocal();
    const bounds = monthBounds(month);
    const editable = status === 'ready';
    const saving = status === 'saving';
    const summary = useMemo(
        () => (book ? expenseSummary(book, month, today) : null),
        [book, month, today],
    );
    const pending = useMemo(
        () => (book ? pendingRecurrences(book, bounds.start, bounds.end) : []),
        [book, bounds.start, bounds.end],
    );
    const chart = useMemo(
        () =>
            book
                ? Array.from({ length: 6 }, (_, i) => {
                      const m = shiftMonth(month, i - 5);
                      const s = expenseSummary(book, m, today);
                      return {
                          month: m,
                          income: s.income,
                          expenses: s.expenses,
                      };
                  })
                : [],
        [book, month, today],
    );
    const filtered = useMemo(
        () =>
            book?.entries
                .filter(
                    (e) =>
                        (allDates || e.date.slice(0, 7) === month) &&
                        (kindFilter === 'all' || e.kind === kindFilter) &&
                        (categoryFilter === 'all' ||
                            e.categoryId === categoryFilter) &&
                        (accountFilter === 'all' ||
                            e.accountId === accountFilter ||
                            e.toAccountId === accountFilter) &&
                        (!tagFilter ||
                            e.tags.some((t) =>
                                t
                                    .toLowerCase()
                                    .includes(tagFilter.toLowerCase()),
                            )) &&
                        `${e.description} ${e.note}`
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                )
                .sort(
                    (a, b) =>
                        b.date.localeCompare(a.date) ||
                        b.id.localeCompare(a.id),
                ) ?? [],
        [
            book,
            allDates,
            month,
            kindFilter,
            categoryFilter,
            accountFilter,
            tagFilter,
            query,
        ],
    );
    const pageCount = Math.max(1, Math.ceil(filtered.length / 30));
    const safePage = Math.min(page, pageCount - 1);
    const save = async (next: ExpenseBook) => {
        setError('');
        setNotice('');
        await store.save(next);
        setNotice(
            cloud
                ? 'Cambios guardados en tu cuenta.'
                : 'Cambios guardados en este dispositivo.',
        );
    };
    const act = async (next: ExpenseBook) => {
        try {
            await save(next);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'No se pudo guardar.',
            );
        }
    };
    const exportBackup = () => {
        const raw =
            !cloud && status === 'error' && !store.hasPending
                ? localStorage.getItem(EXPENSE_KEY)
                : JSON.stringify(store.exportBook, null, 2);
        if (raw)
            downloadExpenseFile(
                raw,
                `freewallet-gastos-${today}.json`,
                'application/json',
            );
    };
    const readFile = async (file?: File) => {
        if (!file || !book) {
            finishNativeFilePicker();
            return;
        }
        setError('');
        if (!editable && !file.name.toLowerCase().endsWith('.json')) {
            setError(
                'Recupera el registro con una copia JSON válida antes de importar movimientos.',
            );
            finishNativeFilePicker();
            return;
        }
        const task = ++fileTask.current;
        setReadingFile(true);
        try {
            if (file.size > EXPENSE_LIMIT_BYTES)
                throw new Error('El archivo supera los 2 MB.');
            const name = file.name.toLowerCase();
            if (/\.xlsx?$/.test(name)) {
                const document = await readExpenseWorkbook(
                    await file.arrayBuffer(),
                );
                if (task === fileTask.current) setImportDocument(document);
            } else if (name.endsWith('.json')) {
                const raw = await file.text();
                if (task !== fileTask.current) return;
                const next = parseExpenseBook(raw);
                setConfirmation({
                    title: 'Restaurar copia de gastos',
                    message: `La copia sustituirá tus ${book.entries.length} movimientos por ${next.entries.length} y reemplazará cuentas, presupuestos y objetivos. Exporta antes tu copia actual si quieres conservarla.`,
                    next,
                });
            } else if (name.endsWith('.csv')) {
                const raw = await file.text();
                if (task === fileTask.current)
                    setImportDocument({
                        format: 'csv',
                        sheets: [
                            { name: file.name, rows: readExpenseCsv(raw) },
                        ],
                    });
            } else
                throw new Error(
                    'Selecciona un archivo CSV, Excel (.xlsx o .xls) o una copia JSON.',
                );
        } catch (err) {
            if (task === fileTask.current)
                setError(
                    err instanceof Error
                        ? err.message
                        : 'No se pudo leer el archivo.',
                );
        } finally {
            if (task === fileTask.current) {
                setReadingFile(false);
                finishNativeFilePicker();
            }
        }
    };
    const newMovement = (kind: ExpenseKind = 'expense') =>
        setEditor({ type: 'entry', kind });
    const changeMonth = (next: string) => {
        if (next < '2000-01' || next > '2199-12') return;
        try {
            monthBounds(next);
        } catch {
            return;
        }
        setMonth(next);
        setPage(0);
    };
    const registerPending = (ruleId: string, date: string) => {
        if (!book) return;
        try {
            const next = confirmRecurrence(
                book,
                ruleId,
                date,
                date > today ? today : date,
            );
            setEditor({ type: 'entry', value: next.entries.at(-1)! });
        } catch (err) {
            setError(String(err));
        }
    };
    // A prefilled recurrence entry is new until it actually appears in the book.
    const saveEditor = async (next: ExpenseBook) => {
        if (
            book &&
            editor?.type === 'entry' &&
            editor.value &&
            !book.entries.some((e) => e.id === editor.value!.id)
        ) {
            // ExpenseEditors replaces existing rows; append the filled draft instead.
            const draft = next.entries.find((e) => e.id === editor.value!.id);
            if (!draft) throw new Error('No se pudo preparar el vencimiento.');
        }
        await save(next);
    };
    const toolbar = (
        <div className="expense-toolbar">
            <ExpenseMonthPicker previous={<button
                    type="button"
                    aria-label="Mes anterior"
                    disabled={month <= '2000-01'}
                    onClick={() => changeMonth(shiftMonth(month, -1))}
                >
                    <ChevronLeft size={18} />
                </button>} next={<button
                    type="button"
                    aria-label="Mes siguiente"
                    disabled={month >= '2199-12'}
                    onClick={() => changeMonth(shiftMonth(month, 1))}
                >
                    <ChevronRight size={18} />
                </button>} label={<>Mes seleccionado</>} control={<input
                        type="month"
                        min="2000-01"
                        max="2199-12"
                        value={month}
                        onChange={(e) => {
                            if (e.target.value) changeMonth(e.target.value);
                        }}
                    />} />
            <ExpenseActions variant="toolbar" className="expense-toolbar-actions">
                <ExpenseButton variant="secondary"
                    type="button"
                    className="expense-btn expense-btn--secondary"
                    disabled={
                        readingFile || (!editable && (cloud || status !== 'error'))
                    }
                    onClick={() => {
                        if (!fileRef.current) return;
                        markNativeFilePickerOpen();
                        fileRef.current.click();
                    }}
                >
                    <FileUp size={16} />
                    Importar
                </ExpenseButton>
                <ExpenseExportMenu onClick={(event) => {
                        if ((event.target as Element).closest('button'))
                            event.currentTarget.open = false;
                    }} summary={<>
                        <Download size={16} />
                        Exportar
                    </>}>
                        <button onClick={exportBackup}>
                            Exportar copia completa (JSON)
                        </button>
                        <button
                            disabled={!book}
                            onClick={() =>
                                book &&
                                downloadExpenseFile(
                                    exportExpenseCsv(book),
                                    `freewallet-gastos-${today}.csv`,
                                    'text/csv;charset=utf-8',
                                )
                            }
                        >
                            Exportar movimientos (CSV)
                        </button>
                        <button
                            onClick={() =>
                                downloadExpenseFile(
                                    'Fecha;Concepto;Importe;Tipo;Categoría;Cuenta;Cuenta destino;Etiquetas\n2026-10-01;Ejemplo compra;25,50;gasto;Alimentación;;;\n',
                                    'plantilla-gastos.csv',
                                    'text/csv;charset=utf-8',
                                )
                            }
                        >
                            Descargar plantilla CSV
                        </button>
                    </ExpenseExportMenu>
                <ExpenseButton
                    className="expense-btn"
                    disabled={!editable}
                    onClick={() => newMovement()}
                >
                    <Plus size={18} />
                    Añadir movimiento
                </ExpenseButton>
            </ExpenseActions>
        </div>
    );
    if (!book || status === 'loading')
        return (
            <div className="expense-manager">
                <div className="expense-loading" role="status">
                    <LoaderCircle className="expense-spinner" size={28} />
                    Cargando tus gastos…
                </div>
            </div>
        );
    const stats = summary!;
    const previous = expenseSummary(book, shiftMonth(month, -1), today);
    const activeCategories = stats.categories.filter((c) => c.cents > 0);
    const positiveTotal = activeCategories.reduce((s, c) => s + c.cents, 0);
    let cumulative = 0;
    const gradient = activeCategories
        .map((c) => {
            const from = cumulative;
            cumulative += (c.cents / positiveTotal) * 100;
            return `${c.color} ${from}% ${cumulative}%`;
        })
        .join(',');
    const commitments = pending
        .filter((p) => p.rule.kind === 'expense')
        .reduce((s, p) => s + p.rule.amountCents, 0);
    const expectedIncome = pending
        .filter((p) => p.rule.kind === 'income')
        .reduce((s, p) => s + p.rule.amountCents, 0);
    const plannedEntries = book.entries.filter(
        (e) => e.date > today && e.date.slice(0, 7) === month,
    );
    const plannedNet = plannedEntries.reduce(
        (s, e) =>
            s +
            (e.kind === 'income' || e.kind === 'refund'
                ? e.amountCents
                : e.kind === 'expense'
                  ? -e.amountCents
                  : 0),
        0,
    );
    const maxBar = Math.max(
        1,
        ...chart.flatMap((m) => [m.income, Math.abs(m.expenses)]),
    );
    const allBalance = book.accounts.reduce(
        (s, a) => s + accountBalance(book, a.id, today),
        0,
    );
    const accountName = (id?: string) =>
        book.accounts.find((a) => a.id === id)?.name ?? '—';
    const categoryName = (id?: string) =>
        book.categories.find((c) => c.id === id)?.name ?? '—';
    const goalPanel = (
        <ExpensePanel className="expense-panel">
            <ExpensePanelHeading title={<>
                    <Target size={20} />
                    Objetivos de ahorro
                 </>} className="expense-panel-title">

                <ExpenseButton variant="quiet"
                    className="expense-btn expense-btn--quiet"
                    disabled={!editable}
                    onClick={() => setEditor({ type: 'goal' })}
                >
                    <Plus size={16} />
                    Objetivo
                </ExpenseButton>
            </ExpensePanelHeading>
            <p className="expense-hint">
                Reservas de planificación; no se descuentan del saldo de tus
                cuentas.
            </p>
            {!book.goals.length ? (
                <Empty title="Ponle nombre a tu ahorro">
                    Un colchón, unas vacaciones o tu próxima inversión.
                </Empty>
            ) : (
                <ExpenseGrid variant="accounts" className="expense-goals">
                    {book.goals.map((g) => {
                        const remaining = Math.max(
                            0,
                            g.targetCents - g.savedCents,
                        );
                        const months =
                            g.deadline && g.deadline >= today
                                ? Math.max(
                                      1,
                                      (Number(g.deadline.slice(0, 4)) -
                                          Number(today.slice(0, 4))) *
                                          12 +
                                          Number(g.deadline.slice(5, 7)) -
                                          Number(today.slice(5, 7)) +
                                          1,
                                  )
                                : 0;
                        return (
                            <ExpenseCard className="expense-goal" key={g.id}>
                                <ExpenseRecordRow >
                                    <h3>{g.name}</h3>
                                    <ExpenseActions variant="row" className="expense-row-actions">
                                        <ExpenseIconButton
                                            aria-label={`Editar objetivo ${g.name}`}
                                            disabled={!editable}
                                            onClick={() =>
                                                setEditor({
                                                    type: 'goal',
                                                    value: g,
                                                })
                                            }
                                        >
                                            <Pencil size={15} />
                                        </ExpenseIconButton>
                                        <ExpenseIconButton
                                            aria-label={`Eliminar objetivo ${g.name}`}
                                            disabled={!editable}
                                            onClick={() =>
                                                setConfirmation({
                                                    title: 'Eliminar objetivo',
                                                    message:
                                                        'Se eliminará la reserva de planificación. Tus movimientos y saldos se conservan.',
                                                    next: {
                                                        ...book,
                                                        goals: book.goals.filter(
                                                            (old) =>
                                                                old.id !== g.id,
                                                        ),
                                                    },
                                                })
                                            }
                                        >
                                            <Trash2 size={15} />
                                        </ExpenseIconButton>
                                    </ExpenseActions>
                                </ExpenseRecordRow>
                                <strong>
                                    {money(g.savedCents)}{' '}
                                    <small>de {money(g.targetCents)}</small>
                                </strong>
                                <Progress
                                    value={g.savedCents}
                                    limit={g.targetCents}
                                />
                                <p className="expense-hint">
                                    {remaining === 0
                                        ? 'Objetivo alcanzado'
                                        : `${money(remaining)} por reservar`}
                                    {g.deadline
                                        ? ` · ${dayLabel(g.deadline)}`
                                        : ''}
                                    {months && remaining
                                        ? ` · ${money(Math.ceil(remaining / months))}/mes orientativos`
                                        : ''}
                                </p>
                            </ExpenseCard>
                        );
                    })}
                </ExpenseGrid>
            )}
        </ExpensePanel>
    );
    return (
        <div className="expense-manager">
            <AcademyPageHeader
                section="Herramientas"
                className="expense-header"
            >
                <div>
                    <h1>Gastos y presupuesto</h1>
                    <p>Decide dónde va tu dinero.</p>
                </div>
                <span className="expense-status">
                    <span
                        className={
                            saving
                                ? 'expense-status-dot expense-status-dot--busy'
                                : 'expense-status-dot'
                        }
                    />
                    {saving
                        ? 'Guardando…'
                        : status === 'ready'
                          ? cloud
                              ? 'Sincronizado con tu cuenta'
                              : 'Guardado en este dispositivo'
                          : 'Guardado pendiente'}
                </span>
            </AcademyPageHeader>
            {toolbar}
            {readingFile && (
                <p className="expense-notice" role="status">
                    <LoaderCircle className="expense-spinner" size={16} />
                    Leyendo archivo…
                </p>
            )}
            <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                hidden
                onChange={(e) => {
                    void readFile(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
            {status !== 'ready' && !saving && (
                <div className="expense-sync-error" role="alert">
                    <strong>{syncError}</strong>
                    <ExpenseActions variant="toolbar" className="expense-actions">
                        <ExpenseButton variant="secondary"
                            className="expense-btn expense-btn--secondary"
                            onClick={exportBackup}
                        >
                            <Download size={16} />
                            Exportar copia
                        </ExpenseButton>
                        {status !== 'conflict' && (
                            <ExpenseButton variant="secondary"
                                className="expense-btn expense-btn--secondary"
                                onClick={() =>
                                    void store
                                        .retry()
                                        .then(() => store.load())
                                        .catch(() => {})
                                }
                            >
                                Reintentar
                            </ExpenseButton>
                        )}
                        <ExpenseButton variant="secondary"
                            className="expense-btn expense-btn--secondary"
                            onClick={() =>
                                setConfirmation({
                                    title: 'Cargar versión guardada',
                                    message:
                                        'Los cambios pendientes de esta pestaña se descartarán. Exporta una copia antes si quieres conservarlos.',
                                    reload: true,
                                })
                            }
                        >
                            Cargar versión guardada
                        </ExpenseButton>
                        {cloud && <Link to="/account">Mi cuenta</Link>}
                    </ExpenseActions>
                </div>
            )}
            {notice && (
                <div className="expense-notice" role="status">
                    <Check size={17} />
                    {notice}
                    <button
                        aria-label="Cerrar aviso"
                        onClick={() => setNotice('')}
                    >
                        <X size={15} />
                    </button>
                </div>
            )}
            {error && (
                <p className="expense-error" role="alert">
                    {error}
                </p>
            )}
            <ExpenseSegments aria-label="Secciones de gastos" value={tab} options={tabs.map(t => ({ value: t.id, label: t.label, icon: <t.icon size={17} /> }))} onChange={setTab} />
            {tab === 'overview' && (
                <>
                    <ExpenseGrid variant="metrics" className="expense-metrics">
                        <ExpenseMetric className="expense-stat" label={<>
                                <ArrowDownLeft size={17} />
                                Ingresos
                            </>} value={<>
                                {money(stats.income)}
                            </>} detail={<>{monthLabel(month)}</>} valueProps={{"data-testid":"expense-income"}} />
                        <ExpenseMetric className="expense-stat" label={<>
                                <ArrowUpRight size={17} />
                                Gastos netos
                            </>} value={<>
                                {money(stats.expenses)}
                            </>} detail={<>
                                {stats.refunds
                                    ? `${money(stats.refunds)} en reembolsos descontados`
                                    : 'Gastos registrados, sin transferencias'}
                            </>} valueProps={{"data-testid":"expense-spent"}} />
                        <ExpenseMetric className="expense-stat expense-stat--hero" label={<>
                                <WalletCards size={17} />
                                Balance del mes
                            </>} value={<>
                                {money(stats.net)}
                            </>} detail={<>
                                {stats.savingRate !== null
                                    ? `${stats.savingRate.toLocaleString('es-ES', { maximumFractionDigits: 1 })} % de tus ingresos conservados`
                                    : 'Registra ingresos para calcular tu tasa de ahorro'}
                            </>} valueProps={{"data-testid":"expense-net"}} />
                        <ExpenseMetric className="expense-stat" label={<>
                                <Target size={17} />
                                Presupuesto disponible
                            </>} value={<>
                                {stats.remaining === null
                                    ? 'Sin definir'
                                    : money(stats.remaining)}
                            </>} detail={<>
                                {stats.dailyAllowance !== null
                                    ? `${money(Math.floor(stats.dailyAllowance))}/día hasta fin de mes`
                                    : stats.budget
                                      ? 'Periodo cerrado'
                                      : 'Define tu límite de gasto mensual'}
                            </>} />
                    </ExpenseGrid>
                    {!book.entries.length && (
                        <div className="expense-start">
                            <div>
                                <h2>Tu mes empieza con un movimiento</h2>
                                <p>
                                    Registra un gasto, añade tus ingresos o
                                    importa el extracto de tu banco.
                                </p>
                            </div>
                            <ExpenseActions variant="toolbar" className="expense-actions">
                                <ExpenseButton
                                    className="expense-btn"
                                    disabled={!editable}
                                    onClick={() => newMovement()}
                                >
                                    <Plus size={17} />
                                    Registrar primer gasto
                                </ExpenseButton>
                                <ExpenseButton variant="secondary"
                                    className="expense-btn expense-btn--secondary"
                                    disabled={!editable}
                                    onClick={() => fileRef.current?.click()}
                                >
                                    <FileUp size={17} />
                                    Importar extracto
                                </ExpenseButton>
                            </ExpenseActions>
                        </div>
                    )}
                    <ExpenseGrid variant="columns" className="expense-two-col">
                        <ExpensePanel className="expense-panel">
                            <ExpensePanelHeading title={<> ¿Dónde se va tu dinero? </>} className="expense-panel-title">

                                <ExpenseButton variant="quiet"
                                    className="expense-btn expense-btn--quiet"
                                    onClick={() => setTab('entries')}
                                >
                                    Ver movimientos
                                </ExpenseButton>
                            </ExpensePanelHeading>
                            {positiveTotal ? (
                                <div className="expense-distribution">
                                    <div
                                        className="expense-donut"
                                        style={{
                                            background: `conic-gradient(${gradient})`,
                                        }}
                                        role="img"
                                        aria-label={activeCategories
                                            .map(
                                                (c) =>
                                                    `${c.name}: ${money(c.cents)}`,
                                            )
                                            .join(', ')}
                                    >
                                        <div>
                                            <span>Por categorías</span>
                                            <strong>
                                                {money(positiveTotal)}
                                            </strong>
                                        </div>
                                    </div>
                                    <ul className="expense-legend">
                                        {activeCategories
                                            .slice(0, 6)
                                            .map((c) => (
                                                <li key={c.id}>
                                                    <span>
                                                        <i
                                                            style={{
                                                                background:
                                                                    c.color,
                                                            }}
                                                        />
                                                        {c.name}
                                                    </span>
                                                    <strong>
                                                        {money(c.cents)}
                                                        <small>
                                                            {(
                                                                (c.cents /
                                                                    positiveTotal) *
                                                                100
                                                            ).toFixed(0)}{' '}
                                                            %
                                                        </small>
                                                    </strong>
                                                </li>
                                            ))}
                                        {activeCategories.length > 6 && (
                                            <li>
                                                <span>Resto de categorías</span>
                                                <strong>
                                                    {money(
                                                        activeCategories
                                                            .slice(6)
                                                            .reduce(
                                                                (s, c) =>
                                                                    s + c.cents,
                                                                0,
                                                            ),
                                                    )}
                                                </strong>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            ) : (
                                <Empty title="Aún no hay gasto neto positivo">
                                    Las categorías aparecerán cuando registres
                                    tus gastos.
                                </Empty>
                            )}
                            {stats.categories.some((c) => c.cents < 0) && (
                                <p className="expense-hint">
                                    El gráfico muestra categorías con saldo de
                                    gasto positivo. Hay categorías con más
                                    reembolsos que gastos este mes.
                                </p>
                            )}
                        </ExpensePanel>
                        <ExpensePanel className="expense-panel">
                            <ExpensePanelHeading title={<> Un plan para lo que queda </>} className="expense-panel-title">

                                <ExpenseButton variant="quiet"
                                    className="expense-btn expense-btn--quiet"
                                    disabled={!editable}
                                    onClick={() =>
                                        setEditor({ type: 'budget' })
                                    }
                                >
                                    <Settings2 size={16} />
                                    {stats.budget
                                        ? 'Ajustar'
                                        : 'Definir presupuesto'}
                                </ExpenseButton>
                            </ExpensePanelHeading>
                            {stats.budget ? (
                                <>
                                    <ExpenseBudgetNumber value={<>{money(stats.expenses)}</>}>
                                            de {money(stats.budget.limitCents)}{' '}
                                            previstos
                                        </ExpenseBudgetNumber>
                                    <Progress
                                        value={stats.expenses}
                                        limit={stats.budget.limitCents}
                                    />
                                    <p
                                        className={`expense-hint${stats.remaining! < 0 ? ' expense-negative' : ''}`}
                                    >
                                        {stats.remaining! < 0
                                            ? `Has superado el presupuesto en ${money(-stats.remaining!)}.`
                                            : `Quedan ${money(stats.remaining!)} dentro del presupuesto.`}
                                    </p>
                                </>
                            ) : (
                                <p className="expense-hint">
                                    Elige cuánto quieres gastar este mes y
                                    reparte límites por categoría.
                                </p>
                            )}
                            <dl className="expense-facts">
                                <div>
                                    <dt>Recurrentes pendientes del mes</dt>
                                    <dd>{money(commitments)}</dd>
                                </div>
                                <div>
                                    <dt>Ingresos recurrentes pendientes</dt>
                                    <dd>{money(expectedIncome)}</dd>
                                </div>
                                <div>
                                    <dt>Balance si se cumplen los previstos</dt>
                                    <dd>
                                        {money(
                                            stats.net -
                                                commitments +
                                                expectedIncome +
                                                plannedNet,
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Saldo total de cuentas hoy</dt>
                                    <dd>{money(allBalance)}</dd>
                                </div>
                            </dl>
                            <p className="expense-hint">
                                Los previstos incluyen vencimientos sin
                                confirmar y movimientos futuros registrados. No
                                son pagos realizados.
                            </p>
                            {stats.budget && stats.remaining! < commitments && (
                                <p className="expense-insight">
                                    Los recurrentes pendientes ya superan el
                                    presupuesto que queda. Revisa los límites
                                    antes de añadir más gasto.
                                </p>
                            )}
                        </ExpensePanel>
                    </ExpenseGrid>
                    <ExpenseGrid variant="columns" className="expense-two-col">
                        <ExpensePanel className="expense-panel">
                            <ExpensePanelHeading title={<> Tu evolución </>} className="expense-panel-title">

                                <span className="expense-hint">
                                    6 meses · solo registrados
                                </span>
                            </ExpensePanelHeading>
                            <div className="expense-chart-legend">
                                <span>
                                    <i />
                                    Ingresos
                                </span>
                                <span>
                                    <i />
                                    Gastos netos
                                </span>
                            </div>
                            <div
                                className="expense-bar-chart"
                                role="img"
                                aria-label={chart
                                    .map(
                                        (c) =>
                                            `${monthLabel(c.month)}: ingresos ${money(c.income)}, gastos netos ${money(c.expenses)}`,
                                    )
                                    .join('; ')}
                            >
                                {chart.map((c) => (
                                    <div
                                        className="expense-bar-month"
                                        key={c.month}
                                    >
                                        <div className="expense-bar-pair">
                                            <span
                                                title={`Ingresos: ${money(c.income)}`}
                                                style={{
                                                    height: `${(c.income / maxBar) * 100}%`,
                                                }}
                                            />
                                            <span
                                                title={`Gastos netos: ${money(c.expenses)}`}
                                                style={{
                                                    height: `${(Math.abs(c.expenses) / maxBar) * 100}%`,
                                                }}
                                                className={
                                                    c.expenses < 0
                                                        ? 'expense-bar-refund'
                                                        : ''
                                                }
                                            />
                                        </div>
                                        <small>
                                            {new Intl.DateTimeFormat('es-ES', {
                                                month: 'short',
                                                timeZone: 'UTC',
                                            }).format(
                                                new Date(`${c.month}-01`),
                                            )}
                                        </small>
                                    </div>
                                ))}
                            </div>
                            {stats.expenses && previous.expenses > 0 ? (
                                <p className="expense-hint">
                                    {money(stats.expenses - previous.expenses)}{' '}
                                    respecto al mes anterior completo.
                                </p>
                            ) : (
                                <p className="expense-hint">
                                    La comparación gana contexto conforme
                                    completas meses.
                                </p>
                            )}
                        </ExpensePanel>
                        <ExpensePanel className="expense-panel">
                            <ExpensePanelHeading title={<>
                                    <CalendarDays size={19} />
                                    Vencimientos del mes
                                 </>} className="expense-panel-title">

                                <ExpenseButton variant="quiet"
                                    className="expense-btn expense-btn--quiet"
                                    onClick={() => setTab('recurring')}
                                >
                                    Ver todos
                                </ExpenseButton>
                            </ExpensePanelHeading>
                            {pending.length ? (
                                <div className="expense-upcoming">
                                    {pending.slice(0, 5).map((p) => (
                                        <ExpenseRecordRow key={`${p.rule.id}:${p.date}`} title={<>{p.rule.title}</>} detail={<>
                                                    {dayLabel(p.date)} ·{' '}
                                                    {p.date < today
                                                        ? 'Pendiente de confirmar'
                                                        : 'Previsto'}
                                                </>}><strong
                                                className={
                                                    p.rule.kind === 'income'
                                                        ? 'expense-positive'
                                                        : ''
                                                }
                                            >
                                                {p.rule.kind === 'income'
                                                    ? '+'
                                                    : '−'}
                                                {money(p.rule.amountCents)}
                                            </strong></ExpenseRecordRow>
                                    ))}
                                </div>
                            ) : (
                                <Empty title="Sin vencimientos pendientes">
                                    Añade tus facturas, suscripciones y cobros
                                    habituales.
                                </Empty>
                            )}
                        </ExpensePanel>
                    </ExpenseGrid>
                    <ExpensePanel as="details" className="expense-panel expense-fold">
                        <summary>
                            <CalendarDays size={18} />
                            Gasto por día · {monthLabel(month)}
                        </summary>
                        <div className="expense-calendar">
                            {Array.from({ length: bounds.days }, (_, i) => {
                                const date = `${month}-${String(i + 1).padStart(2, '0')}`;
                                const cents =
                                    date <= today
                                        ? book.entries
                                              .filter((e) => e.date === date)
                                              .reduce(
                                                  (s, e) =>
                                                      s +
                                                      (e.kind === 'expense'
                                                          ? e.amountCents
                                                          : e.kind === 'refund'
                                                            ? -e.amountCents
                                                            : 0),
                                                  0,
                                              )
                                        : 0;
                                return (
                                    <ExpenseCalendarDay key={date} spent={cents > 0} label={<>{i + 1}</>} value={<>
                                            {cents ? money(cents) : '—'}
                                        </>} />
                                );
                            })}
                        </div>
                    </ExpensePanel>
                </>
            )}
            {tab === 'entries' && (
                <ExpensePanel className="expense-panel">
                    <ExpensePanelHeading title={<> Movimientos </>} className="expense-panel-title">

                        <ExpenseActions variant="heading" className="expense-panel-title-actions">
                            <span>{filtered.length} registros</span>
                            <ExpenseButton variant="danger"
                                type="button"
                                className="expense-btn expense-btn--danger"
                                disabled={!editable || !book.entries.length}
                                onClick={() =>
                                    setConfirmation({
                                        title: 'Borrar todos los movimientos',
                                        message: `Se eliminarán los ${book.entries.length} movimientos de todas las fechas. Se conservarán las cuentas, categorías, presupuestos y reglas recurrentes; los vencimientos recurrentes volverán a quedar pendientes. Esta acción no se puede deshacer.`,
                                        confirmText: 'Borrar movimientos',
                                        resetEntryFilters: true,
                                        next: { ...book, entries: [] },
                                    })
                                }
                            >
                                <Trash2 size={16} />
                                Borrar todos
                            </ExpenseButton>
                        </ExpenseActions>
                    </ExpensePanelHeading>
                    <div className="expense-filters">
                        <ExpenseSearch icon={<Search size={17} />} label="Buscar concepto o nota" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Buscar concepto o nota" />
                        <ExpenseField labelProps={{ className: 'expense-sr' }} label={<>
                                Tipo de movimiento
                             </>} className="expense-field">

                            <select
                                value={kindFilter}
                                onChange={(e) => {
                                    setKindFilter(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <option value="all">Todos los tipos</option>
                                {Object.entries(kindLabels).map(
                                    ([id, label]) => (
                                        <option key={id} value={id}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </ExpenseField>
                        <ExpenseField labelProps={{ className: 'expense-sr' }} label={<>
                                Filtrar categoría
                             </>} className="expense-field">

                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <option value="all">
                                    Todas las categorías
                                </option>
                                {book.categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </ExpenseField>
                        <ExpenseField labelProps={{ className: 'expense-sr' }} label={<> Filtrar cuenta </>} className="expense-field">

                            <select
                                value={accountFilter}
                                onChange={(e) => {
                                    setAccountFilter(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <option value="all">Todas las cuentas</option>
                                {book.accounts.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </ExpenseField>
                        <ExpenseField labelProps={{ className: 'expense-sr' }} label={<> Filtrar etiqueta </>} className="expense-field">

                            <input
                                value={tagFilter}
                                onChange={(e) => {
                                    setTagFilter(e.target.value);
                                    setPage(0);
                                }}
                                placeholder="Etiqueta"
                            />
                        </ExpenseField>
                    </div>
                    <ExpenseCheckbox className="expense-check">
                        <input
                            type="checkbox"
                            checked={allDates}
                            onChange={(e) => {
                                setAllDates(e.target.checked);
                                setPage(0);
                            }}
                        />
                        Ver todas las fechas
                    </ExpenseCheckbox>
                    {filtered.length ? (
                        <>
                            <div className="expense-mobile-entries">
                                {filtered
                                    .slice(safePage * 30, (safePage + 1) * 30)
                                    .map((e) => (
                                        <article
                                            className="expense-mobile-entry"
                                            key={e.id}
                                        >
                                            <ExpenseRecordRow  title={<>
                                                        {e.description}
                                                    </>} detail={<>
                                                        {dayLabel(e.date)} ·{' '}
                                                        {kindLabels[e.kind]}
                                                        {e.date > today
                                                            ? ' · Previsto'
                                                            : ''}
                                                    </>}><strong
                                                    className={
                                                        e.kind === 'income' ||
                                                        e.kind === 'refund'
                                                            ? 'expense-positive'
                                                            : ''
                                                    }
                                                >
                                                    {e.kind === 'expense'
                                                        ? '−'
                                                        : e.kind === 'transfer'
                                                          ? ''
                                                          : '+'}
                                                    {money(e.amountCents)}
                                                </strong></ExpenseRecordRow>
                                            <ExpenseRecordRow >
                                                <p className="expense-hint">
                                                    {accountName(e.accountId)}
                                                    {e.toAccountId
                                                        ? ` → ${accountName(e.toAccountId)}`
                                                        : e.categoryId
                                                          ? ` · ${categoryName(e.categoryId)}`
                                                          : ''}
                                                </p>
                                                <ExpenseActions variant="row" className="expense-row-actions">
                                                    <ExpenseIconButton
                                                        disabled={!editable}
                                                        aria-label={`Editar ${e.description}`}
                                                        onClick={() =>
                                                            setEditor({
                                                                type: 'entry',
                                                                value: e,
                                                            })
                                                        }
                                                    >
                                                        <Pencil size={16} />
                                                    </ExpenseIconButton>
                                                    <ExpenseIconButton
                                                        disabled={!editable}
                                                        aria-label={`Eliminar ${e.description}`}
                                                        onClick={() =>
                                                            setConfirmation({
                                                                title: 'Eliminar movimiento',
                                                                message: `Se eliminará «${e.description}» y se recalcularán los saldos.${e.recurrenceId ? ' Su vencimiento volverá a quedar pendiente.' : ''}`,
                                                                next: {
                                                                    ...book,
                                                                    entries:
                                                                        book.entries.filter(
                                                                            (
                                                                                old,
                                                                            ) =>
                                                                                old.id !==
                                                                                e.id,
                                                                        ),
                                                                },
                                                            })
                                                        }
                                                    >
                                                        <Trash2 size={16} />
                                                    </ExpenseIconButton>
                                                </ExpenseActions>
                                            </ExpenseRecordRow>
                                            {e.tags.length > 0 && (
                                                <small>
                                                    {e.tags.join(' · ')}
                                                </small>
                                            )}
                                            {e.note && (
                                                <details className="expense-hint">
                                                    <summary>Ver nota</summary>
                                                    <p>{e.note}</p>
                                                </details>
                                            )}
                                        </article>
                                    ))}
                            </div>
                            <DataTable appearance="expenses" className="expense-entry-table">
                                <thead>
                                    <tr>
                                        <th>Concepto</th>
                                        <th>Fecha</th>
                                        <th>Categoría</th>
                                        <th>Cuenta</th>
                                        <th>Importe</th>
                                        <th>
                                            <span className="expense-sr">
                                                Acciones
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered
                                        .slice(
                                            safePage * 30,
                                            (safePage + 1) * 30,
                                        )
                                        .map((e) => (
                                            <tr key={e.id}>
                                                <td>
                                                    <div className="expense-entry-name">
                                                        <span
                                                            className={`expense-kind expense-kind--${e.kind}`}
                                                        >
                                                            {e.kind ===
                                                            'transfer' ? (
                                                                <ArrowRightLeft
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            ) : e.kind ===
                                                              'expense' ? (
                                                                <ArrowUpRight
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            ) : (
                                                                <ArrowDownLeft
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            )}
                                                        </span>
                                                        <div>
                                                            <strong>
                                                                {
                                                                    e.description
                                                                }
                                                            </strong>
                                                            <small>
                                                                {
                                                                    kindLabels[
                                                                        e
                                                                            .kind
                                                                    ]
                                                                }
                                                                {e.recurrenceId
                                                                    ? ' · Recurrente'
                                                                    : ''}
                                                                {e.date >
                                                                today
                                                                    ? ' · Previsto'
                                                                    : ''}
                                                                {e.tags
                                                                    .length
                                                                    ? ` · ${e.tags.join(', ')}`
                                                                    : ''}
                                                            </small>
                                                            {e.note && (
                                                                <small
                                                                    title={
                                                                        e.note
                                                                    }
                                                                >
                                                                    {e.note.slice(
                                                                        0,
                                                                        80,
                                                                    )}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{dayLabel(e.date)}</td>
                                                <td>
                                                    {categoryName(
                                                        e.categoryId,
                                                    )}
                                                </td>
                                                <td>
                                                    {accountName(
                                                        e.accountId,
                                                    )}
                                                    {e.toAccountId && (
                                                        <small>
                                                            →{' '}
                                                            {accountName(
                                                                e.toAccountId,
                                                            )}
                                                        </small>
                                                    )}
                                                </td>
                                                <td
                                                    className={
                                                        e.kind ===
                                                            'income' ||
                                                        e.kind === 'refund'
                                                            ? 'expense-positive'
                                                            : ''
                                                    }
                                                >
                                                    {e.kind === 'transfer'
                                                        ? ''
                                                        : e.kind ===
                                                            'expense'
                                                          ? '−'
                                                          : '+'}
                                                    {money(e.amountCents)}
                                                </td>
                                                <td>
                                                    <ExpenseActions variant="row" className="expense-row-actions">
                                                        <ExpenseIconButton
                                                            disabled={
                                                                !editable
                                                            }
                                                            aria-label={`Editar ${e.description}`}
                                                            onClick={() =>
                                                                setEditor({
                                                                    type: 'entry',
                                                                    value: e,
                                                                })
                                                            }
                                                        >
                                                            <Pencil
                                                                size={16}
                                                            />
                                                        </ExpenseIconButton>
                                                        <ExpenseIconButton
                                                            disabled={
                                                                !editable
                                                            }
                                                            aria-label={`Eliminar ${e.description}`}
                                                            onClick={() =>
                                                                setConfirmation(
                                                                    {
                                                                        title: 'Eliminar movimiento',
                                                                        message: `Se eliminará «${e.description}» (${money(e.amountCents)}). Los saldos y presupuestos se recalcularán.${e.recurrenceId ? ' Su vencimiento volverá a quedar pendiente.' : ''}`,
                                                                        next: {
                                                                            ...book,
                                                                            entries:
                                                                                book.entries.filter(
                                                                                    (
                                                                                        old,
                                                                                    ) =>
                                                                                        old.id !==
                                                                                        e.id,
                                                                                ),
                                                                        },
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <Trash2
                                                                size={16}
                                                            />
                                                        </ExpenseIconButton>
                                                    </ExpenseActions>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </DataTable>
                            <div className="expense-pagination">
                                <ExpenseButton variant="secondary"
                                    className="expense-btn expense-btn--secondary"
                                    disabled={safePage === 0}
                                    onClick={() => setPage(safePage - 1)}
                                >
                                    Anterior
                                </ExpenseButton>
                                <span>
                                    {safePage + 1} / {pageCount}
                                </span>
                                <ExpenseButton variant="secondary"
                                    className="expense-btn expense-btn--secondary"
                                    disabled={safePage + 1 >= pageCount}
                                    onClick={() => setPage(safePage + 1)}
                                >
                                    Siguiente
                                </ExpenseButton>
                            </div>
                        </>
                    ) : (
                        <Empty
                            title="No hay movimientos con estos filtros"
                            action={
                                <ExpenseButton
                                    className="expense-btn"
                                    disabled={!editable}
                                    onClick={() => newMovement()}
                                >
                                    Añadir movimiento
                                </ExpenseButton>
                            }
                        >
                            Prueba otra fecha o registra tu primer movimiento.
                        </Empty>
                    )}
                </ExpensePanel>
            )}
            {tab === 'budgets' && (
                <>
                    <ExpenseGrid variant="columns" className="expense-two-col">
                        <ExpensePanel className="expense-panel">
                            <ExpensePanelHeading title={<> Presupuesto de {monthLabel(month)} </>} className="expense-panel-title">

                                <ExpenseButton variant="quiet"
                                    className="expense-btn expense-btn--quiet"
                                    disabled={!editable}
                                    onClick={() =>
                                        setEditor({ type: 'budget' })
                                    }
                                >
                                    <Pencil size={16} />
                                    Editar
                                </ExpenseButton>
                            </ExpensePanelHeading>
                            {stats.budget ? (
                                <>
                                    <ExpenseBudgetNumber value={<>
                                            {money(stats.budget.limitCents)}
                                        </>}>
                                            {stats.budget.month === 'default'
                                                ? 'Presupuesto base'
                                                : 'Presupuesto de este mes'}
                                        </ExpenseBudgetNumber>
                                    <Progress
                                        value={stats.expenses}
                                        limit={stats.budget.limitCents}
                                    />
                                    <div className="expense-facts">
                                        <div>
                                            <span>Gasto neto</span>
                                            <strong>
                                                {money(stats.expenses)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Disponible</span>
                                            <strong>
                                                {money(stats.remaining!)}
                                            </strong>
                                        </div>
                                    </div>
                                    <ExpenseActions variant="toolbar" className="expense-actions">
                                        <ExpenseButton variant="secondary"
                                            className="expense-btn expense-btn--secondary"
                                            disabled={
                                                !editable ||
                                                !budgetForMonth(
                                                    book,
                                                    shiftMonth(month, -1),
                                                )
                                            }
                                            onClick={() => {
                                                const previousBudget =
                                                    budgetForMonth(
                                                        book,
                                                        shiftMonth(month, -1),
                                                    );
                                                if (previousBudget)
                                                    void act({
                                                        ...book,
                                                        budgets: [
                                                            ...book.budgets.filter(
                                                                (b) =>
                                                                    b.month !==
                                                                    month,
                                                            ),
                                                            {
                                                                ...previousBudget,
                                                                month,
                                                            },
                                                        ],
                                                    });
                                            }}
                                        >
                                            Copiar mes anterior
                                        </ExpenseButton>
                                        <ExpenseButton variant="quiet"
                                            className="expense-btn expense-btn--quiet"
                                            disabled={!editable}
                                            onClick={() =>
                                                setConfirmation({
                                                    title: 'Quitar presupuesto',
                                                    message:
                                                        stats.budget!.month ===
                                                        'default'
                                                            ? 'Se eliminará el presupuesto base usado por todos los meses sin límite propio.'
                                                            : 'Se quitará el presupuesto de este mes. Se usará el presupuesto base si existe.',
                                                    next: {
                                                        ...book,
                                                        budgets:
                                                            book.budgets.filter(
                                                                (b) =>
                                                                    b.month !==
                                                                    stats
                                                                        .budget!
                                                                        .month,
                                                            ),
                                                    },
                                                })
                                            }
                                        >
                                            Quitar
                                        </ExpenseButton>
                                    </ExpenseActions>
                                </>
                            ) : (
                                <Empty
                                    title="Un límite te ayuda a decidir"
                                    action={
                                        <ExpenseButton
                                            className="expense-btn"
                                            disabled={!editable}
                                            onClick={() =>
                                                setEditor({ type: 'budget' })
                                            }
                                        >
                                            Definir presupuesto
                                        </ExpenseButton>
                                    }
                                >
                                    Empieza con un total y ajusta las categorías
                                    que quieras controlar.
                                </Empty>
                            )}
                        </ExpensePanel>
                        <ExpensePanel className="expense-panel">
                            <ExpensePanelTitle>Regla 50 / 30 / 20</ExpensePanelTitle>
                            <p className="expense-hint">
                                Una referencia, no una obligación. Los grupos de
                                tus categorías son editables.
                            </p>
                            {(['needs', 'wants'] as const).map((group, i) => {
                                const cents = stats.categories
                                    .filter((c) => c.group === group)
                                    .reduce((s, c) => s + c.cents, 0);
                                const target =
                                    stats.income * (i === 0 ? 0.5 : 0.3);
                                return (
                                    <div
                                        className="expense-allocation"
                                        key={group}
                                    >
                                        <ExpenseRecordRow >
                                            <span>{groupLabels[group]}</span>
                                            <strong>
                                                {money(cents)}{' '}
                                                <small>
                                                    /{' '}
                                                    {stats.income
                                                        ? money(target)
                                                        : 'sin ingresos'}
                                                </small>
                                            </strong>
                                        </ExpenseRecordRow>
                                        <Progress
                                            value={cents}
                                            limit={target}
                                            color={i ? '#818cf8' : '#34d399'}
                                        />
                                    </div>
                                );
                            })}
                            <div className="expense-allocation">
                                <ExpenseRecordRow >
                                    <span>
                                        Ahorro disponible + inversión registrada
                                    </span>
                                    <strong>
                                        {money(
                                            stats.net +
                                                stats.categories
                                                    .filter(
                                                        (c) =>
                                                            c.group ===
                                                            'savings',
                                                    )
                                                    .reduce(
                                                        (s, c) => s + c.cents,
                                                        0,
                                                    ),
                                        )}
                                    </strong>
                                </ExpenseRecordRow>
                                <p className="expense-hint">
                                    Referencia:{' '}
                                    {stats.income
                                        ? `${money(stats.income * 0.2)} (20 % de tus ingresos)`
                                        : 'registra ingresos para comparar'}
                                    . Las transferencias entre tus cuentas
                                    quedan fuera.
                                </p>
                            </div>
                        </ExpensePanel>
                    </ExpenseGrid>
                    <ExpensePanel className="expense-panel">
                        <ExpensePanelHeading title={<> Categorías y límites </>} className="expense-panel-title">

                            <ExpenseButton variant="quiet"
                                className="expense-btn expense-btn--quiet"
                                disabled={!editable}
                                onClick={() => setEditor({ type: 'category' })}
                            >
                                <Plus size={16} />
                                Categoría
                            </ExpenseButton>
                        </ExpensePanelHeading>
                        <ExpenseGrid variant="categories" className="expense-category-grid">
                            {stats.categories.map((c) => {
                                const limit =
                                    stats.budget?.categoryLimits.find(
                                        (l) => l.categoryId === c.id,
                                    )?.limitCents ?? 0;
                                return (
                                    <ExpenseCard
                                        className="expense-category-card"
                                        key={c.id}
                                    >
                                        <ExpenseRecordRow >
                                            <span>
                                                <i
                                                    className="expense-color-dot"
                                                    style={{
                                                        background: c.color,
                                                    }}
                                                />
                                                {c.name}
                                            </span>
                                            <ExpenseIconButton
                                                className="expense-icon-btn"
                                                disabled={!editable}
                                                aria-label={`Editar categoría ${c.name}`}
                                                onClick={() =>
                                                    setEditor({
                                                        type: 'category',
                                                        value: c,
                                                    })
                                                }
                                            >
                                                <Pencil size={15} />
                                            </ExpenseIconButton>
                                        </ExpenseRecordRow>
                                        <strong>
                                            {money(c.cents)}
                                            <small>
                                                {limit
                                                    ? ` / ${money(limit)}`
                                                    : ' · sin límite'}
                                            </small>
                                        </strong>
                                        <Progress
                                            value={c.cents}
                                            limit={limit}
                                            color={c.color}
                                        />
                                        <p className="expense-hint">
                                            {groupLabels[c.group]}
                                            {limit && c.cents > limit
                                                ? ` · Exceso: ${money(c.cents - limit)}`
                                                : ''}
                                        </p>
                                    </ExpenseCard>
                                );
                            })}
                        </ExpenseGrid>
                    </ExpensePanel>
                </>
            )}
            {tab === 'recurring' && (
                <>
                    <ExpenseGrid variant="metrics" className="expense-metrics expense-metrics--three">
                        <ExpenseMetric className="expense-stat" label={<>Gasto recurrente equivalente</>} value={<>
                                {money(Math.round(monthlyRecurrenceCost(book)))}
                            </>} detail={<>
                                Reglas activas hoy · semanales × 52 / 12;
                                anuales ÷ 12
                            </>} />
                        <ExpenseMetric className="expense-stat" label={<>Pendiente de confirmar este mes</>} value={<>{money(commitments)}</>} detail={<>
                                {
                                    pending.filter(
                                        (p) => p.rule.kind === 'expense',
                                    ).length
                                }{' '}
                                vencimientos de gasto
                            </>} />
                        <ExpenseMetric className="expense-stat" label={<>Reglas activas</>} value={<>
                                {
                                    book.recurring.filter((r) =>
                                        activeRecurrence(r, today),
                                    ).length
                                }
                            </>} detail={<>Gastos e ingresos habituales</>} />
                    </ExpenseGrid>
                    <ExpensePanel className="expense-panel">
                        <ExpensePanelHeading title={<> Vencimientos de {monthLabel(month)} </>} className="expense-panel-title">

                            <ExpenseButton
                                className="expense-btn"
                                disabled={!editable}
                                onClick={() => setEditor({ type: 'recurring' })}
                            >
                                <Plus size={16} />
                                Añadir recurrente
                            </ExpenseButton>
                        </ExpensePanelHeading>
                        {pending.length ? (
                            <div className="expense-upcoming">
                                {pending.map((p) => (
                                    <ExpenseRecordRow key={`${p.rule.id}:${p.date}`} className="expense-due-row" title={<>{p.rule.title}</>} detail={<>
                                                {dayLabel(p.date)} ·{' '}
                                                {accountName(p.rule.accountId)}
                                                {p.date < today
                                                    ? ' · Pendiente'
                                                    : ''}
                                            </>}><strong
                                            className={
                                                p.rule.kind === 'income'
                                                    ? 'expense-positive'
                                                    : ''
                                            }
                                        >
                                            {p.rule.kind === 'income'
                                                ? '+'
                                                : '−'}
                                            {money(p.rule.amountCents)}
                                        </strong><ExpenseActions variant="toolbar" className="expense-actions">
                                            <ExpenseButton variant="secondary"
                                                className="expense-btn expense-btn--secondary"
                                                disabled={!editable}
                                                onClick={() =>
                                                    registerPending(
                                                        p.rule.id,
                                                        p.date,
                                                    )
                                                }
                                            >
                                                <Check size={15} />
                                                Registrar
                                            </ExpenseButton>
                                            <ExpenseButton variant="quiet"
                                                className="expense-btn expense-btn--quiet"
                                                disabled={!editable}
                                                onClick={() =>
                                                    setConfirmation({
                                                        title: 'Omitir vencimiento',
                                                        message:
                                                            'Este vencimiento no generará un movimiento. Los siguientes seguirán activos.',
                                                        next: {
                                                            ...book,
                                                            recurring:
                                                                book.recurring.map(
                                                                    (r) =>
                                                                        r.id ===
                                                                        p.rule
                                                                            .id
                                                                            ? {
                                                                                  ...r,
                                                                                  skippedDates:
                                                                                      [
                                                                                          ...r.skippedDates,
                                                                                          p.date,
                                                                                      ],
                                                                              }
                                                                            : r,
                                                                ),
                                                        },
                                                    })
                                                }
                                            >
                                                Omitir
                                            </ExpenseButton>
                                        </ExpenseActions></ExpenseRecordRow>
                                ))}
                            </div>
                        ) : (
                            <Empty title="No hay vencimientos pendientes">
                                Los pagos confirmados ya están en Movimientos.
                                Cambia de mes para ver los próximos.
                            </Empty>
                        )}
                    </ExpensePanel>
                    <ExpensePanel className="expense-panel">
                        <ExpensePanelTitle>Tus reglas recurrentes</ExpensePanelTitle>
                        {book.recurring.length ? (
                            book.recurring.map((r) => (
                                <ExpenseRecordRow key={r.id} className="expense-rule-row" title={<>{r.title}</>} detail={<>
                                            {money(r.amountCents)} ·{' '}
                                            {
                                                {
                                                    weekly: 'Semanal',
                                                    monthly: 'Mensual',
                                                    yearly: 'Anual',
                                                }[r.frequency]
                                            }{' '}
                                            ·{' '}
                                            {r.paused
                                                ? 'Pausado'
                                                : r.endDate && r.endDate < today
                                                  ? 'Finalizado'
                                                  : r.startDate > today
                                                    ? 'Programado'
                                                    : 'Activo'}
                                            {r.endDate
                                                ? ` · Hasta ${dayLabel(r.endDate)}`
                                                : ''}
                                        </>}><ExpenseActions variant="row" className="expense-row-actions">
                                        <ExpenseIconButton
                                            disabled={
                                                !editable ||
                                                book.accounts.find(
                                                    (a) => a.id === r.accountId,
                                                )?.archived
                                            }
                                            onClick={() =>
                                                void act({
                                                    ...book,
                                                    recurring:
                                                        book.recurring.map(
                                                            (old) =>
                                                                old.id === r.id
                                                                    ? {
                                                                          ...old,
                                                                          paused: !old.paused,
                                                                      }
                                                                    : old,
                                                        ),
                                                })
                                            }
                                        >
                                            {r.paused ? 'Activar' : 'Pausar'}
                                        </ExpenseIconButton>
                                        <ExpenseIconButton
                                            disabled={!editable}
                                            aria-label={`Editar recurrente ${r.title}`}
                                            onClick={() =>
                                                setEditor({
                                                    type: 'recurring',
                                                    value: r,
                                                })
                                            }
                                        >
                                            <Pencil size={16} />
                                        </ExpenseIconButton>
                                        <ExpenseIconButton
                                            disabled={!editable}
                                            aria-label={`Eliminar recurrente ${r.title}`}
                                            onClick={() =>
                                                setConfirmation({
                                                    title: 'Eliminar recurrente',
                                                    message:
                                                        'Se eliminarán los vencimientos futuros. Los pagos y cobros que ya registraste se conservan.',
                                                    next: {
                                                        ...book,
                                                        recurring:
                                                            book.recurring.filter(
                                                                (old) =>
                                                                    old.id !==
                                                                    r.id,
                                                            ),
                                                    },
                                                })
                                            }
                                        >
                                            <Trash2 size={16} />
                                        </ExpenseIconButton>
                                    </ExpenseActions></ExpenseRecordRow>
                            ))
                        ) : (
                            <Empty title="Automatiza los recordatorios">
                                Alquiler, facturas, suscripciones y nómina. Tú
                                confirmas los movimientos.
                            </Empty>
                        )}
                    </ExpensePanel>
                </>
            )}
            {tab === 'accounts' && (
                <>
                    <ExpensePanel className="expense-panel">
                        <ExpensePanelHeading title={<> Tus cuentas </>} className="expense-panel-title">

                            <ExpenseButton
                                className="expense-btn"
                                disabled={!editable}
                                onClick={() => setEditor({ type: 'account' })}
                            >
                                <Plus size={16} />
                                Añadir cuenta
                            </ExpenseButton>
                        </ExpensePanelHeading>
                        <p className="expense-hint">
                            Saldos calculados a día de hoy con el saldo inicial
                            y los movimientos registrados. No hay conexión
                            bancaria.
                        </p>
                        <ExpenseGrid variant="accounts" className="expense-accounts">
                            {book.accounts.map((a) => (
                                <ExpenseCard as="article" className="expense-account" key={a.id}>
                                    <ExpenseRecordRow >
                                        <span className="expense-account-icon">
                                            <WalletCards size={23} />
                                        </span>
                                        <ExpenseActions variant="row" className="expense-row-actions">
                                            <ExpenseIconButton
                                                aria-label={`Editar cuenta ${a.name}`}
                                                disabled={!editable}
                                                onClick={() =>
                                                    setEditor({
                                                        type: 'account',
                                                        value: a,
                                                    })
                                                }
                                            >
                                                <Pencil size={16} />
                                            </ExpenseIconButton>
                                            <ExpenseIconButton
                                                disabled={
                                                    !editable ||
                                                    (!a.archived &&
                                                        book.accounts.filter(
                                                            (a) => !a.archived,
                                                        ).length <= 1)
                                                }
                                                onClick={() => {
                                                    if (!a.archived)
                                                        setConfirmation({
                                                            title: 'Archivar cuenta',
                                                            message:
                                                                'Se conserva su historial y saldo. No podrá seleccionarse para nuevos movimientos. Sus recurrentes se pausarán.',
                                                            next: {
                                                                ...book,
                                                                accounts:
                                                                    book.accounts.map(
                                                                        (
                                                                            old,
                                                                        ) =>
                                                                            old.id ===
                                                                            a.id
                                                                                ? {
                                                                                      ...old,
                                                                                      archived: true,
                                                                                  }
                                                                                : old,
                                                                    ),
                                                                recurring:
                                                                    book.recurring.map(
                                                                        (r) =>
                                                                            r.accountId ===
                                                                            a.id
                                                                                ? {
                                                                                      ...r,
                                                                                      paused: true,
                                                                                  }
                                                                                : r,
                                                                    ),
                                                            },
                                                        });
                                                    else
                                                        void act({
                                                            ...book,
                                                            accounts:
                                                                book.accounts.map(
                                                                    (old) =>
                                                                        old.id ===
                                                                        a.id
                                                                            ? {
                                                                                  ...old,
                                                                                  archived: false,
                                                                              }
                                                                            : old,
                                                                ),
                                                        });
                                                }}
                                            >
                                                {a.archived
                                                    ? 'Restaurar'
                                                    : 'Archivar'}
                                            </ExpenseIconButton>
                                        </ExpenseActions>
                                    </ExpenseRecordRow>
                                    <h3>{a.name}</h3>
                                    <strong
                                        className={
                                            accountBalance(book, a.id, today) <
                                            0
                                                ? 'expense-negative'
                                                : ''
                                        }
                                    >
                                        {money(
                                            accountBalance(book, a.id, today),
                                        )}
                                    </strong>
                                    <small>
                                        {
                                            {
                                                bank: 'Cuenta bancaria',
                                                cash: 'Efectivo',
                                                credit: 'Tarjeta de crédito',
                                            }[a.type]
                                        }
                                        {a.archived ? ' · Archivada' : ''}
                                    </small>
                                </ExpenseCard>
                            ))}
                        </ExpenseGrid>
                    </ExpensePanel>
                    {goalPanel}
                </>
            )}
            <footer className="expense-footer">
                {cloud
                    ? 'Gastos privados guardados en tu cuenta.'
                    : 'Tus gastos permanecen en este navegador. Exporta una copia para conservarlos.'}{' '}
                · Registro independiente de la cartera de inversiones.
            </footer>
            <Modal
                isOpen={!!editor}
                onClose={() => {
                    if (!saving) setEditor(null);
                }}
                title={editor ? editorTitles[editor.type] : ''}
                size="md"
            >
                {editor && (
                    <ExpenseEditors
                        key={`${editor.type}:${'value' in editor ? (editor.value?.id ?? 'new') : month}`}
                        editor={editor}
                        book={book}
                        month={month}
                        saving={saving}
                        onSave={saveEditor}
                        onClose={() => setEditor(null)}
                    />
                )}
            </Modal>
            <Modal
                isOpen={!!importDocument}
                onClose={() => {
                    if (!saving) setImportDocument(null);
                }}
                title="Importar movimientos"
                size="lg"
            >
                {importDocument && (
                    <ExpenseImportDialog
                        book={book}
                        document={importDocument}
                        saving={saving}
                        onSave={save}
                        onClose={() => setImportDocument(null)}
                    />
                )}
            </Modal>
            <ConfirmDialog
                isOpen={!!confirmation}
                onClose={() => {
                    if (!saving) setConfirmation(null);
                }}
                title={confirmation?.title ?? ''}
                message={confirmation?.message ?? ''}
                confirmText={
                    confirmation?.confirmText ??
                    (confirmation?.reload
                        ? 'Cargar versión guardada'
                        : 'Confirmar')
                }
                loading={saving}
                onConfirm={() => {
                    if (!confirmation) return;
                    setError('');
                    const run = async () => {
                        if (confirmation.reload) await store.load(true);
                        else if (confirmation.next) {
                            if (!cloud && status === 'error')
                                store.restoreLocal(confirmation.next);
                            else await save(confirmation.next);
                        }
                    };
                    void run()
                        .then(() => {
                            if (confirmation.resetEntryFilters) {
                                setQuery('');
                                setKindFilter('all');
                                setCategoryFilter('all');
                                setAccountFilter('all');
                                setTagFilter('');
                                setAllDates(true);
                                setPage(0);
                            }
                            setConfirmation(null);
                        })
                        .catch((err) =>
                            setError(
                                err instanceof Error
                                    ? err.message
                                    : 'No se pudo guardar.',
                            ),
                        );
                }}
            />
        </div>
    );
}
