export const WORKBOOK_RISK_FREE_ANNUAL_PCT = 2.75;

export function latestContinuousMonths<T extends { month: string }>(rows: T[]): T[] {
    let start = rows.length - 1;
    const ordinal = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5));
    while (start > 0 && ordinal(rows[start].month) - ordinal(rows[start - 1].month) === 1) start--;
    return rows.slice(Math.max(0, start));
}

/** Percentage-point returns; sample volatility and downside over all periods. */
export function workbookRiskStats(returns: number[], riskFreeAnnualPct = WORKBOOK_RISK_FREE_ANNUAL_PCT) {
    const n = returns.length;
    if (returns.some(r => !Number.isFinite(r) || r < -100)) {
        return { sharpe: null, sortino: null, volatility: null, annualized: null, maxDrawdown: null };
    }
    const mean = n ? returns.reduce((sum, r) => sum + r, 0) / n : 0;
    const sigma = n > 1 ? Math.sqrt(returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (n - 1)) : 0;
    const excess = mean - riskFreeAnnualPct / 12;
    const downside = n ? Math.sqrt(returns.reduce((sum, r) => sum + Math.min(r - riskFreeAnnualPct / 12, 0) ** 2, 0) / n) : 0;
    let wealth = 1, peak = 1, drawdown = 0;
    returns.forEach(r => { wealth *= 1 + r / 100; peak = Math.max(peak, wealth); drawdown = Math.min(drawdown, (wealth / peak - 1) * 100); });
    return { sharpe: sigma > 0 ? excess / sigma * Math.sqrt(12) : null,
        sortino: downside > 0 ? excess / downside * Math.sqrt(12) : null,
        volatility: n > 1 ? sigma * Math.sqrt(12) : null,
        annualized: n ? (wealth ** (12 / n) - 1) * 100 : null, maxDrawdown: n ? drawdown : null };
}
