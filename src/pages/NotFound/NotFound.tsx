import { FileSearch, Home, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { ActionGroup } from '../../components/ui/ActionGroup';

const action = 'not-found__button tw:inline-flex tw:items-center tw:justify-center tw:gap-[.75rem] tw:p-[1rem_2rem] tw:rounded-[12px] tw:font-semibold tw:cursor-pointer tw:transition-all tw:duration-200 tw:ease-[ease] tw:no-underline tw:motion-reduce:transition-none';

export function NotFound() {
    const navigate = useNavigate();
    return (
        <div className="not-found tw:flex tw:items-center tw:justify-center tw:min-h-[70vh] tw:p-[2rem]">
            <div className="not-found__container tw:max-w-[500px] tw:text-center tw:ui-fill-surface tw:p-[3.5rem] tw:rounded-[24px] tw:ui-border-default tw:shadow-(--shadow-xl)">
                <div className="not-found__icon tw:size-[120px] tw:[background:rgba(59,130,246,.1)] tw:text-[#3b82f6] tw:rounded-[50%] tw:flex tw:items-center tw:justify-center tw:m-[0_auto_2rem] tw:animate-ui-not-found tw:motion-reduce:animate-none">
                    <FileSearch size={64} />
                </div>
                <h1 className="not-found__title tw:text-[length:3rem] tw:font-extrabold tw:text-main tw:mb-[.5rem]">404</h1>
                <h2 className="not-found__subtitle tw:text-[length:1.5rem] tw:font-semibold tw:text-main tw:mb-[1rem]">Página no encontrada</h2>
                <p className="not-found__description tw:text-[length:1.125rem] tw:text-secondary tw:[line-height:1.6] tw:mb-[2.5rem]">
                    Lo sentimos, la página que estás buscando no existe o ha sido movida a una nueva ubicación.
                </p>
                <ActionGroup className="not-found__actions tw:m-0 tw:flex-col tw:flex-nowrap tw:gap-[1rem]">
                    <Link to="/" className={cn(action, 'not-found__button--primary tw:[background:var(--accent-primary)] tw:text-white tw:[border:none] tw:hover:[transform:translateY(-2px)] tw:hover:[background:var(--accent-secondary)] tw:hover:shadow-[0_4px_12px_rgba(var(--accent-rgb),.3)]')}>
                        <Home size={18} />Ir al Inicio
                    </Link>
                    <button className={cn(action, 'not-found__button--secondary tw:ui-fill-muted tw:text-main tw:ui-border-default tw:hover:ui-fill-surface tw:hover:border-accent')} onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />Volver atrás
                    </button>
                </ActionGroup>
            </div>
        </div>
    );
}
export default NotFound;
