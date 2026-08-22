export type HoldingCategory = 'equity' | 'fixedIncome' | 'cash' | 'alternatives' | 'other';

export type HoldingBucket = 'longTerm' | 'income' | 'liquidity';

export type Holding = {
    asset: string;
    amount: number;
    weight: number;
    category: HoldingCategory;
};

export type HoldingControl = Holding & {
    categoryOverride?: HoldingCategory;
    bucket: HoldingBucket;
};

export type EvolutionPoint = {
    period: string;
    totalValue: number;
    initialCapital: number;
    monthlyContribution: number;
    profit: number;
    monthlyReturnPct: number;
    twrYtdPct: number;
};

export type BenchmarkComparisonPoint = {
    year: number;
    month: string;
    period: string;
    portfolioReturnPct: number;
    benchmarkReturnPct: number;
    portfolioAccumPct: number;
    benchmarkAccumPct: number;
    relativeReturnPct: number;
};

export type DailyPortfolioPoint = {
    date: string;
    totalValue: number;
    netFlow: number;
    dailyReturnPct: number | null;
    dataType: string;
};

export type AdvancedPortfolioStats = {
    riskFreeAnnualPct: number | null;
    sharpeRatio: number | null;
    sortinoRatio: number | null;
    annualAlphaPct: number | null;
    beta: number | null;
    maxDrawdownPct: number | null;
    informationRatio: number | null;
    trackingErrorAnnualPct: number | null;
    correlation: number | null;
    annualizedReturnPct: number | null;
    annualizedVolatilityPct: number | null;
    analyzedMonths: number;
    bestMonth: { period: string; returnPct: number } | null;
    treynorRatioPct: number | null;
    dailyObservations: number;
    dailyVolatilityAnnualPct: number | null;
    latestDailyPoint: DailyPortfolioPoint | null;
};

export type EnrichedEvolutionPoint = EvolutionPoint & {
    investedValue: number;
    gainVsInvested: number;
    drawdownPct: number;
};

export type PieRow = {
    name: string;
    value: number;
    weight: number;
    color: string;
};

export type ParsedPeriod = {
    monthKey: string;
    monthIndex: number;
    year?: number;
};
