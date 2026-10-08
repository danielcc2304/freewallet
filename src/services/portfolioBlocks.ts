import type { Asset } from '../types/types';
import type { FinectFundRelevance } from './finect/finectService';
import { assetValue } from './assetValuation';
import { benchmarkFundIsin } from './portfolioBenchmark';

const names = ['Renta variable', 'Renta fija', 'Cripto', 'Liquidez', 'Otros'] as const;
export type BlockAllocation = Record<(typeof names)[number], number>;
const empty = (): BlockAllocation => Object.fromEntries(names.map(name => [name, 0])) as BlockAllocation;
const labelBlock = (label: string): keyof BlockAllocation => {
    const text = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const matches: Array<keyof BlockAllocation> = [];
    if (/equities|equity|stocks?|shares?|renta variable|acciones/.test(text)) matches.push('Renta variable');
    if (/fixed income|renta fija|bonds?|bonos?|obligaciones|deuda/.test(text)) matches.push('Renta fija');
    if (/money market|monetario|cash|liquidez|liquidity/.test(text)) matches.push('Liquidez');
    if (/crypto|cripto|bitcoin/.test(text)) matches.push('Cripto');
    return matches.length === 1 ? matches[0] : 'Otros';
};
export function fundBlockAllocation(fund: Pick<FinectFundRelevance, 'breakdowns' | 'category' | 'categoryDescription'>): BlockAllocation {
    const result = empty();
    const items = fund.breakdowns.find(item => item.type === 'asset-allocation')?.items.filter(item => Number.isFinite(item.value) && item.value > 0) ?? [];
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (total > 0) {
        const scale = total > 100 ? 100 / total : 1;
        items.forEach(item => { result[labelBlock(item.label)] += item.value * scale; });
        result.Otros += Math.max(0, 100 - total);
    } else result[labelBlock(fund.category || fund.categoryDescription || '')] = 100;
    return result;
}
export function portfolioBlocks(assets: readonly Asset[], funds: Readonly<Record<string, BlockAllocation | null>>) {
    const values = empty();
    let unclassifiedValue = 0;
    for (const asset of assets) {
        const value = assetValue(asset);
        if (!Number.isFinite(value) || value <= 0) continue;
        if (asset.type === 'stock') values['Renta variable'] += value;
        else if (asset.type === 'crypto') values.Cripto += value;
        else if (asset.type === 'cash') values.Liquidez += value;
        else {
            const isin = benchmarkFundIsin(asset), allocation = isin ? funds[isin] : null;
            if (allocation) names.forEach(name => { values[name] += value * allocation[name] / 100; });
            else { values.Otros += value; unclassifiedValue += value; }
        }
    }
    const total = Object.values(values).reduce((sum, value) => sum + value, 0);
    return { rows: names.map(name => ({ name, value: values[name], weight: total > 0 ? values[name] / total * 100 : 0 })), total, unclassifiedValue };
}
