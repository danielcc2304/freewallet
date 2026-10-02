import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { createPortal } from 'react-dom';
import './FeedbackToast.css';

export type FeedbackTone = 'error' | 'success' | 'info';

export function FeedbackToast({ children, tone }: { children: string; tone: FeedbackTone }) {
    const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
    return createPortal(
        <div className={`feedback-toast feedback-toast--${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-atomic="true">
            <Icon size={17} aria-hidden="true" />
            <span>{children}</span>
        </div>,
        document.body,
    );
}
