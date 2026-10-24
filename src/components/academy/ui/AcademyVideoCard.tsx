import {cn} from '../../../utils/cn';
import {videoStyle} from './AcademyVideoCard.styles';
import { ExternalLink, Play } from 'lucide-react';

interface AcademyVideoCardProps {
    video: { videoId: string; title: string; summary: string };
    thumbnailFailed: boolean;
    onThumbnailError: () => void;
}
/** Accessible video preview; the page owns thumbnail error state and the catalogue. */
export function AcademyVideoCard({ video, thumbnailFailed, onThumbnailError }: AcademyVideoCardProps) {
    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    return (
        <article className={cn(videoStyle('resource-card'), 'tw:min-w-[0] tw:ui-fill-surface tw:ui-border-default tw:rounded-[16px] tw:overflow-hidden')}>
            <a className={cn(videoStyle('resource-card__link'), 'tw:ui-stack tw:h-full tw:text-main')} href={videoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${video.title} en YouTube (se abre en otra pestaña)`}>
                <div className={cn(videoStyle('resource-card__preview'), 'tw:relative tw:aspect-[16_/_9] tw:overflow-hidden')}>
                    {!thumbnailFailed && (
                        <img className="tw:block tw:absolute tw:inset-[0] tw:w-full tw:h-full tw:object-cover"
                            src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                            alt=""
                            width={480}
                            height={360}
                            loading="lazy"
                            decoding="async"
                            onError={onThumbnailError}
                        />
                    )}
                    <span className={cn(videoStyle('resource-card__play'), 'tw:absolute tw:z-[1] tw:top-[50%] tw:left-[50%] tw:grid tw:place-items-center tw:w-[52px] tw:h-[52px] tw:rounded-[50%]')} aria-hidden="true"><Play size={24} fill="currentColor" /></span>
                    <span className={cn(videoStyle('resource-card__video-label'), 'tw:absolute tw:z-[1] tw:right-[.65rem] tw:bottom-[.65rem] tw:p-[.25rem_.5rem] tw:rounded-[5px] tw:text-[length:.7rem]')} aria-hidden="true">YouTube</span>
                </div>
                <div className={cn(videoStyle('resource-card__content'), 'tw:ui-stack tw:flex-[1] tw:gap-[.75rem] tw:p-[1.1rem]')}>
                    <h2 className="tw:text-[length:1.05rem] tw:text-main tw:m-[0]">{video.title}</h2>
                    <p className="tw:m-[0] tw:text-secondary tw:text-[length:.9rem]">{video.summary}</p>
                    <span className={cn(videoStyle('resource-card__action'), 'tw:ui-row tw:gap-[.4rem] tw:min-h-[44px] tw:mt-[auto] tw:text-[length:.85rem]')}>Ver en YouTube <ExternalLink size={15} aria-hidden="true" /></span>
                </div>
            </a>
        </article>
    );
}
