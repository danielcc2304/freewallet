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
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
    A: new Set(['href', 'target', 'rel']),
    IMG: new Set(['src', 'alt', 'title']),
};

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function isSafeUrl(value: string): boolean {
    try {
        const url = new URL(value, 'https://freewallet.local');
        return SAFE_URL_PROTOCOLS.has(url.protocol);
    } catch {
        return false;
    }
}

function sanitizeNode(parent: Node): void {
    Array.from(parent.childNodes).forEach((node) => {
        if (node.nodeType === Node.COMMENT_NODE) {
            node.remove();
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        const element = node as HTMLElement;
        const tagName = element.tagName.toUpperCase();

        if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'IFRAME' || tagName === 'OBJECT') {
            element.remove();
            return;
        }

        if (!ALLOWED_TAGS.has(tagName)) {
            const fragment = document.createDocumentFragment();
            while (element.firstChild) {
                fragment.appendChild(element.firstChild);
            }
            element.replaceWith(fragment);
            sanitizeNode(fragment);
            return;
        }

        const allowedAttributes = ALLOWED_ATTRIBUTES[tagName] ?? new Set<string>();
        Array.from(element.attributes).forEach((attribute) => {
            if (!allowedAttributes.has(attribute.name.toLowerCase())) {
                element.removeAttribute(attribute.name);
            }
        });

        if (tagName === 'A') {
            const href = element.getAttribute('href');
            if (!href || !isSafeUrl(href)) {
                element.removeAttribute('href');
                element.removeAttribute('target');
                element.removeAttribute('rel');
            } else if (element.getAttribute('target') === '_blank') {
                element.setAttribute('rel', 'noopener noreferrer');
            }
        }

        if (tagName === 'IMG') {
            const src = element.getAttribute('src');
            if (!src || !isSafeUrl(src)) {
                element.remove();
                return;
            }
        }

        sanitizeNode(element);
    });
}

export function sanitizeNewsHtml(html: string): string {
    if (typeof document === 'undefined') {
        return html;
    }

    const template = document.createElement('template');
    template.innerHTML = html;
    sanitizeNode(template.content);
    return template.innerHTML;
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

