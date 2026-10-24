import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { preferenceClass as part } from './preferenceStyles';

interface PreferenceOptionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'title'> {
    appearance: 'theme' | 'interface';
    selected: boolean;
    icon?: ReactNode;
    preview?: 'standard' | 'glass';
    title: ReactNode;
    description?: ReactNode;
}

export function PreferenceOption({ appearance, selected, icon, preview, title, description, className, ...props }: PreferenceOptionProps) {
    const theme = appearance === 'theme';
    return <button {...props} className={cn(part(theme ? 'theme-option' : 'appearance-option'), selected && part(theme ? 'theme-option--active' : 'appearance-option--active'), className)}>
        {theme ? <><div className={part('theme-option__icon')}>{icon}</div><span className={part('theme-option__label')}>{title}</span></> : <>
            <span className={cn(part('appearance-option__visual'), part(preview === 'glass' ? 'appearance-option__visual--glass' : 'appearance-option__visual--standard'))} aria-hidden="true"><span /><span /></span>
            <span className={part('appearance-option__copy')}><strong>{title}</strong><small>{description}</small></span>
        </>}
        {selected && <span className={part(theme ? 'theme-option__check' : 'appearance-option__check')}>✓</span>}
    </button>;
}

export function PreferenceField({ title, description, children }: { title: ReactNode; description: ReactNode; children: ReactNode }) {
    return <div className={part('settings__toggle-card')}><div className={part('settings__toggle-copy')}><div className={part('settings__toggle-title')}>{title}</div><p className="settings__hint">{description}</p></div>{children}</div>;
}

export function PreferenceSwitch({ checked, className, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { checked: boolean }) {
    return <button {...props} className={cn(part('settings__toggle'), checked && part('settings__toggle--active'), className)}><span className={part('settings__toggle-thumb')} aria-hidden="true" /></button>;
}
