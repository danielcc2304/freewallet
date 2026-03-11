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
    LibraryBig,
    CircleAlert,
    Activity,
    Calculator,
    PieChart,
    Shield,
    Scale,
    Award,
    FileSpreadsheet,
    LineChart,
    Target,
    Sparkles,
    Gamepad2,
    Flame,
    FolderOpen
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
    group: 'Aprender' | 'Construir' | 'Herramientas' | 'Escenarios' | 'Recursos';
    end?: boolean;
};

const academySections: AcademySection[] = [
    { path: '/academy', icon: BookOpen, label: 'Fundamentos', end: true, group: 'Aprender' },
    { path: '/academy/glossary', icon: LibraryBig, label: 'Glosario', group: 'Aprender' },
    { path: '/academy/timeline', icon: TrendingUp, label: 'Tu recorrido', group: 'Aprender' },
    { path: '/academy/errors', icon: CircleAlert, label: 'Errores comunes', group: 'Aprender' },

    { path: '/academy/investor-profile-test', icon: Sparkles, label: 'Perfil inversor', group: 'Construir' },
    { path: '/academy/portfolio', icon: PieChart, label: 'Estrategia y cartera', group: 'Construir' },
    { path: '/academy/risk', icon: Shield, label: 'Gestion del riesgo', group: 'Construir' },
    { path: '/academy/tax', icon: Scale, label: 'Fiscalidad', group: 'Construir' },
    { path: '/academy/strategies', icon: Target, label: 'Estrategias', group: 'Construir' },

    { path: '/academy/calculators', icon: Calculator, label: 'Calculadoras', group: 'Herramientas' },
    { path: '/academy/fund-radar', icon: Award, label: 'Radar de fondos', group: 'Herramientas' },
    { path: '/academy/valuation', icon: LineChart, label: 'Valoracion', group: 'Herramientas' },
    { path: '/academy/market-timing-game', icon: Gamepad2, label: 'Timing vs DCA', group: 'Herramientas' },

    { path: '/academy/crisis', icon: Activity, label: 'Mercado y crisis', group: 'Escenarios' },
    { path: '/academy/scenarios', icon: Target, label: 'Que hacer si...', group: 'Escenarios' },
    { path: '/academy/inflation-predator', icon: Flame, label: 'Impacto de la inflacion', group: 'Escenarios' },

    { path: '/academy/resources', icon: FolderOpen, label: 'Recursos y guias', group: 'Recursos' }
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
        { to: '/add', icon: PlusCircle, label: 'Anadir inversion' },
    ];

    const academyGroups: Array<AcademySection['group']> = ['Aprender', 'Construir', 'Herramientas', 'Escenarios', 'Recursos'];

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
                        <span className="sidebar__link-text">Configuracion</span>
                    </NavLink>
                </nav>

                <div className="sidebar__footer">
                    <Link to="/terms" className="sidebar__terms-link" onClick={closeMobileSidebar}>
                        Terminos y condiciones
                    </Link>
                    <div className="sidebar__version">v3.5.5</div>
                </div>
            </aside>

            <button className="sidebar__toggle sidebar__toggle--fixed" onClick={onToggle}>
                <Menu size={24} />
            </button>
        </>
    );
}
