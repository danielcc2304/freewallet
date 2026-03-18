import type { HoldingBucket, HoldingCategory } from './portfolioCsvTypes';

export const STORAGE_KEYS = {
    holdingsRaw: 'freewallet_portfolio_csv_holdings_raw',
    evolutionRaw: 'freewallet_portfolio_csv_evolution_raw',
    workbookFile: 'freewallet_portfolio_csv_workbook_file',
    updatedAt: 'freewallet_portfolio_csv_updated_at',
    categoryOverrides: 'freewallet_portfolio_csv_category_overrides',
    bucketTargets: 'freewallet_portfolio_csv_bucket_targets',
} as const;

export const CATEGORY_LABELS: Record<HoldingCategory, string> = {
    equity: 'Renta variable',
    fixedIncome: 'Renta fija',
    cash: 'Liquidez',
    alternatives: 'Alternativos',
    other: 'Otros',
};

export const BUCKET_LABELS: Record<HoldingBucket, string> = {
    longTerm: 'Largo plazo',
    income: 'Medio plazo',
    liquidity: 'Liquidez',
    goal: 'Objetivo',
};

export const DEFAULT_BUCKET_TARGETS: Record<HoldingBucket, number> = {
    longTerm: 55,
    income: 20,
    liquidity: 10,
    goal: 15,
};

export const DEFAULT_HOLDINGS_CSV = `Activo,Importe (EUR),Peso %
"ETF Global Equity","3.200,00EUR","32,00%"
"ETF USA Quality","1.800,00EUR","18,00%"
"ETF Europe Dividend","1.250,00EUR","12,50%"
"ETF Emerging Markets","950,00EUR","9,50%"
"Global Bond Fund","1.450,00EUR","14,50%"
"Short Duration Bond","550,00EUR","5,50%"
"Gold ETC","300,00EUR","3,00%"
"Cash Reserve","500,00EUR","5,00%"
TOTAL,"10.000,00EUR",`;

export const DEFAULT_EVOLUTION_CSV = `Mes,Valor Total,Capital Inicial,Capital Aportado,Plusvalias,% mens.,TWR YTD
Mar,8200,8000,200,0,"0,000","0,000"
Abr,8450,8200,200,50,"0,610","0,610"
May,8615,8450,200,-35,"-0,414","0,193"
Jun,8890,8615,200,75,"0,871","1,066"
Jul,9120,8890,200,30,"0,337","1,407"
Ago,9345,9120,200,25,"0,274","1,685"
Sep,9580,9345,200,35,"0,375","2,066"
Oct,9790,9580,200,10,"0,104","2,173"
Nov,9650,9790,200,-340,"-3,473","-1,375"
Dic,9885,9650,200,35,"0,363","-1,017"
Ene,10090,9885,200,5,"0,051","0,033"
Feb,10180,10090,0,90,"0,892","0,925"
"Mar 2026",10000,10180,0,-180,"-1,768","-0,859"`;

export const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#64748b'];

export const MONTH_KEYS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
