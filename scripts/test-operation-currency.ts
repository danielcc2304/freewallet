import assert from 'node:assert/strict';
import { historicalOperationRate, operationEuroPrice } from '../src/services/operationCurrency';
import type { HistoricalDataPoint } from '../src/types/types';

const point = (date: string, close: number, currency = 'EUR'): HistoricalDataPoint => ({ date, close, currency, open: close, high: close, low: close, volume: 0 });
const rates = [point('2026-09-25', 0.85), point('2026-09-28', 0.9), point('2026-09-24', 0.84)];
assert.equal(historicalOperationRate(rates, '2026-09-27')?.close, 0.85); // Sunday: Friday, never Monday.
assert.equal(historicalOperationRate(rates, '2026-09-28')?.close, 0.9);
assert.equal(historicalOperationRate(rates, '2026-10-06'), null); // stale.
assert.equal(historicalOperationRate(rates, '2026-02-31'), null);
assert.equal(historicalOperationRate([point('2026-09-25', 0), point('2026-09-25', 1, 'USD')], '2026-09-25'), null);
assert.equal(operationEuroPrice(100, 10, 'USD', 0.85), 85);
assert.equal(operationEuroPrice(100, 10, 'USD', 0.85, 820), 82);
assert.equal(operationEuroPrice(100, 10, 'USD', undefined, 820), 82);
assert.equal(operationEuroPrice(12.345, 123.456, 'EUR'), 12.345); // Existing euro positions unchanged.
for (const price of [operationEuroPrice(100, 10, 'USD'), operationEuroPrice(100, 0, 'USD', 0.85),
    operationEuroPrice(Infinity, 10, 'EUR'), operationEuroPrice(100, 10, 'USD', 0.85, -1)]) assert.ok(Number.isNaN(price));
const oldQuantity = 10, oldEuroPrice = 90;
const newEuroPrice = operationEuroPrice(100, 5, 'USD', 0.85);
assert.equal((oldQuantity * oldEuroPrice + 5 * newEuroPrice) / 15, 88.33333333333333);
console.log('Operation currency passed: historical date/holiday/staleness, conversion, broker override, invalid inputs, EUR unchanged and DCA in EUR.');
