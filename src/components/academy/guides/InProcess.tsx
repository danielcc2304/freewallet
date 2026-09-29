import { ArrowLeft, ExternalLink, PlayCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import './InProcess.css';

export function InProcess() {
    const navigate = useNavigate();
    const sourceUrl = 'https://www.lapizarradeandres.com/conocimientos-basicos';

    const videos = useMemo(() => ([
        {
            title: 'Tutorial de introducción a la inversión',
            videoId: 'ujY0DkyL--w',
            summary: 'Introducción general a los tipos de inversión y características básicas.'
        },
        {
            title: 'Renta Variable y el poder del interés compuesto',
            videoId: '2EIdCsvgrNc',
            summary: 'Conceptos de interés compuesto aplicados a inversión en renta variable.'
        },
        {
            title: 'Tutorial de Renta Fija',
            videoId: 'bkYK-akFam4',
            summary: 'Fundamentos de renta fija y usos prácticos en cartera.'
        },
        {
            title: 'Empezando a invertir desde 0',
            videoId: 'GJCm99xWUJE',
            summary: 'Guía para dar los primeros pasos y realizar compras iniciales.'
        },
        {
            title: 'Automatizando fondos indexados',
            videoId: 'Au98IMqZV7U',
            summary: 'Cómo invertir en indexados de forma pasiva y automatizada.'
        },
        {
            title: 'La inversión ultra conservadora: los fondos monetarios',
            videoId: 'UseVRu7tVpQ',
            summary: 'Alternativa conservadora para liquidez con algo de retorno.'
        },
        {
            title: 'Aprendiendo a analizar una acción',
            videoId: 'uI6iMgfcuZ4',
            summary: 'Criterios para evaluar si una acción está cara o barata.'
        },
        {
            title: 'Podcast de educación financiera',
            videoId: '3Jub55U3j9Q',
            summary: 'Repaso de conceptos clave y su impacto en finanzas personales.'
        },
        {
            title: 'Oro y plata como inversión',
            videoId: 'kTehPVixmCY',
            summary: 'Comparativa de retornos históricos de metales y renta variable.'
        },
        {
            title: 'En qué divisa comprar tu fondo',
            videoId: 'he8nHph4zUM',
            summary: 'Impacto real de la divisa de contratación en tus fondos.'
        },
        {
            title: 'Inmuebles como inversión',
            videoId: 'Ld5HVQY30fY',
            summary: 'Búsqueda y análisis de inmuebles con ejemplos en España.'
        },
        {
            title: 'Podcast financiero con Uri Sabat',
            videoId: 'gfpIw5OM0WU',
            summary: 'Conversación sobre inversión y temas financieros relacionados.'
        }
    ]), []);

    return (
        <div className="resources-page">
            <AcademyPageHeader className="resources-page__header" section="Recursos">
                <h1 className="resources-page__title">Recursos y Guías</h1>
                <p className="resources-page__description">
                    Selección de vídeos de conocimientos básicos referenciados en la página de La Pizarra de Andrés.
                </p>
                <a className="resources-page__source" href={sourceUrl} target="_blank" rel="noreferrer">
                    Ver página fuente
                    <ExternalLink size={16} />
                </a>
            </AcademyPageHeader>

            <div className="resources-page__grid">
                {videos.map((video) => {
                    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
                    return (
                        <article key={video.title} className="resource-card">
                            <div className="resource-card__head">
                                <PlayCircle size={20} />
                                <h3>{video.title}</h3>
                            </div>
                            <p>{video.summary}</p>
                            <a href={videoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${video.title} en YouTube`}>
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
