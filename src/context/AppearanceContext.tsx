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
    '.card--clickable',
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
    '.period-selector',
    '.period-selector__btn',
    '.filter-chip',
    '.portfolio-csv-btn',
    '.compound__mode-btn',
    '.crisis__tab',
    '.spread-sim__mode-btn',
    '.portfolio-builder__filter-chip',
    '.portfolio-builder__filters-reset',
    '.market-heatmap__floating-refresh',
    '.terms__back-fab',
    '.not-found__button',
    '.fundamentos__eyebrow',
    '.fundamentos__collapse-toggle',
    '.fundamentos__mini-card',
    '.fundamentos__mini-action',
    '.fundamentos__goal-link',
    '.fundamentos__checklist-card',
    '.fundamentos__card',
    '.fundamentos__button',
    '.fundamentos__next-link',
].join(',');

// Keep the selection animation at the interaction layer so every segmented
// control can opt in through its existing active class without duplicating a
// hook or animation state in each module.
const LIQUID_GLASS_SELECTION_TARGETS = [
    '.portfolio-summary__tab',
    '.portfolio-excel-insights__tabs button',
    '.portfolio-excel-insights__periods button',
    '.market-heatmap__tab',
    '.market-heatmap__display-option',
    '.period-selector__btn',
    '.compound__mode-btn',
    '.crisis__tab',
    '.spread-sim__mode-btn',
    '.spread-sim__preset',
    '.spread-sim__stress-btn',
    '.portfolio-builder__filter-chip',
    '.crisis__scenario',
    '.category-chip',
    '.expand-all-btn',
    '.theme-option',
    '.appearance-option',
    '.settings__toggle',
    '.breakdown-toggle__label',
    '.fire__projection-btn',
    '.transactions-page__chip',
    '.rich-text-editor__button',
    '.period-btn',
    '.filter-chip',
].join(',');

const LIQUID_GLASS_SELECTION_CLASS = 'liquid-glass-selection--pulse';

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
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        let animationFrame = 0;
        let pendingPointer: { source: Element; clientX: number; clientY: number } | null = null;
        const updateHighlight = (element: HTMLElement, clientX: number, clientY: number) => {
            const bounds = element.getBoundingClientRect();
            element.style.setProperty('--glass-pointer-x', `${clientX - bounds.left}px`);
            element.style.setProperty('--glass-pointer-y', `${clientY - bounds.top}px`);
        };

        const handlePointerMove = (event: PointerEvent) => {
            if (event.pointerType === 'touch') return;

            const source = event.target;
            if (!(source instanceof Element)) return;

            pendingPointer = { source, clientX: event.clientX, clientY: event.clientY };
            if (animationFrame) return;

            animationFrame = window.requestAnimationFrame(() => {
                animationFrame = 0;
                const pointer = pendingPointer;
                pendingPointer = null;
                if (!pointer) return;

                const control = pointer.source.closest<HTMLElement>(LIQUID_GLASS_POINTER_TARGETS);
                const sidebar = pointer.source.closest<HTMLElement>('.sidebar');

                if (control) updateHighlight(control, pointer.clientX, pointer.clientY);
                if (sidebar && sidebar !== control) updateHighlight(sidebar, pointer.clientX, pointer.clientY);
            });
        };

        document.addEventListener('pointermove', handlePointerMove, { passive: true });
        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            window.cancelAnimationFrame(animationFrame);
        };
    }, [appearance]);

    // Keep the interaction available in both visual modes. The standard mode
    // keeps its own palette while still benefiting from the same fluid change
    // of selection; Liquid Glass additionally supplies the specular sheen.
    useEffect(() => {
        let selectionFrame = 0;
        const selectionTimers = new WeakMap<HTMLElement, number>();
        const handleSelectionClick = (event: MouseEvent) => {
            const source = event.target;
            if (!(source instanceof Element)) return;

            const control = source.closest<HTMLElement>(LIQUID_GLASS_SELECTION_TARGETS);
            if (!control) return;

            window.cancelAnimationFrame(selectionFrame);
            selectionFrame = window.requestAnimationFrame(() => {
                const previousTimer = selectionTimers.get(control);
                if (previousTimer !== undefined) window.clearTimeout(previousTimer);

                // Force a layout boundary before adding the class so repeated
                // clicks on the same control always replay the animation.
                control.classList.remove(LIQUID_GLASS_SELECTION_CLASS);
                void control.offsetWidth;
                control.classList.add(LIQUID_GLASS_SELECTION_CLASS);

                const timer = window.setTimeout(() => {
                    control.classList.remove(LIQUID_GLASS_SELECTION_CLASS);
                    selectionTimers.delete(control);
                }, 760);
                selectionTimers.set(control, timer);
            });
        };

        document.addEventListener('click', handleSelectionClick);
        return () => {
            document.removeEventListener('click', handleSelectionClick);
            window.cancelAnimationFrame(selectionFrame);
        };
    }, []);

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
