import { useEffect, useState, type FormEvent } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Edit3,
    FileText,
    Loader2,
    LockKeyhole,
    LogIn,
    LogOut,
    Plus,
    RefreshCw,
    Send,
    Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RichTextEditor } from '../../components/news';
import { Button, Card, CardContent, Input } from '../../components/ui';
import type { NewsPost, NewsPostInput, NewsSession, NewsStatus } from '../../types/news';
import {
    NewsServiceError,
    deleteNewsPost,
    getNewsSession,
    isCurrentUserNewsAdmin,
    isNewsBackendConfigured,
    listAdminNews,
    saveNewsPost,
    signInNewsAdmin,
    signOutNewsAdmin,
} from '../../services/newsService';
import { getNewsTextExcerpt, getSafeNewsImageUrl, slugifyNewsTitle } from '../../utils/newsContent';
import './NewsAdmin.css';

interface NewsDraft {
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    status: NewsStatus;
    publishedAt: string | null;
}

const EMPTY_DRAFT: NewsDraft = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    status: 'draft',
    publishedAt: null,
};

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
});

function formatDate(value: string): string {
    return dateFormatter.format(new Date(value));
}

function draftFromPost(post: NewsPost): NewsDraft {
    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.coverImageUrl ?? '',
        status: post.status,
        publishedAt: post.publishedAt,
    };
}

function getErrorMessage(error: unknown): string {
    if (error instanceof NewsServiceError) {
        return error.message;
    }

    return 'No se ha podido completar la operación. Inténtalo de nuevo.';
}

