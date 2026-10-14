import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    solveAdvancedBond,
    solveBasicBond,
    solveBondYield,
    bondDayCount,
    bondYearFraction,
    parseIsoDate,
    type DayCountConvention,
    type CouponFrequency,
} from '../src/services/bondCalculator';

const near = (actual: number, expected: number, tolerance = 1e-10) =>
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        actual + ' != ' + expected,
    );

// Independent simple periodic bisection for the manually specified stub flows.
const stubReference = (price: number, flows: Array<[number, number]>) => {
    const pv = (r: number) =>
        flows.reduce(
            (sum, [amount, time]) => sum + amount / (1 + r) ** time,
            0,
        );
    assert.ok(pv(0) > price && pv(1) < price);
    let low = 0,
        high = 1;
    for (let i = 0; i < 180; i++) {
        const mid = (low + high) / 2;
        if (pv(mid) > price) low = mid;
        else high = mid;
    }
    return low + high; // m=2 times the midpoint periodic yield.
};
const base = {
    price: 84.3,
    couponRate: 0.09,
    face: 100,
    settlementDate: '2026-10-14',
    issueDate: '2025-07-25',
    maturityDate: '2031-02-01',
    couponFrequency: 'semiannual' as CouponFrequency,
    priceInputType: 'clean' as const,
    dayCountConvention: '30us360' as DayCountConvention,
};
const result = (
    overrides: Partial<Parameters<typeof solveAdvancedBond>[0]> = {},
) => {
    const value = solveAdvancedBond({ ...base, ...overrides });
    assert.ok(value);
    return value;
};
const core = result();
// Old implementation: 14.816662068195843%, Jul 25 / Jan 25 coupons, 1.975
// accrued, 86.275 dirty and an extra full coupon on Feb 1, 2031.
// Independent Decimal reference: 73/180 accrued, 107/180 remaining, nine
// future coupons, periodic 0.0698511476488458011146417759945884854321885.
const independent = JSON.parse(
    readFileSync(
        new URL('./fixtures/coreweave-bond-reference.json', import.meta.url),
        'utf8',
    ),
);
assert.equal(core.previousCouponDate, '2026-08-01');
assert.equal(core.nextCouponDate, '2027-02-01');
near(core.accruedInterest, 1.825);
near(core.dirtyPrice, 86.125);
near(core.cleanPrice, 84.3);
near(core.firstPeriodFraction, 107 / 180);
assert.equal(core.cashFlows.length, 9);
assert.deepEqual(
    core.cashFlows.map((f) => f.date),
    independent.dates,
);
core.cashFlows.forEach((f, i) => {
    near(f.periods, Number(independent.flows[i].periods));
    near(f.amount, Number(independent.flows[i].amount));
});
near(core.periodicYield, Number(independent.periodicYield));
near(core.ytm, Number(independent.nominalYield));
near(core.effectiveYtm, Number(independent.effectiveYield));
near(core.ytm, Number('0.13970229529769160222928355198917697'));
near(core.effectiveYtm, Number('0.14458147812555245851826763870795638'));
near(
    core.cashFlows.reduce(
        (sum, f) => sum + f.amount / (1 + core.ytm / 2) ** f.periods,
        0,
    ),
    core.dirtyPrice,
    1e-9,
);
const dirty = result({ price: 86.125, priceInputType: 'dirty' });
near(dirty.dirtyPrice, 86.125);
near(dirty.cleanPrice, 84.3);
near(dirty.ytm, core.ytm);
for (const face of [1, 1000, 1000000000]) {
    const scaled = result({ face });
    near(scaled.ytm, core.ytm);
    near(scaled.dirtyPrice / face, 0.86125);
}
assert.deepEqual(
    result({ issueDate: '2020-01-01' }).cashFlows,
    core.cashFlows,
    'Issue date never anchors future ordinary coupons',
);
near(result({ issueDate: '' }).ytm, core.ytm);
assert.deepEqual(
    result({ firstCouponDate: '2026-02-01' }).cashFlows,
    core.cashFlows,
    'An already-paid first stub cannot alter future cash flows',
);
near(
    result({ firstCouponDate: '2026-02-01', lastCouponDate: '2030-08-01' }).ytm,
    core.ytm,
);

