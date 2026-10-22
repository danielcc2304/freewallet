import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface AcademySectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> { title?: ReactNode }
/** In-page anchors, semantic headings and lesson spacing in one reusable section. */
export function AcademySection({ title, className, children, ...props }: AcademySectionProps) {
    return <section {...props} className={cn('asset-page__section tw:mb-[var(--academy-space-section)]', className)}>
        {title != null && <h2 className="tw:ui-row tw:gap-[0.75rem] tw:text-[length:1.75rem] tw:mb-[1.5rem]">{title}</h2>}
        {children}
    </section>;
}
