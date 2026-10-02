import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from '../../context/AccountContext';
import { localPortfolioSummary } from '../../services/localPortfolioSummary';
import { Button } from './Button';
import { Modal } from './Modal';
import './LocalPortfolioPrompt.css';

export function LocalPortfolioPrompt() {
    const account = useAccount();
    const location = useLocation();
    const navigate = useNavigate();
    const [local] = useState(localPortfolioSummary);
    const [dismissed, setDismissed] = useState(false);
    const open = !!account.user && !account.recovery && account.sync.status === 'empty'
        && local.found && !dismissed && location.pathname !== '/account';
    return <Modal isOpen={open} onClose={() => setDismissed(true)} title="Tu cartera sigue en este dispositivo" size="sm">
        <div className="local-portfolio-prompt">
        <p>Has iniciado sesión, pero tu cuenta todavía está vacía. La cartera que usabas antes sigue guardada en este navegador: no se ha borrado.</p>
        <p>Para verla en tu cuenta y en otros dispositivos, revisa los datos y confirma que quieres importarlos.</p>
        <Button fullWidth onClick={() => { setDismissed(true); navigate('/account'); }}>Revisar e importar mi cartera</Button>
        <Button fullWidth variant="secondary" onClick={() => setDismissed(true)}>Ahora no</Button>
        <p>Si eliges «Ahora no», no se subirá nada. Podrás importarla después en Mi cuenta.</p>
        </div>
    </Modal>;
}
