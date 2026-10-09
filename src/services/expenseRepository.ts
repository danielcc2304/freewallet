import type { ExpenseBook } from '../types/expenses';
import { getAppSupabaseClient, appBackendConfig } from './supabaseClient';
import { EXPENSE_LIMIT_BYTES, validateExpenseBook } from './expensePlanner';
export interface ExpenseRecord {
    revision: number;
    book: ExpenseBook;
}
/** Pin the owner's token before sending financial data. The SDK's lazy Auth
 * resolution must not send an old account's book under a new account's token. */
async function request(
    name: string,
    args: Record<string, unknown>,
    owner: string,
    signal: AbortSignal,
): Promise<ExpenseRecord | null> {
    const client = await getAppSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (
        signal.aborted ||
        error ||
        !data.session ||
        data.session.user.id !== owner ||
        !appBackendConfig
    )
        throw new Error('La sesión ha cambiado. No se han enviado tus gastos.');
    const token = data.session.access_token;
    const deadline = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
    const response = await fetch(
        `${appBackendConfig.url}/rest/v1/rpc/${name}`,
        {
            method: 'POST',
            signal: deadline,
            headers: {
                apikey: appBackendConfig.key,
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(args),
        },
    );
    const raw = await response.text();
    if (new TextEncoder().encode(raw).length > EXPENSE_LIMIT_BYTES + 1000)
        throw new Error('Respuesta de gastos demasiado grande.');
    const payload = JSON.parse(raw);
    if (!response.ok) {
        const code = String(payload?.code ?? response.status);
        throw Object.assign(
            new Error(
                code === '40001'
                    ? 'Tus gastos cambiaron en otro dispositivo.'
                    : code === '42501'
                      ? 'Verifica tu sesión y el segundo factor en Mi cuenta.'
                      : 'No se pudo confirmar el guardado de gastos.',
            ),
            { code },
        );
    }
    if (payload === null) return null;
    if (!Number.isSafeInteger(payload.revision) || payload.revision < 0)
        throw new Error('Revisión de gastos no válida.');
    validateExpenseBook(payload.book);
    return payload as ExpenseRecord;
}
export const readExpenseBook = (owner: string, signal: AbortSignal) =>
    request('expense_read_book', {}, owner, signal);
export async function writeExpenseBook(
    owner: string,
    revision: number,
    id: string,
    book: ExpenseBook,
    signal: AbortSignal,
) {
    const result = await request(
        'expense_save_book',
        { expected_revision: revision, request_id: id, payload: book },
        owner,
        signal,
    );
    if (!result) throw new Error('No se pudo confirmar el guardado.');
    return result;
}
