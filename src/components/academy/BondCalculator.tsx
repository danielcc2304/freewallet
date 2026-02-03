import { useState, useMemo } from 'react';
import { Info, AlertTriangle, TrendingDown, Scale, Landmark, HelpCircle, Wallet } from 'lucide-react';
import './BondCalculator.css';

type YtmInputs = {
    price: number;        // P: precio por 100 de nominal (ej 83.7)
    couponRate: number;   // cupón anual en tanto (ej 0.08875)
    years: number;        // N: años enteros hasta vencimiento (ej 4)
    face?: number;        // F: nominal (default 100)
};

/**
 * Fórmula Newton-Raphson para YTM proporcionada por el usuario
 */
function ytmAnnualOneNewton({
    price,
    couponRate,
    years,
    face = 100
}: YtmInputs): number {
    if (!Number.isFinite(price) || price <= 0) return 0;
    if (!Number.isFinite(couponRate) || couponRate < 0) return 0;
    if (!Number.isInteger(years) || years <= 0) return 0;
    if (!Number.isFinite(face) || face <= 0) return 0;

    const C = face * couponRate;

    const y0 = (C + (face - price) / years) / ((face + price) / 2);
    const safeY0 = Math.max(y0, -0.999999);
    const onePlus = 1 + safeY0;

    let theoPrice = 0;
    let dTheoPrice = 0;

    for (let k = 1; k <= years; k++) {
        const discK = Math.pow(onePlus, k);
        theoPrice += C / discK;
        dTheoPrice += (-k * C) / Math.pow(onePlus, k + 1);
    }

    theoPrice += face / Math.pow(onePlus, years);
    dTheoPrice += (-years * face) / Math.pow(onePlus, years + 1);

    if (!Number.isFinite(dTheoPrice) || Math.abs(dTheoPrice) < 1e-12) {
        return safeY0;
    }

    const y1 = safeY0 - (theoPrice - price) / dTheoPrice;
    return y1;
}

export function BondCalculator() {
    const [price, setPrice] = useState<number | string>(83.7);
    const [coupon, setCoupon] = useState<number | string>(8.875);
    const [years, setYears] = useState<number | string>(4);
    const [face, setFace] = useState<number | string>(100);

    const ytm = useMemo(() => {
        const p = price === '' ? 0 : Number(price);
        const c = coupon === '' ? 0 : Number(coupon);
        const y = years === '' ? 0 : Math.round(Number(years));
        const f = face === '' ? 0 : Number(face);

        return ytmAnnualOneNewton({
            price: p,
            couponRate: c / 100,
            years: y,
            face: f
        });
    }, [price, coupon, years, face]);

    const handleInput = (setter: (val: string | number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setter(val === '' ? '' : val);
    };

    return (
        <div className="bond-calc">
            <header className="bond-calc__header">
                <h1 className="bond-calc__title">Calculadora de Bonos (TIR)</h1>
                <p className="bond-calc__subtitle">
                    Calcula la rentabilidad real de un bono (Yield to Maturity) basándote en su precio actual de mercado.
                </p>
            </header>

            <div className="bond-calc__grid">
                <div className="bond-calc__inputs">
                    <div className="bond-calc__input-group">
                        <label>Precio Actual</label>
                        <div className="bond-calc__field">
                            <Scale size={18} className="bond-calc__field-icon" />
                            <input
                                type="number"
                                value={price}
                                onChange={handleInput(setPrice)}
                                step="0.1"
                                placeholder="83.7"
                            />
                            <span className="bond-calc__field-unit">% s/ par</span>
                        </div>
                    </div>

                    <div className="bond-calc__input-group">
                        <label>Cupón Anual</label>
                        <div className="bond-calc__field">
                            <TrendingDown size={18} className="bond-calc__field-icon" />
                            <input
                                type="number"
                                value={coupon}
                                onChange={handleInput(setCoupon)}
                                step="0.01"
                                placeholder="8.875"
                            />
                            <span className="bond-calc__field-unit">%</span>
                        </div>
                    </div>

                    <div className="bond-calc__input-group">
                        <label>Años al Vencimiento</label>
                        <div className="bond-calc__field">
                            <Landmark size={18} className="bond-calc__field-icon" />
                            <input
                                type="number"
                                value={years}
                                onChange={handleInput(setYears)}
                                min="1"
                                placeholder="4"
                            />
                            <span className="bond-calc__field-unit">años</span>
                        </div>
                    </div>

                    <div className="bond-calc__input-group">
                        <label>Valor Nominal (Par)</label>
                        <div className="bond-calc__field">
                            <Info size={18} className="bond-calc__field-icon" />
                            <input
                                type="number"
                                value={face}
                                onChange={handleInput(setFace)}
                                placeholder="100"
                            />
                        </div>
                    </div>
                </div>

                <div className="bond-calc__results">
                    <div className="result-main-card">
                        <span className="label">TIR / YTM (Anualizada)</span>
                        <h2 className="result-value">{(ytm * 100).toFixed(4)}%</h2>
                        <p className="result-main-card__subtext">
                            Aproximación por método Newton-Raphson
                        </p>
                    </div>

                    <div className="result-details">
                        <div className="detail-box">
                            <span className="label">Situación</span>
                            <span className={`status-badge ${Number(price) < Number(face) ? 'status-badge--discount' : Number(price) > Number(face) ? 'status-badge--premium' : 'status-badge--par'}`}>
                                {Number(price) < Number(face) ? 'Bajo Par (Descuento)' : Number(price) > Number(face) ? 'Sobre Par (Prima)' : 'Al Par'}
                            </span>
                        </div>
                        <div className="detail-box">
                            <span className="label">Cupón en Dinero</span>
                            <div className="coupon-value">
                                <Wallet size={16} className="coupon-value__icon" />
                                <span className="value">{(Number(face) * (Number(coupon) / 100)).toFixed(2)}€</span>
                            </div>
                        </div>
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
