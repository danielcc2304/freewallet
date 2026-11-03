import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, NavLink, type NavLinkProps } from 'react-router-dom';
import { ChevronDown, Feather, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { sidebarStyle as s } from './SidebarParts.styles';
export function SidebarBrand() {
    return (
        <div className={s('sidebar__logo')}>
            <div className={s('sidebar__logo-icons')}>
                <Wallet className={cn(s('sidebar__logo-icon'), s('sidebar__logo-icon--wallet'))} />
                <Feather className={cn(s('sidebar__logo-icon'), s('sidebar__logo-icon--feather'))} />
            </div>
            <span className={s('sidebar__logo-text')}>FreeWallet</span>
        </div>
    );
}
export function SidebarNavItem({
    icon: Icon,
    label,
    account,
    sub = false,
    ...props
}: Omit<NavLinkProps, 'children' | 'className'> & {
    icon: LucideIcon;
    label: ReactNode;
    account?: boolean;
    sub?: boolean;
}) {
    return (
        <NavLink
            {...props}
            className={({ isActive }) =>
                cn(
                    sub ? s('sidebar__sub-link') : s('sidebar__link'),
                    isActive && (sub ? s('sidebar__sub-link--active') : s('sidebar__link--active')),
                )
            }
        >
            <Icon className={sub ? s('sidebar__sub-icon') : s('sidebar__link-icon')} size={sub ? 16 : 20} />
            <span
                className={
                    sub ? s('sidebar__sub-text') : cn('sidebar__link-text', account && s('sidebar__account-label'))
                }
            >
                {label}
            </span>
        </NavLink>
    );
}
export function SidebarGroupToggle({
    icon: Icon,
    label,
    active,
    expanded,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: LucideIcon;
    label: ReactNode;
    active: boolean;
    expanded: boolean;
}) {
    return (
        <button
            {...props}
            className={cn(
                s('sidebar__link'),
                s('sidebar__group-toggle'),
                active && s('sidebar__link--active'),
                className,
            )}
        >
            <Icon className={s('sidebar__link-icon')} size={20} />
            <span className="sidebar__link-text">{label}</span>
            <ChevronDown className={cn(s('sidebar__chevron'), expanded && s('sidebar__chevron--open'))} size={16} />
        </button>
    );
}
export function SidebarFooter({ version, onNavigate }: { version: string; onNavigate: () => void }) {
    return (
        <div className={s('sidebar__footer')}>
            <Link to="/terms" className={s('sidebar__terms-link')} onClick={onNavigate}>
                Terminos y condiciones
            </Link>
            <Link to="/feature-log" className={s('sidebar__version')} onClick={onNavigate}>
                v{version}
            </Link>
        </div>
    );
}
