import { MONTH_KEYS } from './portfolioCsvConstants';
import type {
    EvolutionPoint,
    Holding,
    HoldingBucket,
    HoldingCategory,
    ParsedPeriod,
} from './portfolioCsvTypes';

export function parseLooseNumber(value: string): number {
    const normalized = value
        .replace(/\uFEFF/g, '')
        .replace(/EUR/gi, '')
        .replace(/%/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function parseFlexibleNumber(value: string): number {
    const sanitized = value
        .replace(/\uFEFF/g, '')
        .replace(/EUR/gi, '')
        .replace(/%/g, '')
        .replace(/\s/g, '')
        .replace(/[^0-9,.-]/g, '');
    const lastComma = sanitized.lastIndexOf(',');
    const lastDot = sanitized.lastIndexOf('.');
    let normalized = sanitized;

    if (lastComma >= 0 && lastDot >= 0) {
        const decimalSeparator = lastComma > lastDot ? ',' : '.';
        const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
        normalized = sanitized.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
        if (decimalSeparator === ',') normalized = normalized.replace(',', '.');
    } else if (lastComma >= 0) {
        const decimalDigits = sanitized.length - lastComma - 1;
        normalized = decimalDigits === 3 ? sanitized.replace(/,/g, '') : sanitized.replace(',', '.');
    } else if (lastDot >= 0) {
        const decimalDigits = sanitized.length - lastDot - 1;
        normalized = decimalDigits === 3 ? sanitized.replace(/\./g, '') : sanitized;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : parseLooseNumber(value);
}

export function parsePercentNumber(value: string): number {
    const sanitized = value
        .replace(/\uFEFF/g, '')
        .replace(/%/g, '')
        .replace(/\s/g, '')
        .replace(/[^0-9,.-]/g, '');
    if (!sanitized) return 0;

    const normalized = sanitized.includes(',')
        ? sanitized.replace(/\./g, '').replace(',', '.')
        : sanitized;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : parseLooseNumber(value);
}

export function parseCsvRows(raw: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    const normalized = raw.replace(/\uFEFF/g, '');

    for (let i = 0; i < normalized.length; i += 1) {
        const ch = normalized[i];
        if (ch === '"') {
            if (inQuotes && normalized[i + 1] === '"') {
                cell += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (ch === ',' && !inQuotes) {
            row.push(cell.trim());
            cell = '';
            continue;
        }
        if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && normalized[i + 1] === '\n') i += 1;
            row.push(cell.trim());
            if (row.some((value) => value.length > 0)) rows.push(row);
            row = [];
            cell = '';
            continue;
        }
        cell += ch;
    }

    row.push(cell.trim());
    if (row.some((value) => value.length > 0)) rows.push(row);
    return rows;
}

export function normalizeSheetName(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/gi, '')
        .toLowerCase();
}

export function classifyAsset(asset: string): HoldingCategory {
    const name = asset.toLowerCase();
    if (name.includes('renta fija') || name.includes('credit') || name.includes('short duration') || name.includes('bond')) return 'fixedIncome';
    if (name.includes('revolut') || name.includes('cash') || name.includes('liquidez')) return 'cash';
    if (name.includes('reits') || name.includes('commodity') || name.includes('gold') || name.includes('crypto')) return 'alternatives';
    if (name.includes('world') || name.includes('emerging') || name.includes('china') || name.includes('value') || name.includes('nextil') || name.includes('amper') || name.includes('obrascon')) return 'equity';
    return 'other';
}

export function defaultBucketForCategory(category: HoldingCategory): HoldingBucket {
    if (category === 'cash') return 'liquidity';
    if (category === 'fixedIncome') return 'income';
    return 'longTerm';
}

export function parseHoldings(raw: string): Holding[] {
    const rows = parseCsvRows(raw);
    if (rows.length <= 1) return [];

    const base = rows
        .slice(1)
        .map((row) => ({
            asset: (row[0] || '').replace(/"/g, '').trim(),
            amount: parseFlexibleNumber(row[1] || ''),
            weight: parseFlexibleNumber(row[2] || ''),
        }))
        .filter((row) => row.asset && row.asset.toUpperCase() !== 'TOTAL' && row.amount > 0);

    const totalAmount = base.reduce((acc, row) => acc + row.amount, 0);
    return base
        .map((row) => ({
            asset: row.asset,
            amount: row.amount,
            weight: row.weight > 0 ? row.weight : (totalAmount > 0 ? (row.amount / totalAmount) * 100 : 0),
            category: classifyAsset(row.asset),
        }))
        .sort((a, b) => b.amount - a.amount);
}

export function isMonthLabel(value: string): boolean {
    return /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i.test(value.trim());
}

export function parsePeriodParts(value: string): ParsedPeriod | null {
    const match = value.trim().toLowerCase().match(/^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)(?:\s+(\d{2,4}))?$/i);
    if (!match) return null;

    const monthKey = match[1].toLowerCase();
    const monthIndex = MONTH_KEYS.indexOf(monthKey as typeof MONTH_KEYS[number]);
    if (monthIndex < 0) return null;

    const rawYear = match[2];
    const year = rawYear ? (rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear)) : undefined;
    return { monthKey, monthIndex, year: Number.isFinite(year) ? year : undefined };
}

export function formatPeriodLabel(period: string, compactYear = false): string {
    const parsed = parsePeriodParts(period);
    if (!parsed) return period;
    const month = parsed.monthKey.charAt(0).toUpperCase() + parsed.monthKey.slice(1);
    if (!parsed.year) return month;
    return compactYear ? `${month} ${String(parsed.year).slice(-2)}` : `${month} ${parsed.year}`;
}

export function resolveEvolutionPeriods(points: EvolutionPoint[]): Map<string, string> {
    const parsed = points.map((point) => parsePeriodParts(point.period));
    const explicitYearIndex = parsed.findIndex((item) => item?.year !== undefined);
    if (explicitYearIndex === -1) {
        return new Map(points.map((point) => [point.period, formatPeriodLabel(point.period)]));
    }

    const resolved = parsed.map((item) => (item ? { ...item } : null));

    let currentYear = resolved[explicitYearIndex]?.year;
    let currentMonth = resolved[explicitYearIndex]?.monthIndex;
    for (let i = explicitYearIndex - 1; i >= 0; i -= 1) {
        const item = resolved[i];
        if (!item || currentYear === undefined || currentMonth === undefined) continue;
        if (item.year !== undefined) {
            currentYear = item.year;
            currentMonth = item.monthIndex;
            continue;
        }
        if (item.monthIndex > currentMonth) currentYear -= 1;
        item.year = currentYear;
        currentMonth = item.monthIndex;
    }

    currentYear = resolved[explicitYearIndex]?.year;
    currentMonth = resolved[explicitYearIndex]?.monthIndex;
    for (let i = explicitYearIndex + 1; i < resolved.length; i += 1) {
        const item = resolved[i];
        if (!item || currentYear === undefined || currentMonth === undefined) continue;
        if (item.year !== undefined) {
            currentYear = item.year;
            currentMonth = item.monthIndex;
            continue;
        }
        if (item.monthIndex < currentMonth) currentYear += 1;
        item.year = currentYear;
        currentMonth = item.monthIndex;
    }

    return new Map(points.map((point, index) => {
        const item = resolved[index];
        if (!item) return [point.period, point.period];
        const month = item.monthKey.charAt(0).toUpperCase() + item.monthKey.slice(1);
        return [point.period, item.year ? `${month} ${item.year}` : month];
    }));
}

export function parseEvolution(raw: string): EvolutionPoint[] {
    const rows = parseCsvRows(raw);
    if (rows.length <= 1) return [];

    const points: EvolutionPoint[] = [];
    let currentYear: number | undefined;

    for (const row of rows.slice(1)) {
        const rawPeriod = (row[0] || '').replace(/"/g, '').trim();
        if (!rawPeriod) continue;

        const yearSectionMatch = rawPeriod.match(/^(20\d{2})$/);
        if (yearSectionMatch) {
            currentYear = Number(yearSectionMatch[1]);
            continue;
        }

        const ytdYearMatch = rawPeriod.match(/^ytd\s+(20\d{2})$/i);
        if (ytdYearMatch) {
            currentYear = Number(ytdYearMatch[1]);
            continue;
        }

        if (/^mes$/i.test(rawPeriod)) continue;
        if (!isMonthLabel(rawPeriod)) continue;

        const period = /\d{2,4}$/.test(rawPeriod) || currentYear === undefined
            ? rawPeriod
            : `${rawPeriod} ${currentYear}`;

        let monthlyReturnRaw = row[5] || '';
        let twrRaw = row[6] || '';
        if (row.length >= 9) {
            monthlyReturnRaw = `${row[5] || ''},${row[6] || ''}`;
            twrRaw = `${row[7] || ''},${row[8] || ''}`;
        } else if (row.length === 8) {
            twrRaw = `${row[6] || ''},${row[7] || ''}`;
        }

        const point = {
            period,
            totalValue: parseFlexibleNumber(row[1] || ''),
            initialCapital: parseFlexibleNumber(row[2] || ''),
            monthlyContribution: parseFlexibleNumber(row[3] || ''),
            profit: parseFlexibleNumber(row[4] || ''),
            monthlyReturnPct: parsePercentNumber(monthlyReturnRaw),
            twrYtdPct: parsePercentNumber(twrRaw),
        };

        if (point.totalValue > 0) points.push(point);
    }

    return points;
}

export function formatCurrency(value: number): string {
    return value.toLocaleString('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

export function formatPct(value: number): string {
    return `${value.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}%`;
}

export function standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const variance = values.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / values.length;
    return Math.sqrt(variance);
}