const date = (s: string) => {
    const value = parseIsoDate(s);
    assert.ok(value);
    return value;
};
const dc = (a: string, b: string, c: DayCountConvention) =>
    bondDayCount(date(a), date(b), c);
for (const basis of ['actual365', 'actual360', '30e360', '30us360'] as const) {
    const r = result({ dayCountConvention: basis });
    assert.ok(Number.isFinite(r.ytm));
    near(
        r.firstPeriodFraction,
        dc(base.settlementDate, r.nextCouponDate!, basis) /
            dc(r.previousCouponDate!, r.nextCouponDate!, basis),
    );
    near(
        r.accruedInterest,
        (4.5 * dc(r.previousCouponDate!, base.settlementDate, basis)) /
            dc(r.previousCouponDate!, r.nextCouponDate!, basis),
    );
}
// Actual/365 and Actual/360 ratios cancel their fixed denominators when
// expressed in coupon periods. Their year fractions still differ.
near(
    result({ dayCountConvention: 'actual365' }).ytm,
    result({ dayCountConvention: 'actual360' }).ytm,
);
near(
    bondYearFraction(date('2024-01-01'), date('2025-01-01'), 'actual365'),
    366 / 365,
);
near(
    bondYearFraction(date('2024-01-01'), date('2025-01-01'), 'actual360'),
    366 / 360,
);
for (const [a, b, e, us] of [
    ['2023-02-28', '2023-03-31', 32, 30],
    ['2024-02-29', '2024-03-31', 31, 30],
    ['2023-02-28', '2024-02-29', 361, 360],
    ['2024-02-29', '2025-02-28', 359, 360],
    ['2026-01-29', '2026-03-31', 61, 62],
    ['2026-01-31', '2026-02-28', 28, 28],
] as const) {
    assert.equal(dc(a, b, '30e360'), e);
    assert.equal(dc(a, b, '30us360'), us);
}
assert.equal(dc('2024-02-28', '2024-03-01', 'actual365'), 2);
assert.equal(dc('2026-02-01', '2026-02-01', '30us360'), 0);

for (const frequency of [
    'annual',
    'semiannual',
    'quarterly',
    'monthly',
] as const) {
    const par = result({
        price: 100,
        settlementDate: '2026-02-01',
        couponFrequency: frequency,
    });
    near(par.accruedInterest, 0);
    near(par.ytm, 0.09);
    assert.ok(par.cashFlows.every((f) => f.date! > '2026-02-01'));
    assert.ok(
        result({
            price: 90,
            settlementDate: '2026-02-01',
            couponFrequency: frequency,
        }).ytm > 0.09,
    );
    assert.ok(
        result({
            price: 110,
            settlementDate: '2026-02-01',
            couponFrequency: frequency,
        }).ytm < 0.09,
    );
}
const short = result({ settlementDate: '2030-11-01' });
assert.equal(short.cashFlows.length, 1);
near(short.firstPeriodFraction, 0.5);
near(short.cashFlows[0].amount, 104.5);
near(short.ytm, 2 * ((104.5 / short.dirtyPrice) ** 2 - 1));
const negative = result({
    price: 120,
    couponRate: 0,
    settlementDate: '2030-08-01',
});
near(negative.ytm, 2 * (100 / 120 - 1));
assert.ok(negative.effectiveYtm < 0);
const high = result({
    price: 0.001,
    couponRate: 0,
    settlementDate: '2030-08-01',
});
near(high.ytm, 199998, 1e-6);
const endMonth = result({
    maturityDate: '2027-08-31',
    settlementDate: '2026-03-01',
    couponFrequency: 'monthly',
});
assert.equal(endMonth.previousCouponDate, '2026-02-28');
assert.equal(endMonth.nextCouponDate, '2026-03-31');
const leap = result({
    maturityDate: '2024-08-31',
    settlementDate: '2024-02-28',
    issueDate: '2023-01-01',
    couponFrequency: 'monthly',
});
assert.equal(leap.nextCouponDate, '2024-02-29');

