import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    PlusCircle,
    Settings,
    Wallet,
    Feather,
    Menu,
    X,
    GraduationCap,
    ChevronDown,
    BookOpen,
    TrendingUp,
    AlertCircle,
    Calculator,
    PieChart,
    Lightbulb,
    Shield
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const academySections = [
    { path: '/academy', icon: BookOpen, label: 'Fundamentos', end: true },
    { path: '/academy/timeline', icon: TrendingUp, label: 'Tu Journey' },
    { path: '/academy/crisis', icon: AlertCircle, label: 'Mercado y Crisis' },
    { path: '/academy/portfolio', icon: PieChart, label: 'Estrategia y Cartera' },
    { path: '/academy/calculators', icon: Calculator, label: 'Calculadoras' },
    { path: '/academy/tax', icon: Shield, label: 'Fiscalidad y Riesgo' },
    { path: '/academy/errors', icon: Lightbulb, label: 'Errores Comunes' }
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const location = useLocation();
    const isAcademyRoute = location.pathname.startsWith('/academy');
    const [academyExpanded, setAcademyExpanded] = useState(isAcademyRoute);

    // Auto-expand when navigating to academy routes
    useEffect(() => {
        if (isAcademyRoute) {
            setAcademyExpanded(true);
        }
    }, [isAcademyRoute]);

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/add', icon: PlusCircle, label: 'Añadir Inversión' },
    ];

    const handleAcademyToggle = () => {
        setAcademyExpanded(!academyExpanded);
    };

    const closeMobileSidebar = () => {
        if (window.innerWidth < 1024) onToggle();
    };

    return (
        <>
            {/* Mobile overlay */}
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

                    {/* Academy section with collapsible sub-nav */}
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
                            {academySections.map(({ path, icon: Icon, label, end }) => (
                                <NavLink
                                    key={path}
                                    to={path}
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
                    </div>

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
                    <div className="sidebar__version">v2.3.0</div>
                </div>
            </aside>

            {/* Mobile menu button */}
            <button className="sidebar__toggle sidebar__toggle--fixed" onClick={onToggle}>
                <Menu size={24} />
            </button>
        </>
    );
}
