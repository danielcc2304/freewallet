import assert from 'node:assert/strict';
import { calculateCrisisImpact } from '../src/components/academy/simulators/crisisImpact';

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
// 2008 reference: the old simulator fabricated a 15% DCA return. These are
// cash-flow totals only, deliberately not a price-path or backtest estimate.
const crisis = calculateCrisisImpact(10000, 300, 17, -56.8);
near(crisis.lowValue, 4320);
near(crisis.loss, -5680);
near(crisis.contributions, 5100);
near(crisis.totalContributed, 15100);
near(crisis.recoveryPercent, 131.48148148148147);
near(crisis.lowValue * (1 + crisis.recoveryPercent / 100), 10000);
const zero = calculateCrisisImpact(0, 0, 0, 0);
assert.deepEqual(zero, { lowValue: 0, loss: 0, recoveryPercent: 0, contributions: 0, totalContributed: 0 });
near(calculateCrisisImpact(10000, 0, 1, -50).recoveryPercent, 100);
near(calculateCrisisImpact(10000, 300, 1, -33.9).totalContributed, 10300);
near(calculateCrisisImpact(10000, 300, 9, -25.4).lowValue, 7460);
// Monthly savings change cash flows, never the initial position's drawdown.
near(calculateCrisisImpact(10000, 500, 17, -56.8).lowValue, crisis.lowValue);
for (const args of [
    [-1, 0, 1, -50], [1, -1, 1, -50], [1, 1, -1, -50],
    [1, 1, 1.5, -50], [1, 1, 1, -100], [1, 1, 1, 1],
    [NaN, 1, 1, -50], [1, Infinity, 1, -50], [1, 1, 1, -Infinity],
    [Number.MAX_VALUE, Number.MAX_VALUE, 17, -50],
]) assert.throws(() => calculateCrisisImpact(...args as [number, number, number, number]), RangeError);
console.log('Crisis impact: drawdowns, recovery, cash flows and input validation passed');
