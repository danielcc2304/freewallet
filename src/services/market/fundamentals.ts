import {quoteCurrency} from '../../../supabase/functions/_shared/quoteCurrency';
import type {StockQuote} from '../../types/types';
type RecordData = Record<string, unknown>;
const record = (v: unknown): RecordData => v && typeof v === 'object' ? v as RecordData : {};
const text = (v: unknown): string | undefined => typeof v === 'string' && v.trim() ? v.trim() : undefined;
export function fundamentalNumber(v: unknown): number | undefined {
    const value = typeof v === 'number' ? v : record(v).raw;
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
const first = (...values: unknown[]) => values.map(fundamentalNumber).find(v => v !== undefined);
const percent = (v: unknown) => { const n = fundamentalNumber(v); return n === undefined ? undefined : n * 100; };
const currency = (v: unknown) => { const code = text(v); return code && /^[A-Z]{3}$/.test(code) ? code : undefined; };

export function normalizeFundamentals(payload: unknown, symbol: string): Partial<StockQuote> {
    const data = record(payload), summary = record(data.quoteSummary), response = record(data.quoteResponse);
    const requested = symbol.trim().toUpperCase();
    const results = Array.isArray(summary.result) ? summary.result : Array.isArray(response.result) ? response.result : [];
    const result = results.map(record).find(r => {
        const id = text(record(r.price).symbol) || text(r.symbol);
        return id?.toUpperCase() === requested;
    });
    if (!result) return {};
    const stats = record(result.defaultKeyStatistics), financial = record(result.financialData);
    const detail = record(result.summaryDetail), price = record(result.price);
    const profile = record(result.summaryProfile), assetProfile = record(result.assetProfile);
    const quarter = fundamentalNumber(stats.mostRecentQuarter);
    const priceUnit=text(price.currency)||text(result.currency);
    let baseCurrency: string | undefined;
    try{if(priceUnit)baseCurrency=quoteCurrency(priceUnit).currency;}catch{/* Unknown units remain unavailable. */}
    const fields: Partial<StockQuote> = {
        businessDescription: text(profile.longBusinessSummary) || text(assetProfile.longBusinessSummary),
        currency: baseCurrency ? priceUnit : undefined,
        marketCapCurrency: baseCurrency, dividendCurrency: baseCurrency ? priceUnit : undefined,
        financialCurrency: currency(financial.financialCurrency) || currency(result.financialCurrency),
        pe: first(stats.trailingPE, detail.trailingPE, result.trailingPE),
        forwardPe: first(stats.forwardPE, detail.forwardPE, result.forwardPE),
        ps: first(stats.priceToSalesTrailing12Months, detail.priceToSalesTrailing12Months, result.priceToSalesTrailing12Months, result.priceToSales),
        pb: first(stats.priceToBook, detail.priceToBook, result.priceToBook),
        dividendYield: percent(detail.dividendYield) ?? percent(result.trailingAnnualDividendYield) ?? fundamentalNumber(result.dividendYield),
        dividendRate: first(detail.dividendRate, detail.trailingAnnualDividendRate, result.trailingAnnualDividendRate, result.dividendRate),
        eps: first(stats.trailingEps, result.epsTrailingTwelveMonths, result.trailingEps),
        beta: first(stats.beta, detail.beta, result.beta),
        marketCap: first(price.marketCap, detail.marketCap, result.marketCap),
        ebitda: fundamentalNumber(financial.ebitda),
        evToEbitda: fundamentalNumber(stats.enterpriseToEbitda),
        revenueGrowth: percent(financial.revenueGrowth),
        profitMargin: percent(financial.profitMargins),
        roe: percent(financial.returnOnEquity),
        // Yahoo reports debt/equity in percentage points, unlike margins.
        debtToEquity: fundamentalNumber(financial.debtToEquity),
        fiftyTwoWeekHigh: first(detail.fiftyTwoWeekHigh, result.fiftyTwoWeekHigh),
        fiftyTwoWeekLow: first(detail.fiftyTwoWeekLow, result.fiftyTwoWeekLow),
        averageVolume: first(detail.averageVolume, result.averageDailyVolume3Month),
        fundamentalPeriodEnd: quarter !== undefined && quarter > 0 && quarter * 1000 <= 8.64e15 ? new Date(quarter * 1000).toISOString().slice(0, 10) : undefined,
    };
    if (fields.eps !== undefined) fields.epsCurrency = fields.currency;
    if (fields.fundamentalPeriodEnd) {
        fields.fundamentalDates = Object.fromEntries(['ebitda','eps','profitMargin','roe','debtToEquity','revenueGrowth']
            .filter(key => Number.isFinite(fields[key as keyof StockQuote]))
            .map(key => [key, fields.fundamentalPeriodEnd!]));
    }
    return Object.fromEntries(Object.entries(fields).filter(([,v]) => v !== undefined));
}

/** Parse only JSON responses embedded by Yahoo, never execute page scripts.
 * Each embedded result must identify the requested security, not a sidebar ticker.
 */
export function extractPublicFundamentals(html: string, symbol: string): Partial<StockQuote> {
    let merged: Partial<StockQuote> = {};
    const blocks = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi);
    const summaries: Partial<StockQuote>[] = [];
    for (const [,attributes,body] of blocks) {
        if (!/data-sveltekit-fetched/i.test(attributes) || !/type=["']application\/json["']/i.test(attributes)) continue;
        try {
            const envelope = record(JSON.parse(body));
            if (envelope.status !== 200) continue;
            const data = typeof envelope.body === 'string' ? JSON.parse(envelope.body) as unknown : envelope.body;
            const normalized = normalizeFundamentals(data, symbol);
            if ('quoteSummary' in record(data)) summaries.push(normalized);
            else merged = mergeFundamentals(merged, normalized);
        } catch { /* Malformed or unrelated public script is not a source. */ }
    }
    return mergeFundamentals(merged, ...summaries);
}

export const FUNDAMENTAL_KEYS = ['pe','forwardPe','ps','pb','dividendYield','dividendRate','eps','beta','ebitda','evToEbitda','revenueGrowth','profitMargin','roe','debtToEquity','marketCap','fiftyTwoWeekHigh','fiftyTwoWeekLow'] as const;
export function hasFundamentals(data: Partial<StockQuote>): boolean {
    return FUNDAMENTAL_KEYS.some(key => Number.isFinite(data[key]));
}

export function formatFundamentalMoney(value: number | undefined, code: string | undefined, compact = false): string {
    if (!Number.isFinite(value)) return 'N/D';
    let converted=value!, currencyCode: string | undefined;
    try{if(code){const unit=quoteCurrency(code);converted*=unit.scale;currencyCode=unit.currency;}}catch{/* Keep unavailable currency explicit. */}
    const number = new Intl.NumberFormat('es-ES', {notation:compact?'compact':'standard',maximumFractionDigits:compact?2:6}).format(converted);
    return `${number} ${currencyCode || '(divisa no disponible)'}`;
}

export function formatFundamentalPercent(value: number | undefined, signed = false): string {
    if (!Number.isFinite(value)) return 'N/D';
    return `${signed && value! > 0 ? '+' : ''}${value!.toLocaleString('es-ES',{maximumFractionDigits:2})}%`;
}

export function formatFundamentalRatio(value: number | undefined): string {
    return Number.isFinite(value) ? value!.toLocaleString('es-ES',{maximumFractionDigits:2}) : 'N/D';
}

export const FUNDAMENTAL_SERIES_TYPES = ['trailingEBITDA','trailingNetIncome','trailingTotalRevenue','trailingDilutedEPS','trailingBasicEPS',
    'quarterlyTotalDebt','quarterlyStockholdersEquity','trailingEnterprisesValueEBITDARatio','trailingPeRatio','trailingPbRatio','trailingPsRatio'] as const;

export function normalizeFundamentalSeries(payload: unknown, symbol: string, now = Date.now()): Partial<StockQuote> {
    const result = record(record(payload).timeseries).result;
    if (!Array.isArray(result)) return {};
    const requested = symbol.trim().toUpperCase();
    const pick = (type: string) => {
        const points = result.flatMap(value => {
            const r=record(value), meta=record(r.meta);
            if (!Array.isArray(meta.symbol) || !meta.symbol.some(s => typeof s==='string' && s.toUpperCase()===requested)) return [];
            if (!Array.isArray(meta.type) || !meta.type.includes(type) || !Array.isArray(r[type])) return [];
            return r[type] as unknown[];
        }).map(record).flatMap(p => {
            const value=fundamentalNumber(p.reportedValue), date=text(p.asOfDate), unit=currency(p.currencyCode);
            if (value===undefined || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
            const time=Date.parse(date);
            if (!Number.isFinite(time) || time>now || new Date(time).toISOString().slice(0,10)!==date) return [];
            if (p.periodType!==(type.startsWith('trailing')?'TTM':'3M')) return [];
            return [{value,date,currency:unit}];
        }).sort((a,b)=>b.date.localeCompare(a.date));
        return points[0];
    };
    const data:Partial<StockQuote>={}, dates:Record<string,string>={}, derived:Record<string,boolean>={};
    const put = (key: 'pe'|'ps'|'pb'|'evToEbitda'|'ebitda'|'eps'|'profitMargin'|'debtToEquity', point: ReturnType<typeof pick>) => {
        if (point) {data[key]=point.value;dates[key]=point.date;}
    };
    put('pe',pick('trailingPeRatio'));put('ps',pick('trailingPsRatio'));put('pb',pick('trailingPbRatio'));
    put('evToEbitda',pick('trailingEnterprisesValueEBITDARatio'));
    const ebitda=pick('trailingEBITDA');
    put('ebitda',ebitda);if(ebitda) data.financialCurrency=ebitda.currency;
    const diluted=pick('trailingDilutedEPS'), basic=pick('trailingBasicEPS');
    const eps=basic && (!diluted || basic.date>diluted.date) ? basic : diluted || basic;
    put('eps',eps);if(eps) data.epsCurrency=eps.currency;
    const income=pick('trailingNetIncome'), revenue=pick('trailingTotalRevenue');
    if(income && revenue && revenue.value>0 && income.date===revenue.date && income.currency && income.currency===revenue.currency) {
        put('profitMargin',{...income,value:income.value/revenue.value*100});derived.profitMargin=true;
    }
    const debt=pick('quarterlyTotalDebt'), equity=pick('quarterlyStockholdersEquity');
    if(debt && equity && equity.value!==0 && debt.date===equity.date && debt.currency && debt.currency===equity.currency) {
        put('debtToEquity',{...debt,value:debt.value/equity.value*100});derived.debtToEquity=true;
    }
    return hasFundamentals(data) ? {...data,fundamentalDates:dates,fundamentalDerived:derived,fundamentalsSymbol:requested} : {};
}

/** Dates, derivation flags and currencies must follow the value actually used. */
export function mergeFundamentals(...sources: Partial<StockQuote>[]): Partial<StockQuote> {
    let merged:Partial<StockQuote>={};
    const dates:Record<string,string>={}, derived:Record<string,boolean>={};
    for(const source of sources){
        const previous=merged;
        merged={...merged,...source};
        if(source.ebitda!==undefined) merged.financialCurrency=source.financialCurrency;
        else if(previous.ebitda!==undefined) merged.financialCurrency=previous.financialCurrency;
        if(source.eps!==undefined) merged.epsCurrency=source.epsCurrency;
        else if(previous.eps!==undefined) merged.epsCurrency=previous.epsCurrency;
        for(const key of FUNDAMENTAL_KEYS){
            if(source[key]===undefined) continue;
            delete dates[key];delete derived[key];
            if(source.fundamentalDates?.[key]) dates[key]=source.fundamentalDates[key];
            if(source.fundamentalDerived?.[key]) derived[key]=true;
        }
    }
    delete merged.fundamentalDates;
    delete merged.fundamentalDerived;
    return {...merged,
        ...(Object.keys(dates).length ? {fundamentalDates:dates} : {}),
        ...(Object.keys(derived).length ? {fundamentalDerived:derived} : {}),
    };
}
