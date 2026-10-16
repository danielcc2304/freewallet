import { effectiveMetrics, type RadarFund } from '../fundRadar/types';

/** A measured ratio, not a grade or percentile. `value` is CAGR / volatility. */
export interface RadarScore {
    value: number | null;
    rank: number | null;
    peers: number;
    reason: string;
    comparisonReason: string;
    category: string | null;
}

const DAY = 86400000;
function validDay(value: string | null | undefined, now: Date): value is string {
    return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
        && new Date(value).toISOString().slice(0, 10) === value
        && value <= now.toISOString().slice(0, 10) && now.getTime() - Date.parse(value) <= 90 * DAY;
}

/** No fitted constants, brand exceptions or small-sample percentile steps.
 * Annualised 3Y net return / annualised 3Y volatility, in the same units.
 * Not Sharpe: no unverified risk-free rate is assumed. TER is already in returns.
 * Group ranks are contextual only; automatic funds require the provider's exact
 * category, currency and observation month, never the broad editorial bucket.
 */
export function scoreRadarFunds(funds: RadarFund[], now = new Date()): Map<string, RadarScore> {
    const result = new Map<string, RadarScore>();
    const groups = new Map<string, { id: string; value: number }[]>();
    for (const fund of funds) {
        const m = effectiveMetrics(fund);
        const dates = [m.dates?.y3, m.dates?.volatility];
        let reason = '';
        if (!fund.is_active) reason = 'Fondo retirado';
        else if ([m.y3, m.volatility].some(n => n == null || !Number.isFinite(n))) reason = 'Faltan rentabilidad o volatilidad a 3 años';
        else if (m.volatility! <= 0 || m.y3! < -100) reason = 'Rentabilidad o volatilidad fuera de rango';
        else if (m.window !== '3y' || !m.currency) reason = 'Divisa o período de riesgo sin verificar';
        else if (!dates.every(d => validDay(d, now))) reason = 'Fechas sin verificar o métricas con más de 90 días';
        else if (Math.abs(Date.parse(dates[0]!) - Date.parse(dates[1]!)) > 45 * DAY) reason = 'Las fechas de riesgo y rentabilidad difieren más de 45 días';
        const value = reason ? null : m.y3! / m.volatility!;
        if (value !== null && !Number.isFinite(value)) reason = 'No se puede calcular un ratio finito';
        const category = (fund.auto_refresh ? fund.fund_radar_data?.provider_category : fund.category)?.trim() || null;
        const score: RadarScore = { value: reason ? null : value, rank: null, peers: 0, reason, category,
            comparisonReason: category ? 'Se necesitan al menos 5 fondos con categoría, divisa y fecha comparables para mostrar un puesto.' : 'Categoría del proveedor sin verificar; no se asigna un puesto.' };
        result.set(fund.id, score);
        if (score.value === null || !category) continue;
        const groupKey = [fund.auto_refresh ? 'provider' : 'manual', category.toLocaleLowerCase('es'), m.currency, dates[0]!.slice(0, 7)].join('|');
        const group = groups.get(groupKey) ?? [];
        group.push({ id: fund.id, value: score.value });
        groups.set(groupKey, group);
    }
    for (const group of groups.values()) {
        for (const item of group) {
            const score = result.get(item.id)!;
            score.peers = group.length;
            if (group.length >= 5) {
                score.rank = group.filter(g => g.value > item.value).length + 1;
                score.comparisonReason = '';
            }
        }
    }
    return result;
}
