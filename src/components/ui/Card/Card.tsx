import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLElement> {
    as?: 'div' | 'section' | 'article' | 'form';
    variant?: 'default' | 'highlight' | 'compact';
}

export function Card({ as: Tag = 'div', children, className, variant = 'default', onClick, ...props }: CardProps) {
    return (
        <Tag
            {...props}
            data-ui="card"
            className={cn(
                'card tw:border tw:border-line tw:rounded-panel tw:bg-panel tw:transition-[background-color,border-color,box-shadow,transform] tw:duration-250',
                variant === 'compact' ? 'card--compact tw:p-ui-md' : 'tw:p-ui-lg tw:max-[640px]:p-ui-md',
                variant === 'default' && 'card--default',
                variant === 'highlight' && 'card--highlight tw:border-line-accent tw:shadow-glow',
                onClick && 'card--clickable tw:cursor-pointer tw:hover:bg-panel-hover tw:hover:border-line-strong tw:hover:-translate-y-0.5 tw:hover:shadow-ui-md',
                className,
            )}
            onClick={onClick}
        >
            {children}
        </Tag>
    );
}

interface CardHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
    return (
        <div className="card__header tw:flex tw:items-start tw:justify-between tw:gap-ui-md tw:mb-ui-md">
            <div className="card__header-text tw:flex-1 tw:min-w-0">
                <h3 className="card__title tw:m-0 tw:text-lg tw:leading-[1.3] tw:font-semibold tw:text-main tw:max-[640px]:text-base">{title}</h3>
                {subtitle && <p className="card__subtitle tw:mt-ui-xs tw:mb-0 tw:text-sm tw:leading-[1.6] tw:text-muted">{subtitle}</p>}
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
    return <div className={cn('card__content tw:text-secondary', className)}>{children}</div>;
}
