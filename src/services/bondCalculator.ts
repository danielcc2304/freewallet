import { addMonthsClampedUtc } from '../components/academy/calculators/calculatorValidation';

export type CouponFrequency = 'annual' | 'semiannual' | 'quarterly' | 'monthly';
export type PriceInputType = 'clean' | 'dirty';
export type DayCountConvention =
    | 'actual365'
    | 'actual360'
    | '30e360'
    | '30us360';
export type BondCashFlow = {
    date: string | null;
    periods: number;
    amount: number;
};
export type BondCalculationResult = {
    ytm: number;
    effectiveYtm: number;
    periodicYield: number;
    accruedInterest: number;
    cleanPrice: number;
    dirtyPrice: number;
    yearsToMaturity: number;
    nextCouponDate: string | null;
    previousCouponDate: string | null;
    isAdvanced: boolean;
    compoundingLabel: string;
    priceTypeLabel: string;
    dayCountLabel: string;
    periodsPerYear: number;
    firstPeriodFraction: number;
    cashFlows: BondCashFlow[];
    accrualStartDate: string | null;
    hasIrregularCoupons: boolean;
};
export function parseIsoDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parsed = new Date(value + 'T00:00:00Z');
    return Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== value
        ? null
        : parsed;
}
export function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10);
}
export function addMonthsUtc(date: Date, months: number) {
    return addMonthsClampedUtc(date, months);
}
const actualDays = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 86400000;
const lastFebruaryDay = (date: Date) =>
    date.getUTCMonth() === 1 &&
    date.getUTCDate() ===
        new Date(Date.UTC(date.getUTCFullYear(), 2, 0)).getUTCDate();

/** Eurobond 30E/360 and US NASD/SIFMA 30/360; neither is 30E/360 ISDA. */
export function bondDayCount(
    start: Date,
    end: Date,
    convention: DayCountConvention,
): number {
    if (end < start) return -bondDayCount(end, start, convention);
    if (end.getTime() === start.getTime()) return 0;
    if (convention === 'actual365' || convention === 'actual360')
        return actualDays(start, end);
    let d1 = start.getUTCDate(),
        d2 = end.getUTCDate();
    if (convention === '30e360') {
        d1 = Math.min(d1, 30);
        d2 = Math.min(d2, 30);
    } else {
        const febStart = lastFebruaryDay(start);
        if (febStart && lastFebruaryDay(end)) d2 = 30;
        if (febStart || d1 === 31) d1 = 30;
        if (d2 === 31 && d1 >= 30) d2 = 30;
    }
    return (
        (end.getUTCFullYear() - start.getUTCFullYear()) * 360 +
        (end.getUTCMonth() - start.getUTCMonth()) * 30 +
        d2 -
        d1
    );
}
export function bondYearFraction(
    start: Date,
    end: Date,
    convention: DayCountConvention,
) {
    return (
        bondDayCount(start, end, convention) /
        (convention === 'actual365' ? 365 : 360)
    );
}
export function dayCountLabel(convention: DayCountConvention) {
    return {
        actual365: 'Actual / 365 (fijo)',
        actual360: 'Actual / 360',
        '30e360': '30E / 360 (Eurobond)',
        '30us360': '30 / 360 US (NASD)',
    }[convention];
}
export function periodsPerYear(frequency: CouponFrequency) {
    return { annual: 1, semiannual: 2, quarterly: 4, monthly: 12 }[frequency];
}
const frequencyLabel = (frequency: CouponFrequency) =>
    ({
        annual: 'Anual',
        semiannual: 'Semestral',
        quarterly: 'Trimestral',
        monthly: 'Mensual',
    })[frequency];

/** Always anchor to maturity, including month ends. Settlement on a coupon
 * excludes that payment. Issue date does not set ordinary coupon dates. */
