import { Search, Wallet } from 'lucide-react';
import { cn } from '../../utils/cn';

type EntryMode = 'asset' | 'cash';
interface InvestmentEntryModeProps {
    value: EntryMode;
    onChange: (mode: EntryMode) => void;
    disabled?: boolean;
}

/** One compact choice for both entry paths; clicking the active mode preserves the draft. */
export function InvestmentEntryMode({ value, onChange, disabled }: InvestmentEntryModeProps) {
    return (
        <div
            role="group"
            aria-label="Qué quieres añadir"
            className="investment-entry-mode tw:grid tw:grid-cols-2 tw:gap-1 tw:min-w-0 tw:p-1 tw:rounded-[14px] tw:ui-border tw:ui-fill-muted tw:glass:[background:var(--glass-regular)]"
        >
            {(
                [
                    { value: 'asset', label: 'Inversión', icon: Search },
                    { value: 'cash', label: 'Efectivo', icon: Wallet },
                ] as const
            ).map(({ value: mode, label, icon: Icon }) => (
                <button
                    key={mode}
                    type="button"
                    data-entry-mode={mode}
                    aria-pressed={value === mode}
                    disabled={disabled}
                    onClick={() => {
                        if (mode !== value) onChange(mode);
                    }}
                    className={cn(
                        'tw:ui-row tw:justify-center tw:gap-2 tw:min-w-0 tw:min-h-[48px] tw:p-[.65rem_.5rem] tw:rounded-[10px] tw:border tw:border-solid tw:border-transparent tw:[font-family:inherit] tw:text-[length:var(--font-size-sm)] tw:font-semibold tw:cursor-pointer tw:[&:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&:focus-visible]:outline-offset-2 tw:disabled:opacity-50 tw:disabled:cursor-not-allowed',
                        value === mode
                            ? 'tw:ui-fill-surface tw:text-accent tw:border-[color:var(--border-accent)] tw:shadow-ui-sm tw:glass:[background:var(--glass-content)]'
                            : 'tw:ui-fill-transparent tw:text-secondary tw:hover:text-main tw:hover:ui-fill-surface',
                    )}
                >
                    <Icon size={18} aria-hidden="true" className="tw:shrink-0" />
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
