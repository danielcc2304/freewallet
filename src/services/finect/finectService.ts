import {
    CORS_PROXIES,
    fetchFromProxy,
    getNextProxy,
    markProxyFailure,
} from '../market/marketProxy';

const FINECT_API_BASE_URL = 'https://api.finect.com/v4';
const FINECT_SITE_BASE_URL = 'https://www.finect.com';
const FINECT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FINECT_DEV_API_PROXY = '/__finect/api';
const FINECT_DEV_SITE_PROXY = '/__finect/site';

/**
 * Finect exposes this client key in its own public frontend bundle. It is not
 * treated as a secret and can be overridden when the integration moves to a
 * server-side transport.
 */
const DEFAULT_FINECT_PUBLIC_KEY = 'OgcqanUxQ4S6Y5VVvnwlJayUuxeg8Ah5';

type JsonRecord = Record<string, unknown>;

export type FinectErrorCode = 'invalid-isin' | 'not-found' | 'network' | 'parse';

export class FinectError extends Error {
    readonly code: FinectErrorCode;
    readonly cause?: unknown;

    constructor(message: string, code: FinectErrorCode, cause?: unknown) {
        super(message);
        this.name = 'FinectError';
        this.code = code;
        this.cause = cause;
    }
}

export interface FinectMetricPoint {
    type?: string;
    period: string;
    value: number;
    date?: string;
}

export interface FinectFeeSummary {
    management?: number;
    totalExpenseRatio?: number;
    ongoing?: number;
    entry?: number;
    redemption?: number;
    custody?: number;
    success?: number;
}

export interface FinectBreakdown {
    type: string;
    items: Array<{
        label: string;
        value: number;
    }>;
}

export interface FinectHolding {
    name: string;
    weight: number;
}

export interface FinectDocument {
    type: string;
    url: string;
    language?: string;
    effective?: string;
    updated?: string;
}

export interface FinectFeature {
    name: string;
    score?: number;
}

export const FINECT_STATISTIC_KEYS = [
    'maxDrawdown',
    'standardDeviation',
    'alpha',
    'beta',
    'sharpeRatio',
    'trackingError',
    'correlation',
    'informationRatio',
    'r2',
] as const;

export type FinectStatisticKey = typeof FINECT_STATISTIC_KEYS[number];

export interface FinectFundRelevance {
    isin: string;
    name: string;
    className: string;
    alias: string;
    description?: string;
    strategy?: string;
    manager?: string;
    managerCountry?: string;
    category?: string;
    categoryDescription?: string;
    currencyCode?: string;
    currencyName?: string;
    availableDate?: string;
    srri?: number;
    indexed?: boolean;
    finectScore?: number;
    morningstarRating?: number;
    totalNetAsset?: number;
    classTotalNetAsset?: number;
    minimumInvestment?: number;
    lastQuote?: {
        datetime?: string;
        price?: number;
        change?: number;
        percentChange?: number;
    };
    fees: FinectFeeSummary;
    features: FinectFeature[];
    benchmarks: string[];
    performance: FinectMetricPoint[];
    statistics: Record<FinectStatisticKey, FinectMetricPoint[]>;
    breakdowns: FinectBreakdown[];
    holdings: FinectHolding[];
    documents: FinectDocument[];
    sourceUrl: string;
    fetchedAt: string;
}

interface FinectSearchMatch {
    alias: string;
    pageUrl: string;
}

interface CacheEntry {
    data: FinectFundRelevance;
    timestamp: number;
}

const fundCache = new Map<string, CacheEntry>();

function asRecord(value: unknown): JsonRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function getRecord(record: JsonRecord | null | undefined, key: string): JsonRecord | null {
    return asRecord(record?.[key]);
}

function getString(record: JsonRecord | null | undefined, key: string): string | undefined {
    const value = record?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getNumber(record: JsonRecord | null | undefined, key: string): number | undefined {
    const value = record?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
        return Number(value);
    }
    return undefined;
}

function getBoolean(record: JsonRecord | null | undefined, key: string): boolean | undefined {
    const value = record?.[key];
    return typeof value === 'boolean' ? value : undefined;
}

function getFirstRecord(value: unknown): JsonRecord | null {
    const direct = asRecord(value);
    if (direct) return direct;
    return asArray(value).map(asRecord).find((item): item is JsonRecord => item !== null) ?? null;
}

function getConfiguredApiKey(): string {
    const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env;
    const configuredKey = runtimeEnv?.VITE_FINECT_API_KEY;
    return typeof configuredKey === 'string' && configuredKey.trim()
        ? configuredKey.trim()
        : DEFAULT_FINECT_PUBLIC_KEY;
}

