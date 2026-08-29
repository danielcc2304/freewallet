import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, ExternalLink, FileText, Loader2, Newspaper, Settings2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, CardContent } from '../../components/ui';
import type { NewsPost } from '../../types/news';
import {
    NewsServiceError,
    getPublishedNewsBySlug,
    isNewsBackendConfigured,
    listPublishedNews,
} from '../../services/newsService';
import { getNewsTextExcerpt, getSafeNewsImageUrl, sanitizeNewsHtml } from '../../utils/newsContent';
import './News.css';

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'long',
});

function formatNewsDate(value: string | null): string {
    if (!value) {
        return 'Sin fecha';
    }

    return dateFormatter.format(new Date(value));
}

function getErrorMessage(error: unknown): string {
    if (error instanceof NewsServiceError) {
        return error.message;
    }

    return 'No se han podido cargar las noticias. Inténtalo de nuevo más tarde.';
}

function NewsSetupNotice() {
    return (
        <Card className="news-page__setup-notice" variant="highlight">
            <CardContent>
                <div className="news-page__setup-icon">
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
        <header className="news-page__header">
            <div className="news-page__title-row">
                <div className="news-page__title-icon">
                    <Newspaper size={28} />
                </div>
                <div>
                    <p className="news-page__eyebrow">Perspectiva FreeWallet</p>
                    <h1 className="news-page__title">Noticias</h1>
                </div>
            </div>
            <p className="news-page__subtitle">
                Análisis, contexto macroeconómico y aprendizajes para tomar mejores decisiones de inversión.
            </p>
            {showAdminLink && (
                <Link className="news-page__admin-link" to="/admin/news">
                    <Settings2 size={16} />
                    Acceso editorial
                </Link>
            )}
        </header>
    );
}

export function News() {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(isNewsBackendConfigured);
    const [error, setError] = useState<string | null>(null);

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
        <div className="news-page">
            <NewsHeader />

            {!isNewsBackendConfigured && <NewsSetupNotice />}

            {loading && (
                <div className="news-page__state" role="status">
                    <Loader2 className="news-page__spinner" size={24} />
                    <span>Cargando noticias…</span>
                </div>
            )}

            {!loading && error && (
                <Card className="news-page__state-card" variant="highlight">
                    <CardContent>
                        <FileText size={28} />
                        <h2>No se ha podido cargar el contenido</h2>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && posts.length === 0 && isNewsBackendConfigured && (
                <Card className="news-page__state-card">
                    <CardContent>
                        <Newspaper size={32} />
                        <h2>Aún no hay noticias publicadas</h2>
                        <p>Cuando publiques tu primer análisis aparecerá aquí.</p>
                        <Link to="/admin/news">
                            <Button icon={<Settings2 size={16} />} size="sm">
                                Abrir panel editorial
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && posts.length > 0 && (
                <div className="news-page__grid">
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
        <Link className="news-card" to={`/news/${post.slug}`}>
            {coverImageUrl ? (
                <img className="news-card__cover" src={coverImageUrl} alt="" loading="lazy" />
            ) : (
                <div className="news-card__cover news-card__cover--placeholder" aria-hidden="true">
                    <Newspaper size={34} />
                </div>
            )}
            <div className="news-card__body">
                <div className="news-card__meta">
                    <CalendarDays size={14} />
                    <time dateTime={post.publishedAt ?? undefined}>{formatNewsDate(post.publishedAt)}</time>
                </div>
                <h2 className="news-card__title">{post.title}</h2>
                <p className="news-card__excerpt">{excerpt}</p>
                <span className="news-card__read-more">
                    Leer análisis
                    <ExternalLink size={15} />
                </span>
            </div>
        </Link>
    );
}

export function NewsArticle() {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<NewsPost | null>(null);
    const [loading, setLoading] = useState(isNewsBackendConfigured);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug || !isNewsBackendConfigured) {
            return;
        }

        let active = true;
        getPublishedNewsBySlug(slug)
            .then((nextPost) => {
                if (active) {
                    setPost(nextPost);
                    if (nextPost) {
                        document.title = `${nextPost.title} | FreeWallet`;
                    }
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
            document.title = 'FreeWallet';
        };
    }, [slug]);

    if (!slug) {
        return (
            <div className="news-page">
                <Link className="news-page__back-link" to="/news">
                    <ArrowLeft size={16} />
                    Volver a noticias
                </Link>
                <Card className="news-page__state-card" variant="highlight">
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
            <div className="news-page">
                <NewsSetupNotice />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="news-page__state" role="status">
                <Loader2 className="news-page__spinner" size={24} />
                <span>Cargando análisis…</span>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="news-page">
                <Link className="news-page__back-link" to="/news">
                    <ArrowLeft size={16} />
                    Volver a noticias
                </Link>
                <Card className="news-page__state-card" variant="highlight">
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
        <div className="news-page news-page--article">
            <Link className="news-page__back-link" to="/news">
                <ArrowLeft size={16} />
                Todas las noticias
            </Link>

            <article className="news-article">
                <header className="news-article__header">
                    <div className="news-article__meta">
                        <CalendarDays size={15} />
                        <time dateTime={post.publishedAt ?? undefined}>{formatNewsDate(post.publishedAt)}</time>
                    </div>
                    <h1>{post.title}</h1>
                    {post.excerpt && <p className="news-article__excerpt">{post.excerpt}</p>}
                </header>

                {coverImageUrl && (
                    <img className="news-article__cover" src={coverImageUrl} alt="" />
                )}

                <div
                    className="news-article__content"
                    dangerouslySetInnerHTML={{ __html: sanitizeNewsHtml(post.content) }}
                />

                <footer className="news-article__footer">
                    <span>Contenido informativo. No constituye asesoramiento financiero personalizado.</span>
                    <Link to="/news">
                        <ArrowLeft size={15} />
                        Volver a noticias
                    </Link>
                </footer>
            </article>
        </div>
    );
}

