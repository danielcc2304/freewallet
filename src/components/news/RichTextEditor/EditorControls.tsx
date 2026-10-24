import type {
    ReactNode,
    HTMLAttributes,
    FormHTMLAttributes,
    SelectHTMLAttributes,
    ButtonHTMLAttributes,
    ComponentPropsWithRef,
} from 'react';
import { cn } from '../../../utils/cn';
import { editorControlStyle as s } from './EditorControls.styles';
interface ToolbarButtonProps {
    label: string;
    shortcut?: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}

export function ToolbarButton({
    label,
    shortcut,
    active = false,
    disabled = false,
    onClick,
    children,
}: ToolbarButtonProps) {
    const title = shortcut ? `${label} (${shortcut})` : label;

    return (
        <button
            type="button"
            className={cn(s('rich-text-editor__button'), active && s('rich-text-editor__button--active'))}
            aria-label={label}
            aria-pressed={active}
            title={title}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export function ToolbarDivider() {
    return <span className={s('rich-text-editor__separator')} aria-hidden="true" />;
}

export function EditorToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('rich-text-editor__toolbar'), className)} />;
}
export function EditorToolbarGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('rich-text-editor__group'), className)} />;
}
export function EditorFormatSelect({
    fontSize,
    className,
    ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { fontSize?: boolean }) {
    return (
        <select
            {...props}
            className={cn(
                s('rich-text-editor__format'),
                fontSize && s('rich-text-editor__format--font-size'),
                className,
            )}
        />
    );
}
export function EditorLinkPanel({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
    return <form {...props} className={cn(s('rich-text-editor__link-panel'), className)} />;
}
export function EditorLinkFields({
    url,
    text,
}: {
    url: ComponentPropsWithRef<'input'>;
    text: ComponentPropsWithRef<'input'>;
}) {
    return (
        <div className={s('rich-text-editor__link-fields')}>
            <label htmlFor={url.id}>URL</label>
            <input {...url} />
            <label htmlFor={text.id}>Texto visible</label>
            <input {...text} />
        </div>
    );
}
export function EditorLinkActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('rich-text-editor__link-actions'), className)} />;
}
export function EditorLinkButton({
    tone = 'default',
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'default' | 'primary' | 'danger' | 'close' }) {
    return (
        <button
            {...props}
            className={cn(
                tone === 'close' ? s('rich-text-editor__link-close') : s('rich-text-editor__link-button'),
                tone === 'primary' && s('rich-text-editor__link-button--primary'),
                tone === 'danger' && s('rich-text-editor__link-button--danger'),
                className,
            )}
        />
    );
}
