import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type AppearanceMode = 'standard' | 'liquid-glass';

interface AppearanceContextValue {
    appearance: AppearanceMode;
    setAppearance: (appearance: AppearanceMode) => void;
    isLiquidGlass: boolean;
}

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);
const APPEARANCE_STORAGE_KEY = 'freewallet_appearance_mode';
const LIQUID_GLASS_POINTER_TARGETS = [
    '.btn',
    '.sidebar__link',
    '.sidebar__toggle',
    '.dashboard__floating-add',
    '.dashboard__floating-refresh',
    '.portfolio-summary__tabs',
    '.portfolio-summary__tab',
    '.portfolio-excel-insights__tabs',
    '.portfolio-excel-insights__periods',
    '.market-heatmap__tabs',
    '.market-heatmap__display-options',
    '.market-heatmap__tab',
    '.market-heatmap__display-option',
    '.theme-option',
    '.appearance-option',
    '.settings__toggle',
    '.period-btn',
    '.filter-chip',
].join(',');

function readStoredAppearance(): AppearanceMode {
    if (typeof window === 'undefined') return 'liquid-glass';

    try {
        const stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
        if (stored === 'standard' || stored === 'liquid-glass') return stored;
    } catch {
        // Ignore storage access errors so the appearance never blocks the app.
    }

    return 'liquid-glass';
}

function persistAppearance(appearance: AppearanceMode): void {
    try {
        window.localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
    } catch {
        // Ignore storage access errors; the preference still applies for this session.
    }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
    const [appearance, setAppearanceState] = useState<AppearanceMode>(readStoredAppearance);

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-appearance', appearance);
    }, [appearance]);

    useEffect(() => {
        if (appearance !== 'liquid-glass') return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let animationFrame = 0;
        const updateHighlight = (element: HTMLElement, clientX: number, clientY: number) => {
            const bounds = element.getBoundingClientRect();
            element.style.setProperty('--glass-pointer-x', `${clientX - bounds.left}px`);
            element.style.setProperty('--glass-pointer-y', `${clientY - bounds.top}px`);
        };

        const handlePointerMove = (event: PointerEvent) => {
            const source = event.target;
            if (!(source instanceof Element)) return;

            window.cancelAnimationFrame(animationFrame);
            animationFrame = window.requestAnimationFrame(() => {
                const control = source.closest<HTMLElement>(LIQUID_GLASS_POINTER_TARGETS);
                const sidebar = source.closest<HTMLElement>('.sidebar');

                if (control) updateHighlight(control, event.clientX, event.clientY);
                if (sidebar && sidebar !== control) updateHighlight(sidebar, event.clientX, event.clientY);
            });
        };

        document.addEventListener('pointermove', handlePointerMove, { passive: true });
        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            window.cancelAnimationFrame(animationFrame);
        };
    }, [appearance]);

    const setAppearance = useCallback((nextAppearance: AppearanceMode) => {
        setAppearanceState(nextAppearance);
        persistAppearance(nextAppearance);
    }, []);

    return (
        <AppearanceContext.Provider value={{
            appearance,
            setAppearance,
            isLiquidGlass: appearance === 'liquid-glass',
        }}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (context === undefined) {
        throw new Error('useAppearance must be used within an AppearanceProvider');
    }
    return context;
}
