import { LoaderCircle, ShieldCheck } from 'lucide-react';

export function AccountConnectionState() {
    return <main className="account-connection tw:min-h-dvh tw:grid tw:place-items-center tw:p-[max(1.25rem,env(safe-area-inset-top))_1.25rem_max(1.25rem,env(safe-area-inset-bottom))] tw:ui-fill-canvas" aria-busy="true">
        <section className="account-connection__card tw:ui-stack tw:items-center tw:w-[min(100%,400px)] tw:p-[2rem_1.5rem] tw:text-center tw:ui-fill-panel tw:ui-border tw:rounded-dialog tw:shadow-ui-sm" role="status" aria-live="polite">
            <div className="account-connection__icon tw:grid tw:place-items-center tw:size-[56px] tw:mb-[1rem] tw:rounded-panel tw:[background:rgba(var(--accent-rgb),.1)] tw:text-accent" aria-hidden="true"><ShieldCheck size={28} /></div>
            <span className="account-connection__brand tw:text-secondary tw:text-[.875rem] tw:font-semibold">FreeWallet</span>
            <h1 className="tw:m-[.5rem_0] tw:text-[1.25rem] tw:[line-height:1.4] tw:text-main">Preparando tu cuenta</h1>
            <p className="tw:text-[.875rem] tw:[line-height:1.6] tw:text-secondary">Comprobando el acceso y cargando tu cartera.</p>
            <LoaderCircle className="account-connection__spinner tw:mt-[1.25rem] tw:text-accent tw:animate-ui-spinner tw:[animation-duration:1s] tw:motion-reduce:animate-none" size={22} aria-hidden="true" />
        </section>
    </main>;
}
