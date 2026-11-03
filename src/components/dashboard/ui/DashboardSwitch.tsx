import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface DashboardSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: ReactNode;
    appearance?: 'compact' | 'composition';
    subtle?: boolean;
}

export function DashboardSwitch({ checked, onChange, label, appearance = 'compact', subtle = false }: DashboardSwitchProps) {
    if (appearance === 'composition') return <div className="breakdown-toggle">
        <button type="button" className="breakdown-toggle__label tw:ui-row tw:gap-ui-sm tw:cursor-pointer tw:text-secondary tw:ui-border tw:p-[.35rem_.45rem_.35rem_.75rem] tw:rounded-[var(--radius-full)] tw:ui-fill-muted tw:shadow-[inset_0_1px_0_rgba(255,255,255,.08)] tw:[font-family:inherit] tw:[font-size:inherit] tw:[font-weight:inherit] tw:[font-style:inherit] tw:[font-variant:inherit] tw:[line-height:inherit] tw:text-left tw:[transition:color_var(--transition-fast),border-color_var(--transition-fast),background_var(--transition-fast),box-shadow_var(--transition-fast)] tw:[&:hover]:text-main tw:[&:hover]:border-line-strong tw:[&:hover]:[background:var(--bg-card-hover)] tw:focus-visible:[outline:2px_solid_var(--accent-primary)] tw:focus-visible:outline-offset-[3px]" aria-pressed={checked} onClick={() => onChange(!checked)}>
            <span>{label}</span>
            <span className={cn('breakdown-toggle__slider tw:shrink-0 tw:relative tw:w-[44px] tw:h-[24px] tw:rounded-[var(--radius-full)] tw:[transition:background_var(--transition-fast),border-color_var(--transition-fast),box-shadow_var(--transition-fast)] tw:before:content-[\'\'] tw:before:absolute tw:before:top-[3px] tw:before:left-[3px] tw:before:w-[18px] tw:before:h-[18px] tw:before:[border:1px_solid_rgba(255,255,255,.4)] tw:before:rounded-[50%] tw:before:shadow-[0_2px_5px_rgba(0,0,0,.2),inset_0_1px_0_rgba(255,255,255,.4)] tw:before:[transition:transform_var(--transition-fast),background_var(--transition-fast),box-shadow_var(--transition-fast)]', checked
                ? 'tw:[background:var(--accent-primary)] tw:[border:1px_solid_var(--border-accent)] tw:shadow-[inset_0_1px_3px_rgba(0,0,0,.16),0_0_0_2px_rgba(16,185,129,.08)] tw:before:translate-x-[20px] tw:before:bg-white'
                : 'tw:ui-border-strong tw:[background:rgba(127,143,158,.2)] tw:shadow-[inset_0_1px_3px_rgba(0,0,0,.18)] tw:before:[background:var(--text-muted)]')} />
        </button>
    </div>;
    return <label className={cn('portfolio-excel-insights__block-toggle tw:relative tw:ui-row tw:gap-[10px] tw:min-h-[44px] tw:m-[8px_0] tw:cursor-pointer', subtle && 'is-subtle tw:text-[12px] tw:text-muted tw:m-0')}>
        <input className="tw:absolute tw:w-[36px] tw:h-[20px] tw:opacity-0 tw:[&:focus-visible+span]:[outline:2px_solid_var(--text-primary)] tw:[&:focus-visible+span]:outline-offset-[3px]" type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)} />
        <span className={cn('portfolio-excel-insights__switch-track tw:inline-flex tw:items-center tw:w-[36px] tw:h-[20px] tw:shrink-0 tw:p-[3px] tw:box-border tw:rounded-[20px] tw:[transition:background_150ms] tw:[@media(prefers-reduced-motion:reduce)]:transition-none', checked ? 'tw:[background:#10b981]' : 'tw:[background:#64748b]')} aria-hidden="true">
            <span className={cn('tw:w-[14px] tw:h-[14px] tw:rounded-[50%] tw:bg-white tw:shadow-[0_1px_3px_#0003] tw:[transition:transform_150ms] tw:[@media(prefers-reduced-motion:reduce)]:transition-none', checked && 'tw:translate-x-[16px]')} />
        </span><span>{label}</span>
    </label>;
}
