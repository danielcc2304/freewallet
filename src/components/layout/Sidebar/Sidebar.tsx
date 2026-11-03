import{SidebarFrame,SidebarRegion,SidebarSubNav,SidebarOverlay,SidebarToggle}from'./SidebarFrame';
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
                <SidebarOverlay onClick={onToggle}/>
            )}

            <SidebarFrame open={isOpen} >
                <SidebarRegion region="header" >
                    <SidebarBrand />
                    <SidebarToggle placement="mobile" onClick={onToggle}>
                        <X size={20} />
                    </SidebarToggle>
                </SidebarRegion>

                <SidebarRegion region="nav" >
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <SidebarNavItem key={to} to={to} onClick={closeMobileSidebar} icon={Icon} label={<>
                                {label}
                                {to === '/account' && <AccountSyncStatus />}
                            </>}  account={to === '/account'} />
                    ))}

                    <SidebarRegion region="group" className={isToolRoute?'sidebar__group--active':undefined} >
                        <SidebarGroupToggle onClick={() => setToolsExpanded(!toolsAreExpanded)} icon={PanelsTopLeft} label={<>Herramientas</>} active={isToolRoute} expanded={toolsAreExpanded} />

                        <SidebarSubNav open={toolsAreExpanded} >
                                <SidebarRegion region="sub-group" >
                                    {toolSidebarSections.map(({ to, label, icon: Icon, end }) => (
                                        <SidebarNavItem key={to} to={to} end={end} onClick={closeMobileSidebar} icon={Icon} label={<>{label}</>} sub  />
                                    ))}
                                </SidebarRegion>
                            </SidebarSubNav>
                    </SidebarRegion>

                    <SidebarRegion region="group" className={isAcademyRoute?'sidebar__group--active':undefined} >
                        <SidebarGroupToggle onClick={handleAcademyToggle} icon={GraduationCap} label={<>Academia</>} active={isAcademyRoute} expanded={academyIsExpanded} />

                        <SidebarSubNav open={academyIsExpanded} >
                                {academySidebarGroups.filter((group) => group !== 'Herramientas').map((group) => (
                                    <SidebarRegion region="sub-group" key={group}>
                                        <SidebarRegion region="sub-group-title" >{group}</SidebarRegion>
                                        {academySidebarSections
                                            .filter((item) => item.group === group)
                                            .map(({ path, icon: Icon, label, end }) => (
                                                <SidebarNavItem key={path || 'academy-index'} to={path ? `/academy/${path}` : '/academy'} end={end} onClick={closeMobileSidebar} icon={Icon} label={<>{label}</>} sub  />
                                            ))}
                                    </SidebarRegion>
                                ))}
                            </SidebarSubNav>
                    </SidebarRegion>

                    <SidebarNavItem to="/portfolio-csv" onClick={closeMobileSidebar} icon={FileSpreadsheet} label={<>Portfolio</>}   />

                    <SidebarNavItem to="/settings" onClick={closeMobileSidebar} icon={Settings} label={<>Configuración</>}   />
                </SidebarRegion>

                <SidebarFooter version={APP_VERSION} onNavigate={closeMobileSidebar} />
            </SidebarFrame>

            <SidebarToggle placement="fixed" onClick={onToggle}>
                <Menu size={24} />
            </SidebarToggle>
        </>
    );
}

