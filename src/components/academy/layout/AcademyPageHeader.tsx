import type { HTMLAttributes, ReactNode } from 'react';
import { PageHeader } from '../../ui';

import './AcademyPageHeader.css';

export type AcademyHeaderSection =
    | 'Aprender'
    | 'Construir'
    | 'Herramientas'
    | 'Escenarios'
    | 'Recursos';

interface AcademyPageHeaderProps extends HTMLAttributes<HTMLElement> {
    section: AcademyHeaderSection;
    children: ReactNode;
}

/**
 * Shared top-level header for every Academy route.
 * The section badge is kept in the DOM so it remains visible and meaningful
 * in every theme, including the light Liquid Glass variant.
 */
export function AcademyPageHeader({ section, className = '', children, ...props }: AcademyPageHeaderProps) {
    return (
        <PageHeader
            eyebrow={section}
            className={`academy-page-header${className ? ` ${className}` : ''}`}
            {...props}
        >
            {children}
        </PageHeader>
    );
}
