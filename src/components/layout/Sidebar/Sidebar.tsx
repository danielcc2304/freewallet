import { NavLink, Link, useLocation } from 'react-router-dom';
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
    Shield,
    Scale,
    Award,
    FileSpreadsheet,
    LineChart
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

type AcademySection = {
    path: string;
    icon: any;
    label: string;
    group: 'Aprender' | 'Construir' | 'Analizar';
    end?: boolean;
};

const academySections: AcademySection[] = [
    { path: '/academy', icon: BookOpen, label: 'Fundamentos', end: true, group: 'Aprender' },
    { path: '/academy/timeline', icon: TrendingUp, label: 'Tu Journey', group: 'Aprender' },

    { path: '/academy/portfolio', icon: PieChart, label: 'Estrategia y Cartera', group: 'Construir' },
    { path: '/academy/risk', icon: Shield, label: 'Gestión del Riesgo', group: 'Construir' },
    { path: '/academy/tax', icon: Scale, label: 'Fiscalidad', group: 'Construir' },
    { path: '/academy/calculators', icon: Calculator, label: 'Calculadoras', group: 'Construir' },

    { path: '/academy/fund-radar', icon: Award, label: 'Fondos (Radar + Guía)', group: 'Analizar' },
    { path: '/academy/valuation', icon: LineChart, label: 'Valoración', group: 'Analizar' },
    { path: '/academy/crisis', icon: AlertCircle, label: 'Mercado y Crisis', group: 'Analizar' },
    { path: '/academy/scenarios', icon: AlertCircle, label: 'Escenarios prácticos', group: 'Analizar' }
];

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
        { to: '/add', icon: PlusCircle, label: 'Añadir Inversión' },
        { to: '/portfolio-csv', icon: FileSpreadsheet, label: 'Portfolio CSV' },
    ];

    const academyGroups: Array<AcademySection['group']> = ['Aprender', 'Construir', 'Analizar'];

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
                                {academyGroups.map((group) => (
                                    <div key={group} className="sidebar__sub-group">
                                        <div className="sidebar__sub-group-title">{group}</div>
                                        {academySections
                                            .filter((item) => item.group === group)
                                            .map(({ path, icon: Icon, label, end }) => (
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
                                ))}
                            </div>
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
                    <Link to="/terms" className="sidebar__terms-link" onClick={closeMobileSidebar}>
                        Términos y Condiciones
                    </Link>
                    <div className="sidebar__version">v3.3.0</div>
                </div>
            </aside>

            <button className="sidebar__toggle sidebar__toggle--fixed" onClick={onToggle}>
                <Menu size={24} />
            </button>
        </>
    );
}
