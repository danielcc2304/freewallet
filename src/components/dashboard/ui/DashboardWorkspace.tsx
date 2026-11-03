import type {HTMLAttributes,ReactNode} from 'react';
import { cn } from '../../../utils/cn';
import { Card, CardContent, PageHeader } from '../../ui';
import { dashboardWorkspaceStyle as s } from './DashboardWorkspace.styles';
export function DashboardWorkspace({ state, children }: { state?: 'loading' | 'empty'; children: ReactNode }) {
    return (
        <div className={cn(s('dashboard'), state && s(state === 'empty' ? 'dashboard--empty' : 'dashboard--loading'))}>
            {children}
        </div>
    );
}
export function DashboardWorkspaceHeader({ title, children }: { title: ReactNode; children: ReactNode }) {
    return (
        <PageHeader className={s('dashboard__header')} eyebrow="Cartera">
            <div className={s('dashboard__header-content')}>
                <h1 className={s('dashboard__title')}>{title}</h1>
                {children}
            </div>
        </PageHeader>
    );
}
export function DashboardWorkspaceSection({
    performers,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { performers?: boolean }) {
    return (
        <section
            {...props}
            className={cn(s('dashboard__section'), performers && s('dashboard__performers'), className)}
        />
    );
}
export function DashboardWorkspaceStack({
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { appearance: 'status' | 'links' | 'actions' }) {
    return (
        <div
            {...props}
            className={cn(
                s(
                    appearance === 'status'
                        ? 'dashboard__status-row'
                        : appearance === 'links'
                          ? 'dashboard__notice-links'
                          : 'welcome-content__actions',
                ),
                className,
            )}
        />
    );
}
export function DashboardWorkspaceNote({
    updating,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { updating?: boolean }) {
    return updating ? (
        <div {...props} className={cn(s('dashboard__updating-banner'), className)} />
    ) : (
        <p {...props} className={cn(s('dashboard__automatic-status'), className)} />
    );
}
export function DashboardWelcome({
    icons,
    title,
    description,
    children,
}: {
    icons: ReactNode;
    title: ReactNode;
    description: ReactNode;
    children: ReactNode;
}) {
    return (
        <Card className={s('dashboard__welcome')}>
            <CardContent>
                <div className={s('welcome-content')}>
                    <div className={s('welcome-content__icons')}>{icons}</div>
                    <h1 className={s('welcome-content__title')}>{title}</h1>
                    <p className={s('welcome-content__description')}>{description}</p>
                    <div className={s('welcome-content__actions')}>{children}</div>
                </div>
            </CardContent>
        </Card>
    );
}
export function DashboardDevelopmentNotice({
    icon,
    title,
    description,
    links,
    children,
}: {
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
    links: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={cn(s('dashboard__notice'), s('dashboard__notice--hero'))}>
            <div className={s('dashboard__notice-icon')}>{icon}</div>
            <h2 className={s('dashboard__notice-title')}>{title}</h2>
            <p className={s('dashboard__notice-description')}>{description}</p>
            <div className={s('dashboard__notice-links')}>{links}</div>
            {children}
        </div>
    );
}
export function DashboardQuoteStatus({ className, ...props }: HTMLAttributes<HTMLDetailsElement>) {
    return <details {...props} className={cn(s('dashboard__quote-status'), className)} />;
}

export function DashboardStatusPill({
    active,
    children,
    ...props
}: HTMLAttributes<HTMLSpanElement> & { active: boolean }) {
    return (
        <span
            {...props}
            className={cn(s('dashboard__live-status'), active && s('dashboard__live-status--active'), props.className)}
        >
            {children}
        </span>
    );
}
export function DashboardSkeleton({ large }: { large?: boolean }) {
    return <div className={cn('skeleton', s(large ? 'skeleton--large' : 'skeleton--medium'))} />;
}

export function DashboardUpdateInfo({ className, ...props }: HTMLAttributes<HTMLDListElement>) {
    return <dl {...props} className={cn(s('dashboard__update-info'), className)} />;
}
