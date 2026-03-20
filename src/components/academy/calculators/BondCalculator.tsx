import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Info, AlertTriangle, TrendingDown, Scale, Landmark, HelpCircle, Wallet, CalendarDays, SlidersHorizontal } from 'lucide-react';
import './BondCalculator.css';

type CouponFrequency = 'annual' | 'semiannual' | 'quarterly' | 'monthly';
type PriceInputType = 'clean' | 'dirty';
type DayCountConvention = 'actual365' | 'actual360' | '30e360';

type YtmInputs = {
    price: number;
    couponRate: number;
    yearsToMaturity: number;
    face?: number;
};

type BondCashFlow = {
    timeYears: number;
    amount: number;
};

type BondCalculationResult = {
    ytm: number;
    accruedInterest: number;
    cleanPrice: number;
    dirtyPrice: number;
    yearsToMaturity: number;
    nextCouponDate: string | null;
    previousCouponDate: string | null;
    isAdvanced: boolean;
    compoundingLabel: string;
    priceTypeLabel: string;
};

interface BondCalculatorStorage {
    price: number | string;
    coupon: number | string;
    years: number | string;
    months: number | string;
    face: number | string;
    advancedEnabled: boolean;
    settlementDate: string;
    issueDate: string;
    maturityDate: string;
    couponFrequency: CouponFrequency;
    priceInputType: PriceInputType;
    dayCountConvention: DayCountConvention;
}

const BOND_CALCULATOR_STORAGE_KEY = 'freewallet_bond_calculator';

function getTodayIso() {
    const today = new Date();
    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');
}

function parseIsoDate(value: string) {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function addMonthsUtc(date: Date, months: number) {
    return new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() + months,
        date.getUTCDate()
    ));
}

