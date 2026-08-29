import { useEffect, useRef, type ReactNode } from 'react';
import {
    Bold,
    Code,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Strikethrough,
    Underline,
} from 'lucide-react';
import { sanitizeNewsHtml } from '../../../utils/newsContent';
import './RichTextEditor.css';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

type ToolbarCommand = 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'insertUnorderedList' | 'insertOrderedList' | 'formatBlock' | 'createLink';

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Escribe el contenido de tu noticia…',
    disabled = false,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        const current = sanitizeNewsHtml(editor.innerHTML);
        const next = sanitizeNewsHtml(value);
        if (current !== next) {
            editor.innerHTML = next;
        }
    }, [value]);

    const emitChange = () => {
        onChange(editorRef.current?.innerHTML ?? '');
    };

    const runCommand = (command: ToolbarCommand, commandValue?: string) => {
        if (disabled) {
            return;
        }

        editorRef.current?.focus();
        document.execCommand(command, false, commandValue);
        emitChange();
    };

    const addLink = () => {
        if (disabled) {
            return;
        }

        const href = window.prompt('Enlace', 'https://');
        if (!href?.trim()) {
            return;
        }

        try {
            const parsed = new URL(href.trim());
            if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
                window.alert('Introduce un enlace http(s) válido.');
                return;
            }
        } catch {
            window.alert('Introduce un enlace válido.');
            return;
        }

        runCommand('createLink', href.trim());
    };

    return (
        <div className={`rich-text-editor ${disabled ? 'rich-text-editor--disabled' : ''}`}>
            <div className="rich-text-editor__toolbar" aria-label="Formato del texto">
                <select
                    className="rich-text-editor__format"
                    aria-label="Tipo de bloque"
                    defaultValue="p"
                    disabled={disabled}
                    onChange={(event) => runCommand('formatBlock', `<${event.target.value}>`)}
                >
                    <option value="p">Párrafo</option>
                    <option value="h2">Título 2</option>
                    <option value="h3">Título 3</option>
                    <option value="blockquote">Cita</option>
                </select>

                <span className="rich-text-editor__separator" aria-hidden="true" />

                <ToolbarButton label="Negrita" onClick={() => runCommand('bold')}>
                    <Bold size={16} />
                </ToolbarButton>
                <ToolbarButton label="Cursiva" onClick={() => runCommand('italic')}>
                    <Italic size={16} />
                </ToolbarButton>
                <ToolbarButton label="Subrayado" onClick={() => runCommand('underline')}>
                    <Underline size={16} />
                </ToolbarButton>
                <ToolbarButton label="Tachado" onClick={() => runCommand('strikeThrough')}>
                    <Strikethrough size={16} />
                </ToolbarButton>

                <span className="rich-text-editor__separator" aria-hidden="true" />

                <ToolbarButton label="Lista con viñetas" onClick={() => runCommand('insertUnorderedList')}>
                    <List size={16} />
                </ToolbarButton>
                <ToolbarButton label="Lista numerada" onClick={() => runCommand('insertOrderedList')}>
                    <ListOrdered size={16} />
                </ToolbarButton>
                <ToolbarButton label="Cita" onClick={() => runCommand('formatBlock', '<blockquote>')}>
                    <Quote size={16} />
                </ToolbarButton>
                <ToolbarButton label="Código" onClick={() => runCommand('formatBlock', '<pre>')}>
                    <Code size={16} />
                </ToolbarButton>
                <ToolbarButton label="Añadir enlace" onClick={addLink}>
                    <LinkIcon size={16} />
                </ToolbarButton>
            </div>

            <div
                ref={editorRef}
                className="rich-text-editor__surface"
                contentEditable={!disabled}
                data-placeholder={placeholder}
                role="textbox"
                aria-multiline="true"
                aria-label="Contenido de la noticia"
                suppressContentEditableWarning
                onInput={emitChange}
            />
        </div>
    );
}

interface ToolbarButtonProps {
    label: string;
    onClick: () => void;
    children: ReactNode;
}

function ToolbarButton({ label, onClick, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            className="rich-text-editor__button"
            aria-label={label}
            title={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

