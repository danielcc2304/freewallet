export type AssetType = 'stock' | 'etf' | 'fund' | 'crypto' | 'cash';

export interface AssetHolding {
    symbol: string;
    name: string;
    percentage: number;
    sector?: string;
    /** Identifiers are optional because some providers only expose a name. */
    isin?: string;
}

export interface Asset {
    id: string;
    symbol: string;
    name: string;
    type: AssetType;
    purchasePrice: number;
    purchaseDate: string;
    quantity: number;
    currentPrice?: number;
    previousClose?: number;
    currency?: string;
    holdings?: AssetHolding[];
    isin?: string;
    lastQuoteAt?: string;
    lastCheckedAt?: string;
    /** Time the app read the quote; never a provider verification. */
    lastReadAt?: string;
    quoteOrigin?: 'batch' | 'provider';
    quotedAt?: string;
    originalPrice?: number;
    originalCurrency?: string;
    originalUnit?: string;
    unitScale?: number;
    fxRate?: number;
    fxAt?: string | null;
    valuationBasis?: 'quote-date-fx';
    quoteSource?: FundSource | 'Mercado' | 'Saldo';
}
import type {FundSource} from '../../supabase/functions/_shared/fundQuotePolicy';
