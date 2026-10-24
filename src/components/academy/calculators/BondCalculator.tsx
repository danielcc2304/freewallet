import { CalculatorGrid } from './CalculatorGrid';
import { CalculatorHeroMetric } from './CalculatorHeroMetric';
import { CalculatorEducationCard } from './CalculatorEducationCard';
import { CalculatorField } from './CalculatorField';
import { CalculatorDisclosure } from './CalculatorDisclosure';
import { CalculatorDataItem } from './CalculatorDataItem';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
    Info,
    AlertTriangle,
    TrendingDown,
    Scale,
    Landmark,
    HelpCircle,
    Wallet,
    CalendarDays,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { validateCalculatorInputs } from './calculatorValidation';
import {
    solveBasicBond,
    solveAdvancedBond,
    parseIsoDate,
    toIsoDate,
    addMonthsUtc,
    type CouponFrequency,
    type PriceInputType,
    type DayCountConvention,
} from '../../../services/bondCalculator';
import './BondCalculator.css';

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
    firstCouponDate: string;
    lastCouponDate: string;
    couponFrequency: CouponFrequency;
    priceInputType: PriceInputType;
    dayCountConvention: DayCountConvention;
}

const BOND_CALCULATOR_STORAGE_KEY = 'freewallet_bond_calculator';

function readStoredBondCalculator(): Partial<BondCalculatorStorage> {
    if (typeof window === 'undefined') return {};

    try {
        const raw = window.localStorage.getItem(BOND_CALCULATOR_STORAGE_KEY);
        if (!raw) return {};

        const stored = JSON.parse(raw) as unknown;
        return stored && typeof stored === 'object'
            ? (stored as Partial<BondCalculatorStorage>)
            : {};
    } catch {
        return {};
    }
}

function getTodayIso() {
    const today = new Date();
    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-');
}

