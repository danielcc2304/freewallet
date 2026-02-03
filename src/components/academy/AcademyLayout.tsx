import { NavLink, Outlet } from 'react-router-dom';
import {
    BookOpen,
    TrendingUp,
    AlertCircle,
    Target,
    Calculator,
    PieChart,
    Receipt,
    Lightbulb,
    BarChart3,
    Shield,
    Library
} from 'lucide-react';
import './AcademyLayout.css';

export function AcademyLayout() {
    const sections = [
        { id: 'fundamentos', path: '/academy', icon: BookOpen, label: 'Fundamentos' },
        { id: 'timeline', path: '/academy/timeline', icon: TrendingUp, label: 'Tu Journey' },
        { id: 'crisis', path: '/academy/crisis', icon: AlertCircle, label: 'Crisis Históricas' },
        { id: 'scenarios', path: '/academy/scenarios', icon: Target, label: '¿Qué hacer cuando...?' },
        { id: 'errors', path: '/academy/errors', icon: Lightbulb, label: 'Errores Comunes' },
        { id: 'portfolio', path: '/academy/portfolio', icon: PieChart, label: 'Construir Cartera' },
        { id: 'tax', path: '/academy/tax', icon: Receipt, label: 'Fiscalidad' },
        { id: 'strategies', path: '/academy/strategies', icon: BarChart3, label: 'Estrategias' },
        { id: 'calculators', path: '/academy/calculators', icon: Calculator, label: 'Calculadoras' },
        { id: 'risk', path: '/academy/risk', icon: Shield, label: 'Gestión Riesgo' },
        { id: 'resources', path: '/academy/resources', icon: Library, label: 'Recursos' }
    ];



    return (
        <div className="academy">
            <aside className="academy__sidebar">
                <div className="academy__sidebar-header">
                    <h2 className="academy__title">Academia</h2>
                    <p className="academy__subtitle">Aprende a invertir</p>
                </div>

                <nav className="academy__nav">
                    {sections.map(section => (
                        <NavLink
                            key={section.id}
                            to={section.path}
                            end={section.path === '/academy'}
                            className={({ isActive }) =>
                                `academy__nav-link ${isActive ? 'academy__nav-link--active' : ''}`
                            }
                        >
                            <section.icon className="academy__nav-icon" size={18} />
                            <span className="academy__nav-label">{section.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="academy__sidebar-footer">
                    <a href="/terms" className="academy__terms-link">
                        Términos y Condiciones
                    </a>
                </div>
            </aside>

            <main className="academy__content">
                <Outlet />
            </main>
        </div>
    );
}
