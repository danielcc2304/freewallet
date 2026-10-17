import DOMPurify from 'dompurify';

const ALLOWED_TAGS = new Set([
    'P',
    'BR',
    'STRONG',
    'B',
    'EM',
    'I',
    'U',
    'S',
    'H2',
    'H3',
    'UL',
    'OL',
    'LI',
    'BLOCKQUOTE',
    'A',
    'HR',
    'CODE',
    'PRE',
    'IMG',
    'SPAN',
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
    A: new Set(['href', 'target', 'rel']),
    IMG: new Set(['src', 'alt', 'title']),
    SPAN: new Set(['style']),
};

const ALLOWED_FONT_SIZES = new Set(['0.875rem', '1rem', '1.125rem', '1.35rem']);

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function isSafeUrl(value: string): boolean {
    if (!value.trim()) return false;
    try {
        const url = new URL(value, 'https://freewallet.local');
        return SAFE_URL_PROTOCOLS.has(url.protocol);
    } catch {
        return false;
    }
}

/**
 * Normalises a link entered from the editor and rejects protocols that can
 * execute code in the public article view.
 */
export function getSafeNewsLinkUrl(value: string): string | null {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return null;
    }

    const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;

    try {
        const url = new URL(candidate);
        return SAFE_URL_PROTOCOLS.has(url.protocol) ? url.toString() : null;
    } catch {
        return null;
    }
}

/** Sanitize the complete tree before unwrapping or normalizing any node.
 * The maintained parser handles nested/malformed HTML; our pass only narrows
 * per-element formatting and URL rules, never reintroduces unsanitized nodes.
 */
export function sanitizeNewsHtml(html: string): string {
    if (typeof document === 'undefined') return '';
    const fragment = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [...ALLOWED_TAGS].map(tag => tag.toLowerCase()),
        ALLOWED_ATTR: [...new Set(Object.values(ALLOWED_ATTRIBUTES).flatMap(attrs => [...attrs]))],
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: false,
        RETURN_DOM_FRAGMENT: true,
    });
    for (const element of fragment.querySelectorAll<HTMLElement>('*')) {
        const tag = element.tagName.toUpperCase();
        const allowed = ALLOWED_ATTRIBUTES[tag] ?? new Set<string>();
        for (const attribute of [...element.attributes]) {
            if (!allowed.has(attribute.name.toLowerCase())) element.removeAttribute(attribute.name);
        }
        if (tag === 'A') {
            if (!isSafeUrl(element.getAttribute('href') ?? '')) {
                element.removeAttribute('href'); element.removeAttribute('target'); element.removeAttribute('rel');
            } else if (element.getAttribute('target') === '_blank') {
                element.setAttribute('rel', 'noopener noreferrer');
            }
        }
        if (tag === 'IMG' && !getSafeNewsImageUrl(element.getAttribute('src'))) element.remove();
        if (tag === 'SPAN') {
            const size = element.style.fontSize.trim().toLowerCase();
            if (ALLOWED_FONT_SIZES.has(size)) element.setAttribute('style', `font-size: ${size}`);
            else element.replaceWith(...element.childNodes);
        }
    }
    const container = document.createElement('template');
    container.content.append(fragment);
    return container.innerHTML;
}

export function getNewsTextExcerpt(html: string, maxLength = 180): string {
    if (typeof document === 'undefined') {
        return html.replace(/<[^>]*>/g, '').slice(0, maxLength).trim();
    }

    const template = document.createElement('template');
    template.innerHTML = sanitizeNewsHtml(html);
    const text = template.content.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
}

export function getSafeNewsImageUrl(value: string | null | undefined): string | null {
    const trimmedValue = value?.trim();
    if (!trimmedValue) {
        return null;
    }

    try {
        const url = new URL(trimmedValue);
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
    } catch {
        return null;
    }
}

export function slugifyNewsTitle(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90);
}

