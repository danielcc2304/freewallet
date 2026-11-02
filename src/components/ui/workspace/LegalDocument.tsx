import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { legalStyle as s } from './LegalDocument.styles';
export function LegalDocument({ back, children }: { back: ReactNode; children: ReactNode }) {
    return (
        <div className={s('terms')}>
            {back}
            <div className={s('terms__container')}>{children}</div>
        </div>
    );
}
export function LegalBack({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={cn(s('terms__back-fab'), className)} />;
}
export function LegalHeading({ title, updated }: { title: ReactNode; updated: ReactNode }) {
    return (
        <>
            <h1 className={s('terms__title')}>{title}</h1>
            <p className={s('terms__updated')}>{updated}</p>
        </>
    );
}
export function LegalSection({
    title,
    children,
    ...props
}: Omit<HTMLAttributes<HTMLElement>, 'title'> & { title: ReactNode }) {
    return (
        <section {...props} className={cn(s('terms__section'), props.className)}>
            <h2>{title}</h2>
            {children}
        </section>
    );
}
export function LegalNotice({
    acknowledgment,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { acknowledgment?: boolean }) {
    return (
        <div {...props} className={cn(s(acknowledgment ? 'terms__acknowledgment' : 'terms__disclaimer'), className)} />
    );
}
