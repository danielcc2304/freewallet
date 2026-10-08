import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { LocalPortfolioPrompt } from '../../ui/LocalPortfolioPrompt';
import './MainLayout.css';
import type { DashboardReturnSnapshot, DashboardNavigationContext } from './dashboardNavigation';

export function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dashboardReturn, setDashboardReturn] = useState<DashboardReturnSnapshot | null>(null);

    return (
        <div className="layout">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className="layout__main">
                <div className="layout__content">
                    <Outlet context={{ dashboardReturn, setDashboardReturn } satisfies DashboardNavigationContext} />
                </div>
            </main>
            <LocalPortfolioPrompt />
        </div>
    );
}
