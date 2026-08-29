import type { NewsPost, NewsPostInput, NewsSession, NewsUser } from '../types/news';
import { sanitizeNewsHtml } from '../utils/newsContent';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const SUPABASE_KEY =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

const SESSION_STORAGE_KEY = 'freewallet_news_session';
const NEWS_COLUMNS = 'id,slug,title,excerpt,content,cover_image_url,status,published_at,created_at,updated_at,author_id';

export const isNewsBackendConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export class NewsServiceError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'NewsServiceError';
        this.status = status;
    }
}

interface SupabaseAuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: {
        id: string;
        email?: string | null;
    };
}

interface NewsPostRow {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    cover_image_url: string | null;
    status: NewsPost['status'];
    published_at: string | null;
    created_at: string;
    updated_at: string;
    author_id: string | null;
}

function requireConfiguration(): { url: string; key: string } {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new NewsServiceError(
            'La sección de noticias necesita VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (o VITE_SUPABASE_PUBLISHABLE_KEY).',
        );
    }

    return { url: SUPABASE_URL, key: SUPABASE_KEY };
}

function readStoredSession(): NewsSession | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
        return stored ? (JSON.parse(stored) as NewsSession) : null;
    } catch {
        return null;
    }
}

function storeSession(session: NewsSession): void {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession(): void {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function mapUser(user: SupabaseAuthResponse['user']): NewsUser {
    return {
        id: user.id,
        email: user.email ?? null,
    };
}

function mapAuthResponse(response: SupabaseAuthResponse): NewsSession {
    return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: Date.now() + response.expires_in * 1000,
        user: mapUser(response.user),
    };
}

function mapPost(row: NewsPostRow): NewsPost {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt ?? '',
        content: row.content,
        coverImageUrl: row.cover_image_url,
        status: row.status,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        authorId: row.author_id,
    };
}

function getErrorMessage(payload: unknown, fallback: string): string {
    if (typeof payload === 'object' && payload !== null) {
        const errorPayload = payload as { message?: unknown; error_description?: unknown; hint?: unknown };
        const message = errorPayload.message ?? errorPayload.error_description ?? errorPayload.hint;
        if (typeof message === 'string' && message.trim()) {
            return message;
        }
    }

    return fallback;
}

async function parseResponse(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text) as unknown;
    } catch {
        return text;
    }
}

async function refreshSession(session: NewsSession): Promise<NewsSession | null> {
    const { url, key } = requireConfiguration();
    const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
            apikey: key,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
    });

    if (!response.ok) {
        clearStoredSession();
        return null;
    }

    const payload = await parseResponse(response) as SupabaseAuthResponse;
    const nextSession = mapAuthResponse(payload);
    storeSession(nextSession);
    return nextSession;
}

export async function getNewsSession(): Promise<NewsSession | null> {
    const session = readStoredSession();
    if (!session) {
        return null;
    }

    if (session.expiresAt <= Date.now() + 30_000) {
        return refreshSession(session);
    }

    return session;
}

interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
    allowRefresh?: boolean;
}

