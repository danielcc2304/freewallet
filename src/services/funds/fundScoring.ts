import type { Fund } from '../../types/types';

/**
 * Calculates a raw performance score for a fund.
 * Prioritizes 5-year returns, low volatility, and minimal drawdown.
 */
export const calculateRawScore = (f: Fund): number => {
    // 1. Return Component (R)
    // We prioritize 5Y returns as requested.
    const y5 = f.returns.y5;
    const y3 = f.returns.y3 ?? f.returns.y1;
    const y1 = f.returns.y1;

    let R = 0;
    if (y5 !== undefined) {
        // High confidence with 5Y data
        R = (0.85 * y5) + (0.15 * y3);
    } else {
        // Lower confidence, penalized for lack of track record
        R = (0.7 * y3) + (0.3 * y1);
        R -= 8; // Lack of historical consistency penalty
    }

    // 2. Risk Components
    const vol = f.volatility ?? NaN;
    const dd = f.maxDrawdown !== undefined ? Math.abs(f.maxDrawdown) : NaN;

    // Higher weights for volatility and drawdown as requested
    const volTerm = Number.isFinite(vol) ? vol * 0.50 : 6;
    const ddTerm = Number.isFinite(dd) ? dd * 0.50 : 10;

    // 3. Cost Component
    // TER is usually already reflected in returns, but efficiency matters.
    const costTerm = f.ter * 0.5;

    // 4. Quality Multipliers (Optional but professional)
    // Sharpe Ratio tells us if the risk was worth the return
    const sharpeBoost = (f.sharpe && f.sharpe > 1.5) ? (f.sharpe - 1.5) * 2 : 0;

    return R - volTerm - ddTerm - costTerm + sharpeBoost;
};

/**
 * Helper to calculate percentile from a numeric dataset
 */
export const calculatePercentile = (arr: number[], p: number): number => {
    if (arr.length === 0) return 0;
    const a = [...arr].sort((x, y) => x - y);
    const idx = (a.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return a[lo];
    return a[lo] + (a[hi] - a[lo]) * (idx - lo);
};

/**
 * Normalizes a raw score within a category to a 0-100 range.
 * Uses a compressed scale (40-100) for small datasets to avoid extreme low scores.
 */
export const normalizeScore = (raw: number, min: number, max: number, sampleSize: number): number => {
    if (max === min || sampleSize <= 1) return 90; // Default for single item or identical scores

    const score01 = (raw - min) / (max - min);

    if (sampleSize < 4) {
        // Compressed scale 40-100 for small samples
        return 40 + (score01 * 60);
    }

    return score01 * 100;
};
