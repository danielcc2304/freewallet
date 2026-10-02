import { captureLocalPortfolio } from './portfolioCloudStorage';

/** Inspect the untouched DEVICE copy, never the authenticated cloud view. */
export function localPortfolioSummary() {
    try {
        const data = captureLocalPortfolio();
        const portfolio = JSON.parse(data.freewallet_portfolio_v1);
        const positions = portfolio.assets.length as number;
        const movements = portfolio.transactions.length as number;
        const hasWorkbook = ['holdings_raw', 'evolution_raw', 'movements_raw', 'control_raw']
            .some(key => !!data[`freewallet_portfolio_csv_${key}`]?.trim());
        return { positions, movements, hasWorkbook, found: positions > 0 || movements > 0 || hasWorkbook, unreadable: false };
    } catch {
        return { positions: 0, movements: 0, hasWorkbook: false, found: false, unreadable: true };
    }
}
