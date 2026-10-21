import { newsStyles } from '../../components/news/newsStyles';
import { cn } from '../../utils/cn';
import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, ExternalLink, FileText, Loader2, Newspaper, Pencil, Settings2 } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui';
import type { NewsPost } from '../../types/news';
import {
    NewsServiceError,
    getPublishedNewsBySlug,
    isNewsBackendConfigured,
    listPublishedNews,
} from '../../services/newsService';
import { getNewsTextExcerpt, getSafeNewsImageUrl, sanitizeNewsHtml } from '../../utils/newsContent';
import { useNewsEditorId } from '../../hooks/useNewsEditorId';
import '../../components/news/newsContent.css';
import {NewsComments} from '../../components/news/NewsComments';

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'long',
});

function formatNewsDate(value: string | null): string {
    if (!value) {
        return 'Sin fecha';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Sin fecha' : dateFormatter.format(date);
}

function getErrorMessage(error: unknown): string {
    if (error instanceof NewsServiceError) {
        return error.message;
    }

    return 'No se han podido cargar las noticias. Inténtalo de nuevo más tarde.';
}

function getNewsToast(state: unknown): string | null {
    if (typeof state !== 'object' || state === null || !('newsToast' in state)) {
        return null;
    }

    const message = (state as { newsToast?: unknown }).newsToast;
    return typeof message === 'string' && message ? message : null;
}

function NewsSetupNotice() {
    return (
        <Card className={newsStyles['news-page__setup-notice']} variant="highlight">
            <CardContent>
                <div className={newsStyles['news-page__setup-icon']}>
                    <Settings2 size={24} />
                </div>
                <h2>Noticias pendientes de conectar</h2>
                <p>
                    Configura las variables de Supabase para activar la publicación de artículos. La guía está en el README y
                    el esquema SQL se encuentra en <code>supabase/news-schema.sql</code>.
                </p>
            </CardContent>
        </Card>
    );
}

function NewsHeader({ showAdminLink = true }: { showAdminLink?: boolean }) {
    return (
        <header className={newsStyles['news-page__hero']}>
            <p className={newsStyles['news-page__eyebrow']}>Perspectiva FreeWallet</p>
            <h1 className={newsStyles['news-page__title']}>Noticias</h1>
            <p className={newsStyles['news-page__subtitle']}>
                Análisis, contexto macroeconómico y aprendizajes para tomar mejores decisiones de inversión.
            </p>
            {showAdminLink && (
                <Link className={newsStyles['news-page__admin-link']} to="/admin/news">
                    <Settings2 size={16} />
                    Acceso editorial
                </Link>
            )}
        </header>
    );
}

export function News() {
    const location = useLocation();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(isNewsBackendConfigured);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(() => getNewsToast(location.state));

    useEffect(() => {
        if (!getNewsToast(location.state)) {
            return;
        }

        navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null });
    }, [location.hash, location.pathname, location.search, location.state, navigate]);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(null), 4200);
        return () => window.clearTimeout(timeout);
    }, [toast]);

    useEffect(() => {
        if (!isNewsBackendConfigured) {
            return;
        }

        let active = true;

        listPublishedNews()
            .then((nextPosts) => {
                if (active) {
                    setPosts(nextPosts);
                }
            })
            .catch((requestError: unknown) => {
                if (active) {
                    setError(getErrorMessage(requestError));
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className={newsStyles['news-page']}>
            {toast && (
                <div className={newsStyles['news-page__toast']} role="status">
                    <CheckCircle2 size={17} />
                    <span>{toast}</span>
                </div>
            )}
            <NewsHeader />

            {!isNewsBackendConfigured && <NewsSetupNotice />}

            {loading && (
                <div className={newsStyles['news-page__state']} role="status">
                    <Loader2 className={newsStyles['news-page__spinner']} size={24} />
                    <span>Cargando noticias…</span>
                </div>
            )}

            {!loading && error && (
                <Card className={newsStyles['news-page__state-card']} variant="highlight">
                    <CardContent>
                        <FileText size={28} />
                        <h2>No se ha podido cargar el contenido</h2>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && posts.length === 0 && isNewsBackendConfigured && (
                <Card className={newsStyles['news-page__state-card']}>
                    <CardContent>
                        <Newspaper size={32} />
                        <h2>Aún no hay noticias publicadas</h2>
                        <p>Cuando publiques tu primer análisis aparecerá aquí.</p>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && posts.length > 0 && (
                <div className={newsStyles['news-page__grid']}>
                    {posts.map((post) => <NewsCard key={post.id} post={post} />)}
                </div>
            )}
        </div>
    );
}

function NewsCard({ post }: { post: NewsPost }) {
    const excerpt = post.excerpt || getNewsTextExcerpt(post.content);
    const coverImageUrl = getSafeNewsImageUrl(post.coverImageUrl);

    return (
        <Link className={newsStyles['news-card']} to={`/news/${post.slug}`}>
            {coverImageUrl ? (
                <img className={newsStyles['news-card__cover']} src={coverImageUrl} alt="" loading="lazy" />
            ) : (
                <div className={cn(newsStyles['news-card__cover'], newsStyles['news-card__cover--placeholder'])} aria-hidden="true">
                    <Newspaper size={34} />
                </div>
            )}
            <div className={newsStyles['news-card__body']}>
                <div className={newsStyles['news-card__meta']}>
                    <CalendarDays size={14} />
                    <time dateTime={post.publishedAt ?? undefined}>{formatNewsDate(post.publishedAt)}</time>
                </div>
                <h2 className={newsStyles['news-card__title']}>{post.title}</h2>
                <p className={newsStyles['news-card__excerpt']}>{excerpt}</p>
                <span className={newsStyles['news-card__read-more']}>
                    Leer análisis
                    <ExternalLink size={15} />
                </span>
            </div>
        </Link>
    );
}

export function NewsArticle() {
    const { slug } = useParams<{ slug: string }>();
    const editorId = useNewsEditorId();
    const [post, setPost] = useState<NewsPost | null>(null);
    const [loading, setLoading] = useState(isNewsBackendConfigured);
    const [error, setError] = useState<string | null>(null);
    const [loadedSlug,setLoadedSlug]=useState<string|null>(null);

    useEffect(() => {
        if (!slug || !isNewsBackendConfigured) {
            return;
        }

        let active = true;
        getPublishedNewsBySlug(slug)
            .then((nextPost) => {
                if (active) {
                    setPost(nextPost);setError(null);
                    if (nextPost) {
                        document.title = `${nextPost.title} | FreeWallet`;
                    }
                }
            })
            .catch((requestError: unknown) => {
                if (active) {
                    setError(getErrorMessage(requestError));setPost(null);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);setLoadedSlug(slug);
                }
            });

        return () => {
            active = false;
            document.title = 'FreeWallet';
        };
    }, [slug]);

    if (!slug) {
        return (
            <div className={newsStyles['news-page']}>
                <Link className={newsStyles['news-page__back-link']} to="/news">
                    <ArrowLeft size={16} />
                    Volver a noticias
                </Link>
                <Card className={newsStyles['news-page__state-card']} variant="highlight">
                    <CardContent>
                        <FileText size={28} />
                        <h1>Noticia no encontrada</h1>
                        <p>No se ha indicado qué noticia quieres leer.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isNewsBackendConfigured) {
        return (
            <div className={newsStyles['news-page']}>
                <NewsSetupNotice />
            </div>
        );
    }

    if (loading||loadedSlug!==slug) {
        return (
            <div className={newsStyles['news-page__state']} role="status">
                <Loader2 className={newsStyles['news-page__spinner']} size={24} />
                <span>Cargando análisis…</span>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className={newsStyles['news-page']}>
                <Link className={newsStyles['news-page__back-link']} to="/news">
                    <ArrowLeft size={16} />
                    Volver a noticias
                </Link>
                <Card className={newsStyles['news-page__state-card']} variant="highlight">
                    <CardContent>
                        <FileText size={28} />
                        <h1>Noticia no encontrada</h1>
                        <p>{error ?? 'Este artículo no existe o ya no está publicado.'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const coverImageUrl = getSafeNewsImageUrl(post.coverImageUrl);

    return (
        <div className={cn(newsStyles['news-page'], newsStyles['news-page--article'])}>
            <article className={newsStyles['news-article']}>
                <header className={newsStyles['news-article__header']}>
                    <div className={newsStyles['news-article__meta']}>
                        <CalendarDays size={15} />
                        <time dateTime={post.publishedAt ?? undefined}>{formatNewsDate(post.publishedAt)}</time>
                    </div>
                    <h1>{post.title}</h1>
                    {post.excerpt && <p className={newsStyles['news-article__excerpt']}>{post.excerpt}</p>}
                </header>

                {coverImageUrl && (
                    <img className={newsStyles['news-article__cover']} src={coverImageUrl} alt="" />
                )}

                <div
                    className="news-article__content"
                    dangerouslySetInnerHTML={{ __html: sanitizeNewsHtml(post.content) }}
                />

                <footer className={newsStyles['news-article__footer']}>
                    <span>Contenido informativo. No constituye asesoramiento financiero personalizado.</span>
                </footer>
            </article>
            <NewsComments key={post.id} postId={post.id}/>
            {editorId && editorId === post.authorId && (
                <Link className={newsStyles['news-article__edit']} to={`/admin/news?edit=${encodeURIComponent(post.id)}`}
                    aria-label="Editar noticia" title="Editar noticia">
                    <Pencil size={22} aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}
