import type { ExpenseBook } from '../types/expenses';
import {
    emptyExpenseBook,
    EXPENSE_KEY,
    parseExpenseBook,
    validateExpenseBook,
} from './expensePlanner';
import type { ExpenseRecord } from './expenseRepository';
export type ExpenseStatus =
    | 'loading'
    | 'ready'
    | 'saving'
    | 'error'
    | 'conflict';
export interface ExpenseSnapshot {
    owner: string | null | undefined;
    book: ExpenseBook;
    status: ExpenseStatus;
    error: string;
    cloud: boolean;
}
export interface ExpenseTransport {
    read: (owner: string, signal: AbortSignal) => Promise<ExpenseRecord | null>;
    write: (
        owner: string,
        revision: number,
        id: string,
        book: ExpenseBook,
        signal: AbortSignal,
    ) => Promise<ExpenseRecord>;
}
const transport: ExpenseTransport = {
    read: async (owner, signal) =>
        (await import('./expenseRepository')).readExpenseBook(owner, signal),
    write: async (owner, revision, id, book, signal) =>
        (await import('./expenseRepository')).writeExpenseBook(
            owner,
            revision,
            id,
            book,
            signal,
        ),
};
/** Independent expense ledger: no investment mutations, no signed-in balances in localStorage. */
export class ExpenseStore {
    private snapshot: ExpenseSnapshot = {
        owner: undefined,
        book: emptyExpenseBook(),
        status: 'loading',
        error: '',
        cloud: false,
    };
    private listeners = new Set<() => void>();
    private epoch = 0;
    private controller?: AbortController;
    private revision = -1;
    private localBaseline: string | null = null;
    private localPending?: ExpenseBook;
    private pending?: { revision: number; id: string; book: ExpenseBook };
    private backups = new Map<
        string,
        { revision: number; id: string; book: ExpenseBook }
    >();
    private api: ExpenseTransport;
    constructor(api: ExpenseTransport = transport) {
        this.api = api;
    }
    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    getSnapshot = () => this.snapshot;
    private emit(update: Partial<ExpenseSnapshot>) {
        this.snapshot = { ...this.snapshot, ...update };
        this.listeners.forEach((fn) => fn());
    }
    get exportBook() {
        return (
            (this.snapshot.cloud ? this.pending?.book : this.localPending) ??
            this.snapshot.book
        );
    }
    get hasPending() {
        return this.snapshot.cloud ? !!this.pending : !!this.localPending;
    }
    async select(owner: string | null) {
        if (owner === this.snapshot.owner) return;
        if (this.snapshot.owner && this.pending)
            this.backups.set(this.snapshot.owner, this.pending);
        this.epoch++;
        this.controller?.abort();
        this.controller = new AbortController();
        this.pending = undefined;
        this.revision = -1;
        this.emit({
            owner,
            book: emptyExpenseBook(),
            cloud: owner !== null,
            error: '',
            status: 'loading',
        });
        if (!owner) {
            try {
                const raw = localStorage.getItem(EXPENSE_KEY);
                this.localBaseline = raw;
                this.emit({
                    book: raw ? parseExpenseBook(raw) : emptyExpenseBook(),
                    status: this.localPending ? 'conflict' : 'ready',
                    error: this.localPending
                        ? 'Hay cambios locales pendientes. Exporta la copia antes de cargar la versión guardada.'
                        : '',
                });
            } catch {
                this.emit({
                    status: 'error',
                    error: 'No se pudo leer el registro local. No se ha sobrescrito. Exporta la copia original para recuperarlo.',
                });
            }
        } else {
            await this.load();
            const recovered = this.backups.get(owner);
            if (recovered && this.snapshot.owner === owner) {
                this.pending = recovered;
                this.emit({
                    status: 'error',
                    error: 'Hay cambios pendientes de una sesión anterior. Exporta la copia o reintenta el guardado.',
                });
            }
        }
    }
    async load(discardPending = false) {
        if (
            ((this.pending || (!this.snapshot.cloud && this.localPending)) &&
                !discardPending) ||
            this.snapshot.status === 'saving'
        )
            return;
        if (discardPending) {
            this.pending = undefined;
            this.localPending = undefined;
            if (this.snapshot.owner) this.backups.delete(this.snapshot.owner);
        }
        if (!this.snapshot.cloud) {
            try {
                const raw = localStorage.getItem(EXPENSE_KEY);
                const book = raw ? parseExpenseBook(raw) : emptyExpenseBook();
                this.localBaseline = raw;
                this.emit({ book, status: 'ready', error: '' });
            } catch {
                this.emit({
                    status: 'error',
                    error: 'No se pudo leer el registro local. No se ha sobrescrito. Exporta la copia original para recuperarlo.',
                });
            }
            return;
        }
        const epoch = this.epoch;
        this.controller?.abort();
        const controller = (this.controller = new AbortController());
        this.emit({ status: 'loading', error: '' });
        try {
            const result = await this.api.read(
                this.snapshot.owner!,
                controller.signal,
            );
            if (epoch !== this.epoch || controller.signal.aborted) return;
            if (result) validateExpenseBook(result.book);
            this.revision = result?.revision ?? -1;
            this.emit({
                book: result?.book ?? emptyExpenseBook(),
                status: 'ready',
            });
        } catch (error) {
            if (epoch === this.epoch && !controller.signal.aborted)
                this.emit({
                    status: 'error',
                    error:
                        error instanceof Error
                            ? error.message
                            : 'No se pudo cargar el registro de gastos. Comprueba la conexión o la verificación en dos pasos en Mi cuenta.',
                });
        }
    }
    restoreLocal(book: ExpenseBook) {
        if (this.snapshot.cloud || this.snapshot.status !== 'error')
            throw new Error('La recuperación local no está disponible.');
        validateExpenseBook(book);
        const raw = JSON.stringify(book);
        localStorage.setItem(EXPENSE_KEY, raw);
        this.localBaseline = raw;
        this.localPending = undefined;
        this.emit({ book, status: 'ready', error: '' });
    }
    async save(book: ExpenseBook) {
        validateExpenseBook(book);
        if (this.snapshot.status !== 'ready' || this.pending)
            throw new Error(
                'Espera al guardado o resuelve los cambios pendientes.',
            );
        if (!this.snapshot.cloud) {
            this.writeLocal(book);
            return;
        }
        if (!navigator.onLine)
            throw new Error(
                'Sin conexión. Vuelve a conectar antes de guardar.',
            );
        this.pending = {
            revision: this.revision,
            id: crypto.randomUUID(),
            book,
        };
        await this.retry();
    }
    private writeLocal(book: ExpenseBook) {
        this.localPending = book;
        try {
            if (localStorage.getItem(EXPENSE_KEY) !== this.localBaseline) {
                this.emit({
                    status: 'conflict',
                    error: 'Los gastos cambiaron en otra pestaña. Exporta tus cambios pendientes y carga la versión guardada.',
                });
                throw new Error('Conflicto con otra pestaña.');
            }
            const raw = JSON.stringify(book);
            localStorage.setItem(EXPENSE_KEY, raw);
            this.localBaseline = raw;
            this.localPending = undefined;
            this.emit({ book, status: 'ready', error: '' });
        } catch (error) {
            if (this.snapshot.status !== 'conflict')
                this.emit({
                    status: 'error',
                    error: 'El navegador no pudo guardar los gastos. Comprueba el espacio y exporta tus cambios pendientes.',
                });
            throw error;
        }
    }
    async retry() {
        if (!this.snapshot.cloud) {
            if (this.localPending && this.snapshot.status !== 'conflict')
                this.writeLocal(this.localPending);
            return;
        }
        if (!this.pending || this.snapshot.status === 'saving') return;
        const request = this.pending,
            epoch = this.epoch;
        this.controller?.abort();
        const controller = (this.controller = new AbortController());
        this.emit({ status: 'saving', error: '' });
        try {
            const record = await this.api.write(
                this.snapshot.owner!,
                request.revision,
                request.id,
                request.book,
                controller.signal,
            );
            if (epoch !== this.epoch || controller.signal.aborted) return;
            validateExpenseBook(record.book);
            this.revision = record.revision;
            this.pending = undefined;
            if (this.snapshot.owner) this.backups.delete(this.snapshot.owner);
            this.emit({ book: record.book, status: 'ready' });
        } catch (error) {
            if (epoch !== this.epoch || controller.signal.aborted) return;
            const conflict =
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === '40001';
            this.emit({
                status: conflict ? 'conflict' : 'error',
                error: conflict
                    ? 'El registro cambió en otro dispositivo. Exporta tus cambios pendientes y carga la versión del servidor.'
                    : 'No se ha confirmado el guardado. Reintenta o exporta tus cambios pendientes.',
            });
            throw error;
        }
    }
}
export const expenseStore = new ExpenseStore();
