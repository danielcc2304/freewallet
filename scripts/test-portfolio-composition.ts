import { buildConsolidatedPortfolioExposures } from '../src/services/portfolioComposition';
import type { Asset, AssetHolding } from '../src/types/types';

function assert(condition: boolean, message: string): asserts condition {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const assets: Asset[] = [
    ['Fidelity MSCI World Index Fund EUR P Acc', 'IE00BYX5NX33', 'fund', 20881.40],
    ['Nueva Expresion Textil SA', 'NXTE.XD', 'stock', 14663.25],
    ['Ábaco Renta Fija Mixta Global I FI', 'ES0140072002', 'fund', 8627.03],
    ['Vanguard Emerging Markets Stock Index Fund EUR Acc', 'IE0031786696', 'fund', 6979.46],
    ['Myinvestor Value C FI', 'ES0165243025', 'fund', 6973.30],
    ['DWS Floating Rate Notes LC', 'LU0034353002', 'fund', 6019.37],
    ['Cobas Internacional D FI', 'ES0119199018', 'fund', 5096.86],
    ['Carmignac Pf Credit A EUR Acc', 'LU1623762843', 'fund', 4962.65],
    ['EC SICAV - EverCapital Investments UCITS I Fund Class Retail', 'LU1953238794', 'fund', 2842.07],
    ['Pictet-China Index P EUR', 'LU0625737910', 'fund', 2247.33],
    ['Azvalor Internacional FI', 'ES0112611001', 'fund', 2048.57],
    ['AMPER, S.A.', 'AMP.MC', 'stock', 1802.64],
    ['Bitcoin USD', 'BTC-USD', 'crypto', 965.36],
    ['OBRASCON HUARTE LAIN, S.A.', 'OHLA.MC', 'stock', 666],
].map(([name, symbol, type, value], index) => ({
    id: `asset-${index}`,
    name,
    symbol,
    type: type as Asset['type'],
    purchasePrice: Number(value),
    currentPrice: Number(value),
    purchaseDate: '2026-09-11',
    quantity: 1,
    currency: 'EUR',
    isin: type === 'fund' ? symbol : undefined,
}));

const holdings = new Map<string, readonly AssetHolding[]>([
    ['asset-0', [
        { symbol: 'AAPL', name: 'Apple Inc', percentage: 5 },
        { symbol: 'NVDA', name: 'NVIDIA Corp', percentage: 4 },
    ]],
    ['asset-3', [
        { symbol: 'AAPL', name: 'Apple Inc.', percentage: 3 },
        { symbol: 'NVIDIA', name: 'NVIDIA Corporation', percentage: 2 },
    ]],
    ['asset-4', [
        { symbol: 'AAPL', name: 'Apple Inc', percentage: 1 },
    ]],
]);

const exposures = buildConsolidatedPortfolioExposures(assets, holdings);
const totalWeight = exposures.reduce((sum, exposure) => sum + exposure.weight, 0);
const apple = exposures.find((exposure) => exposure.name === 'Apple Inc.');
const appleValue = 20881.40 * 0.05 + 6979.46 * 0.03 + 6973.30 * 0.01;

assert(exposures.length < assets.length + 3, 'combina las posiciones repetidas en una única exposición');
assert(apple !== undefined, 'conserva el nombre de la posición subyacente');
assert(Math.abs((apple?.value ?? 0) - appleValue) < 0.01, 'suma el valor de Apple entre los fondos');
assert(Math.abs(totalWeight - 100) < 0.0001, 'reconcilia el 100% incluyendo los restos de los fondos');
assert(exposures.some((exposure) => exposure.isResidual), 'mantiene visible el porcentaje no desglosado');

console.log(`Portfolio composition tests passed: ${assets.length} posiciones → ${exposures.length} exposiciones, ${totalWeight.toFixed(2)}% reconciliado.`);
