import type { Asset } from '../types/types';
import { assetValue } from './assetValuation';

export const PLAN_TARGETS_KEY = 'freewallet_live_targets_v2';
export const LEGACY_PLAN_TARGETS_KEY = 'freewallet_live_targets';
export const CONTRIBUTION_STEP_EUR = 50;
export function planAssetKey(asset: Pick<Asset, 'isin' | 'symbol' | 'type'>): string {
    return `${asset.type}:${(asset.isin || asset.symbol).replace(/\s+/g, '').toUpperCase()}`;
}
export function parsePlanNumber(raw: string): number | null {
    if (!raw.trim()) return null;
    const value = Number(raw.trim().replace(',', '.'));
    return Number.isFinite(value) && value >= 0 ? value : null;
}
export function migratePlanTargets(assets: Asset[], current: Record<string, string>, legacy: Record<string, number>) {
    const next = { ...current };
    for (const a of assets) {
        const key = planAssetKey(a);
        if (next[key] !== undefined) continue;
        const ids = assets.filter(b => planAssetKey(b) === key);
        const amounts = ids.map(b => legacy[b.id]).filter(v => Number.isFinite(v) && v >= 0 && v <= 100);
        if (amounts.length) next[key] = String(amounts.reduce((s, v) => s + v, 0));
    }
    return next;
}
/** Targets are per instrument, not per lot; allocate whole €50 blocks within budget. */
export function calculateContributionPlan(assets: Asset[], targets: Record<string, string>, budgetRaw: string) {
    const groups = new Map<string, { key: string; name: string; value: number; assets: Asset[] }>();
    assets.forEach(a => {
        const key = planAssetKey(a);
        const group = groups.get(key) || { key, name: a.name, value: 0, assets: [] };
        group.value += assetValue(a); group.assets.push(a); groups.set(key, group);
    });
    const budget = parsePlanNumber(budgetRaw);
    const total = [...groups.values()].reduce((s, g) => s + g.value, 0);
    const rows = [...groups.values()].map(g => ({ ...g, target: parsePlanNumber(targets[g.key] || '') }));
    const targetTotal = rows.reduce((s, r) => s + (r.target ?? 0), 0);
    const validTargets = rows.length > 0 && rows.every(r => r.target !== null && r.target <= 100) && Math.abs(targetTotal - 100) < .01;
    const canCalculate = validTargets && budget !== null && budget >= CONTRIBUTION_STEP_EUR && Number.isSafeInteger(Math.round(budget * 100));
    const blocks = canCalculate ? Math.floor(budget! / CONTRIBUTION_STEP_EUR) : 0;
    const available = blocks * CONTRIBUTION_STEP_EUR;
    const planned = rows.map(r => ({ ...r, gap: Math.max(0, (total + available) * (r.target ?? 0) / 100 - r.value), blocks: 0 }));
    const shortfall = planned.reduce((s, r) => s + r.gap, 0);
    if (canCalculate && shortfall > 0) {
        planned.forEach(r => { r.blocks = Math.floor(blocks * (r.gap / shortfall)); });
        const byRemainder = planned.filter(r => r.gap > 0).sort((a, b) =>
            (blocks * (b.gap / shortfall) - b.blocks) - (blocks * (a.gap / shortfall) - a.blocks)
            || b.gap - a.gap || a.key.localeCompare(b.key));
        const remaining = blocks - planned.reduce((s, r) => s + r.blocks, 0);
        for (let i = 0; i < remaining; i++) byRemainder[i % byRemainder.length].blocks++;
    }
    const allocated = planned.reduce((s, r) => s + r.blocks * CONTRIBUTION_STEP_EUR, 0);
    const unallocated = budget === null ? 0 : Math.max(0, Math.round((budget - allocated) * 100) / 100);
    return { rows: planned.map(r => ({ ...r, contribution: r.blocks * CONTRIBUTION_STEP_EUR })), total, budget, allocated, unallocated, targetTotal, validTargets, canCalculate };
}

export function targetsFromCurrentWeights(assets: Asset[]): Record<string, string> {
    const plan = calculateContributionPlan(assets, {}, '');
    if (plan.total <= 0) return {};
    const weights = plan.rows.map(r => ({ key: r.key, raw: r.value / plan.total * 10000, units: Math.floor(r.value / plan.total * 10000) }));
    const remaining = 10000 - weights.reduce((s, r) => s + r.units, 0);
    const ordered = [...weights].sort((a, b) => (b.raw - b.units) - (a.raw - a.units));
    for (let i = 0; i < remaining; i++) ordered[i % ordered.length].units++;
    return Object.fromEntries(weights.map(r => [r.key, String(r.units / 100)]));
}