export function buildBondCouponSchedule(
    settlement: Date,
    maturity: Date,
    frequency: CouponFrequency,
) {
    const interval = 12 / periodsPerYear(frequency),
        future: Date[] = [];
    for (let i = 0; i <= 1200; i++) {
        const date = addMonthsUtc(maturity, -i * interval);
        if (date <= settlement)
            return { previous: date, dates: future.reverse() };
        future.push(date);
    }
    return null;
}

/** Count quasi-coupon periods for short/long stubs using the regular calendar. */
function couponPeriodDistance(
    start: Date,
    end: Date,
    anchor: Date,
    frequency: CouponFrequency,
    basis: DayCountConvention,
) {
    if (end < start) return NaN;
    const interval = 12 / periodsPerYear(frequency);
    const reference = (date: Date) => {
        const months =
            (date.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
            date.getUTCMonth() -
            anchor.getUTCMonth();
        let index = Math.floor(months / interval);
        let left = addMonthsUtc(anchor, index * interval);
        if (left > date) {
            index--;
            left = addMonthsUtc(anchor, index * interval);
        }
        let right = addMonthsUtc(anchor, (index + 1) * interval);
        if (right <= date) {
            index++;
            left = right;
            right = addMonthsUtc(anchor, (index + 1) * interval);
        }
        return { index, left, right, days: bondDayCount(left, right, basis) };
    };
    const a = reference(start),
        b = reference(end);
    if (a.days <= 0 || b.days <= 0) return NaN;
    if (a.index === b.index) return bondDayCount(start, end, basis) / a.days;
    return (
        bondDayCount(start, a.right, basis) / a.days +
        (b.index - a.index - 1) +
        bondDayCount(b.left, end, basis) / b.days
    );
}

/** Hybrid Newton/bisection in log(1+y/m). Positive cash flows have a unique
 * monotone root. Log-sum-exp keeps negative-yield brackets from overflowing. */
export function solveBondYield(
    price: number,
    flows: BondCashFlow[],
    m: number,
): number {
    if (
        !(price > 0) ||
        !Number.isFinite(price) ||
        !(m > 0) ||
        !Number.isFinite(m) ||
        !flows.length ||
        flows.some(
            (f) =>
                !Number.isFinite(f.amount) ||
                f.amount < 0 ||
                !Number.isFinite(f.periods) ||
                f.periods < 0,
        ) ||
        !flows.some((f) => f.amount > 0 && f.periods > 0)
    )
        return NaN;
    const positive = flows.filter((f) => f.amount > 0);
    if (
        positive
            .filter((f) => f.periods === 0)
            .reduce((sum, f) => sum + f.amount, 0) >= price
    )
        return NaN;
    const evaluate = (x: number) => {
        const logs = positive.map((f) => Math.log(f.amount) - f.periods * x),
            peak = Math.max(...logs);
        let sum = 0,
            weighted = 0;
        logs.forEach((log, i) => {
            const weight = Math.exp(log - peak);
            sum += weight;
            weighted += weight * positive[i].periods;
        });
        return {
            residual: peak + Math.log(sum) - Math.log(price),
            derivative: -weighted / sum,
        };
    };
    let lower = -1,
        upper = 1;
    for (let i = 0; i < 60 && evaluate(lower).residual < 0; i++) lower *= 2;
    for (let i = 0; i < 60 && evaluate(upper).residual > 0; i++) upper *= 2;
    if (evaluate(lower).residual < 0 || evaluate(upper).residual > 0)
        return NaN;
    let x = 0;
    for (let i = 0; i < 256; i++) {
        const { residual, derivative } = evaluate(x);
        if (Math.abs(residual) <= 1e-12) {
            const value = m * Math.expm1(x),
                represented = Math.log1p(value / m);
            return Number.isFinite(value) &&
                Number.isFinite(represented) &&
                Math.abs(evaluate(represented).residual) <= 1e-9
                ? value
                : NaN;
        }
        if (residual > 0) lower = x;
        else upper = x;
        const next = x - residual / derivative;
        x =
            Number.isFinite(next) && next > lower && next < upper
                ? next
                : (lower + upper) / 2;
    }
    return NaN; // Do not publish an unconverged guess.
}
function invalidBasic(price: number): BondCalculationResult {
    return {
        ytm: NaN,
        effectiveYtm: NaN,
        periodicYield: NaN,
        accruedInterest: 0,
        cleanPrice: price,
        dirtyPrice: price,
        yearsToMaturity: 0,
        nextCouponDate: null,
        previousCouponDate: null,
        isAdvanced: false,
        compoundingLabel: 'Anual',
        priceTypeLabel: 'Precio limpio',
        dayCountLabel: 'Periodos anuales aproximados',
        periodsPerYear: 1,
        firstPeriodFraction: NaN,
        cashFlows: [],
        accrualStartDate: null,
        hasIrregularCoupons: false,
    };
}
/** Basic mode: clean percentage price and assumed regular annual coupons. */
export function solveBasicBond({
    price,
    couponRate,
    yearsToMaturity,
    face = 100,
}: {
    price: number;
    couponRate: number;
    yearsToMaturity: number;
    face?: number;
}): BondCalculationResult {
    if (
        !(price > 0) ||
        !Number.isFinite(price) ||
        couponRate < 0 ||
        !Number.isFinite(couponRate) ||
        !(yearsToMaturity > 0) ||
        yearsToMaturity >= 101 ||
        !Number.isFinite(yearsToMaturity) ||
        !(face > 0) ||
        !Number.isFinite(face)
    )
        return invalidBasic(price);
    const count = Math.ceil(yearsToMaturity);
    const offset = yearsToMaturity - (count - 1);
    const annualCoupon = face * couponRate,
        cleanPrice = (face * price) / 100,
        accruedInterest = annualCoupon * (1 - offset);
    const dirtyPrice = cleanPrice + accruedInterest;
    const cashFlows: BondCashFlow[] = Array.from({ length: count }, (_, i) => ({
        date: null,
        periods: offset + i,
        amount: annualCoupon + (i === count - 1 ? face : 0),
    }));
    const ytm = solveBondYield(dirtyPrice, cashFlows, 1);
    return {
        ytm,
        effectiveYtm: ytm,
        periodicYield: ytm,
        accruedInterest,
        cleanPrice,
        dirtyPrice,
        yearsToMaturity,
        nextCouponDate: null,
        previousCouponDate: null,
        isAdvanced: false,
        compoundingLabel: 'Anual',
        priceTypeLabel: 'Precio limpio',
        dayCountLabel: 'Periodos anuales aproximados',
        periodsPerYear: 1,
        firstPeriodFraction: offset,
        cashFlows,
        accrualStartDate: null,
        hasIrregularCoupons: false,
    };
}
/** Regular fixed-coupon bullet bond, no payment-date adjustment or ex-coupon
 * period. Odd coupons, calls and amortization require their contractual schedule. */
export function solveAdvancedBond(params: {
    price: number;
    couponRate: number;
    face: number;
    settlementDate: string;
    issueDate: string;
    maturityDate: string;
    couponFrequency: CouponFrequency;
    priceInputType: PriceInputType;
    dayCountConvention: DayCountConvention;
    firstCouponDate?: string;
    lastCouponDate?: string;
}): BondCalculationResult | null {
    const {
        price,
        couponRate,
        face,
        couponFrequency,
        priceInputType,
        dayCountConvention,
    } = params;
    const settlement = parseIsoDate(params.settlementDate),
        maturity = parseIsoDate(params.maturityDate);
    const issue = params.issueDate ? parseIsoDate(params.issueDate) : null;
    if (
        !settlement ||
        !maturity ||
        settlement >= maturity ||
        actualDays(settlement, maturity) > 36600 ||
        (params.issueDate && (!issue || issue > settlement)) ||
        !(price > 0) ||
        !Number.isFinite(price) ||
        couponRate < 0 ||
        !Number.isFinite(couponRate) ||
        !(face > 0) ||
        !Number.isFinite(face)
    )
        return null;
    const first = params.firstCouponDate
        ? parseIsoDate(params.firstCouponDate)
        : null;
    const last = params.lastCouponDate
        ? parseIsoDate(params.lastCouponDate)
        : null;
    if (
        (params.firstCouponDate &&
            (!first || first > maturity || (issue && first <= issue))) ||
        (params.lastCouponDate &&
            (!last || last >= maturity || (issue && last <= issue))) ||
        (first && last && first > last)
    )
        return null;
    const anchor = last ?? maturity,
        m = periodsPerYear(couponFrequency);
    if (first) {
        const months =
            (anchor.getUTCFullYear() - first.getUTCFullYear()) * 12 +
            anchor.getUTCMonth() -
            first.getUTCMonth();
        if (
            months < 0 ||
            months % (12 / m) !== 0 ||
            toIsoDate(addMonthsUtc(anchor, -months)) !== toIsoDate(first)
        )
            return null;
    }
    const schedule = buildBondCouponSchedule(
        settlement,
        anchor,
        couponFrequency,
    );
    if (!schedule) return null;
    const future = schedule.dates.filter((date) => !first || date >= first);
    if (last) future.push(maturity);
    if (!future.length) return null;
    const next = future[0];
    const isFirstPeriod =
        !!issue &&
        ((first && first > settlement) ||
            (!first && issue > schedule.previous));
    if (first && first > settlement && !issue) return null;
    const accrualStart = isFirstPeriod ? issue! : schedule.previous;
    const distance = (a: Date, b: Date) =>
        couponPeriodDistance(a, b, anchor, couponFrequency, dayCountConvention);
    const couponPayment = (face * couponRate) / m;
    const accruedInterest = couponPayment * distance(accrualStart, settlement);
    const w = distance(settlement, next),
        quotedAmount = (face * price) / 100;
    if (!Number.isFinite(accruedInterest) || !Number.isFinite(w) || w < 0)
        return null;
    const dirtyPrice =
        priceInputType === 'clean'
            ? quotedAmount + accruedInterest
            : quotedAmount;
    const cleanPrice =
        priceInputType === 'dirty'
            ? quotedAmount - accruedInterest
            : quotedAmount;
    const cashFlows = future.map((date, i) => ({
        date: toIsoDate(date),
        periods: distance(settlement, date),
        amount:
            couponPayment *
                (last && date.getTime() === maturity.getTime()
                    ? distance(last, maturity)
                    : isFirstPeriod && i === 0
                      ? distance(issue!, date)
                      : 1) +
            (i === future.length - 1 ? face : 0),
    }));
    const ytm = solveBondYield(dirtyPrice, cashFlows, m),
        periodicYield = ytm / m,
        effectiveYtm = Math.expm1(m * Math.log1p(periodicYield));
    return {
        ytm,
        effectiveYtm,
        periodicYield,
        accruedInterest,
        cleanPrice,
        dirtyPrice,
        yearsToMaturity: bondYearFraction(
            settlement,
            maturity,
            dayCountConvention,
        ),
        nextCouponDate: toIsoDate(next),
        previousCouponDate: isFirstPeriod ? null : toIsoDate(schedule.previous),
        isAdvanced: true,
        compoundingLabel: frequencyLabel(couponFrequency),
        priceTypeLabel:
            priceInputType === 'clean' ? 'Precio limpio' : 'Precio sucio',
        dayCountLabel: dayCountLabel(dayCountConvention),
        periodsPerYear: m,
        firstPeriodFraction: w,
        cashFlows,
        accrualStartDate: toIsoDate(accrualStart),
        hasIrregularCoupons: !!last || !!isFirstPeriod,
    };
}
