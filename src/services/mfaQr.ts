/** Normalize SDK/raw SVG without double-encoding its data URL. No external URLs. */
export function mfaQrImage(source: string): string {
    const value = source.trim();
    if (value.startsWith('data:image/svg+xml;base64,')) return value;
    const prefix = /^data:image\/svg\+xml(?:;utf-8|;charset=utf-8)?,/i;
    const svg = value.replace(prefix, '');
    const decoded = (svg.startsWith('<') ? svg : decodeURIComponent(svg)).trim();
    if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(decoded)) {
        throw new Error('No se pudo mostrar el QR. Usa la clave de configuración manual.');
    }
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(decoded)}`;
}
