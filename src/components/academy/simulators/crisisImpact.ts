/** Applies a drawdown to existing capital; contributions are cash flows, not returns. */
export function calculateCrisisImpact(capital: number, monthly: number, months: number, drawdown: number) {
    if (![capital, monthly, months, drawdown].every(Number.isFinite)
        || capital < 0 || monthly < 0 || !Number.isInteger(months) || months < 0
        || drawdown <= -100 || drawdown > 0) {
        throw new RangeError('Invalid crisis simulation inputs');
    }
    const lowValue = capital * (1 + drawdown / 100);
    const contributions = monthly * months;
    const totalContributed = capital + contributions;
    if (![lowValue, contributions, totalContributed].every(Number.isFinite)) {
        throw new RangeError('Crisis simulation exceeds numeric range');
    }
    return {
        lowValue,
        loss: lowValue - capital,
        recoveryPercent: (1 / (1 + drawdown / 100) - 1) * 100,
        contributions,
        totalContributed,
    };
}
