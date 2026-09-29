import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_VERSION } from '../../constants/app';
import { acknowledgeVersion, shouldShowVersionNotice } from '../../services/versionNotice';
import { Modal } from './Modal/Modal';
import { Button } from './Button';
import './VersionNotice.css';

/** Global release notice, persisted per browser and queued behind other dialogs. */
export function VersionNotice() {
    const [pending, setPending] = useState(() => shouldShowVersionNotice(APP_VERSION));
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!pending) return;
        let disposed = false;
        const observer = new MutationObserver(check);
        function check() {
            if (!disposed && !document.querySelector('[role="dialog"]')) {
                observer.disconnect();
                setVisible(true);
            }
        }
        observer.observe(document.body, { childList: true, subtree: true });
        const frame = requestAnimationFrame(check);
        return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); };
    }, [pending]);

    const close = () => {
        acknowledgeVersion(APP_VERSION);
        setVisible(false);
        setPending(false);
    };

    return <Modal isOpen={visible} onClose={close} title={`Nueva versión de ${APP_NAME}`} size="sm">
        <p>Ya está disponible <strong>{APP_NAME} v{APP_VERSION}</strong>.</p>
        <p>Consulta las novedades para conocer las mejoras y correcciones de esta actualización.</p>
        <div className="version-notice__actions">
            <Link className="btn btn--secondary btn--md" to="/feature-log" onClick={close}>Ver novedades</Link>
            <Button onClick={close}>Continuar</Button>
        </div>
    </Modal>;
}
