import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../Button';
import './Modal.css';

let openModals = 0;
let previousBodyOverflow = '';
const modalStack: HTMLElement[] = [];

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const closeFromKeyboard = useEffectEvent(() => onClose());

    // Close on escape key
    useEffect(() => {
        if (!isOpen) return;
        const dialog = modalRef.current;
        if (!dialog) return;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const root = document.getElementById('root');
        const focusable = () => [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(e => e.getClientRects().length > 0);
        modalStack.push(dialog);
        if (root) root.inert = true;
        (focusable()[0] || dialog).focus();
        const handleEscape = (e: KeyboardEvent) => {
            if (modalStack.at(-1) !== dialog) return;
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeFromKeyboard(); }
            if (e.key === 'Tab') {
                const nodes = focusable();
                const first = nodes[0] || dialog;
                const last = nodes.at(-1) || dialog;
                if (!dialog.contains(document.activeElement) || (e.shiftKey && document.activeElement === first)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };

        document.addEventListener('keydown', handleEscape);
        if (openModals++ === 0) previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            const index = modalStack.indexOf(dialog);
            if (index >= 0) modalStack.splice(index, 1);
            if (root && !modalStack.length) root.inert = false;
            if (--openModals === 0) document.body.style.overflow = previousBodyOverflow;
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [isOpen]);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div
                ref={modalRef}
                className={`modal modal--${size}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : 'Información de FreeWallet'}
                tabIndex={-1}
            >
                <div className="modal__header">
                    {title && <h2 id={titleId} className="modal__title">{title}</h2>}
                    <button className="modal__close" onClick={onClose} aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>
                <div className="modal__content">
                    {children}
                </div>
            </div>
        </div>, document.body
    );
}

// Confirmation Dialog variant
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="confirm-dialog">
                <p className="confirm-dialog__message">{message}</p>
                <div className="confirm-dialog__actions">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