// Short/long first coupons use issue only for devengo, never for ordinary dates.
const firstShort = result({
    issueDate: '2026-01-15',
    settlementDate: '2026-04-01',
    firstCouponDate: '2026-07-01',
    maturityDate: '2028-01-01',
});
near(firstShort.cashFlows[0].amount, 4.15);
near(firstShort.accruedInterest, 1.9);
near(
    firstShort.ytm,
    stubReference(86.2, [
        [4.15, 0.5],
        [4.5, 1.5],
        [4.5, 2.5],
        [104.5, 3.5],
    ]),
);
assert.equal(firstShort.previousCouponDate, null);
const firstLong = result({
    issueDate: '2026-01-15',
    settlementDate: '2026-05-01',
    firstCouponDate: '2027-01-01',
    maturityDate: '2028-01-01',
});
near(firstLong.cashFlows[0].amount, 8.65);
near(firstLong.accruedInterest, 2.65);
near(firstLong.firstPeriodFraction, 240 / 180);
near(
    firstLong.ytm,
    stubReference(86.95, [
        [8.65, 4 / 3],
        [4.5, 7 / 3],
        [104.5, 10 / 3],
    ]),
);
const lastShort = result({
    maturityDate: '2027-11-01',
    lastCouponDate: '2027-08-01',
    settlementDate: '2027-09-01',
});
assert.equal(lastShort.cashFlows.length, 1);
near(lastShort.cashFlows[0].amount, 102.25);
near(lastShort.accruedInterest, 0.75);
near(lastShort.firstPeriodFraction, 60 / 180);
near(lastShort.ytm, 2 * ((102.25 / 85.05) ** 3 - 1));
const lastLong = result({
    maturityDate: '2028-05-01',
    lastCouponDate: '2027-08-01',
    settlementDate: '2028-03-01',
});
near(lastLong.cashFlows[0].amount, 106.75);
near(lastLong.accruedInterest, 5.25);
near(lastLong.firstPeriodFraction, 60 / 180);
near(lastLong.ytm, 2 * ((106.75 / 89.55) ** 3 - 1));
for (const overrides of [
    { settlementDate: '2031-02-01' },
    { issueDate: '2027-01-01' },
    { settlementDate: '2026-02-30' },
    { firstCouponDate: '2026-02-15' },
    { lastCouponDate: '2031-03-01' },
])
    assert.equal(solveAdvancedBond({ ...base, ...overrides }), null);
near(
    solveBasicBond({
        price: 100,
        couponRate: 0.09,
        yearsToMaturity: 4,
        face: 1000,
    }).ytm,
    0.09,
);
near(
    solveBasicBond({ price: 80, couponRate: 0, yearsToMaturity: 2 }).ytm,
    (100 / 80) ** 0.5 - 1,
);
const basicShort = solveBasicBond({
    price: 100,
    couponRate: 0.09,
    yearsToMaturity: 0.5,
});
near(basicShort.accruedInterest, 4.5);
assert.ok(Number.isFinite(basicShort.ytm));
for (const price of [0, -1, NaN, Infinity])
    assert.ok(
        Number.isNaN(
            solveBondYield(price, [{ date: null, amount: 100, periods: 1 }], 1),
        ),
    );
assert.ok(
    Number.isNaN(
        solveBondYield(100, [{ date: null, amount: 100, periods: 0 }], 1),
    ),
);
near(
    solveBondYield(1000000, [{ date: null, amount: 100, periods: 1 }], 1),
    -0.9999,
);
// Near-flat derivative when an almost-undiscounted payment dominates the price.
near(
    solveBondYield(
        100.01,
        [
            { date: null, amount: 100, periods: 0 },
            { date: null, amount: 1, periods: 1 },
        ],
        1,
    ),
    99,
    1e-6,
);
assert.ok(
    Number.isNaN(
        solveBondYield(1e100, [{ date: null, amount: 100, periods: 1 }], 1),
    ),
    'An unrepresentable boundary yield is never published',
);
console.log(
    'PASS: bond schedules, clean/dirty percentage prices, accrued interest, all four day counts, stubs, coupon frequencies, negative/high yields and independent CoreWeave Decimal regression.',
);
console.log({
    coreWeaveNominalPct: core.ytm * 100,
    coreWeaveEffectivePct: core.effectiveYtm * 100,
    accrued: core.accruedInterest,
    dirty: core.dirtyPrice,
    nextCoupon: core.nextCouponDate,
});
