import { Component, Suspense, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import './RouteView.css';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (!this.state.failed) return this.props.children;
        return <section className="route-state" role="alert"><h1>No se pudo abrir esta pantalla</h1>
            <p>Tus datos guardados se conservan. Puedes reintentar cargando la página de nuevo.</p>
            <button type="button" onClick={() => window.location.reload()}>Volver a cargar</button>
            <a href="/">Ir al inicio</a>
        </section>;
    }
}
export function RouteLoading() {
    return <div className="route-state route-state--loading" role="status" aria-live="polite"><span className="route-state__spinner" aria-hidden="true" />Cargando…</div>;
}
/** Layout/sidebar stay mounted while only the destination's code loads. */
export function RouteView({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();
    return <AppErrorBoundary key={pathname}><Suspense fallback={<RouteLoading />}>{children}</Suspense></AppErrorBoundary>;
}
