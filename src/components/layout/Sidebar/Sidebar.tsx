import { useEffect, useState } from 'react';
import {
    ChevronDown,
    Feather,
    FileSpreadsheet,
    GraduationCap,
    LayoutDashboard,
    Menu,
    PlusCircle,
    Settings,
    Wallet,
    X,
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { academySidebarGroups, academySidebarSections } from '../../../app/routes/academyRoutes';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const location = useLocation();
    const isAcademyRoute = location.pathname.startsWith('/academy');
    const [academyExpanded, setAcademyExpanded] = useState(isAcademyRoute);

    useEffect(() => {
        if (isAcademyRoute) {
            setAcademyExpanded(true);
        }
    }, [isAcademyRoute]);

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/add', icon: PlusCircle, label: 'Anadir inversion' },
    ];

    const handleAcademyToggle = () => {
        setAcademyExpanded(!academyExpanded);
    };

    const closeMobileSidebar = () => {
        if (window.innerWidth < 1024) onToggle();
    };

    return (
        <>
            {isOpen && (
                <div className="sidebar-overlay" onClick={onToggle} />
            )}

            <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
                <div className="sidebar__header">
                    <div className="sidebar__logo">
                        <div className="sidebar__logo-icons">
                            <Wallet className="sidebar__logo-icon sidebar__logo-icon--wallet" />
                            <Feather className="sidebar__logo-icon sidebar__logo-icon--feather" />
                        </div>
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
                            onClick={closeMobileSidebar}
                        >
                            <Icon className="sidebar__link-icon" size={20} />
                            <span className="sidebar__link-text">{label}</span>
                        </NavLink>
                    ))}

                    <div className={`sidebar__group ${isAcademyRoute ? 'sidebar__group--active' : ''}`}>
                        <button
                            className={`sidebar__link sidebar__group-toggle ${isAcademyRoute ? 'sidebar__link--active' : ''}`}
                            onClick={handleAcademyToggle}
                        >
                            <GraduationCap className="sidebar__link-icon" size={20} />
                            <span className="sidebar__link-text">Academia</span>
                            <ChevronDown
                                className={`sidebar__chevron ${academyExpanded ? 'sidebar__chevron--open' : ''}`}
                                size={16}
                            />
                        </button>

                        <div className={`sidebar__sub-nav ${academyExpanded ? 'sidebar__sub-nav--open' : ''}`}>
                            <div className="sidebar__sub-nav-inner">
                                {academySidebarGroups.map((group) => (
                                    <div key={group} className="sidebar__sub-group">
                                        <div className="sidebar__sub-group-title">{group}</div>
                                        {academySidebarSections
                                            .filter((item) => item.group === group)
                                            .map(({ path, icon: Icon, label, end }) => (
                                                <NavLink
                                                    key={path || 'academy-index'}
                                                    to={path ? `/academy/${path}` : '/academy'}
                                                    end={end}
                                                    className={({ isActive }) =>
                                                        `sidebar__sub-link ${isActive ? 'sidebar__sub-link--active' : ''}`
                                                    }
                                                    onClick={closeMobileSidebar}
                                                >
                                                    <Icon className="sidebar__sub-icon" size={16} />
                                                    <span className="sidebar__sub-text">{label}</span>
                                                </NavLink>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <NavLink
                        to="/portfolio-csv"
                        className={({ isActive }) =>
                            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                        }
                        onClick={closeMobileSidebar}
                    >
                        <FileSpreadsheet className="sidebar__link-icon" size={20} />
                        <span className="sidebar__link-text">Portfolio CSV</span>
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                        }
                        onClick={closeMobileSidebar}
                    >
                        <Settings className="sidebar__link-icon" size={20} />
                        <span className="sidebar__link-text">Configuración</span>
                    </NavLink>
                </nav>

                <div className="sidebar__footer">
                    <Link to="/terms" className="sidebar__terms-link" onClick={closeMobileSidebar}>
                        Terminos y condiciones
                    </Link>
                    <div className="sidebar__version">v3.6.4</div>
                </div>
            </aside>

            <button className="sidebar__toggle sidebar__toggle--fixed" onClick={onToggle}>
                <Menu size={24} />
            </button>
        </>
    );
}
