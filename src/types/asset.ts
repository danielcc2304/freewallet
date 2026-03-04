export type AssetType = 'stock' | 'etf' | 'fund' | 'crypto';

export interface AssetHolding {
    symbol: string;
    name: string;
    percentage: number;
    sector?: string;
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
}
