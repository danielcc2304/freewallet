import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardHeader, CardContent } from './Card';
import { investmentFormStyle as s } from './InvestmentForm.styles';
/** Shared card/header/form structure; transaction state and submit policy remain with the caller. */
export function InvestmentForm({
    title,
    subtitle,
    children,
    className,
    ...props
}: Omit<FormHTMLAttributes<HTMLFormElement>, 'title'> & { title: string; subtitle?: string }) {
    return (
        <Card className={s('add-investment__form-card')}>
            <CardHeader title={title} subtitle={subtitle} />
            <CardContent>
                <form {...props} className={cn(s('add-investment__form'), className)}>
                    {children}
                </form>
            </CardContent>
        </Card>
    );
}
export function InvestmentFieldsRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('form-row'), className)} />;
}
export function InvestmentAvailability({ label, value }: { label: ReactNode; value: ReactNode }) {
    return (
        <p className={s('position-availability')}>
            {label}
            <strong>{value}</strong> participaciones
        </p>
    );
}
export function InvestmentSearchArea({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('search-container'), className)} />;
}
export function InvestmentSearchResults({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
    return <ul {...props} className={cn(s('search-results'), className)} />;
}
export function InvestmentSearchLoading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <div className={s('search-loading')}>
            {icon}
            {children}
        </div>
    );
}
export function InvestmentSuccess({
    icon,
    title,
    children,
}: {
    icon: ReactNode;
    title: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={cn('add-investment', s('add-investment--success'))}>
            <Card className={s('success-card')}>
                <CardContent>
                    <div className={s('success-content')}>
                        <div className={s('success-content__icon')}>{icon}</div>
                        <h2>{title}</h2>
                        <p>{children}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
