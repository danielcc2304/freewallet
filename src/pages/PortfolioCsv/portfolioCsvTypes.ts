export type HoldingCategory = 'equity' | 'fixedIncome' | 'cash' | 'alternatives' | 'other';

export type HoldingBucket = 'longTerm' | 'income' | 'liquidity' | 'goal';

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