async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
    const { url, key } = requireConfiguration();
    const { requiresAuth = false, allowRefresh = true, ...requestInit } = options;
    let session = await getNewsSession();

    if (requiresAuth && !session) {
        throw new NewsServiceError('Tu sesión editorial ha caducado. Vuelve a iniciar sesión.');
    }

    const headers = new Headers(requestInit.headers);
    headers.set('apikey', key);
    if (session) {
        headers.set('Authorization', `Bearer ${session.accessToken}`);
    }
    if (requestInit.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${url}${path}`, { ...requestInit, headers });

    if (response.status === 401 && allowRefresh && session?.refreshToken) {
        session = await refreshSession(session);
        if (session) {
            return request(path, { ...options, allowRefresh: false });
        }
    }

    const payload = await parseResponse(response);
    if (!response.ok) {
        throw new NewsServiceError(getErrorMessage(payload, 'No se pudo completar la operación.'), response.status);
    }

    return payload;
}

export async function signInNewsAdmin(email: string, password: string): Promise<NewsSession> {
    const { url, key } = requireConfiguration();
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            apikey: key,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
    });
    const payload = await parseResponse(response);

    if (!response.ok) {
        throw new NewsServiceError(getErrorMessage(payload, 'Credenciales no válidas.'), response.status);
    }

    const session = mapAuthResponse(payload as SupabaseAuthResponse);
    storeSession(session);
    return session;
}

export async function signOutNewsAdmin(): Promise<void> {
    const session = readStoredSession();
    if (session && isNewsBackendConfigured) {
        const { url, key } = requireConfiguration();
        await fetch(`${url}/auth/v1/logout`, {
            method: 'POST',
            headers: {
                apikey: key,
                Authorization: `Bearer ${session.accessToken}`,
            },
        }).catch(() => undefined);
    }
    clearStoredSession();
}

export async function isCurrentUserNewsAdmin(): Promise<boolean> {
    const payload = await request('/rest/v1/rpc/is_news_admin', {
        method: 'POST',
        body: JSON.stringify({}),
        requiresAuth: true,
    });
    return payload === true;
}

export async function listPublishedNews(): Promise<NewsPost[]> {
    const params = new URLSearchParams({
        select: NEWS_COLUMNS,
        status: 'eq.published',
        order: 'published_at.desc',
    });
    const payload = await request(`/rest/v1/news_posts?${params.toString()}`);
    return Array.isArray(payload) ? (payload as NewsPostRow[]).map(mapPost) : [];
}

export async function getPublishedNewsBySlug(slug: string): Promise<NewsPost | null> {
    const params = new URLSearchParams({
        select: NEWS_COLUMNS,
        status: 'eq.published',
        slug: `eq.${slug}`,
        limit: '1',
    });
    const payload = await request(`/rest/v1/news_posts?${params.toString()}`);
    const rows = Array.isArray(payload) ? (payload as NewsPostRow[]) : [];
    return rows[0] ? mapPost(rows[0]) : null;
}

export async function listAdminNews(): Promise<NewsPost[]> {
    const params = new URLSearchParams({
        select: NEWS_COLUMNS,
        order: 'updated_at.desc',
    });
    const payload = await request(`/rest/v1/news_posts?${params.toString()}`, { requiresAuth: true });
    return Array.isArray(payload) ? (payload as NewsPostRow[]).map(mapPost) : [];
}

export async function saveNewsPost(input: NewsPostInput, existingId?: string): Promise<NewsPost> {
    const session = await getNewsSession();
    if (!session) {
        throw new NewsServiceError('Tu sesión editorial ha caducado. Vuelve a iniciar sesión.');
    }

    const content = sanitizeNewsHtml(input.content);
    const publishedAt = input.status === 'published'
        ? input.publishedAt ?? new Date().toISOString()
        : null;
    const payload = {
        title: input.title.trim(),
        slug: input.slug.trim(),
        excerpt: input.excerpt.trim(),
        content,
        cover_image_url: input.coverImageUrl.trim() || null,
        status: input.status,
        published_at: publishedAt,
        ...(existingId ? {} : { author_id: session.user.id }),
    };

    const path = existingId
        ? `/rest/v1/news_posts?id=eq.${encodeURIComponent(existingId)}`
        : '/rest/v1/news_posts';
    const response = await request(path, {
        method: existingId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
        headers: { Prefer: 'return=representation' },
        requiresAuth: true,
    });
    const rows = Array.isArray(response) ? (response as NewsPostRow[]) : [];
    if (!rows[0]) {
        throw new NewsServiceError('Supabase no devolvió la noticia guardada.');
    }
    return mapPost(rows[0]);
}

export async function deleteNewsPost(id: string): Promise<void> {
    await request(`/rest/v1/news_posts?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        requiresAuth: true,
    });
}

