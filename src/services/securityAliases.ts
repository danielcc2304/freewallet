/** Verified aliases for the same security, not fuzzy company-name matching.
 * Nextil ISIN is reported in Evercapital's Finect holdings. Yahoo lists the
 * Nueva Expresión Textil equity on DXE/CXE and Frankfurt under these symbols.
 */
const NEXTIL = { isin: 'ES0126962069', name: 'Nueva Expresion Textil SA', chartSymbol: 'B02.F' };
const NEXTIL_SYMBOLS = new Set(['NXTE.XD', 'NXTE.XC', 'B02.F', 'B02.HM', 'B02.MU', 'B02.HA', '0R6G.L']);
export function securityNameKey(name: string): string {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\b(?:sa|s a|sau|plc|inc|corp|corporation|ltd|limited)\b/g, '').replace(/\s+/g, ' ').trim();
}
export function verifiedSecurityAlias(name = '', symbol = '') {
    const key = securityNameKey(name);
    return NEXTIL_SYMBOLS.has(symbol.trim().toUpperCase()) || ['nextil', 'nextil group', 'nueva expresion textil'].includes(key) ? NEXTIL : undefined;
}
