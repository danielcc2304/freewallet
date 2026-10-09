import { useMemo, useRef, useState } from 'react';
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
function Progress({
    value,
    limit,
    color,
}: {
    value: number;
    limit: number;
    color?: string;
}) {
    return (
        <div
            className={`expense-progress${value > limit && limit > 0 ? ' expense-progress--over' : ''}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
                limit > 0
                    ? Math.round(
                          Math.max(0, Math.min(100, (value / limit) * 100)),
                      )
                    : 0
            }
            aria-label={
                limit > 0 ? `${money(value)} de ${money(limit)}` : 'Sin límite'
            }
        >
            <span
                style={{
                    width: `${limit > 0 ? Math.max(0, Math.min(100, (value / limit) * 100)) : 0}%`,
                    backgroundColor: color,
                }}
            />
        </div>
    );
}
function Empty({
    title,
    children,
    action,
}: {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div className="expense-empty">
            <WalletCards size={36} />
            <h3>{title}</h3>
            <p>{children}</p>
            {action}
        </div>
    );
}
export default function ExpenseManager() {
    const { book, status, cloud, error: syncError, store } = useExpenseBook();
    const [month, setMonth] = useState(() => todayLocal().slice(0, 7));
    const [tab, setTab] = useState<Tab>('overview');
    const [editor, setEditor] = useState<ExpenseEditor | null>(null);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState<{
        title: string;
        message: string;
        next?: ExpenseBook;
        reload?: boolean;
    } | null>(null);
    const [csvRows, setCsvRows] = useState<string[][] | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
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
        if (!file || !book) return;
        setError('');
        if (!editable && !file.name.toLowerCase().endsWith('.json')) {
            setError(
                'Recupera el registro con una copia JSON válida antes de importar CSV.',
            );
            return;
        }
        try {
            if (file.size > EXPENSE_LIMIT_BYTES)
                throw new Error('El archivo supera los 2 MB.');
            const raw = await file.text();
            if (file.name.toLowerCase().endsWith('.json')) {
                const next = parseExpenseBook(raw);
                setConfirmation({
                    title: 'Restaurar copia de gastos',
                    message: `La copia sustituirá tus ${book.entries.length} movimientos por ${next.entries.length} y reemplazará cuentas, presupuestos y objetivos. Exporta antes tu copia actual si quieres conservarla.`,
                    next,
                });
            } else setCsvRows(readExpenseCsv(raw));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo leer el archivo.',
            );
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
            <div className="expense-month">
                <button
                    type="button"
                    aria-label="Mes anterior"
                    disabled={month <= '2000-01'}
                    onClick={() => changeMonth(shiftMonth(month, -1))}
                >
                    <ChevronLeft size={18} />
                </button>
                <label>
                    <span className="expense-sr">Mes seleccionado</span>
                    <input
                        type="month"
                        min="2000-01"
                        max="2199-12"
                        value={month}
                        onChange={(e) => {
                            if (e.target.value) changeMonth(e.target.value);
                        }}
                    />
                </label>
                <button
                    type="button"
                    aria-label="Mes siguiente"
                    disabled={month >= '2199-12'}
                    onClick={() => changeMonth(shiftMonth(month, 1))}
                >
                    <ChevronRight size={18} />
                </button>
            </div>
            <div className="expense-toolbar-actions">
                <details className="expense-export-menu">
                    <summary>
                        <Download size={16} />
                        Datos
                    </summary>
                    <div>
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
                            disabled={
                                !editable && (cloud || status !== 'error')
                            }
                            onClick={() => fileRef.current?.click()}
                        >
                            Importar CSV o copia JSON
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
                    </div>
                </details>
                <button
                    className="expense-btn"
                    disabled={!editable}
                    onClick={() => newMovement()}
                >
                    <Plus size={18} />
                    Añadir movimiento
                </button>
            </div>
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
        <section className="expense-panel">
            <div className="expense-panel-title">
                <h2>
                    <Target size={20} />
                    Objetivos de ahorro
                </h2>
                <button
                    className="expense-btn expense-btn--quiet"
                    disabled={!editable}
                    onClick={() => setEditor({ type: 'goal' })}
                >
                    <Plus size={16} />
                    Objetivo
                </button>
            </div>
            <p className="expense-hint">
                Reservas de planificación; no se descuentan del saldo de tus
                cuentas.
            </p>
            {!book.goals.length ? (
                <Empty title="Ponle nombre a tu ahorro">
                    Un colchón, unas vacaciones o tu próxima inversión.
                </Empty>
            ) : (
                <div className="expense-goals">
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
                            <div className="expense-goal" key={g.id}>
                                <div className="expense-row">
                                    <h3>{g.name}</h3>
                                    <div className="expense-row-actions">
                                        <button
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
                                        </button>
                                        <button
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
                                        </button>
                                    </div>
                                </div>
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
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
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
            <input
                ref={fileRef}
                type="file"
                accept=".csv,.json,text/csv,application/json"
                hidden
                onChange={(e) => {
                    void readFile(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
            {status !== 'ready' && !saving && (
                <div className="expense-sync-error" role="alert">
                    <strong>{syncError}</strong>
                    <div className="expense-actions">
                        <button
                            className="expense-btn expense-btn--secondary"
                            onClick={exportBackup}
                        >
                            <Download size={16} />
                            Exportar copia
                        </button>
                        {status !== 'conflict' && (
                            <button
                                className="expense-btn expense-btn--secondary"
                                onClick={() =>
                                    void store
                                        .retry()
                                        .then(() => store.load())
                                        .catch(() => {})
                                }
                            >
                                Reintentar
                            </button>
                        )}
                        <button
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
                        </button>
                        {cloud && <Link to="/account">Mi cuenta</Link>}
                    </div>
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
            <nav className="expense-tabs" aria-label="Secciones de gastos">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        aria-pressed={tab === t.id}
                        onClick={() => setTab(t.id)}
                    >
                        <t.icon size={17} />
                        {t.label}
                    </button>
                ))}
            </nav>
            {tab === 'overview' && (
                <>
                    <div className="expense-metrics">
                        <article className="expense-stat">
                            <span>
                                <ArrowDownLeft size={17} />
                                Ingresos
                            </span>
                            <strong data-testid="expense-income">
                                {money(stats.income)}
                            </strong>
                            <small>{monthLabel(month)}</small>
                        </article>
                        <article className="expense-stat">
                            <span>
                                <ArrowUpRight size={17} />
                                Gastos netos
                            </span>
                            <strong data-testid="expense-spent">
                                {money(stats.expenses)}
                            </strong>
                            <small>
                                {stats.refunds
                                    ? `${money(stats.refunds)} en reembolsos descontados`
                                    : 'Gastos registrados, sin transferencias'}
                            </small>
                        </article>
                        <article className="expense-stat expense-stat--hero">
                            <span>
                                <WalletCards size={17} />
                                Balance del mes
                            </span>
                            <strong data-testid="expense-net">
                                {money(stats.net)}
                            </strong>
                            <small>
                                {stats.savingRate !== null
                                    ? `${stats.savingRate.toLocaleString('es-ES', { maximumFractionDigits: 1 })} % de tus ingresos conservados`
                                    : 'Registra ingresos para calcular tu tasa de ahorro'}
                            </small>
                        </article>
                        <article className="expense-stat">
                            <span>
                                <Target size={17} />
                                Presupuesto disponible
                            </span>
                            <strong>
                                {stats.remaining === null
                                    ? 'Sin definir'
                                    : money(stats.remaining)}
                            </strong>
                            <small>
                                {stats.dailyAllowance !== null
                                    ? `${money(Math.floor(stats.dailyAllowance))}/día hasta fin de mes`
                                    : stats.budget
                                      ? 'Periodo cerrado'
                                      : 'Define tu límite de gasto mensual'}
                            </small>
                        </article>
                    </div>
                    {!book.entries.length && (
                        <div className="expense-start">
                            <div>
                                <h2>Tu mes empieza con un movimiento</h2>
                                <p>
                                    Registra un gasto, añade tus ingresos o
                                    importa el extracto de tu banco.
                                </p>
                            </div>
                            <div className="expense-actions">
                                <button
                                    className="expense-btn"
                                    disabled={!editable}
                                    onClick={() => newMovement()}
                                >
                                    <Plus size={17} />
                                    Registrar primer gasto
                                </button>
                                <button
                                    className="expense-btn expense-btn--secondary"
                                    disabled={!editable}
                                    onClick={() => fileRef.current?.click()}
                                >
                                    <FileUp size={17} />
                                    Importar extracto
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="expense-two-col">
                        <section className="expense-panel">
                            <div className="expense-panel-title">
                                <h2>¿Dónde se va tu dinero?</h2>
                                <button
                                    className="expense-btn expense-btn--quiet"
                                    onClick={() => setTab('entries')}
                                >
                                    Ver movimientos
                                </button>
                            </div>
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
                        </section>
                        <section className="expense-panel">
                            <div className="expense-panel-title">
                                <h2>Un plan para lo que queda</h2>
                                <button
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
                                </button>
                            </div>
                            {stats.budget ? (
                                <>
                                    <div className="expense-budget-number">
                                        <strong>{money(stats.expenses)}</strong>
                                        <span>
                                            de {money(stats.budget.limitCents)}{' '}
                                            previstos
                                        </span>
                                    </div>
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
                        </section>
                    </div>
                    <div className="expense-two-col">
                        <section className="expense-panel">
                            <div className="expense-panel-title">
                                <h2>Tu evolución</h2>
                                <span className="expense-hint">
                                    6 meses · solo registrados
                                </span>
                            </div>
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
                        </section>
                        <section className="expense-panel">
                            <div className="expense-panel-title">
                                <h2>
                                    <CalendarDays size={19} />
                                    Vencimientos del mes
                                </h2>
                                <button
                                    className="expense-btn expense-btn--quiet"
                                    onClick={() => setTab('recurring')}
                                >
                                    Ver todos
                                </button>
                            </div>
                            {pending.length ? (
                                <div className="expense-upcoming">
                                    {pending.slice(0, 5).map((p) => (
                                        <div
                                            className="expense-row"
                                            key={`${p.rule.id}:${p.date}`}
                                        >
                                            <div>
                                                <strong>{p.rule.title}</strong>
                                                <small>
                                                    {dayLabel(p.date)} ·{' '}
                                                    {p.date < today
                                                        ? 'Pendiente de confirmar'
                                                        : 'Previsto'}
                                                </small>
                                            </div>
                                            <strong
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
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Empty title="Sin vencimientos pendientes">
                                    Añade tus facturas, suscripciones y cobros
                                    habituales.
                                </Empty>
                            )}
                        </section>
                    </div>
                    <details className="expense-panel expense-fold">
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
                                    <div
                                        key={date}
                                        className={
                                            cents > 0
                                                ? 'expense-calendar-day expense-calendar-day--spent'
                                                : 'expense-calendar-day'
                                        }
                                    >
                                        <span>{i + 1}</span>
                                        <strong>
                                            {cents ? money(cents) : '—'}
                                        </strong>
                                    </div>
                                );
                            })}
                        </div>
                    </details>
                </>
            )}
            {tab === 'entries' && (
                <section className="expense-panel">
                    <div className="expense-panel-title">
                        <h2>Movimientos</h2>
                        <span>{filtered.length} registros</span>
                    </div>
                    <div className="expense-filters">
                        <label className="expense-search">
                            <Search size={17} />
                            <span className="expense-sr">
                                Buscar concepto o nota
                            </span>
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(0);
                                }}
                                placeholder="Buscar concepto o nota"
                            />
                        </label>
                        <label className="expense-field">
                            <span className="expense-sr">
                                Tipo de movimiento
                            </span>
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
                        </label>
                        <label className="expense-field">
                            <span className="expense-sr">
                                Filtrar categoría
                            </span>
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
                        </label>
                        <label className="expense-field">
                            <span className="expense-sr">Filtrar cuenta</span>
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
                        </label>
                        <label className="expense-field">
                            <span className="expense-sr">Filtrar etiqueta</span>
                            <input
                                value={tagFilter}
                                onChange={(e) => {
                                    setTagFilter(e.target.value);
                                    setPage(0);
                                }}
                                placeholder="Etiqueta"
                            />
                        </label>
                    </div>
                    <label className="expense-check">
                        <input
                            type="checkbox"
                            checked={allDates}
                            onChange={(e) => {
                                setAllDates(e.target.checked);
                                setPage(0);
                            }}
                        />
                        Ver todas las fechas
                    </label>
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
                                            <div className="expense-row">
                                                <div>
                                                    <strong>
                                                        {e.description}
                                                    </strong>
                                                    <small>
                                                        {dayLabel(e.date)} ·{' '}
                                                        {kindLabels[e.kind]}
                                                        {e.date > today
                                                            ? ' · Previsto'
                                                            : ''}
                                                    </small>
                                                </div>
                                                <strong
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
                                                </strong>
                                            </div>
                                            <div className="expense-row">
                                                <p className="expense-hint">
                                                    {accountName(e.accountId)}
                                                    {e.toAccountId
                                                        ? ` → ${accountName(e.toAccountId)}`
                                                        : e.categoryId
                                                          ? ` · ${categoryName(e.categoryId)}`
                                                          : ''}
                                                </p>
                                                <div className="expense-row-actions">
                                                    <button
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
                                                    </button>
                                                    <button
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
                                                    </button>
                                                </div>
                                            </div>
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
                            <div className="expense-table-scroll expense-entry-table">
                                <table className="expense-table">
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
                                                        <div className="expense-row-actions">
                                                            <button
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
                                                            </button>
                                                            <button
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
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="expense-pagination">
                                <button
                                    className="expense-btn expense-btn--secondary"
                                    disabled={safePage === 0}
                                    onClick={() => setPage(safePage - 1)}
                                >
                                    Anterior
                                </button>
                                <span>
                                    {safePage + 1} / {pageCount}
                                </span>
                                <button
                                    className="expense-btn expense-btn--secondary"
                                    disabled={safePage + 1 >= pageCount}
                                    onClick={() => setPage(safePage + 1)}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </>
                    ) : (
                        <Empty
                            title="No hay movimientos con estos filtros"
                            action={
                                <button
                                    className="expense-btn"
                                    disabled={!editable}
                                    onClick={() => newMovement()}
                                >
                                    Añadir movimiento
                                </button>
                            }
                        >
                            Prueba otra fecha o registra tu primer movimiento.
                        </Empty>
                    )}
                </section>
            )}
            {tab === 'budgets' && (
                <>
                    <div className="expense-two-col">
                        <section className="expense-panel">
                            <div className="expense-panel-title">
                                <h2>Presupuesto de {monthLabel(month)}</h2>
                                <button
                                    className="expense-btn expense-btn--quiet"
                                    disabled={!editable}
                                    onClick={() =>
                                        setEditor({ type: 'budget' })
                                    }
                                >
                                    <Pencil size={16} />
                                    Editar
                                </button>
                            </div>
                            {stats.budget ? (
                                <>
                                    <div className="expense-budget-number">
                                        <strong>
                                            {money(stats.budget.limitCents)}
                                        </strong>
                                        <span>
                                            {stats.budget.month === 'default'
                                                ? 'Presupuesto base'
                                                : 'Presupuesto de este mes'}
                                        </span>
                                    </div>
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
                                    <div className="expense-actions">
                                        <button
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
                                        </button>
                                        <button
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
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <Empty
                                    title="Un límite te ayuda a decidir"
                                    action={
                                        <button
                                            className="expense-btn"
                                            disabled={!editable}
                                            onClick={() =>
                                                setEditor({ type: 'budget' })
                                            }
                                        >
                                            Definir presupuesto
                                        </button>
                                    }
                                >
                                    Empieza con un total y ajusta las categorías
                                    que quieras controlar.
                                </Empty>
                            )}
                        </section>
                        <section className="expense-panel">
                            <h2>Regla 50 / 30 / 20</h2>
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
                                        <div className="expense-row">
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
                                        </div>
                                        <Progress
                                            value={cents}
                                            limit={target}
                                            color={i ? '#818cf8' : '#34d399'}
                                        />
                                    </div>
                                );
                            })}
                            <div className="expense-allocation">
                                <div className="expense-row">
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
                                </div>
                                <p className="expense-hint">
                                    Referencia:{' '}
                                    {stats.income
                                        ? `${money(stats.income * 0.2)} (20 % de tus ingresos)`
                                        : 'registra ingresos para comparar'}
                                    . Las transferencias entre tus cuentas
                                    quedan fuera.
                                </p>
                            </div>
                        </section>
                    </div>
                    <section className="expense-panel">
                        <div className="expense-panel-title">
                            <h2>Categorías y límites</h2>
                            <button
                                className="expense-btn expense-btn--quiet"
                                disabled={!editable}
                                onClick={() => setEditor({ type: 'category' })}
                            >
                                <Plus size={16} />
                                Categoría
                            </button>
                        </div>
                        <div className="expense-category-grid">
                            {stats.categories.map((c) => {
                                const limit =
                                    stats.budget?.categoryLimits.find(
                                        (l) => l.categoryId === c.id,
                                    )?.limitCents ?? 0;
                                return (
                                    <div
                                        className="expense-category-card"
                                        key={c.id}
                                    >
                                        <div className="expense-row">
                                            <span>
                                                <i
                                                    className="expense-color-dot"
                                                    style={{
                                                        background: c.color,
                                                    }}
                                                />
                                                {c.name}
                                            </span>
                                            <button
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
                                            </button>
                                        </div>
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
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}
            {tab === 'recurring' && (
                <>
                    <div className="expense-metrics expense-metrics--three">
                        <article className="expense-stat">
                            <span>Gasto recurrente equivalente</span>
                            <strong>
                                {money(Math.round(monthlyRecurrenceCost(book)))}
                            </strong>
                            <small>
                                Reglas activas hoy · semanales × 52 / 12;
                                anuales ÷ 12
                            </small>
                        </article>
                        <article className="expense-stat">
                            <span>Pendiente de confirmar este mes</span>
                            <strong>{money(commitments)}</strong>
                            <small>
                                {
                                    pending.filter(
                                        (p) => p.rule.kind === 'expense',
                                    ).length
                                }{' '}
                                vencimientos de gasto
                            </small>
                        </article>
                        <article className="expense-stat">
                            <span>Reglas activas</span>
                            <strong>
                                {
                                    book.recurring.filter((r) =>
                                        activeRecurrence(r, today),
                                    ).length
                                }
                            </strong>
                            <small>Gastos e ingresos habituales</small>
                        </article>
                    </div>
                    <section className="expense-panel">
                        <div className="expense-panel-title">
                            <h2>Vencimientos de {monthLabel(month)}</h2>
                            <button
                                className="expense-btn"
                                disabled={!editable}
                                onClick={() => setEditor({ type: 'recurring' })}
                            >
                                <Plus size={16} />
                                Añadir recurrente
                            </button>
                        </div>
                        {pending.length ? (
                            <div className="expense-upcoming">
                                {pending.map((p) => (
                                    <div
                                        className="expense-row expense-due-row"
                                        key={`${p.rule.id}:${p.date}`}
                                    >
                                        <div>
                                            <strong>{p.rule.title}</strong>
                                            <small>
                                                {dayLabel(p.date)} ·{' '}
                                                {accountName(p.rule.accountId)}
                                                {p.date < today
                                                    ? ' · Pendiente'
                                                    : ''}
                                            </small>
                                        </div>
                                        <strong
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
                                        </strong>
                                        <div className="expense-actions">
                                            <button
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
                                            </button>
                                            <button
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
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty title="No hay vencimientos pendientes">
                                Los pagos confirmados ya están en Movimientos.
                                Cambia de mes para ver los próximos.
                            </Empty>
                        )}
                    </section>
                    <section className="expense-panel">
                        <h2>Tus reglas recurrentes</h2>
                        {book.recurring.length ? (
                            book.recurring.map((r) => (
                                <div
                                    className="expense-row expense-rule-row"
                                    key={r.id}
                                >
                                    <div>
                                        <strong>{r.title}</strong>
                                        <small>
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
                                        </small>
                                    </div>
                                    <div className="expense-row-actions">
                                        <button
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
                                        </button>
                                        <button
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
                                        </button>
                                        <button
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
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <Empty title="Automatiza los recordatorios">
                                Alquiler, facturas, suscripciones y nómina. Tú
                                confirmas los movimientos.
                            </Empty>
                        )}
                    </section>
                </>
            )}
            {tab === 'accounts' && (
                <>
                    <section className="expense-panel">
                        <div className="expense-panel-title">
                            <h2>Tus cuentas</h2>
                            <button
                                className="expense-btn"
                                disabled={!editable}
                                onClick={() => setEditor({ type: 'account' })}
                            >
                                <Plus size={16} />
                                Añadir cuenta
                            </button>
                        </div>
                        <p className="expense-hint">
                            Saldos calculados a día de hoy con el saldo inicial
                            y los movimientos registrados. No hay conexión
                            bancaria.
                        </p>
                        <div className="expense-accounts">
                            {book.accounts.map((a) => (
                                <article className="expense-account" key={a.id}>
                                    <div className="expense-row">
                                        <span className="expense-account-icon">
                                            <WalletCards size={23} />
                                        </span>
                                        <div className="expense-row-actions">
                                            <button
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
                                            </button>
                                            <button
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
                                            </button>
                                        </div>
                                    </div>
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
                                </article>
                            ))}
                        </div>
                    </section>
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
                isOpen={!!csvRows}
                onClose={() => {
                    if (!saving) setCsvRows(null);
                }}
                title="Importar movimientos"
                size="lg"
            >
                {csvRows && (
                    <ExpenseImportDialog
                        book={book}
                        rows={csvRows}
                        saving={saving}
                        onSave={save}
                        onClose={() => setCsvRows(null)}
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
                    confirmation?.reload
                        ? 'Cargar versión guardada'
                        : 'Confirmar'
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
                        .then(() => setConfirmation(null))
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
