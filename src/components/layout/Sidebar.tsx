import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings, TrendingUp, Menu, X } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/add', icon: PlusCircle, label: 'Añadir Inversión' },
        { to: '/settings', icon: Settings, label: 'Configuración' },
    ];

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={onToggle} />
            )}

            <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
                <div className="sidebar__header">
                    <div className="sidebar__logo">
                        <TrendingUp className="sidebar__logo-icon" />
                        <span className="sidebar__logo-text">FreeWallet</span>
                    </div>
                    <button className="sidebar__toggle sidebar__toggle--mobile" onClick={onToggle}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar__nav">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                            }
                            onClick={() => window.innerWidth < 1024 && onToggle()}
                        >
                            <Icon className="sidebar__link-icon" size={20} />
                            <span className="sidebar__link-text">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar__footer">
                    <div className="sidebar__version">v1.0.0</div>
                </div>
            </aside>

            {/* Mobile menu button */}
            <button className="sidebar__toggle sidebar__toggle--fixed" onClick={onToggle}>
                <Menu size={24} />
            </button>
        </>
    );
}
