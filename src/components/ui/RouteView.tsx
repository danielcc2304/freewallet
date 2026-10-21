import { Component, Suspense, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { routeState, routeAction } from './routeStyles';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (!this.state.failed) return this.props.children;
        return <section className={routeState} role="alert"><h1>No se pudo abrir esta pantalla</h1>
            <p className="tw:text-secondary tw:[line-height:1.6]">Tus datos guardados se conservan. Puedes reintentar cargando la página de nuevo.</p>
            <button className={routeAction} type="button" onClick={() => window.location.reload()}>Volver a cargar</button>
            <a className={routeAction} href="/">Ir al inicio</a>
        </section>;
    }
}
export function RouteLoading() {
    return <div className={cn(routeState, 'route-state--loading tw:flex tw:items-center tw:gap-[.75rem] tw:text-secondary')} role="status" aria-live="polite"><span className="route-state__spinner tw:ui-route-spinner tw:motion-reduce:animate-none" aria-hidden="true" />Cargando…</div>;
}
/** Layout/sidebar stay mounted while only the destination's code loads. */
export function RouteView({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();
    return <AppErrorBoundary key={pathname}><Suspense fallback={<RouteLoading />}>{children}</Suspense></AppErrorBoundary>;
}
