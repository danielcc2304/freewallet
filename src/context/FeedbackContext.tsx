import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { FeedbackToast } from '../components/ui/FeedbackToast';
import type { FeedbackTone } from '../components/ui/FeedbackToast';

interface FeedbackValue {
    notify: (text: string, tone?: FeedbackTone) => void;
    clearNotice: () => void;
}
// eslint-disable-next-line react-refresh/only-export-components
export const FeedbackContext = createContext<FeedbackValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
    const [notice, setNotice] = useState<{ text: string; tone: FeedbackTone } | null>(null);
    const notify = useCallback((text: string, tone: FeedbackTone = 'success') => setNotice({ text, tone }), []);
    const clearNotice = useCallback(() => setNotice(null), []);
    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => setNotice(null), notice.tone === 'success' ? 4200 : 6500);
        return () => window.clearTimeout(timer);
    }, [notice]);
    return <FeedbackContext.Provider value={{ notify, clearNotice }}>
        {children}
        {notice && <FeedbackToast tone={notice.tone}>{notice.text}</FeedbackToast>}
    </FeedbackContext.Provider>;
}
