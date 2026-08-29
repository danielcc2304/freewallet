import {
    createClient,
    type Session,
    type SupabaseClient,
    type User,
} from '@supabase/supabase-js';
import type {
    NewsAdminMember,
    NewsAdminRole,
    NewsAdminStatus,
    NewsPost,
    NewsPostInput,
    NewsSession,
    NewsUser,
} from '../types/news';
import { sanitizeNewsHtml } from '../utils/newsContent';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/$/, '');
const SUPABASE_KEY = (
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
    ?? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
)?.trim();
const CONFIG_PLACEHOLDER_PATTERN = /tu-proyecto|sb_publishable_xxx|eyj\.\.\./i;
const SESSION_STORAGE_KEY = 'freewallet-news-auth';
const NEWS_COLUMNS = 'id,slug,title,excerpt,content,cover_image_url,status,published_at,created_at,updated_at,author_id';
const NEWS_ADMIN_COLUMNS = 'user_id,email,role,status,created_at,invited_at,accepted_at';

function isUsableConfigValue(value: string | undefined): value is string {
    return Boolean(value && !CONFIG_PLACEHOLDER_PATTERN.test(value));
}

const supabaseClient = isUsableConfigValue(SUPABASE_URL) && isUsableConfigValue(SUPABASE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            autoRefreshToken: true,
            detectSessionInUrl: true,
            persistSession: true,
            storageKey: SESSION_STORAGE_KEY,
        },
    })
    : null;

export const isNewsBackendConfigured = supabaseClient !== null;

export class NewsServiceError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'NewsServiceError';
        this.status = status;
    }
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

interface NewsAdminRow {
    user_id: string;
    email: string;
    role: NewsAdminRole;
    status: NewsAdminStatus;
    created_at: string;
    invited_at: string | null;
    accepted_at: string | null;
}

function requireClient(): SupabaseClient {
    if (!supabaseClient) {
        throw new NewsServiceError(
            'La sección de noticias necesita VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY (o VITE_SUPABASE_ANON_KEY).',
        );
    }

    return supabaseClient;
}

function getSupabaseErrorMessage(error: { message?: string } | null, fallback: string): string {
    return error?.message?.trim() || fallback;
}

function mapUser(user: User): NewsUser {
    return {
        id: user.id,
        email: user.email ?? null,
    };
}

function mapSession(session: Session): NewsSession {
    const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;

    return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: expiresAt * 1000,
        user: mapUser(session.user),
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

function mapAdminMember(row: NewsAdminRow): NewsAdminMember {
    return {
        userId: row.user_id,
        email: row.email,
        role: row.role,
        status: row.status,
        createdAt: row.created_at,
        invitedAt: row.invited_at,
        acceptedAt: row.accepted_at,
    };
}

export async function getNewsSession(): Promise<NewsSession | null> {
    const client = requireClient();
    const { data, error } = await client.auth.getSession();
    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo recuperar la sesión editorial.'));
    }

    return data.session ? mapSession(data.session) : null;
}

export async function signInNewsAdmin(email: string, password: string): Promise<NewsSession> {
    const client = requireClient();
    const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
    });

    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'Credenciales no válidas.'));
    }

    if (!data.session) {
        throw new NewsServiceError('Supabase no devolvió una sesión de usuario.');
    }

    return mapSession(data.session);
}

export async function signOutNewsAdmin(): Promise<void> {
    if (!supabaseClient) {
        return;
    }

    await supabaseClient.auth.signOut().catch(() => undefined);
}

export async function isCurrentUserNewsAdmin(): Promise<boolean> {
    const { data, error } = await requireClient().rpc('is_news_admin');
    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo comprobar el permiso editorial.'));
    }

    return data === true;
}

export async function isCurrentUserNewsOwner(): Promise<boolean> {
    const { data, error } = await requireClient().rpc('is_news_owner');
    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo comprobar el propietario editorial.'));
    }

    return data === true;
}

export async function ensureNewsOwnerMembership(): Promise<boolean> {
    const { data, error } = await requireClient().rpc('ensure_news_owner');
    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo activar el propietario editorial.'));
    }

    return data === true;
}

