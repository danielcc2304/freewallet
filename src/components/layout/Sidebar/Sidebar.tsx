import {SidebarBrand,SidebarNavItem,SidebarGroupToggle,SidebarFooter} from './SidebarParts';
import { useState } from 'react';
import {
    FileSpreadsheet,
    GraduationCap,
    LayoutDashboard,
    Menu,
    Newspaper,
    PanelsTopLeft,
    Settings,
    Wallet,
    X,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { academySidebarGroups, academySidebarSections, toolSidebarSections } from '../../../app/routes/academyRoutes';
import { APP_VERSION } from '../../../constants/app';
import { AccountSyncStatus } from '../../ui/AccountSyncStatus';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const location = useLocation();
    const isAcademyRoute = location.pathname.startsWith('/academy');
    const isToolRoute = toolSidebarSections.some((item) => item.to === location.pathname);
    const [academyExpanded, setAcademyExpanded] = useState(isAcademyRoute);
    const [toolsExpanded, setToolsExpanded] = useState(isToolRoute);
    const toolsAreExpanded = toolsExpanded || isToolRoute;
    const academyIsExpanded = academyExpanded || isAcademyRoute;

    const navItems = [
        { to: '/account', icon: Wallet, label: 'Mi cuenta' },
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/news', icon: Newspaper, label: 'Noticias' },
    ];

    const handleAcademyToggle = () => {
        setAcademyExpanded(!academyIsExpanded);
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
                    <SidebarBrand />
                    <button className="sidebar__toggle sidebar__toggle--mobile" onClick={onToggle}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar__nav">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <SidebarNavItem key={to} to={to} onClick={closeMobileSidebar} icon={Icon} label={<>
                                {label}
                                {to === '/account' && <AccountSyncStatus />}
                            </>}  account={to === '/account'} />
                    ))}

                    <div className={`sidebar__group ${isToolRoute ? 'sidebar__group--active' : ''}`}>
                        <SidebarGroupToggle onClick={() => setToolsExpanded(!toolsAreExpanded)} icon={PanelsTopLeft} label={<>Herramientas</>} active={isToolRoute} expanded={toolsAreExpanded} />

                        <div className={`sidebar__sub-nav ${toolsAreExpanded ? 'sidebar__sub-nav--open' : ''}`}>
                            <div className="sidebar__sub-nav-inner">
                                <div className="sidebar__sub-group">
                                    {toolSidebarSections.map(({ to, label, icon: Icon, end }) => (
                                        <SidebarNavItem key={to} to={to} end={end} onClick={closeMobileSidebar} icon={Icon} label={<>{label}</>} sub  />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`sidebar__group ${isAcademyRoute ? 'sidebar__group--active' : ''}`}>
                        <SidebarGroupToggle onClick={handleAcademyToggle} icon={GraduationCap} label={<>Academia</>} active={isAcademyRoute} expanded={academyIsExpanded} />

                        <div className={`sidebar__sub-nav ${academyIsExpanded ? 'sidebar__sub-nav--open' : ''}`}>
                            <div className="sidebar__sub-nav-inner">
                                {academySidebarGroups.filter((group) => group !== 'Herramientas').map((group) => (
                                    <div key={group} className="sidebar__sub-group">
                                        <div className="sidebar__sub-group-title">{group}</div>
                                        {academySidebarSections
                                            .filter((item) => item.group === group)
                                            .map(({ path, icon: Icon, label, end }) => (
                                                <SidebarNavItem key={path || 'academy-index'} to={path ? `/academy/${path}` : '/academy'} end={end} onClick={closeMobileSidebar} icon={Icon} label={<>{label}</>} sub  />
                                            ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <SidebarNavItem to="/portfolio-csv" onClick={closeMobileSidebar} icon={FileSpreadsheet} label={<>Portfolio</>}   />

                    <SidebarNavItem to="/settings" onClick={closeMobileSidebar} icon={Settings} label={<>Configuración</>}   />
                </nav>

                <SidebarFooter version={APP_VERSION} onNavigate={closeMobileSidebar} />
            </aside>

            <button className="sidebar__toggle sidebar__toggle--fixed" onClick={onToggle}>
                <Menu size={24} />
            </button>
        </>
    );
}