function hasValidIsinCheckDigit(isin: string): boolean {
    const expanded = isin
        .split('')
        .map((character) => {
            if (/[A-Z]/.test(character)) {
                return String(character.charCodeAt(0) - 55);
            }
            return character;
        })
        .join('');

    let sum = 0;
    let positionFromRight = 0;

    for (let index = expanded.length - 1; index >= 0; index -= 1) {
        const digit = Number(expanded[index]);
        const multiplier = positionFromRight % 2 === 0 ? 1 : 2;
        const product = digit * multiplier;
        sum += product > 9 ? product - 9 : product;
        positionFromRight += 1;
    }

    return sum % 10 === 0;
}

export function normalizeIsin(value: string): string {
    const normalized = value.replace(/\s+/g, '').toUpperCase();

    if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(normalized) || !hasValidIsinCheckDigit(normalized)) {
        throw new FinectError(
            'Introduce un ISIN válido de 12 caracteres, por ejemplo IE00BYX5NX33.',
            'invalid-isin',
        );
    }

    return normalized;
}

function normalizeOptionalIsin(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.replace(/\s+/g, '').toUpperCase();
    return /^[A-Z]{2}[A-Z0-9]{9}\d$/.test(normalized) ? normalized : undefined;
}

function isAbortError(error: unknown): boolean {
    const record = asRecord(error);
    return error instanceof Error && error.name === 'AbortError'
        || getString(record, 'code') === 'ERR_CANCELED';
}

