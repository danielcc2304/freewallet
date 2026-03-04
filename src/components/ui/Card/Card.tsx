import type { ReactNode } from 'react';
import './Card.css';

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'highlight' | 'compact';
    onClick?: () => void;
}

export function Card({ children, className = '', variant = 'default', onClick }: CardProps) {
    return (
        <div
            className={`card card--${variant} ${onClick ? 'card--clickable' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
    return (
        <div className="card__header">
            <div className="card__header-text">
                <h3 className="card__title">{title}</h3>
                {subtitle && <p className="card__subtitle">{subtitle}</p>}
            </div>
            {action && <div className="card__header-action">{action}</div>}
        </div>
    );
}

interface CardContentProps {
    children: ReactNode;
    className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
    return <div className={`card__content ${className}`}>{children}</div>;
}
