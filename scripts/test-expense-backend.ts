import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { emptyExpenseBook } from '../src/services/expensePlanner';
const db = new PGlite();
const A = '11111111-1111-4111-8111-111111111111',
    B = '22222222-2222-4222-8222-222222222222';
const sessionA = '33333333-3333-4333-8333-333333333333',
    sessionB = '44444444-4444-4444-8444-444444444444';
try {
    await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create schema portfolio_private;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz default now(),is_anonymous boolean default false);
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users);
 create table auth.mfa_factors(id uuid primary key,user_id uuid,status text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 grant usage on schema auth to authenticated,anon;
 insert into auth.users(id)values('${A}'),('${B}');insert into auth.sessions values('${sessionA}','${A}'),('${sessionB}','${B}');`);
    await db.exec(
        readFileSync(
            'supabase/migrations/20261001234107_portfolio_mfa_guard.sql',
            'utf8',
        ),
    );
    await db.exec(
        readFileSync(
            'supabase/migrations/20261009000900_expense_books.sql',
            'utf8',
        ),
    );
    const login = async (id: string, session: string, aal = 'aal1') => {
        await db.exec('reset role');
        await db.query(
            "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
            [id, JSON.stringify({ session_id: session, aal })],
        );
        await db.exec('set role authenticated');
    };
    const bad = async (sql: string, params: unknown[], code: string) =>
        assert.rejects(
            db.query(sql, params),
            (e: unknown) =>
                !!e && typeof e === 'object' && 'code' in e && e.code === code,
        );
    await db.exec('set role anon');
    await bad('select public.expense_read_book()', [], '42501');
    await login(A, sessionA);
    assert.equal(
        (
            await db.query<{ result: unknown }>(
                'select public.expense_read_book() result',
            )
        ).rows[0].result,
        null,
        'Expenses work without an investment portfolio',
    );
    const book = emptyExpenseBook(),
        req = '55555555-5555-4555-8555-555555555555';
    const saved = (
        await db.query<{ result: { revision: number; book: unknown } }>(
            'select public.expense_save_book(-1,$1,$2) result',
            [req, book],
        )
    ).rows[0].result;
    assert.equal(saved.revision, 0);
    assert.deepEqual(
        (
            await db.query('select public.expense_save_book(-1,$1,$2) result', [
                req,
                book,
            ])
        ).rows[0].result,
        saved,
        'Exact retry is idempotent',
    );
    await bad('select * from expense_private.books', [], '42501');
    await bad(
        'select public.expense_save_book(-1,$1,$2)',
        [crypto.randomUUID(), book],
        '40001',
    );
    const newer = {
        ...book,
        accounts: book.accounts.map((a) => ({
            ...a,
            name: 'Cuenta actualizada',
        })),
    };
    await db.query('select public.expense_save_book(0,$1,$2)', [
        crypto.randomUUID(),
        newer,
    ]);
    const retry = (
        await db.query<{ result: { revision: number; book: typeof book } }>(
            'select public.expense_save_book(-1,$1,$2) result',
            [req, book],
        )
    ).rows[0].result;
    assert.equal(retry.revision, 1);
    assert.equal(
        retry.book.accounts[0].name,
        'Cuenta actualizada',
        'Retry preserves a newer device edit',
    );
    await bad(
        'select public.expense_save_book(1,$1,$2)',
        [req, newer],
        '22023',
    );
    await bad(
        'select public.expense_save_book(1,$1,$2)',
        [
            crypto.randomUUID(),
            {
                ...book,
                entries: [
                    {
                        id: 'bad',
                        date: '2026-10-01',
                        kind: 'transfer',
                        amountCents: 100,
                        accountId: 'main',
                        toAccountId: 'main',
                        description: 'Bad',
                        tags: [],
                        note: '',
                    },
                ],
            },
        ],
        '22023',
    );
    await login(B, sessionB);
    assert.equal(
        (
            await db.query<{ result: unknown }>(
                'select public.expense_read_book() result',
            )
        ).rows[0].result,
        null,
        'Other account cannot see A',
    );
    await db.query('select public.expense_save_book(-1,$1,$2)', [
        crypto.randomUUID(),
        book,
    ]);
    await login(A, sessionB);
    await bad('select public.expense_read_book()', [], '42501');
    await db.exec('reset role');
    await db.query("insert into auth.mfa_factors values($1,$2,'verified')", [
        crypto.randomUUID(),
        A,
    ]);
    await login(A, sessionA);
    await bad('select public.expense_read_book()', [], '42501');
    await login(A, sessionA, 'aal2');
    assert.equal(
        (
            await db.query<{ result: { revision: number } }>(
                'select public.expense_read_book() result',
            )
        ).rows[0].result.revision,
        1,
    );
    await db.exec('reset role');
    await db.query('delete from auth.users where id=$1', [B]).catch(() => {}); // Auth fixture session FK prevents deletion; explicitly test after removing it.
    await db.query('delete from auth.sessions where user_id=$1', [B]);
    await db.query('delete from auth.users where id=$1', [B]);
    assert.equal(
        (
            await db.query<{ n: number }>(
                'select count(*)::int n from expense_private.books where user_id=$1',
                [B],
            )
        ).rows[0].n,
        0,
    );
    console.log(
        'PASS: actual expense migration, owner isolation, active sessions, MFA, no client table access, CAS conflicts, idempotency, validation, deletion cascade, no investment portfolio required.',
    );
} finally {
    await db.close();
}
