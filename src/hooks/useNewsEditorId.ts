import { useEffect, useState } from 'react';
import { getAppSupabaseClient, isAppBackendConfigured } from '../services/supabaseClient';
import { isCurrentUserNewsAdmin } from '../services/newsService';

/** Editorial access also works when portfolio cloud sync is disabled. */
export function useNewsEditorId(): string | null {
    const [editorId, setEditorId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAppBackendConfigured) return;
        let active = true;
        let sequence = 0;
        let unsubscribe: (() => void) | undefined;

        void getAppSupabaseClient().then(client => {
            if (!active) return;
            const subscription = client.auth.onAuthStateChange((_event, session) => {
                const request = ++sequence;
                setEditorId(null);
                if (!session) return;
                // Auth calls must run outside the auth event callback's lock.
                window.setTimeout(() => {
                    if (!active || request !== sequence) return;
                    void Promise.all([client.auth.getUser(), isCurrentUserNewsAdmin()])
                        .then(([identity, isEditor]) => {
                            if (active && request === sequence && !identity.error && isEditor
                                && identity.data.user?.id === session.user.id) {
                                setEditorId(identity.data.user.id);
                            }
                        }).catch(() => { /* Reading the article remains available without an edit shortcut. */ });
                }, 0);
            });
            unsubscribe = () => subscription.data.subscription.unsubscribe();
        }).catch(() => { /* An unavailable session must not expose editorial controls. */ });

        return () => {
            active = false;
            sequence++;
            unsubscribe?.();
        };
    }, []);

    return editorId;
}
