import { DEFAULT_FINNHUB_API_KEY, FINNHUB_STORAGE_KEY } from './marketConfig';

let lastAlphaVantageCall = 0;
let lastFinnhubCall = 0;

const ALPHA_VANTAGE_MIN_INTERVAL = 3000;
const FINNHUB_MIN_INTERVAL = 1000;

let alphaVantageFailures = 0;
let yahooFinanceFailures = 0;

export async function waitForAlphaVantageRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastAlphaVantageCall;
    if (elapsed < ALPHA_VANTAGE_MIN_INTERVAL) {
        await new Promise((resolve) => setTimeout(resolve, ALPHA_VANTAGE_MIN_INTERVAL - elapsed));
    }
    lastAlphaVantageCall = Date.now();
}

export async function waitForFinnhubRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastFinnhubCall;
    if (elapsed < FINNHUB_MIN_INTERVAL) {
        await new Promise((resolve) => setTimeout(resolve, FINNHUB_MIN_INTERVAL - elapsed));
    }
    lastFinnhubCall = Date.now();
}

export function getAlphaVantageFailures(): number {
    return alphaVantageFailures;
}

export function resetAlphaVantageFailures(): void {
    alphaVantageFailures = 0;
}

export function incrementAlphaVantageFailures(): void {
    alphaVantageFailures += 1;
}

export function getYahooFinanceFailures(): number {
    return yahooFinanceFailures;
}

export function resetYahooFinanceFailures(): void {
    yahooFinanceFailures = 0;
}

export function incrementYahooFinanceFailures(): void {
    yahooFinanceFailures += 1;
}

export function setFinnhubApiKey(key: string): void {
    localStorage.setItem(FINNHUB_STORAGE_KEY, key);
}

export function getFinnhubApiKey(): string {
    return localStorage.getItem(FINNHUB_STORAGE_KEY) || DEFAULT_FINNHUB_API_KEY;
}
