import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

export type FeedbackTone = 'error' | 'success' | 'info';
const tones = {
    error: 'feedback-toast--error tw:[border:1px_solid_rgba(239,68,68,.3)] tw:[background:var(--color-negative-bg)] tw:text-negative',
    success: 'feedback-toast--success tw:[border:1px_solid_rgba(34,197,94,.3)] tw:[background:var(--color-positive-bg)] tw:text-positive',
    info: 'feedback-toast--info tw:ui-border-default tw:ui-fill-surface tw:text-main',
} as const;

export function FeedbackToast({ children, tone }: { children: string; tone: FeedbackTone }) {
    const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
    return createPortal(
        <div className={cn('feedback-toast tw:fixed tw:z-[1100] tw:top-[max(1rem,env(safe-area-inset-top))] tw:right-[max(1rem,env(safe-area-inset-right))] tw:flex tw:items-start tw:gap-ui-sm tw:w-max tw:max-w-[min(440px,calc(100vw-2rem))] tw:box-border tw:p-[.75rem_.9rem] tw:rounded-control tw:shadow-ui-md tw:text-[length:var(--font-size-sm)] tw:font-semibold tw:animate-ui-feedback tw:motion-reduce:animate-none', tones[tone])} role={tone === 'error' ? 'alert' : 'status'} aria-atomic="true">
            <Icon className="tw:shrink-0 tw:mt-[2px]" size={17} aria-hidden="true" />
            <span className="tw:text-inherit tw:min-w-0 tw:wrap-anywhere">{children}</span>
        </div>,
        document.body,
    );
}
