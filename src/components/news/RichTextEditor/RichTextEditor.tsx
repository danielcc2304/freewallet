import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import {
    Bold,
    Code,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Minus,
    Quote,
    Redo2,
    RemoveFormatting,
    Strikethrough,
    Underline as UnderlineIcon,
    Undo2,
    Unlink,
    X,
} from 'lucide-react';
import { getSafeNewsLinkUrl, sanitizeNewsHtml } from '../../../utils/newsContent';
import './RichTextEditor.css';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
}

interface TextSelection {
    from: number;
    to: number;
}

const EMPTY_DOCUMENT = '<p></p>';
const FONT_SIZE_OPTIONS = [
    { value: '0.875rem', label: 'Pequeño' },
    { value: '1rem', label: 'Normal' },
    { value: '1.125rem', label: 'Grande' },
    { value: '1.35rem', label: 'Muy grande' },
] as const;
const LINK_ATTRIBUTES = {
    target: '_blank',
    rel: 'noopener noreferrer',
};

function getEditorContent(value: string): string {
    return sanitizeNewsHtml(value) || EMPTY_DOCUMENT;
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Escribe el contenido de tu noticia…',
    disabled = false,
    id,
}: RichTextEditorProps) {
    const generatedId = useId().replace(/:/g, '');
    const editorId = id ?? `news-editor-${generatedId}`;
    const formatId = `${editorId}-format`;
    const fontSizeId = `${editorId}-font-size`;
    const linkUrlId = `${editorId}-link-url`;
    const linkTextId = `${editorId}-link-text`;
    const onChangeRef = useRef(onChange);
    const linkInputRef = useRef<HTMLInputElement>(null);
    const [, setToolbarRevision] = useState(0);
    const [linkPanelOpen, setLinkPanelOpen] = useState(false);
    const [linkSelection, setLinkSelection] = useState<TextSelection | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [linkError, setLinkError] = useState<string | null>(null);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                link: false,
                underline: false,
            }),
            Link.configure({
                openOnClick: false,
                enableClickSelection: true,
                autolink: true,
                linkOnPaste: true,
                isAllowedUri: (url) => Boolean(getSafeNewsLinkUrl(url)),
                shouldAutoLink: (url) => Boolean(getSafeNewsLinkUrl(url)),
                HTMLAttributes: LINK_ATTRIBUTES,
            }),
            TextStyle,
            FontSize.configure({ types: ['textStyle'] }),
            Underline,
            Placeholder.configure({ placeholder }),
        ],
        content: getEditorContent(value),
        editable: !disabled,
        editorProps: {
            attributes: {
                id: editorId,
                class: 'rich-text-editor__surface',
                role: 'textbox',
                'aria-multiline': 'true',
                'aria-label': 'Contenido de la noticia',
                spellcheck: 'true',
            },
        },
        onUpdate: ({ editor: currentEditor }) => {
            onChangeRef.current(currentEditor.isEmpty ? '' : sanitizeNewsHtml(currentEditor.getHTML()));
        },
    }, []);

    useEffect(() => {
        if (!editor) {
            return;
        }

        editor.setEditable(!disabled, false);
    }, [disabled, editor]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const nextContent = sanitizeNewsHtml(value);
        const currentContent = editor.isEmpty ? '' : sanitizeNewsHtml(editor.getHTML());
        if (currentContent !== nextContent) {
            editor.commands.setContent(nextContent || EMPTY_DOCUMENT, { emitUpdate: false });
        }
    }, [editor, value]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const refreshToolbar = () => setToolbarRevision((revision) => revision + 1);
        editor.on('selectionUpdate', refreshToolbar);
        editor.on('transaction', refreshToolbar);
        editor.on('focus', refreshToolbar);
        editor.on('blur', refreshToolbar);

        return () => {
            editor.off('selectionUpdate', refreshToolbar);
            editor.off('transaction', refreshToolbar);
            editor.off('focus', refreshToolbar);
            editor.off('blur', refreshToolbar);
        };
    }, [editor]);

    useEffect(() => {
        if (linkPanelOpen && !disabled) {
            linkInputRef.current?.focus();
        }
    }, [disabled, linkPanelOpen]);

    const currentBlock = editor?.isActive('heading', { level: 2 })
        ? 'h2'
        : editor?.isActive('heading', { level: 3 })
            ? 'h3'
            : editor?.isActive('blockquote')
                ? 'blockquote'
                : editor?.isActive('codeBlock')
                    ? 'codeBlock'
                    : 'p';
    const currentFontSize = editor?.getAttributes('textStyle').fontSize ?? '';
    const selectedFontSize = FONT_SIZE_OPTIONS.some(({ value }) => value === currentFontSize)
        ? currentFontSize
        : '';
    const hasSelectedText = Boolean(
        linkSelection && linkSelection.from !== linkSelection.to,
    );
    const linkIsActive = editor?.isActive('link') ?? false;

    const run = (command: () => boolean) => {
        if (!editor || disabled) {
            return;
        }

        command();
    };

    const changeBlock = (valueToApply: string) => {
        if (!editor || disabled) {
            return;
        }

        const chain = editor.chain().focus();
        if (valueToApply === 'h2') {
            chain.toggleHeading({ level: 2 }).run();
        } else if (valueToApply === 'h3') {
            chain.toggleHeading({ level: 3 }).run();
        } else if (valueToApply === 'blockquote') {
            chain.toggleBlockquote().run();
        } else if (valueToApply === 'codeBlock') {
            chain.toggleCodeBlock().run();
        } else {
            chain.setParagraph().run();
        }
    };

    const changeFontSize = (valueToApply: string) => {
        if (!editor || disabled) {
            return;
        }

        const chain = editor.chain().focus();
        if (valueToApply) {
            chain.setFontSize(valueToApply).run();
        } else {
            chain.unsetFontSize().run();
        }
    };

    const openLinkPanel = () => {
        if (!editor || disabled) {
            return;
        }

        const { from, to } = editor.state.selection;
        setLinkSelection({ from, to });
        setLinkUrl(String(editor.getAttributes('link').href ?? ''));
        setLinkText(editor.state.doc.textBetween(from, to, ' ').trim());
        setLinkError(null);
        setLinkPanelOpen(true);
    };

    const closeLinkPanel = () => {
        setLinkPanelOpen(false);
        setLinkSelection(null);
        setLinkError(null);
    };

    const applyLink = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editor || disabled) {
            return;
        }

        const safeUrl = getSafeNewsLinkUrl(linkUrl);
        if (!safeUrl) {
            setLinkError('Introduce una URL http(s) o mailto válida.');
            return;
        }

        const selection = linkSelection;
        const hasSelection = Boolean(selection && selection.from !== selection.to);
        const chain = editor.chain().focus();
        if (selection) {
            chain.setTextSelection(selection);
        }

        const attributes = { href: safeUrl, ...LINK_ATTRIBUTES };
        if (linkIsActive) {
            chain.extendMarkRange('link').setLink(attributes).run();
        } else if (hasSelection) {
            chain.setLink(attributes).run();
        } else if (linkText.trim()) {
            chain.insertContent({
                type: 'text',
                text: linkText.trim(),
                marks: [{ type: 'link', attrs: attributes }],
            }).run();
        } else {
            setLinkError('Selecciona un texto o escribe el texto visible del enlace.');
            return;
        }

        closeLinkPanel();
    };

    const removeLink = () => {
        if (!editor || disabled) {
            return;
        }

        const chain = editor.chain().focus();
        if (linkSelection) {
            chain.setTextSelection(linkSelection);
        }
        chain.extendMarkRange('link').unsetLink().run();
        closeLinkPanel();
    };

    const clearFormatting = () => {
        if (!editor || disabled) {
            return;
        }

        editor.chain().focus().clearNodes().unsetAllMarks().run();
    };

    return (
        <div className={`rich-text-editor ${disabled ? 'rich-text-editor--disabled' : ''}`}>
            <div className="rich-text-editor__toolbar" role="toolbar" aria-label="Formato del texto">
                <div className="rich-text-editor__group">
                    <label className="rich-text-editor__sr-only" htmlFor={formatId}>Formato de bloque</label>
                    <select
                        id={formatId}
                        className="rich-text-editor__format"
                        aria-label="Tipo de bloque"
                        value={currentBlock}
                        disabled={disabled || !editor}
                        onChange={(event) => changeBlock(event.target.value)}
                    >
                        <option value="p">Párrafo</option>
                        <option value="h2">Título 2</option>
                        <option value="h3">Título 3</option>
                        <option value="blockquote">Cita</option>
                        <option value="codeBlock">Código</option>
                    </select>
                </div>

                <div className="rich-text-editor__group">
                    <label className="rich-text-editor__sr-only" htmlFor={fontSizeId}>Tamaño de letra</label>
                    <select
                        id={fontSizeId}
                        className="rich-text-editor__format rich-text-editor__format--font-size"
                        aria-label="Tamaño de letra"
                        value={selectedFontSize}
                        disabled={disabled || !editor}
                        onChange={(event) => changeFontSize(event.target.value)}
                    >
                        <option value="">Tamaño</option>
                        {FONT_SIZE_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                <ToolbarDivider />

                <div className="rich-text-editor__group" aria-label="Énfasis">
                    <ToolbarButton label="Negrita" shortcut="Ctrl+B" active={editor?.isActive('bold')} disabled={disabled || !editor} onClick={() => run(() => editor?.chain().focus().toggleBold().run() ?? false)}>
                        <Bold size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                    <ToolbarButton label="Cursiva" shortcut="Ctrl+I" active={editor?.isActive('italic')} disabled={disabled || !editor} onClick={() => run(() => editor?.chain().focus().toggleItalic().run() ?? false)}>
                        <Italic size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                    <ToolbarButton label="Subrayado" shortcut="Ctrl+U" active={editor?.isActive('underline')} disabled={disabled || !editor} onClick={() => run(() => editor?.chain().focus().toggleUnderline().run() ?? false)}>
                        <UnderlineIcon size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                    <ToolbarButton label="Tachado" active={editor?.isActive('strike')} disabled={disabled || !editor} onClick={() => run(() => editor?.chain().focus().toggleStrike().run() ?? false)}>
                        <Strikethrough size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                </div>

                <ToolbarDivider />

                <div className="rich-text-editor__group" aria-label="Listas y bloques">
                    <ToolbarButton label="Lista con viñetas" active={editor?.isActive('bulletList')} disabled={disabled || !editor} onClick={() => run(() => editor?.chain().focus().toggleBulletList().run() ?? false)}>
                        <List size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                    <ToolbarButton label="Lista numerada" active={editor?.isActive('orderedList')} disabled={disabled || !editor} onClick={() => run(() => editor?.chain().focus().toggleOrderedList().run() ?? false)}>
                        <ListOrdered size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                    <ToolbarButton label="Cita" active={editor?.isActive('blockquote')} disabled={disabled || !editor} onClick={() => run(() => editor?.chain().focus().toggleBlockquote().run() ?? false)}>
                        <Quote size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                    <ToolbarButton label="Bloque de código" active={editor?.isActive('codeBlock')} disabled={disabled || !editor} onClick={() => run(() => editor?.chain().focus().toggleCodeBlock().run() ?? false)}>
                        <Code size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                    <ToolbarButton label="Separador horizontal" disabled={disabled || !editor} onClick={() => run(() => editor?.chain().focus().setHorizontalRule().run() ?? false)}>
                        <Minus size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                </div>

                <ToolbarDivider />

                <div className="rich-text-editor__group" aria-label="Enlaces y edición">
                    <ToolbarButton label="Añadir o editar enlace" shortcut="Ctrl+K" active={linkIsActive} disabled={disabled || !editor} onClick={openLinkPanel}>
                        <LinkIcon size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                    <ToolbarButton label="Quitar enlace" disabled={disabled || !editor || !linkIsActive} onClick={removeLink}>
                        <Unlink size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                    <ToolbarButton label="Limpiar formato" disabled={disabled || !editor} onClick={clearFormatting}>
                        <RemoveFormatting size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                </div>

                <ToolbarDivider />

                <div className="rich-text-editor__group rich-text-editor__group--history" aria-label="Historial">
                    <ToolbarButton label="Deshacer" shortcut="Ctrl+Z" disabled={disabled || !editor || !editor.can().undo()} onClick={() => run(() => editor?.chain().focus().undo().run() ?? false)}>
                        <Undo2 size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                    <ToolbarButton label="Rehacer" shortcut="Ctrl+Y" disabled={disabled || !editor || !editor.can().redo()} onClick={() => run(() => editor?.chain().focus().redo().run() ?? false)}>
                        <Redo2 size={16} strokeWidth={2.25} />
                    </ToolbarButton>
                </div>
            </div>

            {linkPanelOpen && !disabled && (
                <form
                    className="rich-text-editor__link-panel"
                    aria-label="Configurar enlace"
                    onSubmit={applyLink}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            closeLinkPanel();
                        }
                    }}
                >
                    <div className="rich-text-editor__link-fields">
                        <label htmlFor={linkUrlId}>URL</label>
                        <input
                            ref={linkInputRef}
                            id={linkUrlId}
                            type="text"
                            inputMode="url"
                            value={linkUrl}
                            placeholder="https://ejemplo.com"
                            autoComplete="off"
                            spellCheck={false}
                            onChange={(event) => setLinkUrl(event.target.value)}
                        />
                        <label htmlFor={linkTextId}>Texto visible</label>
                        <input
                            id={linkTextId}
                            type="text"
                            value={linkText}
                            placeholder="Texto del enlace"
                            disabled={hasSelectedText}
                            onChange={(event) => setLinkText(event.target.value)}
                        />
                    </div>
                    <div className="rich-text-editor__link-actions">
                        {linkIsActive && (
                            <button type="button" className="rich-text-editor__link-button rich-text-editor__link-button--danger" onMouseDown={(event) => event.preventDefault()} onClick={removeLink}>
                                <Unlink size={15} />
                                Quitar
                            </button>
                        )}
                        <button type="button" className="rich-text-editor__link-button" onMouseDown={(event) => event.preventDefault()} onClick={closeLinkPanel}>
                            Cancelar
                        </button>
                        <button type="submit" className="rich-text-editor__link-button rich-text-editor__link-button--primary">
                            Aplicar enlace
                        </button>
                        <button type="button" className="rich-text-editor__link-close" aria-label="Cerrar panel de enlace" onMouseDown={(event) => event.preventDefault()} onClick={closeLinkPanel}>
                            <X size={16} />
                        </button>
                    </div>
                    {hasSelectedText && <span className="rich-text-editor__link-hint">Se usará el texto seleccionado.</span>}
                    {linkError && <span className="rich-text-editor__link-error" role="alert">{linkError}</span>}
                </form>
            )}

            <EditorContent editor={editor} className="rich-text-editor__content" />
        </div>
    );
}

interface ToolbarButtonProps {
    label: string;
    shortcut?: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}

function ToolbarButton({ label, shortcut, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
    const title = shortcut ? `${label} (${shortcut})` : label;

    return (
        <button
            type="button"
            className={`rich-text-editor__button ${active ? 'rich-text-editor__button--active' : ''}`}
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

function ToolbarDivider() {
    return <span className="rich-text-editor__separator" aria-hidden="true" />;
}
