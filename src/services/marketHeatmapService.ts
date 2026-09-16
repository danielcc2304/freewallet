import type {
    MarketHeatmapConstituent,
    MarketHeatmapIndex,
} from '../data/marketHeatmapIndices';

type WorkbookRow = Array<unknown>;

const SECTOR_LABELS: Record<string, string> = {
    'Information Technology': 'Tecnología de la información',
    Financials: 'Finanzas',
    Industrials: 'Industria',
    'Health Care': 'Salud',
    'Consumer Discretionary': 'Consumo discrecional',
    Communication: 'Servicios de comunicación',
    'Communication Services': 'Servicios de comunicación',
    'Consumer Staples': 'Consumo básico',
    Energy: 'Energía',
    Materials: 'Materiales',
    Utilities: 'Utilities',
    'Real Estate': 'Inmobiliario',
    Tecnología: 'Tecnología de la información',
    Comunicación: 'Servicios de comunicación',
};

const COUNTRY_LABELS: Record<string, string> = {
    'United States': 'Estados Unidos',
    'United Kingdom': 'Reino Unido',
    Netherlands: 'Países Bajos',
    Germany: 'Alemania',
    Spain: 'España',
    France: 'Francia',
    Switzerland: 'Suiza',
    Japan: 'Japón',
    'Korea (South)': 'Corea del Sur',
    Taiwan: 'Taiwán',
    China: 'China',
    India: 'India',
    Brazil: 'Brasil',
    'Saudi Arabia': 'Arabia Saudí',
    Canada: 'Canadá',
    Australia: 'Australia',
};

function cellText(value: unknown): string {
    return String(value ?? '').trim();
}

