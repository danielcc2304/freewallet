import { LoaderCircle, ShieldCheck } from 'lucide-react';
import './AccountConnectionState.css';

export function AccountConnectionState() {
    return <main className="account-connection" aria-busy="true">
        <section className="account-connection__card" role="status" aria-live="polite">
            <div className="account-connection__icon" aria-hidden="true"><ShieldCheck size={28} /></div>
            <span className="account-connection__brand">FreeWallet</span>
            <h1>Preparando tu cuenta</h1>
            <p>Comprobando el acceso y cargando tu cartera.</p>
            <LoaderCircle className="account-connection__spinner" size={22} aria-hidden="true" />
        </section>
    </main>;
}
