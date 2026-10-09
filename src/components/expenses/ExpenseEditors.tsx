import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type {
    ExpenseAccount,
    ExpenseBook,
    ExpenseBudget,
    ExpenseCategory,
    ExpenseEntry,
    ExpenseGoal,
    ExpenseRecurrence,
    ExpenseKind,
} from '../../types/expenses';
import {
    budgetForMonth,
    monthLabel,
    newExpenseId,
    parseExpenseAmount,
    todayLocal,
} from '../../services/expensePlanner';

export type ExpenseEditor =
    | { type: 'entry'; value?: ExpenseEntry; kind?: ExpenseKind }
    | { type: 'account'; value?: ExpenseAccount }
    | { type: 'budget' }
    | { type: 'recurring'; value?: ExpenseRecurrence }
    | { type: 'goal'; value?: ExpenseGoal }
    | { type: 'category'; value?: ExpenseCategory };
const kinds = {
    expense: 'Gasto',
    income: 'Ingreso',
    transfer: 'Transferencia',
    refund: 'Reembolso',
};
const euros = (cents: number | undefined) =>
    cents === undefined ? '' : String(cents / 100);
function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="expense-field">
            <span>{label}</span>
            {children}
        </label>
    );
}
export function ExpenseEditors({
    editor,
    book,
    month,
    saving,
    onSave,
    onClose,
}: {
    editor: ExpenseEditor;
    book: ExpenseBook;
    month: string;
    saving: boolean;
    onSave: (book: ExpenseBook) => Promise<void>;
    onClose: () => void;
}) {
    const [error, setError] = useState('');
    const [kind, setKind] = useState<ExpenseKind>(
        editor.type === 'entry'
            ? (editor.value?.kind ?? editor.kind ?? 'expense')
            : editor.type === 'recurring'
              ? (editor.value?.kind ?? 'expense')
              : 'expense',
    );
    const [defaultBudget, setDefaultBudget] = useState(false);
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        const f = new FormData(event.currentTarget);
        const text = (key: string) => String(f.get(key) ?? '').trim();
        const amount = (key: string, signed = false) =>
            parseExpenseAmount(text(key) || '0', signed);
        try {
            let next: ExpenseBook = book;
            if (editor.type === 'entry') {
                const entry: ExpenseEntry = {
                    ...editor.value,
                    id: editor.value?.id ?? newExpenseId(),
                    kind,
                    date: text('date'),
                    amountCents: amount('amount'),
                    accountId: text('account'),
                    toAccountId:
                        kind === 'transfer' ? text('toAccount') : undefined,
                    categoryId:
                        kind !== 'income' && kind !== 'transfer'
                            ? text('category')
                            : undefined,
                    description: text('description'),
                    tags: text('tags')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    note: text('note'),
                };
                next = {
                    ...book,
                    entries: book.entries.some((e) => e.id === entry.id)
                        ? book.entries.map((e) =>
                              e.id === entry.id ? entry : e,
                          )
                        : [...book.entries, entry],
                };
            } else if (editor.type === 'account') {
                const a: ExpenseAccount = {
                    id: editor.value?.id ?? newExpenseId(),
                    name: text('name'),
                    type: text('accountType') as ExpenseAccount['type'],
                    openingBalanceCents: amount('opening', true),
                    openingDate: text('openingDate'),
                    archived: editor.value?.archived ?? false,
                };
                next = {
                    ...book,
                    accounts: editor.value
                        ? book.accounts.map((old) =>
                              old.id === a.id ? a : old,
                          )
                        : [...book.accounts, a],
                };
            } else if (editor.type === 'budget') {
                const b: ExpenseBudget = {
                    month: defaultBudget ? 'default' : month,
                    limitCents: amount('limit'),
                    categoryLimits: book.categories
                        .map((c) => ({
                            categoryId: c.id,
                            limitCents: amount(`limit-${c.id}`),
                        }))
                        .filter((c) => c.limitCents > 0),
                };
                next = {
                    ...book,
                    budgets: [
                        ...book.budgets.filter((old) => old.month !== b.month),
                        b,
                    ],
                };
            } else if (editor.type === 'recurring') {
                const r: ExpenseRecurrence = {
                    id: editor.value?.id ?? newExpenseId(),
                    title: text('title'),
                    kind: kind === 'income' ? 'income' : 'expense',
                    amountCents: amount('amount'),
                    accountId: text('account'),
                    categoryId:
                        kind === 'expense' ? text('category') : undefined,
                    startDate: text('startDate'),
                    endDate: text('endDate') || undefined,
                    frequency: text(
                        'frequency',
                    ) as ExpenseRecurrence['frequency'],
                    paused: editor.value?.paused ?? false,
                    skippedDates: editor.value?.skippedDates ?? [],
                };
                next = {
                    ...book,
                    recurring: editor.value
                        ? book.recurring.map((old) =>
                              old.id === r.id ? r : old,
                          )
                        : [...book.recurring, r],
                };
            } else if (editor.type === 'goal') {
                const g: ExpenseGoal = {
                    id: editor.value?.id ?? newExpenseId(),
                    name: text('name'),
                    targetCents: amount('target'),
                    savedCents: amount('saved'),
                    deadline: text('deadline') || undefined,
                };
                next = {
                    ...book,
                    goals: editor.value
                        ? book.goals.map((old) => (old.id === g.id ? g : old))
                        : [...book.goals, g],
                };
            } else {
                const c: ExpenseCategory = {
                    id: editor.value?.id ?? newExpenseId(),
                    name: text('name'),
                    color: text('color'),
                    group: text('group') as ExpenseCategory['group'],
                };
                next = {
                    ...book,
                    categories: editor.value
                        ? book.categories.map((old) =>
                              old.id === c.id ? c : old,
                          )
                        : [...book.categories, c],
                };
            }
            await onSave(next);
            onClose();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'No se pudo guardar.',
            );
        }
    };
    const accounts = (name: string, value?: string, destination = false) => (
        <Field label={destination ? 'Cuenta de destino' : 'Cuenta'}>
            <select
                name={name}
                defaultValue={
                    value ?? book.accounts.find((a) => !a.archived)?.id
                }
                required
            >
                {book.accounts
                    .filter((a) => !a.archived || a.id === value)
                    .map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                            {a.archived ? ' (archivada)' : ''}
                        </option>
                    ))}
            </select>
        </Field>
    );
    const category = (value?: string) => (
        <Field label="Categoría">
            <select
                name="category"
                defaultValue={value ?? book.categories[0]?.id}
                required
            >
                {book.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </select>
        </Field>
    );
    const amountField = (value?: number) => (
        <Field label="Importe (€)">
            <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                max="1000000000"
                defaultValue={euros(value)}
                placeholder="0,00"
                required
            />
        </Field>
    );
    const budget = budgetForMonth(book, month);
    return (
        <form className="expense-form" onSubmit={(event) => void submit(event)}>
            {editor.type === 'entry' && (
                <>
                    <div className="expense-segmented">
                        {(Object.keys(kinds) as ExpenseKind[]).map((k) => (
                            <button
                                key={k}
                                type="button"
                                aria-pressed={kind === k}
                                onClick={() => setKind(k)}
                            >
                                {kinds[k]}
                            </button>
                        ))}
                    </div>
                    <Field label="Concepto">
                        <input
                            name="description"
                            placeholder={
                                kind === 'income'
                                    ? 'Ej. Nómina'
                                    : kind === 'transfer'
                                      ? 'Ej. Ahorro a otra cuenta'
                                      : 'Ej. Compra del supermercado'
                            }
                            maxLength={200}
                            defaultValue={editor.value?.description}
                            required
                            autoComplete="off"
                        />
                    </Field>
                    <div className="expense-form-grid">
                        {amountField(editor.value?.amountCents)}
                        <Field label="Fecha">
                            <input
                                name="date"
                                type="date"
                                min="2000-01-01"
                                max="2199-12-31"
                                defaultValue={
                                    editor.value?.date ?? todayLocal()
                                }
                                required
                            />
                        </Field>
                        {accounts('account', editor.value?.accountId)}
                        {kind === 'transfer'
                            ? accounts(
                                  'toAccount',
                                  editor.value?.toAccountId,
                                  true,
                              )
                            : kind !== 'income'
                              ? category(editor.value?.categoryId)
                              : null}
                    </div>
                    <details className="expense-fold">
                        <summary>Etiquetas y notas</summary>
                        <Field label="Etiquetas (separadas por comas)">
                            <input
                                name="tags"
                                defaultValue={editor.value?.tags.join(', ')}
                                placeholder="Ej. vacaciones, compartido"
                                maxLength={320}
                            />
                        </Field>
                        <Field label="Notas">
                            <textarea
                                name="note"
                                rows={3}
                                maxLength={1000}
                                defaultValue={editor.value?.note}
                            />
                        </Field>
                    </details>
                    {kind === 'transfer' && (
                        <p className="expense-hint">
                            Mueve saldo entre tus cuentas. No cuenta como gasto
                            ni ingreso.
                        </p>
                    )}
                    {kind === 'refund' && (
                        <p className="expense-hint">
                            Reduce el gasto de la categoría y aumenta el saldo
                            de esta cuenta.
                        </p>
                    )}
                    {editor.value?.recurrenceId && (
                        <p className="expense-hint">
                            Vencimiento recurrente ya registrado. Puedes
                            corregir su importe y fecha reales.
                        </p>
                    )}
                </>
            )}
            {editor.type === 'account' && (
                <>
                    <Field label="Nombre de la cuenta">
                        <input
                            name="name"
                            maxLength={80}
                            defaultValue={editor.value?.name}
                            placeholder="Ej. Cuenta nómina"
                            required
                        />
                    </Field>
                    <div className="expense-form-grid">
                        <Field label="Tipo">
                            <select
                                name="accountType"
                                defaultValue={editor.value?.type ?? 'bank'}
                            >
                                <option value="bank">Cuenta bancaria</option>
                                <option value="cash">Efectivo</option>
                                <option value="credit">
                                    Tarjeta de crédito
                                </option>
                            </select>
                        </Field>
                        <Field label="Saldo inicial (€)">
                            <input
                                name="opening"
                                type="number"
                                step="0.01"
                                defaultValue={euros(
                                    editor.value?.openingBalanceCents ?? 0,
                                )}
                                required
                            />
                        </Field>
                        <Field label="Fecha del saldo inicial">
                            <input
                                name="openingDate"
                                type="date"
                                min="2000-01-01"
                                max="2199-12-31"
                                defaultValue={
                                    editor.value?.openingDate ?? todayLocal()
                                }
                                required
                            />
                        </Field>
                    </div>
                    <p className="expense-hint">
                        Saldo antes de los movimientos de esa fecha. Para una
                        tarjeta, introduce la deuda como saldo negativo.
                    </p>
                </>
            )}
            {editor.type === 'budget' && (
                <>
                    <p className="expense-hint">
                        {monthLabel(month)} · Los presupuestos miden gastos
                        menos reembolsos.
                    </p>
                    <Field label="Presupuesto total del mes (€)">
                        <input
                            name="limit"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={euros(budget?.limitCents)}
                            placeholder="Ej. 1500"
                            required
                        />
                    </Field>
                    <label className="expense-check">
                        <input
                            type="checkbox"
                            checked={defaultBudget}
                            onChange={(e) => setDefaultBudget(e.target.checked)}
                        />
                        Usar como base para los meses sin presupuesto propio
                    </label>
                    <h3>Límites por categoría</h3>
                    <p className="expense-hint">
                        Opcionales. Su suma no debe superar el total.
                    </p>
                    <div className="expense-form-grid">
                        {book.categories.map((c) => (
                            <Field key={c.id} label={`${c.name} (€)`}>
                                <input
                                    name={`limit-${c.id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    defaultValue={euros(
                                        budget?.categoryLimits.find(
                                            (l) => l.categoryId === c.id,
                                        )?.limitCents,
                                    )}
                                    placeholder="Sin límite"
                                />
                            </Field>
                        ))}
                    </div>
                </>
            )}
            {editor.type === 'recurring' && (
                <>
                    <Field label="Nombre">
                        <input
                            name="title"
                            defaultValue={editor.value?.title}
                            placeholder="Ej. Alquiler, nómina o Netflix"
                            maxLength={200}
                            required
                        />
                    </Field>
                    <div className="expense-segmented">
                        {(['expense', 'income'] as const).map((k) => (
                            <button
                                type="button"
                                key={k}
                                aria-pressed={kind === k}
                                onClick={() => setKind(k)}
                            >
                                {kinds[k]}
                            </button>
                        ))}
                    </div>
                    <div className="expense-form-grid">
                        {amountField(editor.value?.amountCents)}
                        <Field label="Frecuencia">
                            <select
                                name="frequency"
                                defaultValue={
                                    editor.value?.frequency ?? 'monthly'
                                }
                            >
                                <option value="monthly">Mensual</option>
                                <option value="weekly">Semanal</option>
                                <option value="yearly">Anual</option>
                            </select>
                        </Field>
                        {accounts('account', editor.value?.accountId)}
                        {kind === 'expense' &&
                            category(editor.value?.categoryId)}
                        <Field label="Primer vencimiento">
                            <input
                                name="startDate"
                                type="date"
                                min="2000-01-01"
                                max="2199-12-31"
                                defaultValue={
                                    editor.value?.startDate ?? todayLocal()
                                }
                                required
                            />
                        </Field>
                        <Field label="Último vencimiento (opcional)">
                            <input
                                name="endDate"
                                type="date"
                                min="2000-01-01"
                                max="2199-12-31"
                                defaultValue={editor.value?.endDate}
                            />
                        </Field>
                    </div>
                    <p className="expense-hint">
                        Genera recordatorios. Confirma cada pago o cobro cuando
                        ocurra; no se añadirá a tus gastos automáticamente.
                    </p>
                </>
            )}
            {editor.type === 'goal' && (
                <>
                    <Field label="Nombre del objetivo">
                        <input
                            name="name"
                            defaultValue={editor.value?.name}
                            maxLength={80}
                            placeholder="Ej. Colchón de emergencia"
                            required
                        />
                    </Field>
                    <div className="expense-form-grid">
                        <Field label="Objetivo (€)">
                            <input
                                name="target"
                                type="number"
                                min="0.01"
                                step="0.01"
                                defaultValue={euros(editor.value?.targetCents)}
                                required
                            />
                        </Field>
                        <Field label="Ya reservado (€)">
                            <input
                                name="saved"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={euros(
                                    editor.value?.savedCents ?? 0,
                                )}
                                required
                            />
                        </Field>
                        <Field label="Fecha objetivo (opcional)">
                            <input
                                name="deadline"
                                type="date"
                                min="2000-01-01"
                                max="2199-12-31"
                                defaultValue={editor.value?.deadline}
                            />
                        </Field>
                    </div>
                    <p className="expense-hint">
                        Es una reserva de planificación. No modifica tus saldos
                        ni registra un movimiento.
                    </p>
                </>
            )}
            {editor.type === 'category' && (
                <>
                    <Field label="Nombre">
                        <input
                            name="name"
                            maxLength={60}
                            defaultValue={editor.value?.name}
                            required
                        />
                    </Field>
                    <div className="expense-form-grid">
                        <Field label="Grupo">
                            <select
                                name="group"
                                defaultValue={editor.value?.group ?? 'wants'}
                            >
                                <option value="needs">Necesidades</option>
                                <option value="wants">Deseos</option>
                                <option value="savings">
                                    Ahorro e inversión
                                </option>
                            </select>
                        </Field>
                        <Field label="Color">
                            <input
                                name="color"
                                type="color"
                                defaultValue={editor.value?.color ?? '#34d399'}
                            />
                        </Field>
                    </div>
                    <p className="expense-hint">
                        El grupo sirve para contrastar tus gastos con la regla
                        orientativa 50/30/20.
                    </p>
                </>
            )}
            {error && (
                <p className="expense-error" role="alert">
                    {error}
                </p>
            )}
            <div className="expense-form-actions">
                <button
                    className="expense-btn expense-btn--secondary"
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                >
                    Cancelar
                </button>
                <button className="expense-btn" type="submit" disabled={saving}>
                    {saving ? 'Guardando…' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}
