import { ArrowLeft, ExternalLink, PlayCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './InProcess.css';

export function InProcess() {
    const navigate = useNavigate();
    const sourceUrl = 'https://www.lapizarradeandres.com/conocimientos-basicos';

    const videos = useMemo(() => ([
        {
            title: 'Tutorial de introducción a la inversión',
            summary: 'Introducción general a los tipos de inversión y características básicas.'
        },
        {
            title: 'Renta Variable y el poder del interés compuesto',
            summary: 'Conceptos de interés compuesto aplicados a inversión en renta variable.'
        },
        {
            title: 'Tutorial de Renta Fija',
            summary: 'Fundamentos de renta fija y usos prácticos en cartera.'
        },
        {
            title: 'Empezando a invertir desde 0',
            summary: 'Guía para dar los primeros pasos y realizar compras iniciales.'
        },
        {
            title: 'Automatizando fondos indexados',
            summary: 'Cómo invertir en indexados de forma pasiva y automatizada.'
        },
        {
            title: 'La inversión ultra conservadora: los fondos monetarios',
            summary: 'Alternativa conservadora para liquidez con algo de retorno.'
        },
        {
            title: 'Aprendiendo a analizar una acción',
            summary: 'Criterios para evaluar si una acción está cara o barata.'
        },
        {
            title: 'Podcast de educación financiera',
            summary: 'Repaso de conceptos clave y su impacto en finanzas personales.'
        },
        {
            title: 'Oro y plata como inversión',
            summary: 'Comparativa de retornos históricos de metales y renta variable.'
        },
        {
            title: 'En qué divisa comprar tu fondo',
            summary: 'Impacto real de la divisa de contratación en tus fondos.'
        },
        {
            title: 'Inmuebles como inversión',
            summary: 'Búsqueda y análisis de inmuebles con ejemplos en España.'
        },
        {
            title: 'Podcast financiero con Uri Sabat',
            summary: 'Conversación sobre inversión y temas financieros relacionados.'
        }
    ]), []);

    return (
        <div className="resources-page">
            <header className="resources-page__header">
                <h1 className="resources-page__title">Recursos y Guías</h1>
                <p className="resources-page__description">
                    Selección de vídeos de conocimientos básicos referenciados en la página de La Pizarra de Andrés.
                </p>
                <a className="resources-page__source" href={sourceUrl} target="_blank" rel="noreferrer">
                    Ver página fuente
                    <ExternalLink size={16} />
                </a>
            </header>

            <div className="resources-page__grid">
                {videos.map((video) => {
                    const channelSearchUrl = `https://www.youtube.com/@lapizarradeandres/search?query=${encodeURIComponent(video.title)}`;
                    return (
                        <article key={video.title} className="resource-card">
                            <div className="resource-card__head">
                                <PlayCircle size={20} />
                                <h3>{video.title}</h3>
                            </div>
                            <p>{video.summary}</p>
                            <a href={channelSearchUrl} target="_blank" rel="noreferrer">
                                Ver en YouTube
                                <ExternalLink size={14} />
                            </a>
                        </article>
                    );
                })}
            </div>

            <div className="resources-page__footer">
                <button className="resources-page__back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                    Volver atrás
                </button>
            </div>
        </div>
    );
}
