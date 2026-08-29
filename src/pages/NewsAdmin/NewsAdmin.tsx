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
    Mail,
    Plus,
    RefreshCw,
    Send,
    ShieldCheck,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { RichTextEditor } from '../../components/news';
import { Button, Card, CardContent, Input } from '../../components/ui';
import type {
    NewsAdminMember,
    NewsPost,
    NewsPostInput,
    NewsSession,
    NewsStatus,
} from '../../types/news';
import {
    NewsServiceError,
    acceptNewsEditorInvitation,
    deleteNewsPost,
    ensureNewsOwnerMembership,
    getNewsSession,
    hasPendingNewsInvitation,
    inviteNewsEditor,
    isCurrentUserNewsAdmin,
    isCurrentUserNewsOwner,
    isNewsBackendConfigured,
    listNewsAdmins,
    listAdminNews,
    revokeNewsEditor,
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
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Sin fecha' : dateFormatter.format(date);
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
    const navigate = useNavigate();
    const [session, setSession] = useState<NewsSession | null>(null);
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const [adminMembers, setAdminMembers] = useState<NewsAdminMember[]>([]);
    const [draft, setDraft] = useState<NewsDraft>(EMPTY_DRAFT);
    const [slugEdited, setSlugEdited] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [pendingInvitation, setPendingInvitation] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [revokingUserId, setRevokingUserId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        if (!notice && !error) {
            return undefined;
        }

        const timeout = window.setTimeout(() => {
            setNotice(null);
            setError(null);
        }, error ? 6500 : 4200);

        return () => window.clearTimeout(timeout);
    }, [error, notice]);

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
                    const ownerBootstrap = await ensureNewsOwnerMembership();
                    const isAdmin = await isCurrentUserNewsAdmin();
                    if (!isAdmin) {
                        if (await hasPendingNewsInvitation()) {
                            setSession(currentSession);
                            setPendingInvitation(true);
                        } else {
                            await signOutNewsAdmin();
                            setError('Esta cuenta no tiene permisos de edición.');
                        }
                    } else {
                        const currentUserIsOwner = ownerBootstrap || await isCurrentUserNewsOwner();
                        setSession(currentSession);
                        setIsOwner(currentUserIsOwner);
                        setPosts(await listAdminNews());
                        if (currentUserIsOwner) {
                            setAdminMembers(await listNewsAdmins());
                        }
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
            const ownerBootstrap = await ensureNewsOwnerMembership();
            const isAdmin = await isCurrentUserNewsAdmin();
            if (!isAdmin) {
                if (await hasPendingNewsInvitation()) {
                    setSession(nextSession);
                    setPendingInvitation(true);
                    setPassword('');
                    return;
                }

                await signOutNewsAdmin();
                throw new NewsServiceError('La cuenta ha iniciado sesión, pero no tiene permisos de edición.');
            }

            const currentUserIsOwner = ownerBootstrap || await isCurrentUserNewsOwner();
            setSession(nextSession);
            setPendingInvitation(false);
            setIsOwner(currentUserIsOwner);
            setPassword('');
            setPosts(await listAdminNews());
            if (currentUserIsOwner) {
                setAdminMembers(await listNewsAdmins());
            }
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
        setIsOwner(false);
        setAdminMembers([]);
        setDraft(EMPTY_DRAFT);
        setPendingInvitation(false);
        setNotice('Sesión cerrada.');
    };

    const handleInvitationAccepted = async () => {
        setPendingInvitation(false);
        setError(null);
        setNotice(null);
        try {
            setPosts(await listAdminNews());
            setNotice('Ya puedes acceder al panel editorial.');
        } catch (acceptError: unknown) {
            setError(getErrorMessage(acceptError));
        }
    };

    const handleInviteEditor = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isOwner) {
            return;
        }

        setInviteLoading(true);
        setError(null);
        setNotice(null);
        try {
            await inviteNewsEditor(inviteEmail);
            setInviteEmail('');
            setAdminMembers(await listNewsAdmins());
            setNotice('Invitación enviada. El editor recibirá un correo para aceptar y crear su contraseña.');
        } catch (inviteError: unknown) {
            setError(getErrorMessage(inviteError));
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRevokeEditor = async (member: NewsAdminMember) => {
        if (!isOwner || member.role !== 'editor' || member.status === 'revoked') {
            return;
        }

        if (!window.confirm(`¿Revocar el acceso editorial de ${member.email}?`)) {
            return;
        }

        setRevokingUserId(member.userId);
        setError(null);
        setNotice(null);
        try {
            await revokeNewsEditor(member.userId);
            setAdminMembers(await listNewsAdmins());
            setNotice('Acceso editorial revocado.');
        } catch (revokeError: unknown) {
            setError(getErrorMessage(revokeError));
        } finally {
            setRevokingUserId(null);
        }
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
            if (status === 'published') {
                navigate('/news', { state: { newsToast: 'Noticia publicada.' } });
            } else {
                setNotice('Borrador guardado.');
            }
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

    if (pendingInvitation) {
        return <NewsAdminInviteAcceptance onAccepted={() => void handleInvitationAccepted()} />;
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

                        {error && <NewsToast tone="error">{error}</NewsToast>}
                        {notice && <NewsToast tone="success">{notice}</NewsToast>}

                        <form className="news-admin__login-form" onSubmit={handleLogin}>
                            <Input
                                label="Correo electrónico"
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

            {error && <NewsToast tone="error">{error}</NewsToast>}
            {notice && <NewsToast tone="success">{notice}</NewsToast>}

            <div className="news-admin__workspace">
                <Card className="news-admin__posts-card">
                    <CardContent>
                        <div className="news-admin__section-heading">
                            <div>
                                <h2>Noticias editoriales</h2>
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
                                    <p>Aún no hay noticias editoriales.</p>
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
                            <label className="news-admin__label" htmlFor="news-editor">Contenido</label>
                            <RichTextEditor
                                id="news-editor"
                                value={draft.content}
                                onChange={(content) => setDraft((currentDraft) => ({ ...currentDraft, content }))}
                            />
                            <span className="news-admin__hint">Puedes usar tamaños de letra, títulos, énfasis, listas, citas, enlaces y bloques de código.</span>
                        </div>

                        <div className="news-admin__editor-actions" aria-label="Acciones de publicación">
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

            {isOwner && (
                <Card className="news-admin__team-card">
                    <CardContent>
                        <div className="news-admin__section-heading">
                            <div>
                                <p className="news-admin__eyebrow"><ShieldCheck size={15} /> Propietario</p>
                                <h2>Equipo editorial</h2>
                                <p>Solo tú puedes invitar o revocar editores. La autorización real también queda protegida por RLS en Supabase.</p>
                            </div>
                            <Users className="news-admin__team-icon" size={24} />
                        </div>

                        <form className="news-admin__invite-form" onSubmit={handleInviteEditor}>
                            <Input
                                className="news-admin__invite-email"
                                label="Correo del nuevo editor"
                                type="email"
                                autoComplete="off"
                                value={inviteEmail}
                                onChange={(event) => setInviteEmail(event.target.value)}
                                placeholder="editor@ejemplo.com"
                                icon={<Mail size={17} />}
                                required
                            />
                            <Button type="submit" icon={<UserPlus size={17} />} loading={inviteLoading}>
                                Enviar invitación
                            </Button>
                        </form>

                        <div className="news-admin__members-list" aria-live="polite">
                            {adminMembers.map((member) => (
                                <div className="news-admin__member-row" key={member.userId}>
                                    <div className="news-admin__member-details">
                                        <strong>{member.email}</strong>
                                        <span className={`news-admin__member-status news-admin__member-status--${member.status}`}>
                                            {getAdminStatusLabel(member)}
                                        </span>
                                        <small>{member.status === 'invited' ? 'Invitada' : 'Registrada'} {formatDate(member.invitedAt ?? member.createdAt)}</small>
                                    </div>
                                    {member.role === 'editor' && member.status !== 'revoked' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={revokingUserId === member.userId}
                                            loading={revokingUserId === member.userId}
                                            onClick={() => void handleRevokeEditor(member)}
                                        >
                                            Revocar
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function getAdminStatusLabel(member: NewsAdminMember): string {
    if (member.role === 'owner') {
        return 'Propietario';
    }

    if (member.status === 'invited') {
        return 'Invitación pendiente';
    }

    if (member.status === 'revoked') {
        return 'Acceso revocado';
    }

    return 'Editor activo';
}

function NewsToast({ children, tone }: { children: string; tone: 'error' | 'success' }) {
    return (
        <div className={`news-admin__toast news-admin__toast--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
            {tone === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
            <span>{children}</span>
        </div>
    );
}

function NewsAdminInviteAcceptance({ onAccepted }: { onAccepted: () => void }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptanceError, setAcceptanceError] = useState<string | null>(null);
    const [acceptanceLoading, setAcceptanceLoading] = useState(false);

    useEffect(() => {
        if (!acceptanceError) return undefined;

        const timeoutId = window.setTimeout(() => setAcceptanceError(null), 6500);
        return () => window.clearTimeout(timeoutId);
    }, [acceptanceError]);

    const handleAccept = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setAcceptanceError(null);

        if (newPassword.length < 12) {
            setAcceptanceError('La contraseña debe tener al menos 12 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setAcceptanceError('Las contraseñas no coinciden.');
            return;
        }

        setAcceptanceLoading(true);
        try {
            await acceptNewsEditorInvitation(newPassword);
            setNewPassword('');
            setConfirmPassword('');
            onAccepted();
        } catch (acceptError: unknown) {
            setAcceptanceError(getErrorMessage(acceptError));
        } finally {
            setAcceptanceLoading(false);
        }
    };

    return (
        <div className="news-admin news-admin--login">
            <Card className="news-admin__login-card" variant="highlight">
                <CardContent>
                    <div className="news-admin__login-icon">
                        <LockKeyhole size={28} />
                    </div>
                    <p className="news-admin__eyebrow">Invitación editorial</p>
                    <h1>Acepta el acceso</h1>
                    <p className="news-admin__login-copy">
                        Crea una contraseña segura para activar tu cuenta de editor. Después podrás entrar al panel con tu correo.
                    </p>

                    {acceptanceError && <NewsToast tone="error">{acceptanceError}</NewsToast>}

                    <form className="news-admin__login-form" onSubmit={handleAccept}>
                        <Input
                            label="Nueva contraseña"
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            hint="Usa al menos 12 caracteres."
                            required
                        />
                        <Input
                            label="Repite la contraseña"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                        />
                        <Button type="submit" icon={<ShieldCheck size={17} />} loading={acceptanceLoading} fullWidth>
                            Aceptar invitación
                        </Button>
                    </form>
                </CardContent>
            </Card>
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
                        Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> (o la clave anon
                        heredada), ejecuta <code>supabase/news-schema.sql</code> y despliega la función de invitaciones para
                        añadir editores por correo.
                    </p>
                    <Link className="news-admin__public-link" to="/news">
                        Volver a noticias públicas
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