export async function hasPendingNewsInvitation(): Promise<boolean> {
    const { data, error } = await requireClient().rpc('has_pending_news_invitation');
    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo comprobar la invitación editorial.'));
    }

    return data === true;
}

export async function acceptNewsEditorInvitation(password: string): Promise<void> {
    const client = requireClient();
    const { error: passwordError } = await client.auth.updateUser({ password });
    if (passwordError) {
        throw new NewsServiceError(getSupabaseErrorMessage(passwordError, 'No se pudo establecer la contraseña.'));
    }

    const { data, error } = await client.rpc('accept_news_editor_invitation');
    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo aceptar la invitación editorial.'));
    }

    if (data !== true) {
        throw new NewsServiceError('La invitación editorial ya no está disponible.');
    }
}

export async function listNewsAdmins(): Promise<NewsAdminMember[]> {
    const { data, error } = await requireClient()
        .from('news_admins')
        .select(NEWS_ADMIN_COLUMNS)
        .order('role', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo cargar el equipo editorial.'));
    }

    return ((data ?? []) as NewsAdminRow[]).map(mapAdminMember);
}

export async function inviteNewsEditor(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await requireClient().functions.invoke('invite-news-editor', {
        body: { email: normalizedEmail },
    });

    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo enviar la invitación editorial.'));
    }

    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
        throw new NewsServiceError(data.error);
    }
}

export async function revokeNewsEditor(userId: string): Promise<void> {
    const { data, error } = await requireClient().rpc('revoke_news_editor', { target_user_id: userId });
    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo revocar el acceso editorial.'));
    }

    if (data !== true) {
        throw new NewsServiceError('Solo se pueden revocar editores activos o invitados.');
    }
}

export async function listPublishedNews(): Promise<NewsPost[]> {
    const { data, error } = await requireClient()
        .from('news_posts')
        .select(NEWS_COLUMNS)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudieron cargar las noticias.'));
    }

    return ((data ?? []) as NewsPostRow[]).map(mapPost);
}

export async function getPublishedNewsBySlug(slug: string): Promise<NewsPost | null> {
    const { data, error } = await requireClient()
        .from('news_posts')
        .select(NEWS_COLUMNS)
        .eq('status', 'published')
        .eq('slug', slug)
        .maybeSingle();

    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo cargar el análisis.'));
    }

    return data ? mapPost(data as NewsPostRow) : null;
}

export async function listAdminNews(): Promise<NewsPost[]> {
    const { data, error } = await requireClient()
        .from('news_posts')
        .select(NEWS_COLUMNS)
        .order('updated_at', { ascending: false });

    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudieron cargar las noticias editoriales.'));
    }

    return ((data ?? []) as NewsPostRow[]).map(mapPost);
}

export async function saveNewsPost(input: NewsPostInput, existingId?: string): Promise<NewsPost> {
    const session = await getNewsSession();
    if (!session) {
        throw new NewsServiceError('Tu sesión editorial ha caducado. Vuelve a iniciar sesión.');
    }

    const client = requireClient();
    const content = sanitizeNewsHtml(input.content);
    const publishedAt = input.status === 'published'
        ? input.publishedAt ?? new Date().toISOString()
        : null;
    const basePayload = {
        title: input.title.trim(),
        slug: input.slug.trim(),
        excerpt: input.excerpt.trim(),
        content,
        cover_image_url: input.coverImageUrl.trim() || null,
        status: input.status,
        published_at: publishedAt,
    };

    if (existingId) {
        const { data, error } = await client
            .from('news_posts')
            .update(basePayload)
            .eq('id', existingId)
            .select(NEWS_COLUMNS)
            .single();

        if (error) {
            throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo actualizar la noticia.'));
        }

        return mapPost(data as NewsPostRow);
    }

    const { data, error } = await client
        .from('news_posts')
        .insert({ ...basePayload, author_id: session.user.id })
        .select(NEWS_COLUMNS)
        .single();

    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo guardar la noticia.'));
    }

    return mapPost(data as NewsPostRow);
}

export async function deleteNewsPost(id: string): Promise<void> {
    const { error } = await requireClient()
        .from('news_posts')
        .delete()
        .eq('id', id);

    if (error) {
        throw new NewsServiceError(getSupabaseErrorMessage(error, 'No se pudo eliminar la noticia.'));
    }
}
