import { MONTH_KEYS } from './portfolioCsvConstants';
import type {
    AdvancedPortfolioStats,
    BenchmarkComparisonPoint,
    DailyPortfolioPoint,
    EvolutionPoint,
    Holding,
    HoldingBucket,
    HoldingCategory,
    ParsedPeriod,
} from './portfolioCsvTypes';

function normalizeHeader(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}

function isInvalidSpreadsheetValue(value: string): boolean {
    return !value.trim() || /^#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A)$/i.test(value.trim()) || !/\d/.test(value);
}

function findHeaderRow(rows: string[][], predicate: (row: string[]) => boolean): number {
    return rows.findIndex(predicate);
}

function findColumnIndex(headers: string[], predicate: (normalized: string) => boolean, fallback: number): number {
    const index = headers.findIndex((header) => predicate(normalizeHeader(header)));
    return index >= 0 ? index : fallback;
}

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

export function parseNullableFlexibleNumber(value: string): number | null {
    if (isInvalidSpreadsheetValue(value)) return null;
    const parsed = parseFlexibleNumber(value);
    return Number.isFinite(parsed) ? parsed : null;
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

export function parseNullablePercentNumber(value: string): number | null {
    if (isInvalidSpreadsheetValue(value)) return null;
    const parsed = parsePercentNumber(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseRatePercent(value: string): number | null {
    const parsed = parseNullablePercentNumber(value);
    if (parsed === null) return null;
    return !value.includes('%') && Math.abs(parsed) <= 1 ? parsed * 100 : parsed;
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

    const headerIndex = findHeaderRow(rows, (row) => {
        const normalized = row.map(normalizeHeader);
        return normalized.some((value) => value.includes('activo'))
            && normalized.some((value) => value.includes('importe') || value.includes('valor'));
    });
    if (headerIndex < 0) return [];

    const headers = rows[headerIndex];
    const assetIndex = findColumnIndex(headers, (value) => value.includes('activo') || value.includes('asset'), 0);
    const amountIndex = findColumnIndex(headers, (value) => value.includes('importe') || value.includes('valor'), 1);
    const weightIndex = findColumnIndex(headers, (value) => value.includes('peso') || value.includes('weight'), 2);
    const base = rows
        .slice(headerIndex + 1)
        .map((row) => ({
            asset: (row[assetIndex] || '').replace(/"/g, '').trim(),
            amount: parseFlexibleNumber(row[amountIndex] || ''),
            weight: parseFlexibleNumber(row[weightIndex] || ''),
            weightRaw: row[weightIndex] || '',
        }))
        .filter((row) => row.asset && row.asset.toUpperCase() !== 'TOTAL' && row.amount > 0);

    const totalAmount = base.reduce((acc, row) => acc + row.amount, 0);
    return base
        .map((row) => ({
            asset: row.asset,
            amount: row.amount,
            weight: row.weight > 0
                ? (!row.weightRaw.includes('%') && row.weight <= 1 ? row.weight * 100 : row.weight)
                : (totalAmount > 0 ? (row.amount / totalAmount) * 100 : 0),
            category: classifyAsset(row.asset),
        }))
        .sort((a, b) => b.amount - a.amount);
}

export function isMonthLabel(value: string): boolean {
    return /^(?:20\d{2}\s+)?(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i.test(value.trim())
        || /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)(?:\s+20\d{2})?\b/i.test(value.trim());
}

export function parsePeriodParts(value: string): ParsedPeriod | null {
    const normalized = value.trim().toLowerCase();
    const yearFirstMatch = normalized.match(/^(20\d{2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)$/i);
    const match = yearFirstMatch
        ? ['', yearFirstMatch[2], yearFirstMatch[1]]
        : normalized.match(/^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)(?:\s+(\d{2,4}))?$/i);
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
    if (rows.length === 0) return [];

    const points: EvolutionPoint[] = [];
    let currentYear: number | undefined;
    let columns = {
        period: 0,
        totalValue: 1,
        initialCapital: 2,
        monthlyContribution: 3,
        profit: 4,
        monthlyReturnPct: 5,
        twrYtdPct: 6,
    };

    for (const row of rows) {
        const rawPeriod = (row[0] || '').replace(/"/g, '').trim();
        if (!rawPeriod) continue;

        const normalizedHeaders = row.map(normalizeHeader);
        const isEvolutionHeader = normalizedHeaders[0] === 'mes'
            && normalizedHeaders.some((value) => value.includes('valortotal'));
        if (isEvolutionHeader) {
            const mainHeaders = row.slice(0, 8);
            columns = {
                period: findColumnIndex(mainHeaders, (value) => value === 'mes' || value.includes('periodo'), 0),
                totalValue: findColumnIndex(mainHeaders, (value) => value.includes('valortotal'), 1),
                initialCapital: findColumnIndex(mainHeaders, (value) => value.includes('capitalinicial'), 2),
                monthlyContribution: findColumnIndex(mainHeaders, (value) => value.includes('capitalaportado') || value.includes('aportado'), 3),
                profit: findColumnIndex(mainHeaders, (value) => value.includes('plusval'), 4),
                monthlyReturnPct: findColumnIndex(mainHeaders, (value) => value.includes('mens') || value.includes('gananciames'), 5),
                twrYtdPct: findColumnIndex(mainHeaders, (value) => value.includes('twrytd'), 6),
            };
            continue;
        }

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

        const rawPeriodParts = parsePeriodParts(rawPeriod);
        const period = rawPeriodParts?.year !== undefined
            ? formatPeriodLabel(rawPeriod)
            : (currentYear === undefined
                ? rawPeriod
                : `${rawPeriod} ${currentYear}`);

        let monthlyReturnRaw = row[columns.monthlyReturnPct] || '';
        let twrRaw = row[columns.twrYtdPct] || '';
        const hasSplitDecimalPercents = row.length >= 9
            && !/%/.test(row[5] || '')
            && !/%/.test(row[6] || '')
            && !/%/.test(row[7] || '')
            && !/%/.test(row[8] || '')
            && /^-?\d+$/.test(row[5] || '')
            && /^\d+$/.test(row[6] || '')
            && /^-?\d+$/.test(row[7] || '')
            && /^\d+$/.test(row[8] || '');
        if (hasSplitDecimalPercents) {
            monthlyReturnRaw = `${row[5] || ''},${row[6] || ''}`;
            twrRaw = `${row[7] || ''},${row[8] || ''}`;
        } else if (row.length === 8) {
            twrRaw = `${row[6] || ''},${row[7] || ''}`;
        }

        const point = {
            period,
            totalValue: parseNullableFlexibleNumber(row[columns.totalValue] || ''),
            initialCapital: parseFlexibleNumber(row[columns.initialCapital] || ''),
            monthlyContribution: parseFlexibleNumber(row[columns.monthlyContribution] || ''),
            profit: parseFlexibleNumber(row[columns.profit] || ''),
            monthlyReturnPct: parsePercentNumber(monthlyReturnRaw),
            twrYtdPct: parsePercentNumber(twrRaw),
        };

        if (point.totalValue !== null) {
            points.push({ ...point, totalValue: point.totalValue });
        }
    }

    return points;
}

export function parseBenchmarkComparison(raw: string): BenchmarkComparisonPoint[] {
    const rows = parseCsvRows(raw);
    if (rows.length === 0) return [];

    const headerIndex = findHeaderRow(rows, (row) => {
        const normalized = row.map(normalizeHeader);
        return normalized.some((value) => value.includes('rentabilidadcartera'))
            && normalized.some((value) => value.includes('rentabilidadmsci') || value.includes('benchmark'));
    });
    if (headerIndex < 0) return [];

    const headers = rows[headerIndex];
    const yearIndex = findColumnIndex(headers, (value) => value === 'ano' || value === 'year', 0);
    const monthIndex = findColumnIndex(headers, (value) => value === 'mes' || value === 'month', 1);
    const periodIndex = findColumnIndex(headers, (value) => value.includes('periodo'), 2);
    const portfolioReturnIndex = findColumnIndex(headers, (value) => value.includes('rentabilidadcartera') || value.includes('portfolioreturn'), 3);
    const benchmarkReturnIndex = findColumnIndex(headers, (value) => value.includes('rentabilidadmsci') || value.includes('benchmarkreturn'), 4);
    const portfolioAccumIndex = findColumnIndex(headers, (value) => value.includes('carteraacum') || value.includes('portfolioaccum'), 5);
    const benchmarkAccumIndex = findColumnIndex(headers, (value) => value.includes('msciacum') || value.includes('benchmarkaccum'), 6);

    let lastPortfolioAccum = 0;
    let lastBenchmarkAccum = 0;
    let hasAccumulatedValues = false;
    const parsedRows: BenchmarkComparisonPoint[] = [];

    for (const row of rows.slice(headerIndex + 1)) {
        const year = parseNullableFlexibleNumber(row[yearIndex] || '');
        const month = (row[monthIndex] || '').replace(/"/g, '').trim();
        const periodRaw = (row[periodIndex] || '').replace(/"/g, '').trim();
        const portfolioReturnPct = parseNullablePercentNumber(row[portfolioReturnIndex] || '');
        const benchmarkReturnPct = parseNullablePercentNumber(row[benchmarkReturnIndex] || '');
        if (year === null || !month || portfolioReturnPct === null || benchmarkReturnPct === null) continue;

        const periodParts = parsePeriodParts(periodRaw || `${month} ${year}`);
        const period = periodParts
            ? `${periodParts.monthKey.charAt(0).toUpperCase()}${periodParts.monthKey.slice(1)} ${periodParts.year || year}`
            : periodRaw;
        if (!period) continue;

        const explicitPortfolioAccum = parseNullablePercentNumber(row[portfolioAccumIndex] || '');
        const explicitBenchmarkAccum = parseNullablePercentNumber(row[benchmarkAccumIndex] || '');
        const portfolioAccum = explicitPortfolioAccum
            ?? (hasAccumulatedValues ? ((1 + lastPortfolioAccum / 100) * (1 + portfolioReturnPct / 100) - 1) * 100 : portfolioReturnPct);
        const benchmarkAccum = explicitBenchmarkAccum
            ?? (hasAccumulatedValues ? ((1 + lastBenchmarkAccum / 100) * (1 + benchmarkReturnPct / 100) - 1) * 100 : benchmarkReturnPct);

        lastPortfolioAccum = portfolioAccum;
        lastBenchmarkAccum = benchmarkAccum;
        hasAccumulatedValues = true;
        parsedRows.push({
            year,
            month,
            period,
            portfolioReturnPct,
            benchmarkReturnPct,
            portfolioAccumPct: portfolioAccum,
            benchmarkAccumPct: benchmarkAccum,
            relativeReturnPct: portfolioReturnPct - benchmarkReturnPct,
        });
    }

    return parsedRows;
}

export function parseAdvancedStats(raw: string): { riskFreeAnnualPct: number | null } {
    const rows = parseCsvRows(raw);
    const sourceRow = rows.find((row) => {
        const firstCell = normalizeHeader(row[0] || '');
        return firstCell.includes('estr') || firstCell.includes('str') || firstCell.includes('tasalibrederiesgo');
    });
    if (!sourceRow) return { riskFreeAnnualPct: null };

    const riskFreeAnnualPct = sourceRow
        .slice(1)
        .map((value) => parseRatePercent(value))
        .find((value): value is number => value !== null) ?? null;
    return { riskFreeAnnualPct };
}

function parseDateLabel(value: string): string | null {
    const normalized = value.trim();
    if (!normalized) return null;

    const dayFirst = normalized.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dayFirst) {
        return `${dayFirst[3]}-${dayFirst[2].padStart(2, '0')}-${dayFirst[1].padStart(2, '0')}`;
    }

    const iso = normalized.match(/^(20\d{2})-(\d{1,2})-(\d{1,2})/);
    if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

    const serial = parseNullableFlexibleNumber(normalized);
    if (serial === null || serial < 20000 || serial > 70000) return null;
    const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return date.toISOString().slice(0, 10);
}

export function parseDailyData(raw: string): DailyPortfolioPoint[] {
    const rows = parseCsvRows(raw);
    if (rows.length === 0) return [];

    const headerIndex = findHeaderRow(rows, (row) => {
        const normalized = row.map(normalizeHeader);
        return normalized.some((value) => value === 'fecha' || value === 'date')
            && normalized.some((value) => value.includes('valorportfolio') || value.includes('portfoliovalue'));
    });
    if (headerIndex < 0) return [];

    const headers = rows[headerIndex];
    const dateIndex = findColumnIndex(headers, (value) => value === 'fecha' || value === 'date', 0);
    const valueIndex = findColumnIndex(headers, (value) => value.includes('valorportfolio') || value.includes('portfoliovalue'), 1);
    const flowIndex = findColumnIndex(headers, (value) => value.includes('flujoneto') || value.includes('netflow'), 2);
    const returnIndex = findColumnIndex(headers, (value) => value.includes('retornodiario') || value.includes('dailyreturn'), 3);
    const typeIndex = findColumnIndex(headers, (value) => value.includes('tipodedato') || value.includes('datatype'), 4);

    let previousDailyValue: number | null = null;
    return rows.slice(headerIndex + 1).flatMap((row) => {
        const date = parseDateLabel(row[dateIndex] || '');
        const totalValue = parseNullableFlexibleNumber(row[valueIndex] || '');
        if (!date || totalValue === null) return [];

        const netFlow = parseFlexibleNumber(row[flowIndex] || '');
        const dataType = (row[typeIndex] || '').replace(/"/g, '').trim();
        const normalizedType = normalizeHeader(dataType);
        const isDailyRecord = !dataType
            || normalizedType.includes('diario')
            || normalizedType.includes('findesemana')
            || normalizedType.includes('basediaria');
        const explicitReturn = parseNullablePercentNumber(row[returnIndex] || '');
        const dailyReturnPct = explicitReturn
            ?? (isDailyRecord && previousDailyValue !== null && previousDailyValue !== 0
                ? ((totalValue - previousDailyValue - netFlow) / previousDailyValue) * 100
                : null);

        if (isDailyRecord) previousDailyValue = totalValue;
        return [{ date, totalValue, netFlow, dailyReturnPct, dataType }];
    });
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

export function sampleStandardDeviation(values: number[]): number | null {
    if (values.length < 2) return null;
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const variance = values.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
}

function average(values: number[]): number | null {
    return values.length > 0 ? values.reduce((acc, value) => acc + value, 0) / values.length : null;
}

function correlation(first: number[], second: number[]): number | null {
    if (first.length < 2 || first.length !== second.length) return null;
    const firstMean = first.reduce((acc, value) => acc + value, 0) / first.length;
    const secondMean = second.reduce((acc, value) => acc + value, 0) / second.length;
    const covariance = first.reduce((acc, value, index) => acc + ((value - firstMean) * (second[index] - secondMean)), 0);
    const firstVariance = first.reduce((acc, value) => acc + ((value - firstMean) ** 2), 0);
    const secondVariance = second.reduce((acc, value) => acc + ((value - secondMean) ** 2), 0);
    const denominator = Math.sqrt(firstVariance * secondVariance);
    return denominator > 0 ? covariance / denominator : null;
}

function regression(portfolioReturns: number[], benchmarkReturns: number[]): { beta: number | null; alphaMonthlyPct: number | null; correlation: number | null } {
    if (portfolioReturns.length < 2 || portfolioReturns.length !== benchmarkReturns.length) {
        return { beta: null, alphaMonthlyPct: null, correlation: null };
    }

    const benchmarkMean = benchmarkReturns.reduce((acc, value) => acc + value, 0) / benchmarkReturns.length;
    const portfolioMean = portfolioReturns.reduce((acc, value) => acc + value, 0) / portfolioReturns.length;
    const covariance = benchmarkReturns.reduce((acc, value, index) => acc + ((value - benchmarkMean) * (portfolioReturns[index] - portfolioMean)), 0);
    const benchmarkVariance = benchmarkReturns.reduce((acc, value) => acc + ((value - benchmarkMean) ** 2), 0);
    const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : null;
    return {
        beta,
        alphaMonthlyPct: beta === null ? null : portfolioMean - (beta * benchmarkMean),
        correlation: correlation(portfolioReturns, benchmarkReturns),
    };
}

function annualizedReturn(monthlyReturns: number[]): number | null {
    if (monthlyReturns.length === 0) return null;
    const growth = monthlyReturns.reduce((acc, value) => acc * (1 + value / 100), 1);
    if (growth <= 0) return null;
    return ((growth ** (12 / monthlyReturns.length)) - 1) * 100;
}

function maximumDrawdown(monthlyReturns: number[]): number | null {
    if (monthlyReturns.length === 0) return null;
    let wealth = 1;
    let peak = 1;
    let maxDrawdown = 0;
    monthlyReturns.forEach((value) => {
        wealth *= 1 + value / 100;
        peak = Math.max(peak, wealth);
        maxDrawdown = Math.min(maxDrawdown, ((wealth / peak) - 1) * 100);
    });
    return maxDrawdown;
}

export function calculateAdvancedPortfolioStats(
    evolution: EvolutionPoint[],
    benchmark: BenchmarkComparisonPoint[],
    dailyPoints: DailyPortfolioPoint[],
    riskFreeAnnualPct: number | null,
): AdvancedPortfolioStats {
    const paired = benchmark.filter((row) => Number.isFinite(row.portfolioReturnPct) && Number.isFinite(row.benchmarkReturnPct));
    const portfolioReturns = paired.length > 0
        ? paired.map((row) => row.portfolioReturnPct)
        : evolution.map((row) => row.monthlyReturnPct).filter(Number.isFinite);
    const benchmarkReturns = paired.map((row) => row.benchmarkReturnPct);
    const relativeReturns = paired.map((row) => row.relativeReturnPct);
    const monthlyRiskFreePct = (riskFreeAnnualPct ?? 0) / 12;
    const excessReturns = portfolioReturns.map((value) => value - monthlyRiskFreePct);
    const meanExcess = average(excessReturns);
    const monthlyVolatility = sampleStandardDeviation(portfolioReturns);
    const negativeExcess = excessReturns.filter((value) => value < 0);
    const downsideDeviation = negativeExcess.length > 0
        ? Math.sqrt(negativeExcess.reduce((acc, value) => acc + (value ** 2), 0) / negativeExcess.length)
        : null;
    const relativeAverage = average(relativeReturns);
    const trackingErrorMonthly = sampleStandardDeviation(relativeReturns);
    const regressionStats = regression(portfolioReturns, benchmarkReturns);
    const bestMonth = evolution.length > 0
        ? evolution.reduce((best, row) => (row.monthlyReturnPct > best.monthlyReturnPct ? row : best), evolution[0])
        : null;
    const dailyRecords = dailyPoints.filter((point) => {
        const normalizedType = normalizeHeader(point.dataType);
        return !point.dataType
            || normalizedType.includes('diario')
            || normalizedType.includes('findesemana')
            || normalizedType.includes('basediaria');
    });
    const dailyReturns = dailyRecords
        .map((point) => point.dailyReturnPct)
        .filter((value): value is number => value !== null && Number.isFinite(value));
    const dailyVolatility = sampleStandardDeviation(dailyReturns);

    return {
        riskFreeAnnualPct,
        sharpeRatio: meanExcess !== null && monthlyVolatility ? (meanExcess / monthlyVolatility) * Math.sqrt(12) : null,
        sortinoRatio: meanExcess !== null && downsideDeviation ? (meanExcess / downsideDeviation) * Math.sqrt(12) : null,
        annualAlphaPct: regressionStats.alphaMonthlyPct === null ? null : regressionStats.alphaMonthlyPct * 12,
        beta: regressionStats.beta,
        maxDrawdownPct: maximumDrawdown(portfolioReturns),
        informationRatio: relativeAverage !== null && trackingErrorMonthly ? (relativeAverage / trackingErrorMonthly) * Math.sqrt(12) : null,
        trackingErrorAnnualPct: trackingErrorMonthly === null ? null : trackingErrorMonthly * Math.sqrt(12),
        correlation: regressionStats.correlation,
        annualizedReturnPct: annualizedReturn(portfolioReturns),
        annualizedVolatilityPct: monthlyVolatility === null ? null : monthlyVolatility * Math.sqrt(12),
        analyzedMonths: portfolioReturns.length,
        bestMonth: bestMonth ? { period: bestMonth.period, returnPct: bestMonth.monthlyReturnPct } : null,
        treynorRatioPct: meanExcess !== null && regressionStats.beta ? (meanExcess * 12) / regressionStats.beta : null,
        dailyObservations: dailyReturns.length,
        dailyVolatilityAnnualPct: dailyVolatility === null ? null : dailyVolatility * Math.sqrt(252),
        latestDailyPoint: dailyPoints.length > 0 ? dailyPoints[dailyPoints.length - 1] : null,
    };
}