export function BondCalculator() {
    const todayIso = getTodayIso();
    const defaultSettlementDate = todayIso;
    const defaultMaturityDate = (() => {
        const today = parseIsoDate(todayIso) ?? new Date();
        return toIsoDate(addMonthsUtc(today, 48));
    })();

    const stored = useMemo(() => readStoredBondCalculator(), []);
    const initialCouponFrequency: CouponFrequency =
        stored.couponFrequency === 'semiannual' ||
        stored.couponFrequency === 'quarterly' ||
        stored.couponFrequency === 'monthly'
            ? stored.couponFrequency
            : 'annual';
    const initialPriceInputType: PriceInputType =
        stored.priceInputType === 'dirty' ? 'dirty' : 'clean';
    const initialDayCountConvention: DayCountConvention =
        stored.dayCountConvention === 'actual360' ||
        stored.dayCountConvention === '30e360' ||
        stored.dayCountConvention === '30us360'
            ? stored.dayCountConvention
            : 'actual365';

    const [price, setPrice] = useState<number | string>(stored.price ?? 83.7);
    const [coupon, setCoupon] = useState<number | string>(
        stored.coupon ?? 8.875,
    );
    const [years, setYears] = useState<number | string>(stored.years ?? 4);
    const [months, setMonths] = useState<number | string>(stored.months ?? 0);
    const [face, setFace] = useState<number | string>(stored.face ?? 100);
    const [advancedEnabled, setAdvancedEnabled] = useState(
        stored.advancedEnabled ?? false,
    );
    const [settlementDate, setSettlementDate] = useState(
        stored.settlementDate || defaultSettlementDate,
    );
    const [issueDate, setIssueDate] = useState(stored.issueDate ?? '');
    const [maturityDate, setMaturityDate] = useState(
        stored.maturityDate || defaultMaturityDate,
    );
    const [firstCouponDate, setFirstCouponDate] = useState(
        stored.firstCouponDate || '',
    );
    const [lastCouponDate, setLastCouponDate] = useState(
        stored.lastCouponDate || '',
    );
    const [couponFrequency, setCouponFrequency] = useState<CouponFrequency>(
        initialCouponFrequency,
    );
    const [priceInputType, setPriceInputType] = useState<PriceInputType>(
        initialPriceInputType,
    );
    const [dayCountConvention, setDayCountConvention] =
        useState<DayCountConvention>(initialDayCountConvention);

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
            firstCouponDate,
            lastCouponDate,
            couponFrequency,
            priceInputType,
            dayCountConvention,
        };
        try {
            localStorage.setItem(
                BOND_CALCULATOR_STORAGE_KEY,
                JSON.stringify(payload),
            );
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
        firstCouponDate,
        lastCouponDate,
        couponFrequency,
        priceInputType,
        dayCountConvention,
    ]);

    const normalizedYears =
        years === '' ? 0 : Math.max(0, Math.floor(Number(years)));
    const normalizedMonths =
        months === ''
            ? 0
            : Math.min(11, Math.max(0, Math.floor(Number(months))));
    const totalYearsToMaturity = normalizedYears + normalizedMonths / 12;

    const calculation = useMemo(() => {
        const numericPrice = price === '' ? 0 : Number(price);
        const numericCoupon = coupon === '' ? 0 : Number(coupon);
        const numericFace = face === '' ? 0 : Number(face);
        const inputError = validateCalculatorInputs([
            { label: 'Precio', value: price, min: 0.000001 },
            { label: 'Cupón', value: coupon, max: 100 },
            { label: 'Nominal', value: face, min: 0.000001 },
            ...(advancedEnabled
                ? []
                : [
                      { label: 'Años', value: years, max: 100, integer: true },
                      { label: 'Meses', value: months, max: 11, integer: true },
                  ]),
        ]);
        if (inputError)
            return solveBasicBond({
                price: 0,
                couponRate: 0,
                yearsToMaturity: 0,
            });

        if (advancedEnabled) {
            const advancedResult = solveAdvancedBond({
                price: numericPrice,
                couponRate: numericCoupon / 100,
                face: numericFace,
                settlementDate,
                issueDate,
                maturityDate,
                firstCouponDate,
                lastCouponDate,
                couponFrequency,
                priceInputType,
                dayCountConvention,
            });

            if (advancedResult) {
                return advancedResult;
            }
            return solveBasicBond({
                price: 0,
                couponRate: 0,
                yearsToMaturity: 0,
            });
        }

        return solveBasicBond({
            price: numericPrice,
            couponRate: numericCoupon / 100,
            yearsToMaturity: totalYearsToMaturity,
            face: numericFace,
        });
    }, [
        price,
        coupon,
        face,
        totalYearsToMaturity,
        years,
        months,
        advancedEnabled,
        settlementDate,
        issueDate,
        maturityDate,
        firstCouponDate,
        lastCouponDate,
        couponFrequency,
        priceInputType,
        dayCountConvention,
    ]);

    const handleInput =
        (setter: (val: string | number) => void) =>
        (e: ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setter(val === '' ? '' : val);
        };

    const showAdvancedPriceBreakdown =
        calculation.isAdvanced &&
        Math.abs(calculation.cleanPrice - calculation.dirtyPrice) > 0.0001;
    const showAccruedInterest =
        calculation.isAdvanced &&
        Math.abs(calculation.accruedInterest) > 0.0001;
    const parDelta = calculation.cleanPrice - Number(face);
    const parStatus =
        Math.abs(parDelta) <= Math.max(1, Number(face)) * 1e-10
            ? 0
            : Math.sign(parDelta);

    return (
        <div className="bond-calc">
            <AcademyPageHeader
                className="bond-calc__header"
                section="Herramientas">
                <h1 className="bond-calc__title">Calculadora de Bonos (TIR)</h1>
                <p className="bond-calc__subtitle">
                    Calcula la rentabilidad al vencimiento de un bono a partir
                    de su precio de mercado.
                </p>
            </AcademyPageHeader>

            <CalculatorGrid variant="bond-grid">
                <div className="bond-calc__inputs">
                    <div className="bond-calc__inputs-header">
                        <h3>Parámetros</h3>
                    </div>

                    <CalculatorField
                        controlId="bond-price"
                        label="Precio Actual"
                        icon={<Scale size={18} />}
                        unit="% s/ par">
                        <input
                            id="bond-price"
                            type="number"
                            value={price}
                            onChange={handleInput(setPrice)}
                            step="any"
                            placeholder="83.7"
                        />
                    </CalculatorField>

                    <CalculatorField
                        controlId="bond-coupon"
                        label="Cupón Anual"
                        icon={<TrendingDown size={18} />}
                        unit="%">
                        <input
                            id="bond-coupon"
                            type="number"
                            value={coupon}
                            onChange={handleInput(setCoupon)}
                            step="any"
                            placeholder="8.875"
                        />
                    </CalculatorField>

                    {!advancedEnabled && (
                        <div className="calc__input-group">
                            <label>Vencimiento</label>
                            <CalculatorGrid variant="bond-maturity-grid">
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
                            </CalculatorGrid>
                        </div>
                    )}

                    <CalculatorField
                        controlId="bond-face"
                        label="Valor Nominal (Par)"
                        icon={<Info size={18} />}
                        unit="u.m.">
                        <input
                            id="bond-face"
                            type="number"
                            step="any"
                            value={face}
                            onChange={handleInput(setFace)}
                            placeholder="100"
                        />
                    </CalculatorField>
                    <div className="bond-calc__advanced">
                        <button
                            type="button"
                            className="bond-calc__advanced-toggle"
                            onClick={() =>
                                setAdvancedEnabled((current) => !current)
                            }>
                            <span>Opciones avanzadas</span>
                            {advancedEnabled ? (
                                <ChevronUp size={18} />
                            ) : (
                                <ChevronDown size={18} />
                            )}
                        </button>

                        {advancedEnabled && (
                            <div className="bond-calc__advanced-content">
                                <CalculatorGrid variant="bond-advanced-grid">
                                    <CalculatorField
                                        controlId="bond-settlement-date"
                                        label="Fecha de liquidacion"
                                        icon={<CalendarDays size={18} />}>
                                        <input
                                            id="bond-settlement-date"
                                            type="date"
                                            value={settlementDate}
                                            onChange={(event) =>
                                                setSettlementDate(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </CalculatorField>

                                    <CalculatorField
                                        controlId="bond-issue-date"
                                        label={<>Inicio de devengo / emisión
                                            (opcional)</>}
                                        icon={<CalendarDays size={18} />}>
                                        <input
                                            id="bond-issue-date"
                                            type="date"
                                            value={issueDate}
                                            onChange={(event) =>
                                                setIssueDate(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </CalculatorField>

                                    <CalculatorField
                                        controlId="bond-maturity-date"
                                        label="Fecha de vencimiento"
                                        icon={<CalendarDays size={18} />}>
                                        <input
                                            id="bond-maturity-date"
                                            type="date"
                                            value={maturityDate}
                                            onChange={(event) =>
                                                setMaturityDate(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </CalculatorField>

                                    <CalculatorField
                                        controlId="bond-frequency"
                                        label="Frecuencia de cupón"
                                        icon={<TrendingDown size={18} />}>
                                        <select
                                            id="bond-frequency"
                                            value={couponFrequency}
                                            onChange={(event) =>
                                                setCouponFrequency(
                                                    event.target
                                                        .value as CouponFrequency,
                                                )
                                            }>
                                            <option value="annual">
                                                Anual
                                            </option>
                                            <option value="semiannual">
                                                Semestral
                                            </option>
                                            <option value="quarterly">
                                                Trimestral
                                            </option>
                                            <option value="monthly">
                                                Mensual
                                            </option>
                                        </select>
                                    </CalculatorField>

                                    <CalculatorField
                                        controlId="bond-price-type"
                                        label="Tipo de precio"
                                        icon={<Wallet size={18} />}>
                                        <select
                                            id="bond-price-type"
                                            value={priceInputType}
                                            onChange={(event) =>
                                                setPriceInputType(
                                                    event.target
                                                        .value as PriceInputType,
                                                )
                                            }>
                                            <option value="clean">
                                                Limpio (sin cupón corrido)
                                            </option>
                                            <option value="dirty">
                                                Sucio (con cupón corrido)
                                            </option>
                                        </select>
                                    </CalculatorField>

                                    <CalculatorField
                                        controlId="bond-day-count"
                                        label="Convención day count"
                                        icon={<Landmark size={18} />}>
                                        <select
                                            id="bond-day-count"
                                            value={dayCountConvention}
                                            onChange={(event) =>
                                                setDayCountConvention(
                                                    event.target
                                                        .value as DayCountConvention,
                                                )
                                            }>
                                            <option value="actual365">
                                                Actual / 365
                                            </option>
                                            <option value="actual360">
                                                Actual / 360
                                            </option>
                                            <option value="30e360">
                                                30E / 360
                                            </option>
                                            <option value="30us360">
                                                30 / 360 US (NASD)
                                            </option>
                                        </select>
                                    </CalculatorField>
                                </CalculatorGrid>
                                <CalculatorDisclosure
                                    appearance="plain"
                                    className="bond-calc__calculation-details"
                                    title={<>Cupones irregulares (opcional)</>}>

                                    <p>
                                        Indica las fechas contractuales si el
                                        primer o último cupón no corresponde a
                                        un periodo completo. El inicio del
                                        devengo permite calcular el primer cupón
                                        proporcional.
                                    </p>
                                    <CalculatorGrid variant="bond-advanced-grid">
                                        <CalculatorField
                                            controlId="bond-first-coupon"
                                            label="Primer cupón contractual"
                                            icon={<CalendarDays size={18} />}>
                                            <input
                                                id="bond-first-coupon"
                                                type="date"
                                                value={firstCouponDate}
                                                onChange={(event) =>
                                                    setFirstCouponDate(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </CalculatorField>
                                        <CalculatorField
                                            controlId="bond-last-coupon"
                                            label={<>Último cupón anterior al
                                                vencimiento</>}
                                            icon={<CalendarDays size={18} />}>
                                            <input
                                                id="bond-last-coupon"
                                                type="date"
                                                value={lastCouponDate}
                                                onChange={(event) =>
                                                    setLastCouponDate(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </CalculatorField>
                                    </CalculatorGrid>

                                </CalculatorDisclosure>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bond-calc__results">
                    {!Number.isFinite(calculation.ytm) ||
                    !Number.isFinite(calculation.effectiveYtm) ? (
                        <p role="alert">
                            No se puede calcular una TIR válida. Revisa precio,
                            nominal, cupón y plazo. En modo avanzado: inicio de
                            devengo ≤ liquidación &lt; vencimiento. Las fechas
                            de cupones irregulares deben corresponder al
                            calendario contractual.
                        </p>
                    ) : (
                        <>
                                <CalculatorHeroMetric
                                    appearance="yield"
                                    label="YTM nominal anual"
                                    value={<>{(calculation.ytm * 100).toFixed(2)}%</>}
                                    description={<>{calculation.isAdvanced
                                        ? `Capitalización ${calculation.compoundingLabel.toLowerCase()} · ${calculation.periodsPerYear} periodo(s) al año.`
                                        : 'Estimación con precio limpio y cupones anuales regulares. Usa fechas para precisar el cálculo.'}</>}
                                />

                            <CalculatorGrid variant="result-details">
                                    <CalculatorDataItem
                                        layout="detail"
                                        className="detail-box"
                                        labelClassName="label"
                                        label="Situacion"
                                        valueAs="span"
                                        valueClassName={`status-badge ${parStatus < 0 ? 'status-badge--discount' : parStatus > 0 ? 'status-badge--premium' : 'status-badge--par'}`}
                                        value={<>{parStatus < 0
                                            ? 'Bajo Par (Descuento)'
                                            : parStatus > 0
                                                ? 'Sobre Par (Prima)'
                                                : 'Al Par'}</>}
                                    />
                                    <CalculatorDataItem
                                        layout="detail"
                                        className="detail-box"
                                        labelClassName="label"
                                        label="Cupón anual en dinero"
                                        valueAs="div"
                                        valueClassName="coupon-value"
                                        value={<><Wallet
                                            size={16}
                                            className="coupon-value__icon"
                                        />
                                            <span className="value">
                                                {(
                                                    Number(face) *
                                                    (Number(coupon) / 100)
                                                ).toFixed(2)}{' '}
                                                u.m.
                                            </span></>}
                                    />
                                {showAdvancedPriceBreakdown && (
                                        <CalculatorDataItem
                                            layout="detail"
                                            className="detail-box"
                                            labelClassName="label"
                                            label="Precio Limpio"
                                            valueAs="span"
                                            valueClassName="detail-box__value"
                                            value={<>{calculation.cleanPrice.toFixed(4)}</>}
                                        />
                                )}
                                {showAdvancedPriceBreakdown && (
                                        <CalculatorDataItem
                                            layout="detail"
                                            className="detail-box"
                                            labelClassName="label"
                                            label="Precio Sucio"
                                            valueAs="span"
                                            valueClassName="detail-box__value"
                                            value={<>{calculation.dirtyPrice.toFixed(4)}</>}
                                        />
                                )}
                                {showAccruedInterest && (
                                        <CalculatorDataItem
                                            layout="detail"
                                            className="detail-box"
                                            labelClassName="label"
                                            label="Cupón Corrido"
                                            valueAs="span"
                                            valueClassName="detail-box__value"
                                            value={<>{calculation.accruedInterest.toFixed(
                                                6,
                                            )}</>}
                                        />
                                )}
                                {calculation.isAdvanced && (
                                        <CalculatorDataItem
                                            layout="detail"
                                            className="detail-box"
                                            labelClassName="label"
                                            label="Próximo Cupón"
                                            valueAs="span"
                                            valueClassName="detail-box__value"
                                            value={<>{calculation.nextCouponDate ?? '--'}</>}
                                        />
                                )}
                            </CalculatorGrid>
                                <CalculatorDataItem
                                    layout="detail"
                                    className="detail-box"
                                    labelClassName="label"
                                    label="YTM efectiva anual"
                                    valueAs="span"
                                    valueClassName="detail-box__value"
                                    value={<>{(calculation.effectiveYtm * 100).toFixed(
                                        2,
                                    )}
                                        %</>}
                                />
                                <CalculatorDisclosure
                                    appearance="plain"
                                    className="bond-calc__calculation-details"
                                    title={<>Detalles del cálculo</>}>

                                    <dl>
                                        <dt>Precio limpio</dt>
                                        <dd>
                                            {calculation.cleanPrice.toFixed(6)} u.m.
                                        </dd>
                                        <dt>Cupón corrido</dt>
                                        <dd>
                                            {calculation.accruedInterest.toFixed(6)}{' '}
                                            u.m.
                                        </dd>
                                        <dt>Precio sucio</dt>
                                        <dd>
                                            {calculation.dirtyPrice.toFixed(6)} u.m.
                                        </dd>
                                        <dt>Último cupón</dt>
                                        <dd>
                                            {calculation.previousCouponDate ??
                                                'Sin cupón anterior / modo básico'}
                                        </dd>
                                        <dt>Inicio del devengo</dt>
                                        <dd>
                                            {calculation.accrualStartDate ??
                                                'Estimado en modo básico'}
                                        </dd>
                                        <dt>Próximo cupón</dt>
                                        <dd>
                                            {calculation.nextCouponDate ??
                                                'Estimado en modo básico'}
                                        </dd>
                                        <dt>Flujos restantes</dt>
                                        <dd>{calculation.cashFlows.length}</dd>
                                        <dt>Cupón regular por pago</dt>
                                        <dd>
                                            {(
                                                (Number(face) * Number(coupon)) /
                                                100 /
                                                calculation.periodsPerYear
                                            ).toFixed(6)}{' '}
                                            u.m.
                                        </dd>
                                        <dt>Último flujo (nominal y cupón)</dt>
                                        <dd>
                                            {calculation.cashFlows[
                                                calculation.cashFlows.length - 1
                                            ].amount.toFixed(6)}{' '}
                                            u.m.
                                        </dd>
                                        <dt>Day-count</dt>
                                        <dd>{calculation.dayCountLabel}</dd>
                                        <dt>Periodos hasta el próximo cupón</dt>
                                        <dd>
                                            {calculation.firstPeriodFraction.toFixed(
                                                9,
                                            )}
                                        </dd>
                                        <dt>YTM nominal anual</dt>
                                        <dd>
                                            {(calculation.ytm * 100).toFixed(6)}%
                                        </dd>
                                        <dt>YTM efectiva anual</dt>
                                        <dd>
                                            {(
                                                calculation.effectiveYtm * 100
                                            ).toFixed(6)}
                                            %
                                        </dd>
                                    </dl>
                                    <p>
                                        {calculation.hasIrregularCoupons
                                            ? 'Cupones irregulares calculados proporcionalmente sobre el calendario ordinario. '
                                            : ''}
                                        Sin impuestos, comisiones, ajuste por días
                                        hábiles ni periodos ex cupón. Es YTM al
                                        vencimiento, no YTW ni rentabilidad ajustada
                                        por inflación.
                                    </p>

                                </CalculatorDisclosure>
                        </>
                    )}
                </div>
            </CalculatorGrid>

            <CalculatorGrid variant="bond-calc-edu">
                <CalculatorEducationCard
                    icon={<HelpCircle size={20} />}
                    title={<>¿Qué es la TIR / YTM?</>}>
                    La YTM es la tasa que iguala el precio sucio con el
                    valor actual de los pagos restantes. La rentabilidad
                    efectiva supone mantener el bono hasta vencimiento,
                    cobrar todos los pagos y reinvertir los cupones a la
                    tasa periódica calculada.
                </CalculatorEducationCard>
                <CalculatorEducationCard
                    icon={<TrendingDown size={20} />}
                    title={<>Relación Inversa</>}>
                    Cuando los tipos de interés del mercado suben, el precio
                    de los bonos antiguos baja para ofrecer una TIR
                    competitiva. Es la regla de oro de la renta fija: Tipos
                    ⬆️ = Precios ⬇️.
                </CalculatorEducationCard>
                <CalculatorEducationCard
                    icon={<AlertTriangle size={20} />}
                    title={<>Riesgos Clave</>}>
                    Incluso los bonos tienen riesgo. El principal es el de{' '}
                    <strong>crédito</strong> (que el emisor no pague) y el
                    de <strong>duración</strong> (que el precio caiga mucho
                    ante subidas de tipos si el plazo es largo).
                </CalculatorEducationCard>
            </CalculatorGrid>
        </div>
    );
}