export function NewsAdmin() {
    const [session, setSession] = useState<NewsSession | null>(null);
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [draft, setDraft] = useState<NewsDraft>(EMPTY_DRAFT);
    const [slugEdited, setSlugEdited] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const initialise = async () => {
            if (!isNewsBackendConfigured) {
                setLoading(false);
                return;
            }

            try {
                const currentSession = await getNewsSession();
                if (!active) {
                    return;
                }

                if (currentSession) {
                    const isAdmin = await isCurrentUserNewsAdmin();
                    if (!isAdmin) {
                        await signOutNewsAdmin();
                        setError('Esta cuenta no tiene permisos de edición.');
                    } else {
                        setSession(currentSession);
                        setPosts(await listAdminNews());
                    }
                }
            } catch (initialError: unknown) {
                if (active) {
                    setError(getErrorMessage(initialError));
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void initialise();
        return () => {
            active = false;
        };
    }, []);

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoginLoading(true);
        setError(null);
        setNotice(null);

        try {
            const nextSession = await signInNewsAdmin(email, password);
            const isAdmin = await isCurrentUserNewsAdmin();
            if (!isAdmin) {
                await signOutNewsAdmin();
                throw new NewsServiceError('La cuenta ha iniciado sesión, pero no tiene permisos de edición.');
            }

            setSession(nextSession);
            setPassword('');
            setPosts(await listAdminNews());
            setNotice('Sesión editorial iniciada.');
        } catch (loginError: unknown) {
            setError(getErrorMessage(loginError));
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOutNewsAdmin();
        setSession(null);
        setPosts([]);
        setDraft(EMPTY_DRAFT);
        setNotice('Sesión cerrada.');
    };

    const handleRefresh = async () => {
        setError(null);
        try {
            setPosts(await listAdminNews());
            setNotice('Lista actualizada.');
        } catch (refreshError: unknown) {
            setError(getErrorMessage(refreshError));
        }
    };

    const startNewPost = () => {
        setDraft({ ...EMPTY_DRAFT });
        setSlugEdited(false);
        setError(null);
        setNotice(null);
    };

    const editPost = (post: NewsPost) => {
        setDraft(draftFromPost(post));
        setSlugEdited(true);
        setError(null);
        setNotice(null);
    };

    const handleSave = async (status: NewsStatus) => {
        if (!session) {
            return;
        }

        const title = draft.title.trim();
        const slug = slugifyNewsTitle(draft.slug);
        if (!title || !slug) {
            setError('El título y el slug son obligatorios.');
            return;
        }

        if (status === 'published' && !getNewsTextExcerpt(draft.content, 1)) {
            setError('Añade contenido antes de publicar la noticia.');
            return;
        }

        const coverImageUrl = getSafeNewsImageUrl(draft.coverImageUrl);
        if (draft.coverImageUrl.trim() && !coverImageUrl) {
            setError('La imagen de portada debe usar una URL http(s) válida.');
            return;
        }

        const input: NewsPostInput = {
            title,
            slug,
            excerpt: draft.excerpt,
            content: draft.content,
            coverImageUrl: coverImageUrl ?? '',
            status,
            publishedAt: draft.publishedAt,
        };

        setSaving(true);
        setError(null);
        setNotice(null);

        try {
            const savedPost = await saveNewsPost(input, draft.id);
            setPosts((currentPosts) => [savedPost, ...currentPosts.filter((post) => post.id !== savedPost.id)]);
            setDraft(draftFromPost(savedPost));
            setSlugEdited(true);
            setNotice(status === 'published' ? 'Noticia publicada.' : 'Borrador guardado.');
        } catch (saveError: unknown) {
            setError(getErrorMessage(saveError));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (post: NewsPost) => {
        if (!window.confirm(`¿Eliminar “${post.title}”? Esta acción no se puede deshacer.`)) {
            return;
        }

        setDeletingId(post.id);
        setError(null);
        try {
            await deleteNewsPost(post.id);
            setPosts((currentPosts) => currentPosts.filter((currentPost) => currentPost.id !== post.id));
            if (draft.id === post.id) {
                startNewPost();
            }
            setNotice('Noticia eliminada.');
        } catch (deleteError: unknown) {
            setError(getErrorMessage(deleteError));
        } finally {
            setDeletingId(null);
        }
    };

    if (!isNewsBackendConfigured) {
        return <NewsAdminSetup />;
    }

    if (loading) {
        return (
            <div className="news-admin news-admin--loading" role="status">
                <Loader2 className="news-admin__spinner" size={26} />
                <span>Comprobando acceso editorial…</span>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="news-admin news-admin--login">
                <Card className="news-admin__login-card" variant="highlight">
                    <CardContent>
                        <div className="news-admin__login-icon">
                            <LockKeyhole size={28} />
                        </div>
                        <p className="news-admin__eyebrow">Área privada</p>
                        <h1>Panel editorial</h1>
                        <p className="news-admin__login-copy">
                            Inicia sesión con tu cuenta de administrador para crear y publicar noticias.
                        </p>

                        {error && <Feedback tone="error">{error}</Feedback>}
                        {notice && <Feedback tone="success">{notice}</Feedback>}

                        <form className="news-admin__login-form" onSubmit={handleLogin}>
                            <Input
                                label="Email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                            <Input
                                label="Contraseña"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />
                            <Button type="submit" icon={<LogIn size={17} />} loading={loginLoading} fullWidth>
                                Entrar
                            </Button>
                        </form>
                        <Link className="news-admin__public-link" to="/news">
                            Volver a noticias públicas
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="news-admin">
            <header className="news-admin__header">
                <div>
                    <p className="news-admin__eyebrow">Contenido propio</p>
                    <h1>Panel editorial</h1>
                    <p className="news-admin__subtitle">
                        Crea borradores, edita análisis y publícalos cuando estén listos.
                    </p>
                </div>
                <div className="news-admin__header-actions">
                    <Link to="/news">
                        <Button variant="secondary" icon={<FileText size={16} />} size="sm">
                            Ver noticias
                        </Button>
                    </Link>
                    <Button variant="ghost" icon={<LogOut size={16} />} size="sm" onClick={handleLogout}>
                        Cerrar sesión
                    </Button>
                </div>
            </header>

            {error && <Feedback tone="error">{error}</Feedback>}
            {notice && <Feedback tone="success">{notice}</Feedback>}

            <div className="news-admin__workspace">
                <Card className="news-admin__posts-card">
                    <CardContent>
                        <div className="news-admin__section-heading">
                            <div>
                                <h2>Tus noticias</h2>
                                <p>{posts.length} {posts.length === 1 ? 'entrada' : 'entradas'}</p>
                            </div>
                            <div className="news-admin__list-actions">
                                <Button variant="ghost" size="sm" icon={<RefreshCw size={15} />} onClick={() => void handleRefresh()}>
                                    Actualizar
                                </Button>
                                <Button size="sm" icon={<Plus size={16} />} onClick={startNewPost}>
                                    Nueva
                                </Button>
                            </div>
                        </div>

                        <div className="news-admin__posts-list">
                            {posts.length === 0 && (
                                <div className="news-admin__empty-list">
                                    <FileText size={26} />
                                    <p>Aún no has creado ninguna noticia.</p>
                                    <Button variant="secondary" size="sm" onClick={startNewPost}>
                                        Crear primer borrador
                                    </Button>
                                </div>
                            )}
                            {posts.map((post) => (
                                <div
                                    className={`news-admin__post-row ${draft.id === post.id ? 'news-admin__post-row--selected' : ''}`}
                                    key={post.id}
                                >
                                    <button type="button" className="news-admin__post-select" onClick={() => editPost(post)}>
                                        <span className={`news-admin__status news-admin__status--${post.status}`}>
                                            {post.status === 'published' ? 'Publicada' : 'Borrador'}
                                        </span>
                                        <strong>{post.title}</strong>
                                        <small>Actualizada {formatDate(post.updatedAt)}</small>
                                    </button>
                                    <button
                                        type="button"
                                        className="news-admin__delete-button"
                                        aria-label={`Eliminar ${post.title}`}
                                        title="Eliminar noticia"
                                        disabled={deletingId === post.id}
                                        onClick={() => void handleDelete(post)}
                                    >
                                        {deletingId === post.id ? <Loader2 className="news-admin__spinner" size={16} /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="news-admin__editor-card">
                    <CardContent>
                        <div className="news-admin__section-heading">
                            <div>
                                <p className="news-admin__eyebrow">{draft.id ? 'Editar entrada' : 'Nueva entrada'}</p>
                                <h2>{draft.id ? draft.title || 'Sin título' : 'Escribe tu análisis'}</h2>
                            </div>
                            {draft.id && (
                                <Button variant="ghost" size="sm" icon={<Edit3 size={15} />} onClick={startNewPost}>
                                    Nueva
                                </Button>
                            )}
                        </div>

                        <div className="news-admin__form-grid">
                            <Input
                                className="news-admin__field--wide"
                                label="Título"
                                value={draft.title}
                                onChange={(event) => {
                                    const title = event.target.value;
                                    setDraft((currentDraft) => ({
                                        ...currentDraft,
                                        title,
                                        slug: slugEdited ? currentDraft.slug : slugifyNewsTitle(title),
                                    }));
                                }}
                                placeholder="Ej. Cómo estoy leyendo el ciclo macro actual"
                            />
                            <Input
                                label="Slug"
                                hint="Se usará en la URL pública."
                                value={draft.slug}
                                onChange={(event) => {
                                    setSlugEdited(true);
                                    setDraft((currentDraft) => ({
                                        ...currentDraft,
                                        slug: slugifyNewsTitle(event.target.value),
                                    }));
                                }}
                                placeholder="analisis-ciclo-macro"
                            />
                            <div className="news-admin__field news-admin__field--wide">
                                <label className="news-admin__label" htmlFor="news-excerpt">Extracto</label>
                                <textarea
                                    id="news-excerpt"
                                    className="news-admin__textarea news-admin__textarea--excerpt"
                                    value={draft.excerpt}
                                    maxLength={500}
                                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, excerpt: event.target.value }))}
                                    placeholder="Una o dos frases para presentar el análisis."
                                />
                                <span className="news-admin__hint">{draft.excerpt.length}/500 caracteres</span>
                            </div>
                            <Input
                                label="Imagen de portada (opcional)"
                                hint="Pega una URL https://."
                                type="url"
                                value={draft.coverImageUrl}
                                onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, coverImageUrl: event.target.value }))}
                                placeholder="https://…"
                            />
                        </div>

                        <div className="news-admin__editor-field">
                            <label className="news-admin__label">Contenido</label>
                            <RichTextEditor
                                value={draft.content}
                                onChange={(content) => setDraft((currentDraft) => ({ ...currentDraft, content }))}
                            />
                            <span className="news-admin__hint">Puedes usar títulos, énfasis, listas, citas, enlaces y bloques de código.</span>
                        </div>

                        <div className="news-admin__editor-actions">
                            <select
                                className="news-admin__status-select"
                                value={draft.status}
                                aria-label="Estado de la noticia"
                                onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, status: event.target.value as NewsStatus }))}
                            >
                                <option value="draft">Guardar como borrador</option>
                                <option value="published">Publicar directamente</option>
                            </select>
                            <Button
                                variant="secondary"
                                icon={<FileText size={16} />}
                                loading={saving && draft.status === 'draft'}
                                disabled={saving}
                                onClick={() => void handleSave('draft')}
                            >
                                Guardar borrador
                            </Button>
                            <Button
                                icon={<Send size={16} />}
                                loading={saving && draft.status === 'published'}
                                disabled={saving}
                                onClick={() => void handleSave('published')}
                            >
                                {draft.id && draft.status === 'published' ? 'Actualizar publicación' : 'Publicar'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Feedback({ children, tone }: { children: string; tone: 'error' | 'success' }) {
    return (
        <div className={`news-admin__feedback news-admin__feedback--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
            {tone === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
            <span>{children}</span>
        </div>
    );
}

function NewsAdminSetup() {
    return (
        <div className="news-admin news-admin--login">
            <Card className="news-admin__login-card" variant="highlight">
                <CardContent>
                    <div className="news-admin__login-icon">
                        <LockKeyhole size={28} />
                    </div>
                    <p className="news-admin__eyebrow">Configuración necesaria</p>
                    <h1>Conecta el panel editorial</h1>
                    <p className="news-admin__login-copy">
                        Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en tu entorno y ejecuta
                        el esquema de <code>supabase/news-schema.sql</code>.
                    </p>
                    <Link className="news-admin__public-link" to="/news">
                        Volver a noticias públicas
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

