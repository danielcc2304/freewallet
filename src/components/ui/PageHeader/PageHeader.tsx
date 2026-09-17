import type { HTMLAttributes, ReactNode } from 'react';

import './PageHeader.css';

interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
    eyebrow: string;
    children: ReactNode;
}

export function PageHeader({ eyebrow, className = '', children, ...props }: PageHeaderProps) {
    return (
        <header className={`page-header${className ? ` ${className}` : ''}`} {...props}>
            <span className="page-header__eyebrow">{eyebrow}</span>
            {children}
        </header>
    );
}