function dateDiffDaysUtc(start: Date, end: Date) {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

function dayCountFraction(start: Date, end: Date, convention: DayCountConvention) {
    if (end <= start) return 0;

    if (convention === 'actual360') {
        return dateDiffDaysUtc(start, end) / 360;
    }

    if (convention === '30e360') {
        const startDay = Math.min(start.getUTCDate(), 30);
        const endDay = Math.min(end.getUTCDate(), 30);
        const years = end.getUTCFullYear() - start.getUTCFullYear();
        const months = end.getUTCMonth() - start.getUTCMonth();
        const days = endDay - startDay;
        return ((years * 360) + (months * 30) + days) / 360;
    }

    return dateDiffDaysUtc(start, end) / 365;
}

function getPeriodsPerYear(frequency: CouponFrequency) {
    if (frequency === 'semiannual') return 2;
    if (frequency === 'quarterly') return 4;
    if (frequency === 'monthly') return 12;
    return 1;
}

function getFrequencyLabel(frequency: CouponFrequency) {
    if (frequency === 'semiannual') return 'Semestral';
    if (frequency === 'quarterly') return 'Trimestral';
    if (frequency === 'monthly') return 'Mensual';
    return 'Anual';
}

function getPriceTypeLabel(priceType: PriceInputType) {
    return priceType === 'clean' ? 'Precio limpio' : 'Precio sucio';
}

function datesEqual(left: Date, right: Date) {
    return left.getTime() === right.getTime();
}

function buildBasicBondCashFlows(yearsToMaturity: number, annualCoupon: number, face: number): BondCashFlow[] {
    const totalMonths = Math.max(1, Math.round(yearsToMaturity * 12));
    const firstCouponOffsetMonths = totalMonths % 12 === 0 ? 12 : totalMonths % 12;
    const cashFlows: BondCashFlow[] = [];

    for (let paymentMonth = firstCouponOffsetMonths; paymentMonth < totalMonths; paymentMonth += 12) {
        cashFlows.push({
            timeYears: paymentMonth / 12,
            amount: annualCoupon
        });
    }

    cashFlows.push({
        timeYears: totalMonths / 12,
        amount: face + annualCoupon
    });

    return cashFlows;
}

function buildCouponSchedule(issueDate: Date, maturityDate: Date, periodsPerYear: number) {
    const couponMonths = Math.round(12 / periodsPerYear);
    const schedule: Date[] = [];
    let cursor = addMonthsUtc(issueDate, couponMonths);
    let guard = 0;

    while (cursor < maturityDate && guard < 1000) {
        schedule.push(cursor);
        cursor = addMonthsUtc(cursor, couponMonths);
        guard++;
    }

    if (schedule.length === 0 || !datesEqual(schedule[schedule.length - 1], maturityDate)) {
        schedule.push(maturityDate);
    }

    return schedule;
}

function bondPriceResidual(ytm: number, price: number, cashFlows: BondCashFlow[], periodsPerYear: number) {
    const base = 1 + (ytm / periodsPerYear);
    if (base <= 0) {
        return {
            residual: Number.POSITIVE_INFINITY,
            derivative: Number.POSITIVE_INFINITY
        };
    }

    let theoreticalPrice = 0;
    let derivative = 0;

    for (const cashFlow of cashFlows) {
        const exponent = cashFlow.timeYears * periodsPerYear;
        theoreticalPrice += cashFlow.amount / Math.pow(base, exponent);
        derivative += (-cashFlow.timeYears * cashFlow.amount) / Math.pow(base, exponent + 1);
    }

    return {
        residual: theoreticalPrice - price,
        derivative
    };
}

function solveYtmHybrid(price: number, cashFlows: BondCashFlow[], initialGuess: number, periodsPerYear: number) {
    let lower = -0.9999 * periodsPerYear;
    let upper = periodsPerYear;
    let lowerEval = bondPriceResidual(lower, price, cashFlows, periodsPerYear).residual;
    let upperEval = bondPriceResidual(upper, price, cashFlows, periodsPerYear).residual;

    let expansionCount = 0;
    while (lowerEval * upperEval > 0 && expansionCount < 30) {
        upper *= 2;
        upperEval = bondPriceResidual(upper, price, cashFlows, periodsPerYear).residual;
        expansionCount++;
    }

    let ytm = Math.min(Math.max(initialGuess, lower), upper);

    for (let iteration = 0; iteration < 120; iteration++) {
        const { residual, derivative } = bondPriceResidual(ytm, price, cashFlows, periodsPerYear);
        if (!Number.isFinite(residual)) {
            ytm = (lower + upper) / 2;
            continue;
        }

        if (Math.abs(residual) < 1e-13) {
            return ytm;
        }

        let nextYtm = Number.NaN;
        if (Number.isFinite(derivative) && Math.abs(derivative) >= 1e-12) {
            nextYtm = ytm - (residual / derivative);
        }

        if (!Number.isFinite(nextYtm) || nextYtm <= lower || nextYtm >= upper) {
            nextYtm = (lower + upper) / 2;
        }

        const nextResidual = bondPriceResidual(nextYtm, price, cashFlows, periodsPerYear).residual;
        if (!Number.isFinite(nextResidual)) {
            nextYtm = (lower + upper) / 2;
        } else if (lowerEval * nextResidual <= 0) {
            upper = nextYtm;
            upperEval = nextResidual;
        } else {
            lower = nextYtm;
            lowerEval = nextResidual;
        }

        if (Math.abs(nextYtm - ytm) < 1e-13) {
            return nextYtm;
        }

        ytm = nextYtm;
    }

    return ytm;
}

function solveBasicBond({
    price,
    couponRate,
    yearsToMaturity,
    face = 100
}: YtmInputs): BondCalculationResult {
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(couponRate) || couponRate < 0 || !Number.isFinite(yearsToMaturity) || yearsToMaturity <= 0 || !Number.isFinite(face) || face <= 0) {
        return {
            ytm: 0,
            accruedInterest: 0,
            cleanPrice: price,
            dirtyPrice: price,
            yearsToMaturity: 0,
            nextCouponDate: null,
            previousCouponDate: null,
            isAdvanced: false,
            compoundingLabel: 'Anual',
            priceTypeLabel: 'Precio de mercado'
        };
    }

    const annualCoupon = face * couponRate;
    const cashFlows = buildBasicBondCashFlows(yearsToMaturity, annualCoupon, face);
    const initialGuess = (annualCoupon + (face - price) / yearsToMaturity) / ((face + price) / 2);

    return {
        ytm: solveYtmHybrid(price, cashFlows, initialGuess, 1),
        accruedInterest: 0,
        cleanPrice: price,
        dirtyPrice: price,
        yearsToMaturity,
        nextCouponDate: null,
        previousCouponDate: null,
        isAdvanced: false,
        compoundingLabel: 'Anual',
        priceTypeLabel: 'Precio de mercado'
    };
}

