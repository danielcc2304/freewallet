import type { AssetHolding } from '../types/types';
import { verifiedSecurityAlias } from './securityAliases';

const ISIN = /^[A-Z]{2}[A-Z0-9]{9}\d$/i;
export function underlyingIsin(holding: AssetHolding): string | undefined {
    const value = holding.isin || (ISIN.test(holding.symbol.trim()) ? holding.symbol : '');
    return value.trim().toUpperCase() || undefined;
}

/** Remove legal suffixes and generic share wording; retain ADR, preferred and class letters. */
export function underlyingNameKey(name: string): string {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\bordinary\s+(?:shares|shs)\b/g, '')
        .replace(/\b(?:s a|n v|s p a|incorporated|inc|corp|corporation|co|company|plc|ltd|limited|sa|sau|ag|nv)\b/g, '')
        .replace(/\s+/g, ' ').trim();
}

// Exact share-class references. HK ordinary shares must not resolve to US ADRs.
// Listings checked in Yahoo, by ISIN where available; US classes against Nasdaq.
const REFERENCES = [
    {name:'Alibaba Group Holding Ltd Ordinary Shares',symbol:'9988.HK',isin:'KYG017191142'},
    {name:'Tencent Holdings Ltd',symbol:'0700.HK',isin:'KYG875721634'},
    {name:'Xiaomi Corp Class B',symbol:'1810.HK',isin:'KYG9830T1067'},
    {name:'Meituan Class B',symbol:'3690.HK',isin:'KYG596691041'},
    {name:'Alphabet Inc Class C',symbol:'GOOG',isin:'US02079K1079'},
    {name:'Alphabet Inc Class A',symbol:'GOOGL',isin:'US02079K3059'},
    {name:'Meta Platforms Inc Class A',symbol:'META',isin:'US30303M1027'},
    {name:'Apple Inc',symbol:'AAPL',isin:'US0378331005'},
    {name:'NVIDIA Corp',symbol:'NVDA',isin:'US67066G1040'},
    {name:'Microsoft Corp',symbol:'MSFT',isin:'US5949181045'},
    {name:'Amazon.com Inc',symbol:'AMZN',isin:'US0231351067'},
    {name:'Broadcom Inc',symbol:'AVGO',isin:'US11135F1012'},
    {name:'Micron Technology Inc',symbol:'MU',isin:'US5951121038'},
    {name:'PDD Holdings Inc ADR',symbol:'PDD',isin:'US7223041028'},
    {name:'NetEase Inc Ordinary Shares',symbol:'9999.HK',isin:'KYG6427A1028'},
];

export function underlyingReference(holding: AssetHolding) {
    const isin = underlyingIsin(holding);
    const reference = REFERENCES.find(r => isin ? r.isin === isin : underlyingNameKey(r.name) === underlyingNameKey(holding.name));
    if(reference) return reference;
    const nextil=verifiedSecurityAlias(holding.name,holding.symbol);
    return nextil && (!isin || isin===nextil.isin) ? {...nextil,symbol:nextil.chartSymbol} : undefined;
}

export function underlyingCompanyKey(name: string): string {
    return underlyingNameKey(name).replace(/\bclass\s+[a-z0-9]+\b/g, '')
        .replace(/\b(?:adr|ads|pfd|preferred|registered|shs|non-voting)\b/g, '')
        .replace(/\bnon\s+voting\b/g, '').replace(/\s+/g, ' ').trim();
}

export function underlyingQueries(holding: AssetHolding) {
    const isin=underlyingIsin(holding), reference=underlyingReference(holding);
    if(isin) return [{query:isin,isinSearch:true},...(reference ? [{query:reference.symbol,isinSearch:false}] : [])];
    if(reference) return [{query:reference.symbol,isinSearch:false}];
    const ticker=holding.symbol.trim();
    const queries = /^[A-Z0-9][A-Z0-9.-]{0,15}$/i.test(ticker) && underlyingNameKey(ticker)!==underlyingNameKey(holding.name)
        ? [ticker,underlyingNameKey(holding.name)] : [underlyingNameKey(holding.name)];
    return [...new Set(queries.filter(Boolean))].map(query=>({query,isinSearch:false}));
}
