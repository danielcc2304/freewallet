type SearchQuote = { symbol?: unknown; isin?: unknown; quoteType?: unknown; longname?: unknown; shortname?: unknown };

/** Preserve share-class tokens; company-name matching deliberately drops them. */
export function fundClassNameKey(name: string): string {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/€/g, ' eur ').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** ISIN searches bind the result to the instrument. Name fallback must match
 * the entire class name of the independently ISIN-verified Finect sheet.
 */
export function fundChartSymbols(payload: unknown, isin: string, className?: string): string[] {
    const quotes = payload && typeof payload === 'object' && 'quotes' in payload
        && Array.isArray(payload.quotes) ? payload.quotes as SearchQuote[] : [];
    const requested = isin.trim().toUpperCase();
    return [...new Set(quotes.filter(q => {
        if (!q || typeof q.symbol !== 'string' || q.quoteType !== 'MUTUALFUND') return false;
        if (typeof q.isin === 'string' && q.isin.trim().toUpperCase() !== requested) return false;
        if (!className) return true;
        const name = typeof q.longname === 'string' ? q.longname : typeof q.shortname === 'string' ? q.shortname : '';
        return fundClassNameKey(name) === fundClassNameKey(className);
    }).map(q => (q.symbol as string).trim().toUpperCase()).filter(Boolean))];
}