function parseWeight(value: unknown): number {
    const normalized = cellText(value).replace(/[%\s]/g, '').replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSector(value: unknown, fallback: string): string {
    const rawValue = cellText(value);
    if (!rawValue || rawValue === '-' || rawValue.toLowerCase() === 'n/a') return fallback;
    return SECTOR_LABELS[rawValue] || rawValue;
}

function normalizeUsTicker(ticker: string): string {
    return ticker.replace(/\s+/g, '-').replace(/\./g, '-').replace(/-+$/g, '');
}

function normalizeYahooSymbol(tickerValue: unknown, exchangeValue: unknown, locationValue: unknown): string | null {
    const ticker = cellText(tickerValue).replace(/^"|"$/g, '');
    const exchange = cellText(exchangeValue).toLowerCase();
    const location = cellText(locationValue).toLowerCase();
    if (!ticker || ticker === '-' || ticker.startsWith('XTSLA')) return null;

    if (
        location === 'united states'
        || exchange === 'nasdaq'
        || exchange === 'nyse'
        || exchange.startsWith('nyse arca')
        || exchange.includes('cboe bzx')
    ) {
        return normalizeUsTicker(ticker);
    }
    if (exchange.includes('shanghai')) return `${ticker}.SS`;
    if (exchange.includes('shenzhen')) return `${ticker}.SZ`;
    if (exchange.includes('hong kong')) return `${ticker.padStart(4, '0')}.HK`;
    if (exchange.includes('taiwan')) return `${ticker.padStart(4, '0')}.TW`;
    if (exchange.includes('gretai')) return `${ticker.padStart(4, '0')}.TWO`;
    if (exchange.includes('kosdaq')) return `${ticker.padStart(6, '0')}.KQ`;
    if (exchange.includes('korea')) return `${ticker.padStart(6, '0')}.KS`;
    if (exchange.includes('national stock exchange of india')) return `${ticker}.NS`;
    if (exchange.includes('bse ltd')) return `${ticker}.BO`;
    if (exchange.includes('xbsp') || exchange.includes('b3 - brasil')) return `${ticker}.SA`;
    if (exchange.includes('london')) return `${ticker.replace(/\.$/, '')}.L`;
    if (exchange.includes('toronto')) return `${ticker}.TO`;
    if (exchange.includes('tokyo')) return `${ticker}.T`;
    if (exchange.includes('asx')) return `${ticker}.AX`;
    if (exchange.includes('six swiss')) return `${ticker}.SW`;
    if (exchange.includes('xetra')) return `${ticker}.DE`;
    if (exchange.includes('euronext amsterdam')) return `${ticker}.AS`;
    if (exchange.includes('euronext paris')) return `${ticker}.PA`;
    if (exchange.includes('bolsa de madrid')) return `${ticker}.MC`;
    if (exchange.includes('borsa italiana')) return `${ticker}.MI`;
    if (exchange.includes('copenhagen')) return `${ticker.replace(/\s+/g, '-')}.CO`;
    if (exchange.includes('stockholm')) return `${ticker.replace(/\s+/g, '-')}.ST`;
    if (exchange.includes('helsinki')) return `${ticker.replace(/\s+/g, '-')}.HE`;
    if (exchange.includes('nasdaq omx nordic')) {
        if (location.includes('sweden')) return `${ticker.replace(/\s+/g, '-')}.ST`;
        if (location.includes('denmark')) return `${ticker.replace(/\s+/g, '-')}.CO`;
        if (location.includes('finland')) return `${ticker.replace(/\s+/g, '-')}.HE`;
    }
    if (exchange.includes('oslo')) return `${ticker}.OL`;
    if (exchange.includes('brussels')) return `${ticker}.BR`;
    if (exchange.includes('lisbon')) return `${ticker}.LS`;
    if (exchange.includes('wiener')) return `${ticker}.VI`;
    if (exchange.includes('irish')) return `${ticker}.IR`;
    if (exchange.includes('new zealand')) return `${ticker}.NZ`;
    if (exchange.includes('johannesburg')) return `${ticker}.JO`;
    if (exchange.includes('saudi')) return `${ticker}.SR`;
    if (exchange.includes('mexican') || exchange.includes('bolsa mexicana')) return `${ticker}.MX`;
    if (exchange.includes('warsaw')) return `${ticker}.WA`;
    if (exchange.includes('budapest')) return `${ticker}.BD`;
    if (exchange.includes('thailand')) return `${ticker}.BK`;
    if (exchange.includes('malaysia')) return `${ticker}.KL`;
    if (exchange.includes('indonesia')) return `${ticker}.JK`;
    if (exchange.includes('singapore')) return `${ticker}.SI`;
    if (exchange.includes('istanbul')) return `${ticker}.IS`;
    if (exchange.includes('tel aviv')) return `${ticker}.TA`;
    if (exchange.includes('qatar')) return `${ticker}.QA`;
    if (exchange.includes('athens')) return `${ticker}.AT`;
    if (exchange.includes('santiago')) return `${ticker}.SN`;
    if (exchange.includes('abu dhabi')) return `${ticker}.AD`;
    if (exchange.includes('dubai')) return `${ticker}.DU`;
    if (exchange.includes('kuwait')) return `${ticker}.KW`;
    if (exchange.includes('philippine')) return `${ticker}.PS`;
    if (exchange.includes('colombia')) return `${ticker}.CL`;
    if (exchange.includes('prague')) return `${ticker}.PR`;
    if (exchange.includes('egyptian')) return `${ticker}.CA`;

    return null;
}

async function readSectorMap(index: MarketHeatmapIndex, signal: AbortSignal): Promise<Map<string, string>> {
    if (!index.sectorEndpoint) return new Map();

    const response = await fetch(index.sectorEndpoint, { signal });
    if (!response.ok) throw new Error(`Sector request failed with ${response.status}`);

    const html = await response.text();
    const document = new DOMParser().parseFromString(html, 'text/html');
    const table = Array.from(document.querySelectorAll('table')).find((candidate) => {
        const header = cellText(candidate.querySelector('tr')?.textContent).toLowerCase();
        return header.includes('symbol') && header.includes('gics sector');
    });
    if (!table) return new Map();

    const headers = Array.from(table.querySelectorAll('tr:first-child th, tr:first-child td'))
        .map((cell) => cellText(cell.textContent).toLowerCase());
    const symbolColumn = headers.findIndex((header) => header === 'symbol');
    const sectorColumn = headers.findIndex((header) => header.includes('gics sector'));
    if (symbolColumn < 0 || sectorColumn < 0) return new Map();

    return new Map(
        Array.from(table.querySelectorAll('tr')).slice(1).flatMap((row) => {
            const cells = Array.from(row.querySelectorAll('td')).map((cell) => cellText(cell.textContent));
            const symbol = normalizeUsTicker(cells[symbolColumn] || '');
            const sector = normalizeSector(cells[sectorColumn], 'Otros');
            return symbol && sector !== 'Otros' ? [[symbol, sector] as const] : [];
        }),
    );
}

async function readRows(index: MarketHeatmapIndex, signal: AbortSignal): Promise<WorkbookRow[]> {
    const response = await fetch(index.holdingsEndpoint, { signal });
    if (!response.ok) throw new Error(`Holdings request failed with ${response.status}`);

    const XLSX = await import('xlsx');
    const workbook = index.holdingsFormat === 'xlsx'
        ? XLSX.read(await response.arrayBuffer(), { type: 'array' })
        : XLSX.read(await response.text(), { type: 'string' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<WorkbookRow>(firstSheet, { header: 1, defval: '' });
}

function parseRows(index: MarketHeatmapIndex, rows: WorkbookRow[]): MarketHeatmapConstituent[] {
    const headerIndex = rows.findIndex((row) => row.some((cell) => cellText(cell) === 'Ticker'));
    if (headerIndex < 0) return [];

    const headers = rows[headerIndex].map((cell) => cellText(cell));
    const column = (name: string) => headers.indexOf(name);
    const tickerColumn = column('Ticker');
    const nameColumn = column('Name');
    const weightColumn = column('Weight (%)') >= 0 ? column('Weight (%)') : column('Weight');
    const sectorColumn = column('Sector');
    const locationColumn = column('Location');
    const exchangeColumn = column('Exchange');
    const assetClassColumn = column('Asset Class');
    const fallbackBySymbol = new Map(index.constituents.map((item) => [item.symbol, item]));
    const seen = new Set<string>();

    return rows.slice(headerIndex + 1).flatMap((row) => {
        const assetClass = assetClassColumn >= 0 ? cellText(row[assetClassColumn]) : 'Equity';
        if (assetClass && assetClass !== 'Equity') return [];

        const symbol = normalizeYahooSymbol(
            row[tickerColumn],
            exchangeColumn >= 0 ? row[exchangeColumn] : '',
            locationColumn >= 0 ? row[locationColumn] : index.id === 'sp500' ? 'United States' : '',
        );
        const weight = parseWeight(row[weightColumn]);
        const name = cellText(row[nameColumn]);
        if (!symbol || !name || weight <= 0 || seen.has(symbol)) return [];
        seen.add(symbol);

        const fallback = fallbackBySymbol.get(symbol);
        const sourceSector = sectorColumn >= 0 ? cellText(row[sectorColumn]) : '';
        const sourceCountry = locationColumn >= 0 ? cellText(row[locationColumn]) : '';
        return [{
            symbol,
            displaySymbol: fallback?.displaySymbol || cellText(row[tickerColumn]),
            name: fallback?.name || name,
            weight,
            sector: normalizeSector(fallback?.sector || sourceSector, index.label),
            country: fallback?.country || COUNTRY_LABELS[sourceCountry] || sourceCountry || 'Estados Unidos',
        }];
    }).sort((left, right) => right.weight - left.weight);
}

export async function loadMarketIndexHoldings(
    index: MarketHeatmapIndex,
    signal: AbortSignal,
): Promise<MarketHeatmapConstituent[]> {
    try {
        let parsed = parseRows(index, await readRows(index, signal));
        if (index.sectorEndpoint && parsed.length > 0) {
            const sectorMap = await readSectorMap(index, signal);
            if (sectorMap.size > 0) {
                parsed = parsed.map((constituent) => ({
                    ...constituent,
                    sector: sectorMap.get(constituent.symbol) || constituent.sector,
                }));
            }
        }
        return parsed.length > index.constituents.length ? parsed : index.constituents;
    } catch (error) {
        if (signal.aborted) throw error;
        console.warn(`Could not refresh holdings for ${index.id}:`, error);
        return index.constituents;
    }
}
