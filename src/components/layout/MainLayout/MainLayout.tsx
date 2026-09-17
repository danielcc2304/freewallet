import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import './MainLayout.css';

export function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const isAcademyRoute = location.pathname.startsWith('/academy');

    return (
        <div className="layout">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className="layout__main">
                <div className={`layout__content${isAcademyRoute ? ' layout__content--academy' : ''}`}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
