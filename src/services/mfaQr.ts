/** Normalize SDK/raw SVG without double-encoding its data URL. No external URLs. */
export function mfaQrImage(source: string): string {
    const value = source.trim();
    if (value.startsWith('data:image/svg+xml;base64,')) return value;
    const prefix = /^data:image\/svg\+xml(?:;utf-8|;charset=utf-8)?,/i;
    const svg = value.replace(prefix, '');
    // SVGo (used by Supabase Auth) prefixes SVG with XML and a generator comment.
    const decoded = (svg.startsWith('<') ? svg : decodeURIComponent(svg)).trim()
        .replace(/^(?:(?:<\?xml[^>]*\?>|<!--[\s\S]*?-->)\s*)+/i, '');
    if (!/^<svg[\s>]/i.test(decoded)) {
        throw new Error('No se pudo mostrar el QR. Usa la clave de configuración manual.');
    }
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(decoded)}`;
}

/** Encode the enrollment URI locally as PNG. Nothing is sent to a QR service. */
export async function createMfaQrImage(source: string, uri: string): Promise<string> {
    const parsed=new URL(uri);
    if(parsed.protocol!=='otpauth:' || parsed.hostname!=='totp' || !parsed.searchParams.get('secret')) {
        throw new Error('La configuración del autenticador no contiene una URI TOTP válida.');
    }
    try {
        const {default:QRCode}=await import('qrcode');
        return await QRCode.toDataURL(uri,{width:248,margin:4,errorCorrectionLevel:'M',color:{dark:'#000000',light:'#ffffff'}});
    } catch {
        return mfaQrImage(source);
    }
}
