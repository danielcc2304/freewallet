import type { HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';
import { sidebarFrameStyle as s } from './SidebarFrame.styles';
export function SidebarFrame({ open, className, ...props }: HTMLAttributes<HTMLElement> & { open: boolean }) {
    return <aside {...props} className={cn(s('sidebar'), open && s('sidebar--open'), className)} />;
}
export function SidebarRegion({
    region,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { region: 'header' | 'nav' | 'group' | 'sub-group' | 'sub-group-title' }) {
    const Tag = region === 'nav' ? 'nav' : 'div';
    return <Tag {...props} className={cn(s(`sidebar__${region}`), className)} />;
}
export function SidebarSubNav({ open, children, ...props }: HTMLAttributes<HTMLDivElement> & { open: boolean }) {
    return (
        <div {...props} className={cn(s('sidebar__sub-nav'), open && s('sidebar__sub-nav--open'))}>
            <div className={s('sidebar__sub-nav-inner')}>{children}</div>
        </div>
    );
}
export function SidebarOverlay(props: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={s('sidebar-overlay')} />;
}
export function SidebarToggle({
    placement,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { placement: 'mobile' | 'fixed' }) {
    return (
        <button
            {...props}
            className={cn(
                s('sidebar__toggle'),
                s(placement === 'mobile' ? 'sidebar__toggle--mobile' : 'sidebar__toggle--fixed'),
                className,
            )}
        />
    );
}
