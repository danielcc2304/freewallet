export type MarketHeatmapIndexId = 'sp500' | 'msci-world' | 'msci-emerging';

export interface MarketHeatmapConstituent {
    symbol: string;
    displaySymbol?: string;
    name: string;
    weight: number;
    sector: string;
    country: string;
}

export interface MarketHeatmapIndex {
    id: MarketHeatmapIndexId;
    label: string;
    shortLabel: string;
    description: string;
    proxySymbol: string;
    proxyLabel: string;
    holdingsEndpoint: string;
    holdingsFormat: 'xlsx' | 'csv';
    sectorEndpoint?: string;
    holdingsAsOf: string;
    totalHoldings: number;
    sourceLabel: string;
    sourceUrl: string;
    constituents: MarketHeatmapConstituent[];
}

export const MARKET_HEATMAP_INDICES: MarketHeatmapIndex[] = [
    {
        id: 'sp500',
        label: 'S&P 500',
        shortLabel: 'S&P 500',
        description: 'Grandes compañías cotizadas de Estados Unidos.',
        proxySymbol: 'SPY',
        proxyLabel: 'SPDR S&P 500 ETF Trust',
        holdingsEndpoint: '/__holdings/spy',
        holdingsFormat: 'xlsx',
        sectorEndpoint: '/__holdings/sp500-sectors',
        holdingsAsOf: '15 sep 2026',
        totalHoldings: 500,
        sourceLabel: 'State Street · SPY',
        sourceUrl: 'https://www.ssga.com/us/en/intermediary/etfs/state-street-spdr-sp-500-etf-trust-spy',
        constituents: [
            { symbol: 'NVDA', name: 'NVIDIA', weight: 7.856, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'AAPL', name: 'Apple', weight: 7.440, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'MSFT', name: 'Microsoft', weight: 5.645, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'AMZN', name: 'Amazon', weight: 3.718, sector: 'Consumo discrecional', country: 'Estados Unidos' },
            { symbol: 'GOOGL', name: 'Alphabet A', weight: 3.093, sector: 'Comunicación', country: 'Estados Unidos' },
            { symbol: 'GOOG', name: 'Alphabet C', weight: 2.467, sector: 'Comunicación', country: 'Estados Unidos' },
            { symbol: 'AVGO', name: 'Broadcom', weight: 2.456, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'META', name: 'Meta Platforms', weight: 2.250, sector: 'Comunicación', country: 'Estados Unidos' },
            { symbol: 'MU', name: 'Micron', weight: 1.599, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'TSLA', name: 'Tesla', weight: 1.535, sector: 'Consumo discrecional', country: 'Estados Unidos' },
            { symbol: 'BRK-B', displaySymbol: 'BRK.B', name: 'Berkshire Hathaway', weight: 1.448, sector: 'Finanzas', country: 'Estados Unidos' },
            { symbol: 'JPM', name: 'JPMorgan Chase', weight: 1.444, sector: 'Finanzas', country: 'Estados Unidos' },
            { symbol: 'LLY', name: 'Eli Lilly', weight: 1.374, sector: 'Salud', country: 'Estados Unidos' },
            { symbol: 'AMD', name: 'AMD', weight: 1.257, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'XOM', name: 'Exxon Mobil', weight: 1.073, sector: 'Energía', country: 'Estados Unidos' },
            { symbol: 'JNJ', name: 'Johnson & Johnson', weight: 0.983, sector: 'Salud', country: 'Estados Unidos' },
            { symbol: 'V', name: 'Visa', weight: 0.953, sector: 'Finanzas', country: 'Estados Unidos' },
            { symbol: 'INTC', name: 'Intel', weight: 0.733, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'WMT', name: 'Walmart', weight: 0.724, sector: 'Consumo básico', country: 'Estados Unidos' },
            { symbol: 'ABBV', name: 'AbbVie', weight: 0.710, sector: 'Salud', country: 'Estados Unidos' },
            { symbol: 'MA', name: 'Mastercard', weight: 0.707, sector: 'Finanzas', country: 'Estados Unidos' },
            { symbol: 'CSCO', name: 'Cisco', weight: 0.665, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'CVX', name: 'Chevron', weight: 0.623, sector: 'Energía', country: 'Estados Unidos' },
            { symbol: 'COST', name: 'Costco', weight: 0.611, sector: 'Consumo básico', country: 'Estados Unidos' },
            { symbol: 'PLTR', name: 'Palantir', weight: 0.606, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'BAC', name: 'Bank of America', weight: 0.594, sector: 'Finanzas', country: 'Estados Unidos' },
            { symbol: 'CAT', name: 'Caterpillar', weight: 0.552, sector: 'Industria', country: 'Estados Unidos' },
            { symbol: 'MRK', name: 'Merck', weight: 0.543, sector: 'Salud', country: 'Estados Unidos' },
            { symbol: 'KO', name: 'Coca-Cola', weight: 0.525, sector: 'Consumo básico', country: 'Estados Unidos' },
            { symbol: 'PG', name: 'Procter & Gamble', weight: 0.522, sector: 'Consumo básico', country: 'Estados Unidos' },
        ],
    },
    {
        id: 'msci-world',
        label: 'MSCI World',
        shortLabel: 'MSCI World',
        description: 'Renta variable de gran y mediana capitalización de mercados desarrollados.',
        proxySymbol: 'URTH',
        proxyLabel: 'iShares MSCI World ETF',
        holdingsEndpoint: '/__holdings/urth',
        holdingsFormat: 'csv',
        holdingsAsOf: '14 sep 2026',
        totalHoldings: 1253,
        sourceLabel: 'iShares · URTH',
        sourceUrl: 'https://www.ishares.com/us/products/239696/ishares-msci-world-etf',
        constituents: [
            { symbol: 'AAPL', name: 'Apple', weight: 5.39, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'NVDA', name: 'NVIDIA', weight: 5.34, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'MSFT', name: 'Microsoft', weight: 3.93, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'AMZN', name: 'Amazon', weight: 2.70, sector: 'Consumo discrecional', country: 'Estados Unidos' },
            { symbol: 'GOOGL', name: 'Alphabet A', weight: 2.26, sector: 'Comunicación', country: 'Estados Unidos' },
            { symbol: 'GOOG', name: 'Alphabet C', weight: 1.78, sector: 'Comunicación', country: 'Estados Unidos' },
            { symbol: 'AVGO', name: 'Broadcom', weight: 1.72, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'META', name: 'Meta Platforms', weight: 1.61, sector: 'Comunicación', country: 'Estados Unidos' },
            { symbol: 'MU', name: 'Micron', weight: 1.15, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'TSLA', name: 'Tesla', weight: 1.13, sector: 'Consumo discrecional', country: 'Estados Unidos' },
            { symbol: 'JPM', name: 'JPMorgan Chase', weight: 1.02, sector: 'Finanzas', country: 'Estados Unidos' },
            { symbol: 'LLY', name: 'Eli Lilly', weight: 1.01, sector: 'Salud', country: 'Estados Unidos' },
            { symbol: 'AMD', name: 'AMD', weight: 0.88, sector: 'Tecnología', country: 'Estados Unidos' },
            { symbol: 'BRK-B', displaySymbol: 'BRK.B', name: 'Berkshire Hathaway', weight: 0.80, sector: 'Finanzas', country: 'Estados Unidos' },
            { symbol: 'XOM', name: 'Exxon Mobil', weight: 0.75, sector: 'Energía', country: 'Estados Unidos' },
            { symbol: 'JNJ', name: 'Johnson & Johnson', weight: 0.70, sector: 'Salud', country: 'Estados Unidos' },
            { symbol: 'V', name: 'Visa', weight: 0.69, sector: 'Finanzas', country: 'Estados Unidos' },
            { symbol: 'ASML.AS', displaySymbol: 'ASML', name: 'ASML', weight: 0.68, sector: 'Tecnología', country: 'Países Bajos' },
            { symbol: 'ROG.SW', displaySymbol: 'ROG', name: 'Roche', weight: 0.34, sector: 'Salud', country: 'Suiza' },
            { symbol: 'RY.TO', displaySymbol: 'RY', name: 'Royal Bank of Canada', weight: 0.31, sector: 'Finanzas', country: 'Canadá' },
            { symbol: 'SHEL.L', displaySymbol: 'SHEL', name: 'Shell', weight: 0.30, sector: 'Energía', country: 'Reino Unido' },
            { symbol: '8306.T', displaySymbol: '8306', name: 'Mitsubishi UFJ', weight: 0.28, sector: 'Finanzas', country: 'Japón' },
            { symbol: 'NOVN.SW', displaySymbol: 'NOVN', name: 'Novartis', weight: 0.28, sector: 'Salud', country: 'Suiza' },
            { symbol: 'AZN.L', displaySymbol: 'AZN', name: 'AstraZeneca', weight: 0.27, sector: 'Salud', country: 'Reino Unido' },
            { symbol: 'NESN.SW', displaySymbol: 'NESN', name: 'Nestlé', weight: 0.27, sector: 'Consumo básico', country: 'Suiza' },
            { symbol: 'BHP.AX', displaySymbol: 'BHP', name: 'BHP', weight: 0.24, sector: 'Materiales', country: 'Australia' },
            { symbol: 'SIE.DE', displaySymbol: 'SIE', name: 'Siemens', weight: 0.24, sector: 'Industria', country: 'Alemania' },
            { symbol: 'SAP.DE', displaySymbol: 'SAP', name: 'SAP', weight: 0.24, sector: 'Tecnología', country: 'Alemania' },
            { symbol: 'SAN.MC', displaySymbol: 'SAN', name: 'Banco Santander', weight: 0.23, sector: 'Finanzas', country: 'España' },
            { symbol: '7203.T', displaySymbol: '7203', name: 'Toyota', weight: 0.20, sector: 'Consumo discrecional', country: 'Japón' },
            { symbol: 'CBA.AX', displaySymbol: 'CBA', name: 'Commonwealth Bank', weight: 0.20, sector: 'Finanzas', country: 'Australia' },
            { symbol: 'TTE.PA', displaySymbol: 'TTE', name: 'TotalEnergies', weight: 0.20, sector: 'Energía', country: 'Francia' },
            { symbol: 'IBE.MC', displaySymbol: 'IBE', name: 'Iberdrola', weight: 0.16, sector: 'Utilities', country: 'España' },
        ],
    },
    {
        id: 'msci-emerging',
        label: 'MSCI Emerging Markets',
        shortLabel: 'MSCI Emerging',
        description: 'Grandes y medianas compañías de mercados emergentes.',
        proxySymbol: 'EEM',
        proxyLabel: 'iShares MSCI Emerging Markets ETF',
        holdingsEndpoint: '/__holdings/eem',
        holdingsFormat: 'csv',
        holdingsAsOf: '14 sep 2026',
        totalHoldings: 1186,
        sourceLabel: 'iShares · EEM',
        sourceUrl: 'https://www.ishares.com/us/products/239637/ishares-msci-emerging-markets-etf',
        constituents: [
            { symbol: '2330.TW', displaySymbol: '2330', name: 'TSMC', weight: 15.07, sector: 'Tecnología', country: 'Taiwán' },
            { symbol: '005930.KS', displaySymbol: '005930', name: 'Samsung Electronics', weight: 7.05, sector: 'Tecnología', country: 'Corea del Sur' },
            { symbol: '000660.KS', displaySymbol: '000660', name: 'SK Hynix', weight: 5.68, sector: 'Tecnología', country: 'Corea del Sur' },
            { symbol: '0700.HK', displaySymbol: '0700', name: 'Tencent', weight: 2.75, sector: 'Comunicación', country: 'China' },
            { symbol: '9988.HK', displaySymbol: '9988', name: 'Alibaba', weight: 1.85, sector: 'Consumo discrecional', country: 'China' },
            { symbol: '2454.TW', displaySymbol: '2454', name: 'MediaTek', weight: 1.69, sector: 'Tecnología', country: 'Taiwán' },
            { symbol: '005935.KS', displaySymbol: '005935', name: 'Samsung Electronics Pref.', weight: 0.89, sector: 'Tecnología', country: 'Corea del Sur' },
            { symbol: '0939.HK', displaySymbol: '0939', name: 'China Construction Bank', weight: 0.87, sector: 'Finanzas', country: 'China' },
            { symbol: '2308.TW', displaySymbol: '2308', name: 'Delta Electronics', weight: 0.81, sector: 'Tecnología', country: 'Taiwán' },
            { symbol: '2317.TW', displaySymbol: '2317', name: 'Hon Hai', weight: 0.78, sector: 'Tecnología', country: 'Taiwán' },
            { symbol: 'HDFCBANK.NS', displaySymbol: 'HDFCBANK', name: 'HDFC Bank', weight: 0.69, sector: 'Finanzas', country: 'India' },
            { symbol: 'RELIANCE.NS', displaySymbol: 'RELIANCE', name: 'Reliance Industries', weight: 0.62, sector: 'Energía', country: 'India' },
            { symbol: 'ICICIBANK.NS', displaySymbol: 'ICICIBANK', name: 'ICICI Bank', weight: 0.61, sector: 'Finanzas', country: 'India' },
            { symbol: '402340.KS', displaySymbol: '402340', name: 'SK Square', weight: 0.56, sector: 'Industria', country: 'Corea del Sur' },
            { symbol: '3711.TW', displaySymbol: '3711', name: 'ASE Technology', weight: 0.53, sector: 'Tecnología', country: 'Taiwán' },
            { symbol: '1398.HK', displaySymbol: '1398', name: 'ICBC', weight: 0.52, sector: 'Finanzas', country: 'China' },
            { symbol: '1810.HK', displaySymbol: '1810', name: 'Xiaomi', weight: 0.48, sector: 'Tecnología', country: 'China' },
            { symbol: '009150.KS', displaySymbol: '009150', name: 'Samsung Electro-Mechanics', weight: 0.45, sector: 'Tecnología', country: 'Corea del Sur' },
            { symbol: 'BHARTIARTL.NS', displaySymbol: 'BHARTIARTL', name: 'Bharti Airtel', weight: 0.44, sector: 'Comunicación', country: 'India' },
            { symbol: 'VALE3.SA', displaySymbol: 'VALE3', name: 'Vale', weight: 0.43, sector: 'Materiales', country: 'Brasil' },
            { symbol: 'NU', name: 'Nu Holdings', weight: 0.43, sector: 'Finanzas', country: 'Brasil' },
            { symbol: '1120.SR', displaySymbol: '1120', name: 'Al Rajhi Bank', weight: 0.42, sector: 'Finanzas', country: 'Arabia Saudí' },
            { symbol: '3988.HK', displaySymbol: '3988', name: 'Bank of China', weight: 0.42, sector: 'Finanzas', country: 'China' },
            { symbol: '2303.TW', displaySymbol: '2303', name: 'United Microelectronics', weight: 0.41, sector: 'Tecnología', country: 'Taiwán' },
            { symbol: '3690.HK', displaySymbol: '3690', name: 'Meituan', weight: 0.39, sector: 'Consumo discrecional', country: 'China' },
            { symbol: 'ITUB4.SA', displaySymbol: 'ITUB4', name: 'Itaú Unibanco', weight: 0.36, sector: 'Finanzas', country: 'Brasil' },
            { symbol: 'PETR4.SA', displaySymbol: 'PETR4', name: 'Petrobras', weight: 0.35, sector: 'Energía', country: 'Brasil' },
            { symbol: '2318.HK', displaySymbol: '2318', name: 'Ping An Insurance', weight: 0.35, sector: 'Finanzas', country: 'China' },
            { symbol: '2222.SR', displaySymbol: '2222', name: 'Saudi Aramco', weight: 0.34, sector: 'Energía', country: 'Arabia Saudí' },
            { symbol: 'PDD', name: 'PDD Holdings', weight: 0.33, sector: 'Consumo discrecional', country: 'China' },
        ],
    },
];

export const MARKET_HEATMAP_INDEX_BY_ID = Object.fromEntries(
    MARKET_HEATMAP_INDICES.map((index) => [index.id, index]),
) as Record<MarketHeatmapIndexId, MarketHeatmapIndex>;