function solveAdvancedBond(params: {
    price: number;
    couponRate: number;
    face: number;
    settlementDate: string;
    issueDate: string;
    maturityDate: string;
    couponFrequency: CouponFrequency;
    priceInputType: PriceInputType;
    dayCountConvention: DayCountConvention;
}) {
    const {
        price,
        couponRate,
        face,
        settlementDate,
        issueDate,
        maturityDate,
        couponFrequency,
        priceInputType,
        dayCountConvention
    } = params;

    const settlement = parseIsoDate(settlementDate);
    const issue = parseIsoDate(issueDate);
    const maturity = parseIsoDate(maturityDate);
    const periodsPerYear = getPeriodsPerYear(couponFrequency);

    if (!settlement || !issue || !maturity || settlement >= maturity || issue >= maturity || issue > settlement || !Number.isFinite(price) || price <= 0 || !Number.isFinite(couponRate) || couponRate < 0 || !Number.isFinite(face) || face <= 0) {
        return null;
    }

    const schedule = buildCouponSchedule(issue, maturity, periodsPerYear);
    const nextCoupon = schedule.find((date) => date > settlement) ?? null;
    if (!nextCoupon) return null;

    let previousCoupon = issue;
    for (const couponDate of schedule) {
        if (couponDate <= settlement) {
            previousCoupon = couponDate;
            continue;
        }
        break;
    }

    const couponPerPeriod = face * couponRate / periodsPerYear;
    const periodFraction = dayCountFraction(previousCoupon, nextCoupon, dayCountConvention);
    const elapsedFraction = dayCountFraction(previousCoupon, settlement, dayCountConvention);
    const accruedInterest = periodFraction > 0
        ? couponPerPeriod * Math.min(Math.max(elapsedFraction / periodFraction, 0), 1)
        : 0;

    const dirtyPrice = priceInputType === 'clean' ? price + accruedInterest : price;
    const cleanPrice = priceInputType === 'dirty' ? price - accruedInterest : price;

    const cashFlows: BondCashFlow[] = schedule
        .filter((couponDate) => couponDate > settlement)
        .map((couponDate) => ({
            timeYears: dayCountFraction(settlement, couponDate, dayCountConvention),
            amount: couponPerPeriod + (datesEqual(couponDate, maturity) ? face : 0)
        }));

    if (cashFlows.length === 0) return null;

    const yearsToMaturity = dayCountFraction(settlement, maturity, dayCountConvention);
    const annualCoupon = face * couponRate;
    const initialGuess = (annualCoupon + (face - dirtyPrice) / Math.max(yearsToMaturity, 1e-6)) / ((face + dirtyPrice) / 2);

    return {
        ytm: solveYtmHybrid(dirtyPrice, cashFlows, initialGuess, periodsPerYear),
        accruedInterest,
        cleanPrice,
        dirtyPrice,
        yearsToMaturity,
        nextCouponDate: toIsoDate(nextCoupon),
        previousCouponDate: toIsoDate(previousCoupon),
        isAdvanced: true,
        compoundingLabel: getFrequencyLabel(couponFrequency),
        priceTypeLabel: getPriceTypeLabel(priceInputType)
    } satisfies BondCalculationResult;
}

