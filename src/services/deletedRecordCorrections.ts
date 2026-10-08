import {getAssets,getTransactions,getSettings,saveSettings} from './storageService';
import {deletedRecordReviews} from './portfolioResults';
import {portfolioStorage} from './portfolioCloudStorage';
import {notifyLocalDataChange} from '../hooks/useLocalDataVersion';

/** Preserve the immutable ledger; store a reversible, owner-scoped decision. */
export async function correctDeletedRecord(deletionId:string,discard:boolean) {
    const epoch=portfolioStorage.epoch;
    if(portfolioStorage.cloud)await portfolioStorage.flush();
    if(epoch!==portfolioStorage.epoch)throw new Error('La cuenta ha cambiado.');
    const settings=getSettings();
    const review=deletedRecordReviews(getAssets(),getTransactions(),settings.discardedPositionRecords).find(r=>r.id===deletionId);
    if(!review || (discard && !review.canDiscard))throw new Error('Este registro contiene ventas o posiciones activas y necesita revisar sus operaciones.');
    const corrections=(Array.isArray(settings.discardedPositionRecords) ? settings.discardedPositionRecords : []).filter(c=>c && c.deletionId!==deletionId);
    if(discard)corrections.push({deletionId,assetId:review.assetId,confirmedAt:new Date().toISOString()});
    saveSettings({...settings,discardedPositionRecords:corrections});
    await portfolioStorage.flush();
    if(epoch!==portfolioStorage.epoch)throw new Error('La cuenta ha cambiado.');
    notifyLocalDataChange();
}
