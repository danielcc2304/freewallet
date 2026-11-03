import { Loader2, PlusCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui';

export function DashboardActions({ updating, apiEnabled, onRefresh }: { updating: boolean; apiEnabled: boolean; onRefresh: () => void }) {
    const label = !apiEnabled ? 'Consultas desactivadas' : updating ? 'Consultando precios' : 'Consultar precios ahora';
    return <div className="dashboard__floating-actions tw:fixed tw:right-[max(1.25rem,env(safe-area-inset-right))] tw:bottom-[max(1.25rem,env(safe-area-inset-bottom))] tw:z-[900] tw:ui-stack tw:items-center tw:gap-[.65rem] tw:[@media(max-width:640px)]:right-[max(1rem,env(safe-area-inset-right))] tw:[@media(max-width:640px)]:bottom-[max(1rem,env(safe-area-inset-bottom))] tw:[@media(max-width:640px)]:gap-[.55rem]" aria-label="Acciones de cartera">
        <Button variant="secondary" onClick={onRefresh} icon={updating ? <Loader2 size={18} className="spinning" /> : <RefreshCw size={18} />} size="sm"
            className="dashboard__floating-refresh tw:w-[2.8rem] tw:h-[2.8rem] tw:p-0 tw:rounded-[999px] tw:ui-fill-surface tw:shadow-[0_8px_20px_rgba(0,0,0,.28)] tw:[&:hover:not(:disabled)]:[transform:translateY(-2px)_scale(1.04)] tw:[@media(max-width:640px)]:w-[2.75rem] tw:[@media(max-width:640px)]:h-[2.75rem]"
            disabled={updating || !apiEnabled} aria-label={label} title={label} />
        <Link className="dashboard__floating-add tw:inline-flex tw:items-center tw:justify-center tw:w-[3.5rem] tw:h-[3.5rem] tw:[border:1px_solid_rgba(255,255,255,.2)] tw:rounded-[999px] tw:[background:var(--accent-primary)] tw:text-white tw:shadow-[0_12px_30px_rgba(16,185,129,.35),0_4px_12px_rgba(0,0,0,.28)] tw:[transition:transform_.2s_ease,box-shadow_.2s_ease] tw:[&:hover]:text-white tw:[&:hover]:[transform:translateY(-3px)_scale(1.04)] tw:[&:hover]:shadow-[0_16px_34px_rgba(16,185,129,.45),0_5px_14px_rgba(0,0,0,.3)] tw:[@media(max-width:640px)]:w-[3.25rem] tw:[@media(max-width:640px)]:h-[3.25rem]" to="/add" aria-label="Añadir inversión" title="Añadir inversión">
            <PlusCircle size={25} strokeWidth={2.4} />
        </Link>
    </div>;
}