function buildFinectUrl(path: string, params: Record<string, string>): string {
    const url = new URL(`${FINECT_API_BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
}

function buildDevelopmentProxyUrl(targetUrl: string): string | undefined {
    const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env;
    if (runtimeEnv?.DEV !== true) return undefined;

    const target = new URL(targetUrl);
    const proxyPrefix = target.origin === FINECT_API_BASE_URL.replace('/v4', '')
        ? FINECT_DEV_API_PROXY
        : target.origin === FINECT_SITE_BASE_URL
            ? FINECT_DEV_SITE_PROXY
            : undefined;

    return proxyPrefix ? `${proxyPrefix}${target.pathname}${target.search}` : undefined;
}

function getPageUrl(relativeUrl: string | undefined, web: string | undefined): string {
    const candidate = relativeUrl ?? (web ? `/fondos-inversion/${web}` : undefined);

    if (!candidate) {
        throw new FinectError('Finect no ha devuelto la URL pública del fondo.', 'parse');
    }

    const parsed = new URL(candidate, FINECT_SITE_BASE_URL);
    if (parsed.origin !== FINECT_SITE_BASE_URL || !parsed.pathname.startsWith('/fondos-inversion/')) {
        throw new FinectError('La respuesta de Finect contiene una URL de fondo no válida.', 'parse');
    }

    return parsed.toString();
}

async function fetchThroughProxy<T>(
    targetUrl: string,
    signal: AbortSignal | undefined,
    parsePayload: (payload: unknown) => T,
): Promise<T> {
    let lastError: unknown;

    const developmentProxyUrl = buildDevelopmentProxyUrl(targetUrl);
    if (developmentProxyUrl) {
        try {
            const response = await fetch(developmentProxyUrl, { signal });
            if (!response.ok) {
                throw new Error(`Finect development proxy responded with ${response.status}.`);
            }

            return parsePayload(await response.text());
        } catch (error) {
            if (isAbortError(error) || signal?.aborted) throw error;
            lastError = error;
            console.warn('[Finect] Development proxy failed; trying public proxies.', error);
        }
    }

    for (let attempt = 0; attempt < CORS_PROXIES.length; attempt += 1) {
        const proxy = getNextProxy();

        try {
            const payload = await fetchFromProxy(proxy, targetUrl, signal, attempt > 0);
            return parsePayload(payload);
        } catch (error) {
            if (isAbortError(error) || signal?.aborted) throw error;
            lastError = error;
            markProxyFailure(proxy.url, error);
        }
    }

    throw new FinectError(
        'No se ha podido conectar con Finect mediante los proxys disponibles.',
        'network',
        lastError,
    );
}

function parseJsonPayload(payload: unknown): unknown {
    if (typeof payload !== 'string') return payload;

    try {
        return JSON.parse(payload) as unknown;
    } catch (error) {
        throw new FinectError('Finect ha devuelto una respuesta JSON no válida.', 'parse', error);
    }
}

async function fetchJsonThroughProxy(targetUrl: string, signal?: AbortSignal): Promise<unknown> {
    return fetchThroughProxy(targetUrl, signal, parseJsonPayload);
}

async function fetchHtmlThroughProxy(targetUrl: string, signal?: AbortSignal): Promise<string> {
    return fetchThroughProxy(targetUrl, signal, (payload) => {
        const html = typeof payload === 'string' ? payload : getString(asRecord(payload), 'contents');
        if (html?.includes('window.INITIAL_STATE')) return html;
        throw new FinectError('Finect no ha devuelto el HTML de la ficha.', 'parse');
    });
}

/** Extracts the server-rendered state used by the public Finect fund page. */
export function extractFinectInitialState(html: string): unknown {
    // Finect's encoded value can contain literal single quotes (for example
    // in country filters), so the closing delimiter must match the opener.
    const match = html.match(/window\.INITIAL_STATE\s*=\s*(["'])([\s\S]*?)\1\s*;?/);
    const encodedState = match?.[2];

    if (!encodedState) {
        throw new FinectError('No se ha encontrado la información embebida de la ficha de Finect.', 'parse');
    }

    try {
        return JSON.parse(decodeURIComponent(encodedState)) as unknown;
    } catch (error) {
        throw new FinectError('No se ha podido interpretar la información de la ficha de Finect.', 'parse', error);
    }
}

function extractModelFromInitialState(state: unknown): JsonRecord | null {
    const root = asRecord(state);
    const fundState = getRecord(getRecord(root, 'fund'), 'fund');
    const productState = getRecord(getRecord(root, 'products'), 'product');
    return getRecord(fundState, 'model') ?? getRecord(productState, 'model');
}

function extractModelFromApiPayload(payload: unknown): JsonRecord | null {
    const root = asRecord(payload);
    return getRecord(getRecord(root, 'data'), 'entity');
}

function readMetricPoint(value: unknown): FinectMetricPoint | null {
    const record = asRecord(value);
    const metricValue = getNumber(record, 'value');
    const period = getString(record, 'period');

    if (metricValue === undefined || !period) return null;

    return {
        type: getString(record, 'type'),
        period,
        value: metricValue,
        date: getString(record, 'date'),
    };
}

function readMetricPoints(value: unknown): FinectMetricPoint[] {
    const values = asArray(value);
    if (values.length > 0) {
        return values.map(readMetricPoint).filter((item): item is FinectMetricPoint => item !== null);
    }

    const single = readMetricPoint(value);
    return single ? [single] : [];
}

function readFeeValue(fees: JsonRecord | null, key: string): number | undefined {
    return getNumber(getRecord(fees, key), 'value');
}

function readCategory(model: JsonRecord): JsonRecord | null {
    return getFirstRecord(model.category) ?? getFirstRecord(model.categories);
}

function readBreakdowns(model: JsonRecord): FinectBreakdown[] {
    return asArray(model.breakdown).flatMap((value) => {
        const breakdown = asRecord(value);
        const type = getString(breakdown, 'type');
        if (!type) return [];

        const items = asArray(breakdown?.items)
            .map((item) => {
                const record = asRecord(item);
                const values = getRecord(record, 'values');
                const itemValue = getNumber(values, 'long');
                const label = getString(record, 'drawer');

                if (!label || itemValue === undefined || itemValue <= 0) return null;
                return { label, value: itemValue };
            })
            .filter((item): item is { label: string; value: number } => item !== null)
            .sort((left, right) => right.value - left.value);

        return items.length > 0 ? [{ type, items }] : [];
    });
}

function readHoldings(model: JsonRecord): FinectHolding[] {
    return asArray(getRecord(model, 'portfolio')?.holdings)
        .map((value) => {
            const holding = asRecord(value);
            const name = getString(holding, 'name');
            const weight = getNumber(holding, 'weight');
            return name && weight !== undefined ? { name, weight } : null;
        })
        .filter((item): item is FinectHolding => item !== null)
        .sort((left, right) => right.weight - left.weight)
        .slice(0, 10);
}

function readDocuments(model: JsonRecord): FinectDocument[] {
    return asArray(model.documents).flatMap((value) => {
        const document = asRecord(value);
        const type = getString(document, 'type');
        const url = getString(document, 'url');
        return type && url ? [{
            type,
            url,
            language: getString(document, 'language'),
            effective: getString(document, 'effective'),
            updated: getString(document, 'updated'),
        }] : [];
    });
}

function readStatistics(model: JsonRecord): Record<FinectStatisticKey, FinectMetricPoint[]> {
    const stats = getRecord(model, 'stats');

    return FINECT_STATISTIC_KEYS.reduce<Record<FinectStatisticKey, FinectMetricPoint[]>>((result, key) => {
        result[key] = readMetricPoints(stats?.[key]);
        return result;
    }, {
        maxDrawdown: [],
        standardDeviation: [],
        alpha: [],
        beta: [],
        sharpeRatio: [],
        trackingError: [],
        correlation: [],
        informationRatio: [],
        r2: [],
    });
}

function readFeatures(model: JsonRecord): FinectFeature[] {
    return asArray(model.features).flatMap((value) => {
        const feature = asRecord(value);
        const name = getString(feature, 'name');
        return name ? [{ name, score: getNumber(feature, 'score') }] : [];
    });
}

function readRatings(model: JsonRecord): { finect?: number; morningstar?: number } {
    return asArray(model.ratings).reduce<{ finect?: number; morningstar?: number }>((result, value) => {
        const rating = asRecord(value);
        const provider = getString(rating, 'provider')?.toLowerCase();
        const score = getNumber(rating, 'value');
        if (!provider || score === undefined) return result;

        if (provider === 'finect') result.finect = score;
        if (provider === 'morningstar') result.morningstar = score;
        return result;
    }, {});
}

function readLastQuote(model: JsonRecord, selectedClass: JsonRecord): FinectFundRelevance['lastQuote'] | undefined {
    const quote = getRecord(selectedClass, 'lastQuote') ?? getRecord(model, 'lastQuote');
    if (!quote) return undefined;

    return {
        datetime: getString(quote, 'datetime'),
        price: getNumber(quote, 'price'),
        change: getNumber(quote, 'change'),
        percentChange: getNumber(quote, 'percentChange'),
    };
}

/** Converts Finect's changing page/API model into the app's stable DTO. */
export function normalizeFinectFundModel(
    model: unknown,
    requestedIsin: string,
    sourceUrl: string,
    fetchedAt = new Date().toISOString(),
): FinectFundRelevance {
    const normalizedIsin = normalizeIsin(requestedIsin);
    const fundModel = asRecord(model);

    if (!fundModel) {
        throw new FinectError('Finect no ha devuelto una ficha de fondo interpretable.', 'parse');
    }

    const classes = asArray(fundModel.classes).map(asRecord).filter((item): item is JsonRecord => item !== null);
    const selectedClass = classes.find((item) => normalizeOptionalIsin(item.isin) === normalizedIsin)
        ?? getRecord(fundModel, 'class')
        ?? {};
    const modelIsin = normalizeOptionalIsin(fundModel.isin);

    if (modelIsin !== normalizedIsin && normalizeOptionalIsin(selectedClass.isin) !== normalizedIsin) {
        throw new FinectError('La ficha encontrada no coincide con el ISIN solicitado.', 'not-found');
    }

    const category = readCategory(fundModel);
    const manager = getRecord(fundModel, 'managementCompany');
    const organization = getRecord(manager, 'organization');
    const currency = getRecord(selectedClass, 'currency') ?? getRecord(fundModel, 'currency');
    const fees = getRecord(selectedClass, 'fees');
    const stats = getRecord(fundModel, 'stats');
    const performance = readMetricPoints(getRecord(stats, 'performance')?.periods);
    const classPerformance = readMetricPoint(selectedClass.annualizedPerformance);
    const ratings = readRatings(fundModel);
    const attributes = getRecord(fundModel, 'attributes');
    const benchmarkNames = asArray(fundModel.benchmarks).flatMap((value) => {
        const benchmark = asRecord(value);
        const name = getString(benchmark, 'name');
        return name ? [name] : [];
    });

    if (classPerformance && !performance.some((point) => point.period === classPerformance.period && point.type === classPerformance.type)) {
        performance.push(classPerformance);
    }

    const name = getString(fundModel, 'name') ?? getString(selectedClass, 'name');
    const className = getString(selectedClass, 'name') ?? name;
    const alias = getString(selectedClass, 'alias') ?? getString(fundModel, 'alias');

    if (!name || !className || !alias) {
        throw new FinectError('La ficha de Finect no contiene los datos identificativos del fondo.', 'parse');
    }

    return {
        isin: normalizedIsin,
        name,
        className,
        alias,
        description: getString(fundModel, 'description'),
        strategy: getString(fundModel, 'strategy'),
        manager: getString(manager, 'name')
            ?? getString(organization, 'displayName')
            ?? getString(fundModel, 'management_organization'),
        managerCountry: getString(manager, 'country'),
        category: getString(category, 'name'),
        categoryDescription: getString(category, 'description'),
        currencyCode: getString(currency, 'code'),
        currencyName: getString(currency, 'name'),
        availableDate: getString(fundModel, 'available'),
        srri: getNumber(fundModel, 'srri'),
        indexed: getBoolean(attributes, 'indexed'),
        finectScore: getNumber(fundModel, 'score') ?? ratings.finect,
        morningstarRating: ratings.morningstar,
        totalNetAsset: getNumber(fundModel, 'totalNetAsset'),
        classTotalNetAsset: getNumber(selectedClass, 'classTotalNetAsset'),
        minimumInvestment: getNumber(getRecord(selectedClass, 'minimalInvestment'), 'amount'),
        lastQuote: readLastQuote(fundModel, selectedClass),
        fees: {
            management: readFeeValue(fees, 'mgr'),
            totalExpenseRatio: readFeeValue(fees, 'ter'),
            ongoing: readFeeValue(fees, 'ogc'),
            entry: readFeeValue(fees, 'flo'),
            redemption: readFeeValue(fees, 'red'),
            custody: readFeeValue(fees, 'cus'),
            success: readFeeValue(fees, 'suc'),
        },
        features: readFeatures(fundModel),
        benchmarks: benchmarkNames,
        performance,
        statistics: readStatistics(fundModel),
        breakdowns: readBreakdowns(fundModel),
        holdings: readHoldings(fundModel),
        documents: readDocuments(fundModel),
        sourceUrl,
        fetchedAt,
    };
}

async function searchFinectFund(isin: string, signal?: AbortSignal): Promise<FinectSearchMatch> {
    const searchUrl = buildFinectUrl('/search', {
        key: getConfiguredApiKey(),
        limit: '50',
        q: isin,
        type: 'product',
    });
    const payload = await fetchJsonThroughProxy(searchUrl, signal);
    const root = asRecord(payload);
    const items = asArray(root?.data);

    const match = items.map(asRecord).find((item) => {
        if (!item || getString(item, 'type')?.toLowerCase() !== 'fund') return false;
        return normalizeOptionalIsin(getRecord(item, 'entity')?.isin) === isin;
    });
    const entity = getRecord(match, 'entity');

    if (!match || !entity) {
        throw new FinectError(`No se ha encontrado ningún fondo en Finect para ${isin}.`, 'not-found');
    }

    const alias = getString(entity, 'alias');
    if (!alias) {
        throw new FinectError('Finect ha encontrado el fondo, pero no ha devuelto su alias.', 'parse');
    }

    return {
        alias,
        pageUrl: getPageUrl(getString(match, 'url'), undefined),
    };
}

async function fetchApiModel(alias: string, signal?: AbortSignal): Promise<unknown> {
    const productUrl = buildFinectUrl(`/products/${encodeURIComponent(alias)}`, {
        key: getConfiguredApiKey(),
    });
    return fetchJsonThroughProxy(productUrl, signal);
}

/**
 * Gets a normalized Finect fund sheet from an ISIN.
 *
 * The public SPA transport can later be replaced by a backend transport while
 * keeping this function's return type and the calculator UI unchanged.
 */
export async function getFundRelevance(isinValue: string, signal?: AbortSignal): Promise<FinectFundRelevance> {
    const isin = normalizeIsin(isinValue);
    const cached = fundCache.get(isin);

    if (cached && Date.now() - cached.timestamp < FINECT_CACHE_TTL_MS) {
        return cached.data;
    }

    fundCache.delete(isin);
    const match = await searchFinectFund(isin, signal);
    let normalized: FinectFundRelevance;

    try {
        const html = await fetchHtmlThroughProxy(match.pageUrl, signal);
        const state = extractFinectInitialState(html);
        const model = extractModelFromInitialState(state);
        normalized = normalizeFinectFundModel(model, isin, match.pageUrl);
    } catch (htmlError) {
        if (isAbortError(htmlError) || signal?.aborted) throw htmlError;

        try {
            const payload = await fetchApiModel(match.alias, signal);
            const model = extractModelFromApiPayload(payload);
            normalized = normalizeFinectFundModel(model, isin, match.pageUrl);
        } catch (apiError) {
            if (isAbortError(apiError) || signal?.aborted) throw apiError;
            throw new FinectError(
                'No se ha podido leer la ficha de Finect. Prueba de nuevo en unos segundos.',
                'network',
                apiError ?? htmlError,
            );
        }
    }

    fundCache.set(isin, { data: normalized, timestamp: Date.now() });
    return normalized;
}
