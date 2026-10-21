import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../Button';
import { cn } from '../../../utils/cn';
import { ActionGroup } from '../ActionGroup';

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
        <div className="modal-backdrop tw:fixed tw:inset-0 tw:bg-black/70 tw:backdrop-blur-[4px] tw:flex tw:items-center tw:justify-center tw:z-[1000] tw:p-ui-md tw:animate-ui-backdrop tw:motion-reduce:animate-none tw:max-[640px]:p-3" onClick={handleBackdropClick}>
            <div
                ref={modalRef}
                className={cn(
                    'modal tw:bg-surface tw:border tw:border-line-strong tw:rounded-panel tw:shadow-ui-lg tw:max-h-[90vh] tw:min-w-0 tw:overflow-hidden tw:flex tw:flex-col tw:animate-ui-dialog tw:motion-reduce:animate-none tw:w-full',
                    `modal--${size}`,
                    size === 'sm' && 'tw:max-w-[400px]',
                    size === 'md' && 'tw:max-w-[560px]',
                    size === 'lg' && 'tw:w-[min(960px,calc(100vw-2*var(--spacing-md)))] tw:max-w-[960px]',
                    'tw:max-[640px]:w-full tw:max-[640px]:max-w-full tw:max-[640px]:max-h-[calc(100dvh-1.5rem)]',
                    'tw:[&_:is(button,a):focus-visible]:outline-2 tw:[&_:is(button,a):focus-visible]:outline-accent tw:[&_:is(button,a):focus-visible]:outline-offset-2',
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : 'Información de FreeWallet'}
                tabIndex={-1}
            >
                <div className="modal__header tw:flex tw:items-center tw:justify-between tw:min-w-0 tw:box-border tw:py-ui-md tw:px-ui-lg tw:border-b tw:border-line">
                    {title && <h2 id={titleId} className="modal__title tw:m-0 tw:min-w-0 tw:wrap-anywhere tw:text-lg tw:font-semibold tw:leading-[1.3] tw:text-main">{title}</h2>}
                    <button className="modal__close tw:bg-transparent tw:border-0 tw:text-muted tw:cursor-pointer tw:p-ui-xs tw:rounded-[var(--radius-sm)] tw:transition-colors tw:duration-150 tw:flex tw:items-center tw:justify-center tw:min-w-[44px] tw:min-h-[44px] tw:hover:bg-surface-muted tw:hover:text-main" onClick={onClose} aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>
                <div className={cn('modal__content tw:p-ui-lg tw:overflow-y-auto tw:overflow-x-hidden tw:min-h-0 tw:min-w-0 tw:w-full tw:flex-auto tw:box-border',
                    size === 'lg' && 'tw:h-[min(780px,calc(90vh-76px))] tw:max-[640px]:h-[calc(100dvh-6rem)] tw:max-[640px]:max-h-[calc(100dvh-6rem)]')}>
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
                <p className="confirm-dialog__message tw:text-secondary tw:mt-0 tw:mb-ui-lg tw:leading-[1.6]">{message}</p>
                <ActionGroup align="end" className="confirm-dialog__actions tw:m-0 tw:gap-ui-md tw:max-[640px]:flex-col-reverse tw:max-[640px]:[&>button]:w-full">
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
                </ActionGroup>
            </div>
        </Modal>
    );
}