export function BondCalculator() {
    const todayIso = getTodayIso();
    const defaultSettlementDate = todayIso;
    const defaultMaturityDate = (() => {
        const today = parseIsoDate(todayIso) ?? new Date();
        return toIsoDate(addMonthsUtc(today, 48));
    })();
    const defaultIssueDate = (() => {
        const maturity = parseIsoDate(defaultMaturityDate) ?? new Date();
        return toIsoDate(addMonthsUtc(maturity, -120));
    })();

    const [price, setPrice] = useState<number | string>(83.7);
    const [coupon, setCoupon] = useState<number | string>(8.875);
    const [years, setYears] = useState<number | string>(4);
    const [months, setMonths] = useState<number | string>(0);
    const [face, setFace] = useState<number | string>(100);
    const [advancedEnabled, setAdvancedEnabled] = useState(false);
    const [settlementDate, setSettlementDate] = useState(defaultSettlementDate);
    const [issueDate, setIssueDate] = useState(defaultIssueDate);
    const [maturityDate, setMaturityDate] = useState(defaultMaturityDate);
    const [couponFrequency, setCouponFrequency] = useState<CouponFrequency>('annual');
    const [priceInputType, setPriceInputType] = useState<PriceInputType>('clean');
    const [dayCountConvention, setDayCountConvention] = useState<DayCountConvention>('actual365');

    useEffect(() => {
        try {
            const raw = localStorage.getItem(BOND_CALCULATOR_STORAGE_KEY);
            if (!raw) return;

            const stored = JSON.parse(raw) as Partial<BondCalculatorStorage>;
            if (stored.price !== undefined) setPrice(stored.price);
            if (stored.coupon !== undefined) setCoupon(stored.coupon);
            if (stored.years !== undefined) setYears(stored.years);
            if (stored.months !== undefined) setMonths(stored.months);
            if (stored.face !== undefined) setFace(stored.face);
            if (typeof stored.advancedEnabled === 'boolean') setAdvancedEnabled(stored.advancedEnabled);
            if (stored.settlementDate) setSettlementDate(stored.settlementDate);
            if (stored.issueDate) setIssueDate(stored.issueDate);
            if (stored.maturityDate) setMaturityDate(stored.maturityDate);
            if (stored.couponFrequency) setCouponFrequency(stored.couponFrequency);
            if (stored.priceInputType) setPriceInputType(stored.priceInputType);
            if (stored.dayCountConvention) setDayCountConvention(stored.dayCountConvention);
        } catch {
            // Ignore localStorage failures or malformed saved values.
        }
    }, []);

    useEffect(() => {
        const payload: BondCalculatorStorage = {
            price,
            coupon,
            years,
            months,
            face,
            advancedEnabled,
            settlementDate,
            issueDate,
            maturityDate,
            couponFrequency,
            priceInputType,
            dayCountConvention
        };
        try {
            localStorage.setItem(BOND_CALCULATOR_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // Ignore localStorage failures.
        }
    }, [
        price,
        coupon,
        years,
        months,
        face,
        advancedEnabled,
        settlementDate,
        issueDate,
        maturityDate,
        couponFrequency,
        priceInputType,
        dayCountConvention
    ]);

    const normalizedYears = years === '' ? 0 : Math.max(0, Math.floor(Number(years)));
    const normalizedMonths = months === '' ? 0 : Math.min(11, Math.max(0, Math.floor(Number(months))));
    const totalYearsToMaturity = normalizedYears + (normalizedMonths / 12);

    const calculation = useMemo(() => {
        const numericPrice = price === '' ? 0 : Number(price);
        const numericCoupon = coupon === '' ? 0 : Number(coupon);
        const numericFace = face === '' ? 0 : Number(face);

        if (advancedEnabled) {
            const advancedResult = solveAdvancedBond({
                price: numericPrice,
                couponRate: numericCoupon / 100,
                face: numericFace,
                settlementDate,
                issueDate,
                maturityDate,
                couponFrequency,
                priceInputType,
                dayCountConvention
            });

            if (advancedResult) {
                return advancedResult;
            }
        }

        return solveBasicBond({
            price: numericPrice,
            couponRate: numericCoupon / 100,
            yearsToMaturity: totalYearsToMaturity,
            face: numericFace
        });
    }, [
        price,
        coupon,
        face,
        totalYearsToMaturity,
        advancedEnabled,
        settlementDate,
        issueDate,
        maturityDate,
        couponFrequency,
        priceInputType,
        dayCountConvention
    ]);

    const handleInput = (setter: (val: string | number) => void) => (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setter(val === '' ? '' : val);
    };

    const showAdvancedPriceBreakdown = calculation.isAdvanced
        && Math.abs(calculation.cleanPrice - calculation.dirtyPrice) > 0.0001;
    const showAccruedInterest = calculation.isAdvanced && Math.abs(calculation.accruedInterest) > 0.0001;

    return (
        <div className="bond-calc">
            <header className="bond-calc__header">
                <h1 className="bond-calc__title">Calculadora de Bonos (TIR)</h1>
                <p className="bond-calc__subtitle">
                    Calcula la rentabilidad real de un bono (Yield to Maturity) a partir de su precio actual de mercado.
                </p>
            </header>

            <div className="bond-calc__grid">
                <div className="bond-calc__inputs">
                    <div className="bond-calc__inputs-header">
                        <h3>Parámetros</h3>
                    </div>

                    <div className="calc__input-group">
                        <label htmlFor="bond-price">Precio Actual</label>
                        <div className="calc__input-wrapper">
                            <Scale size={18} />
                            <input
                                id="bond-price"
                                type="number"
                                value={price}
                                onChange={handleInput(setPrice)}
                                step="0.1"
                                placeholder="83.7"
                            />
                            <span className="unit">% s/ par</span>
                        </div>
                    </div>

                    <div className="calc__input-group">
                        <label htmlFor="bond-coupon">Cupón Anual</label>
                        <div className="calc__input-wrapper">
                            <TrendingDown size={18} />
                            <input
                                id="bond-coupon"
                                type="number"
                                value={coupon}
                                onChange={handleInput(setCoupon)}
                                step="0.01"
                                placeholder="8.875"
                            />
                            <span className="unit">%</span>
                        </div>
                    </div>

                    {!advancedEnabled && (
                    <div className="calc__input-group">
                        <label>Vencimiento</label>
                        <div className="bond-calc__maturity-grid">
                            <div className="calc__input-wrapper">
                                <Landmark size={18} />
                                <input
                                    type="number"
                                    value={years}
                                    onChange={handleInput(setYears)}
                                    min="0"
                                    step="1"
                                    placeholder="4"
                                />
                                <span className="unit">años</span>
                            </div>
                            <div className="calc__input-wrapper">
                                <Landmark size={18} />
                                <input
                                    type="number"
                                    value={months}
                                    onChange={handleInput(setMonths)}
                                    min="0"
                                    max="11"
                                    step="1"
                                    placeholder="0"
                                />
                                <span className="unit">meses</span>
                            </div>
                        </div>
                    </div>
                    )}

                    <div className="calc__input-group">
                        <label>Valor Nominal (Par)</label>
                        <div className="calc__input-wrapper">
                            <Info size={18} />
                            <input
                                type="number"
                                value={face}
                                onChange={handleInput(setFace)}
                                placeholder="100"
                            />
                            <span className="unit">€</span>
                        </div>
                    </div>
                    <div className="bond-calc__advanced">
                        <button
                            type="button"
                            className={`bond-calc__advanced-toggle ${advancedEnabled ? 'bond-calc__advanced-toggle--active' : ''}`}
                            onClick={() => setAdvancedEnabled((current) => !current)}
                        >
                            <span className="bond-calc__advanced-label">
                                <SlidersHorizontal size={16} />
                                Cálculo avanzado
                            </span>
                            <span>{advancedEnabled ? 'Activado' : 'Desactivado'}</span>
                        </button>

                        {advancedEnabled && (
                            <div className="bond-calc__advanced-grid">
                                <div className="calc__input-group">
                                    <label htmlFor="bond-settlement-date">Fecha de liquidacion</label>
                                    <div className="calc__input-wrapper">
                                        <CalendarDays size={18} />
                                        <input
                                            id="bond-settlement-date"
                                            type="date"
                                            value={settlementDate}
                                            onChange={(event) => setSettlementDate(event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="calc__input-group">
                                    <label htmlFor="bond-issue-date">Fecha de emision</label>
                                    <div className="calc__input-wrapper">
                                        <CalendarDays size={18} />
                                        <input
                                            id="bond-issue-date"
                                            type="date"
                                            value={issueDate}
                                            onChange={(event) => setIssueDate(event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="calc__input-group">
                                    <label htmlFor="bond-maturity-date">Fecha de vencimiento</label>
                                    <div className="calc__input-wrapper">
                                        <CalendarDays size={18} />
                                        <input
                                            id="bond-maturity-date"
                                            type="date"
                                            value={maturityDate}
                                            onChange={(event) => setMaturityDate(event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="calc__input-group">
                                    <label htmlFor="bond-frequency">Frecuencia de cupón</label>
                                    <div className="calc__input-wrapper">
                                        <TrendingDown size={18} />
                                        <select
                                            id="bond-frequency"
                                            value={couponFrequency}
                                            onChange={(event) => setCouponFrequency(event.target.value as CouponFrequency)}
                                        >
                                            <option value="annual">Anual</option>
                                            <option value="semiannual">Semestral</option>
                                            <option value="quarterly">Trimestral</option>
                                            <option value="monthly">Mensual</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="calc__input-group">
                                    <label htmlFor="bond-price-type">Tipo de precio</label>
                                    <div className="calc__input-wrapper">
                                        <Wallet size={18} />
                                        <select
                                            id="bond-price-type"
                                            value={priceInputType}
                                            onChange={(event) => setPriceInputType(event.target.value as PriceInputType)}
                                        >
                                            <option value="clean">Limpio (sin cópon corrido)</option>
                                            <option value="dirty">Sucio (con cupón corrido)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="calc__input-group">
                                    <label htmlFor="bond-day-count">Convencion day count</label>
                                    <div className="calc__input-wrapper">
                                        <Landmark size={18} />
                                        <select
                                            id="bond-day-count"
                                            value={dayCountConvention}
                                            onChange={(event) => setDayCountConvention(event.target.value as DayCountConvention)}
                                        >
                                            <option value="actual365">Actual / 365</option>
                                            <option value="actual360">Actual / 360</option>
                                            <option value="30e360">30E / 360</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bond-calc__results">
                    <div className="result-main-card">
                        <span className="label">TIR / YTM (Anualizada)</span>
                        <h2 className="result-value">{(calculation.ytm * 100).toFixed(2)}%</h2>
                        <p className="result-main-card__subtext">
                            {calculation.isAdvanced
                                ? `Método: descuento de flujos con day count, cupón ${calculation.compoundingLabel.toLowerCase()} y solver híbrido Newton-Raphson + bisección`
                                : 'Método: descuento de flujos aproximados y solver híbrido Newton-Raphson + bisección'}
                        </p>
                    </div>

                                        <div className="result-details">
                        <div className="detail-box">
                            <span className="label">Situacion</span>
                            <span className={`status-badge ${Number(price) < Number(face) ? 'status-badge--discount' : Number(price) > Number(face) ? 'status-badge--premium' : 'status-badge--par'}`}>
                                {Number(price) < Number(face) ? 'Bajo Par (Descuento)' : Number(price) > Number(face) ? 'Sobre Par (Prima)' : 'Al Par'}
                            </span>
                        </div>
                        <div className="detail-box">
                            <span className="label">Cupón en Dinero</span>
                            <div className="coupon-value">
                                <Wallet size={16} className="coupon-value__icon" />
                                <span className="value">{(Number(face) * (Number(coupon) / 100)).toFixed(2)} EUR</span>
                            </div>
                        </div>
                        {showAdvancedPriceBreakdown && (
                            <div className="detail-box">
                                <span className="label">Precio Limpio</span>
                                <span className="detail-box__value">{calculation.cleanPrice.toFixed(4)}</span>
                            </div>
                        )}
                        {showAdvancedPriceBreakdown && (
                            <div className="detail-box">
                                <span className="label">Precio Sucio</span>
                                <span className="detail-box__value">{calculation.dirtyPrice.toFixed(4)}</span>
                            </div>
                        )}
                        {showAccruedInterest && (
                            <div className="detail-box">
                                <span className="label">Cupón Corrido</span>
                                <span className="detail-box__value">{calculation.accruedInterest.toFixed(6)}</span>
                            </div>
                        )}
                        {calculation.isAdvanced && (
                            <div className="detail-box">
                                <span className="label">Próximo Cupón</span>
                                <span className="detail-box__value">{calculation.nextCouponDate ?? '--'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bond-calc-edu">
                <div className="edu-card">
                    <h3><HelpCircle size={20} /> ¿Qué es la TIR / YTM?</h3>
                    <p>
                        La TIR (Tasa Interna de Retorno) o YTM (Yield to Maturity) es la rentabilidad total anual que obtendrás
                        si compras un bono hoy y lo mantienes hasta su vencimiento, reinvirtiendo todos los cupones a esa misma tasa.
                    </p>
                </div>
                <div className="edu-card">
                    <h3><TrendingDown size={20} /> Relación Inversa</h3>
                    <p>
                        Cuando los tipos de interés del mercado suben, el precio de los bonos antiguos baja para ofrecer una TIR competitiva.
                        Es la regla de oro de la renta fija: Tipos ⬆️ = Precios ⬇️.
                    </p>
                </div>
                <div className="edu-card">
                    <h3><AlertTriangle size={20} /> Riesgos Clave</h3>
                    <p>
                        Incluso los bonos tienen riesgo. El principal es el de <strong>crédito</strong> (que el emisor no pague)
                        y el de <strong>duración</strong> (que el precio caiga mucho ante subidas de tipos si el plazo es largo).
                    </p>
                </div>
            </div>
        </div>
    );
}
