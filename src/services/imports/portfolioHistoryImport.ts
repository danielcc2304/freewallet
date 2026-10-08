import { portfolioStorage } from '../portfolioCloudStorage';
import { buildWorkbookHistory, buildWorkbookBenchmarkHistory } from '../portfolioWorkbookHistory';
import { HISTORY_ARCHIVE_KEY, emptyHistoryArchive, historicalFlowEffectiveDay, validateHistoryArchive } from '../portfolioHistoryArchive';
import type { PortfolioHistoryArchive } from '../portfolioHistoryArchive';
import { DEFAULT_COMPARISON_CSV, DEFAULT_EVOLUTION_CSV, STORAGE_KEYS } from './portfolioCsvConstants';
import { parseAdvancedStats } from './portfolioCsvUtils';

export function importHistoryArchive(input: { evolution:string; daily:string; movements:string; comparison:string; advanced:string; label:string; legacyLink?:string|null }, now = Date.now()): PortfolioHistoryArchive {
    const bundle = input.label === 'Demo precargada' && input.evolution.trim() === DEFAULT_EVOLUTION_CSV.trim()
        ? null : buildWorkbookHistory(input.evolution,input.daily,input.movements,now);
    let hash = 2166136261;
    for (const char of input.label+'\u0000'+input.evolution+'\u0000'+input.daily+'\u0000'+input.movements) hash = Math.imul(hash ^ char.charCodeAt(0),16777619);
    const identity = String(hash >>> 0);
    let linkedAssetIds:string[]=[];
    try { const link=JSON.parse(input.legacyLink || 'null'); if(link?.workbook===identity && Array.isArray(link.ids))linkedAssetIds=link.ids; } catch { /* An unverified import remains isolated. */ }
    const archive: PortfolioHistoryArchive = { ...emptyHistoryArchive(),identity,label:input.label,importedAt:new Date(now).toISOString(),linkedAssetIds,
        valuations:(bundle?.points ?? []).filter(p => Date.parse(p.date)<=now).map(p => ({date:p.date,value:p.value,invested:p.invested,cadence:p.cadence,returnUnavailable:p.returnUnavailable,historyOrigin:'import'})),
        cashFlows:(bundle?.flowTransactions ?? []).filter(t=>Date.parse(t.date+'T18:00:00Z')<=now).map(t => ({id:t.id,date:t.date,amount:(t.type==='sell'?-1:1)*t.total!,
            precision: /-movement-/.test(t.id) || bundle?.points.find(p=>p.date.slice(0,10)===t.date)?.cadence==='daily' ? 'day' as const : 'month' as const,source:'import'})),
        benchmarkReturns:input.label==='Demo precargada' && input.comparison.trim()===DEFAULT_COMPARISON_CSV.trim() ? [] : buildWorkbookBenchmarkHistory(input.comparison).filter(p=>Date.parse(p.date)<=now),
        riskFreeAnnualPct:parseAdvancedStats(input.advanced).riskFreeAnnualPct, evolutionCount:bundle?.evolutionCount ?? 0,dailyCount:bundle?.dailyCount ?? 0 };
    archive.cashFlows=archive.cashFlows.map(flow=>({...flow,date:historicalFlowEffectiveDay(flow)}));
    validateHistoryArchive(archive);
    return archive;
}
/** Compatibility boundary: legacy text is read once, outside analytics. */
export function migrateLegacyPortfolioHistory(replaceImport = false): boolean {
    if (typeof window==='undefined' || (portfolioStorage.cloud && !['synced','saving'].includes(portfolioStorage.getSnapshot().status))) return false;
    const existing=portfolioStorage.getItem(HISTORY_ARCHIVE_KEY);
    if(existing && !replaceImport)return false;
    const get=(key:string)=>portfolioStorage.getItem(key) || '';
    const input={evolution:get(STORAGE_KEYS.evolutionRaw),daily:get(STORAGE_KEYS.dailyRaw),movements:get(STORAGE_KEYS.movementsRaw),comparison:get(STORAGE_KEYS.comparisonRaw),advanced:get(STORAGE_KEYS.advancedRaw),label:get(STORAGE_KEYS.workbookFile),legacyLink:get('freewallet_workbook_link')};
    if(!input.evolution && !input.comparison)return false;
    const archive=importHistoryArchive(input);
    if(existing){
        const previous:PortfolioHistoryArchive=JSON.parse(existing);validateHistoryArchive(previous);
        // Reimporting a file cannot discard NAVs already submitted by an agent.
        archive.benchmarkNavs=previous.benchmarkNavs;
        archive.valuations=[...new Map([...archive.valuations,...previous.valuations.filter(p=>p.historyOrigin==='agent')].map(p=>[Date.parse(p.date),p])).values()];
        archive.cashFlows=[...new Map([...archive.cashFlows,...previous.cashFlows.filter(p=>p.source!=='import')].map(p=>[p.id,p])).values()];
        archive.benchmarkReturns=[...new Map([...archive.benchmarkReturns,...previous.benchmarkReturns.filter(p=>p.source==='agent')].map(p=>[Date.parse(p.date),p])).values()];
        if(previous.identity===archive.identity)archive.linkedAssetIds=previous.linkedAssetIds;
        if(JSON.stringify({...archive,importedAt:''})===JSON.stringify({...previous,importedAt:''}))return false;
    }
    portfolioStorage.setItem(HISTORY_ARCHIVE_KEY,JSON.stringify(archive));
    return true;
}
