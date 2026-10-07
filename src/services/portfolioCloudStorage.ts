import type { Asset } from '../types/types';

export const PRIVATE_KEYS = [
    'freewallet_portfolio_v1','freewallet_assets','freewallet_transactions',
    'freewallet_history','freewallet_goals','freewallet_watchlist','freewallet_settings',
    'freewallet_theme_mode','freewallet_appearance_mode','freewallet_live_targets_v2','freewallet_live_targets',
    'freewallet_workbook_link',
    ...['holdings_raw','evolution_raw','comparison_raw','advanced_raw','daily_raw','movements_raw','objectives_raw',
        'control_raw','workbook_file','updated_at','category_overrides','bucket_targets'].map(key => `freewallet_portfolio_csv_${key}`),
] as const;
export type CloudData = Record<string, string>;
export interface CloudRecord { revision: number; data: CloudData | null; patch?: boolean; removed?: string[] }
export type SyncStatus = 'local' | 'loading' | 'empty' | 'synced' | 'saving' | 'error' | 'conflict';
type Writer = (revision: number, requestId: string, data: CloudData, baseline?: CloudData) => Promise<CloudRecord>;
const allowed = new Set<string>(PRIVATE_KEYS);

export function canonicalPortfolio(raw: string): string {
    const state = JSON.parse(raw);
    return JSON.stringify({version:1,assets:state.assets.map((asset: Asset) => ({
        id:asset.id,symbol:asset.symbol,name:asset.name,type:asset.type,quantity:asset.quantity,
        purchasePrice:asset.purchasePrice,purchaseDate:asset.purchaseDate,currency:asset.currency,isin:asset.isin,
    })),transactions:state.transactions});
}
function normalized(data:CloudData):CloudData {
    const result=Object.fromEntries(Object.entries(data).sort(([a],[b])=>a.localeCompare(b)));
    delete result.freewallet_assets;delete result.freewallet_transactions;
    if(result.freewallet_portfolio_v1)result.freewallet_portfolio_v1=canonicalPortfolio(result.freewallet_portfolio_v1);
    return result;
}
function preserveQuotes(data:CloudData, current:CloudData):CloudData {
    if(!data.freewallet_portfolio_v1 || !current.freewallet_portfolio_v1)return {...data};
    const result=JSON.parse(data.freewallet_portfolio_v1);
    const old:Asset[]=JSON.parse(current.freewallet_portfolio_v1).assets;
    result.assets=result.assets.map((asset:Asset)=>{
        const cached=old.find(a=>a.id===asset.id && a.symbol===asset.symbol && a.isin===asset.isin);
        if(!cached)return asset;
        const {currentPrice,previousClose,holdings,lastQuoteAt,lastCheckedAt,lastReadAt,quoteOrigin,quotedAt,quoteSource,originalPrice,originalCurrency,originalUnit,unitScale,fxRate,fxAt,valuationBasis}=cached;
        return {...asset,currentPrice,previousClose,holdings,lastQuoteAt,lastCheckedAt,lastReadAt,quoteOrigin,quotedAt,quoteSource,originalPrice,originalCurrency,originalUnit,unitScale,fxRate,fxAt,valuationBasis};
    });
    return {...data,freewallet_portfolio_v1:JSON.stringify(result)};
}

/** Device-local mode stays untouched; signed-in portfolios live in memory only.
 * Only allowlisted data can cross the network. No tokens or market API keys.
 */
export class PortfolioCloudStorage {
    private userId: string | null = null;
    private generation = 0;
    private values: CloudData = {};
    private confirmed: CloudData = {};
    private writer?: Writer;
    private revision = -1;
    private timer?: ReturnType<typeof setTimeout>;
    private pending?: { revision:number; id:string; data:CloudData; baseline:CloudData };
    private flight?: Promise<void>;
    private listeners = new Set<() => void>();
    private viewEpoch=0;
    private recovered=new Map<string,CloudData>();
    private snapshot = {userId:null as string|null,status:'local' as SyncStatus,error:'',viewEpoch:0,recovered:false};
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => {this.listeners.delete(listener);}; };
    getSnapshot = () => this.snapshot;
    private emit(status: SyncStatus, error = '') {
        this.snapshot = {userId:this.userId,status,error,viewEpoch:this.viewEpoch,recovered:!!this.userId&&this.recovered.has(this.userId)};
        this.listeners.forEach(listener => listener());
    }
    get epoch() { return this.generation; }
    get cloud() { return this.userId !== null; }
    get busy() { return !!this.flight || !!this.pending || this.snapshot.status === 'saving'; }
    get currentRevision() { return this.revision; }
    select(userId: string | null, writer?: Writer) {
        if(this.userId && this.values.freewallet_portfolio_v1 && ['saving','error','conflict'].includes(this.snapshot.status)
            && JSON.stringify(this.exportData())!==JSON.stringify(this.confirmed))this.recovered.set(this.userId,this.exportData());
        this.generation++; if(this.timer) clearTimeout(this.timer);
        this.values={}; this.confirmed={}; this.pending=undefined; this.flight=undefined;
        this.revision=-1; this.userId=userId; this.writer=writer;
        this.emit(userId ? 'loading':'local');
    }
    hydrate(record: CloudRecord | null) {
        if (!this.cloud || this.busy) return;
        if(record) {
            this.revision=record.revision;
            if(record.data) { this.values=preserveQuotes(record.data,this.values); this.confirmed=normalized(record.data);this.viewEpoch++; }
            this.emit('synced');
        } else { this.emit('empty'); }
        if(typeof window !== 'undefined') window.dispatchEvent(new Event('freewallet-data-change'));
    }
    fail(error: string) { this.emit('error',error); }
    getItem(key: string): string | null {
        if (this.cloud && allowed.has(key)) {
            if(key==='freewallet_portfolio_v1' && this.confirmed[key] && ['saving','error','conflict'].includes(this.snapshot.status))
                return preserveQuotes(this.confirmed,this.values)[key];
            return this.values[key] ?? null;
        }
        return localStorage.getItem(key);
    }
    private writable() {
        if(!['synced','saving'].includes(this.snapshot.status)) throw new Error(this.snapshot.error || 'Abre Mi cuenta para importar o recuperar tu cartera antes de editar.');
        if(typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('Sin conexión: la cartera es de solo lectura.');
    }
    setItem(key: string, value: string) {
        if(!this.cloud || !allowed.has(key)) { localStorage.setItem(key,value); return; }
        if(this.values[key] === value) return;
        const before = this.values[key];
        // Market quotes are ephemeral, never portfolio mutations.
        if(key==='freewallet_portfolio_v1' && before && (canonicalPortfolio(before)===canonicalPortfolio(value)
            || (this.confirmed[key] && canonicalPortfolio(this.confirmed[key])===canonicalPortfolio(value)))) {
            this.values=preserveQuotes(this.values,{[key]:value});return;
        }
        this.writable();this.values[key]=value;
        this.emit('saving');
        if(this.timer) clearTimeout(this.timer);
        this.timer=setTimeout(() => { void this.flush().catch(() => {}); },600);
    }
    removeItem(key: string) {
        if(!this.cloud || !allowed.has(key)) {localStorage.removeItem(key);return;}
        this.writable(); delete this.values[key]; this.emit('saving');
        if(this.timer) clearTimeout(this.timer);
        this.timer=setTimeout(() => {void this.flush().catch(() => {});},600);
    }
    exportData(): CloudData {
        return normalized(this.values);
    }
    recoveredData():CloudData|null{return this.userId?this.recovered.get(this.userId)??null:null;}
    async flush(): Promise<void> {
        if(!this.cloud) return;
        if(this.timer) {clearTimeout(this.timer);this.timer=undefined;}
        if(this.flight) { await this.flight; return this.flush(); }
        if(!this.writer || this.revision<0) throw new Error('La cartera todavía no está importada.');
        if(this.snapshot.status==='conflict') throw new Error(this.snapshot.error);
        const wanted=this.exportData();
        if(!this.pending && JSON.stringify(wanted)===JSON.stringify(this.confirmed)) {this.emit('synced');return;}
        this.pending ??= {revision:this.revision,id:crypto.randomUUID(),data:wanted,baseline:{...this.confirmed}};
        const request=this.pending; const epoch=this.generation; const writer=this.writer;
        this.emit('saving');
        const run=async () => {
            try {
                const record=await writer(request.revision,request.id,request.data,request.baseline);
                if(epoch!==this.generation) throw new Error('La sesión ha cambiado.');
                if(!record.data) throw new Error('Respuesta incompleta del servidor.');
                const unchanged=JSON.stringify(this.exportData())===JSON.stringify(request.data);
                this.revision=record.revision; this.confirmed=normalized(record.data); this.pending=undefined;
                if(unchanged) this.values=preserveQuotes(record.data,this.values);
                else if(this.exportData().freewallet_portfolio_v1===request.data.freewallet_portfolio_v1)
                    this.values=preserveQuotes({...this.values,freewallet_portfolio_v1:record.data.freewallet_portfolio_v1},this.values);
                this.emit(unchanged?'synced':'saving');
                if(typeof window!=='undefined') window.dispatchEvent(new Event('freewallet-data-change'));
            } catch(error) {
                if(epoch===this.generation) {
                    const conflict=typeof error==='object' && error!==null && 'code' in error && error.code==='40001';
                    this.emit(conflict?'conflict':'error',conflict ? 'La cartera cambió en otro dispositivo. Exporta tus cambios pendientes y carga la versión del servidor.' : 'No se ha confirmado el guardado. Tus cambios siguen en esta pestaña; puedes exportarlos o reintentar.');
                }
                throw error;
            }
        };
        this.flight=run();
        try {await this.flight;} finally {if(epoch===this.generation)this.flight=undefined;}
        if(epoch===this.generation && this.snapshot.status==='saving') await this.flush();
    }
    /** Explicitly discard pending edits, never automatically on a conflict. */
    discard() { if(this.flight) throw new Error('Espera a que termine la petición.'); if(this.timer){clearTimeout(this.timer);this.timer=undefined;}this.pending=undefined;this.values={...this.confirmed};this.viewEpoch++;this.emit(this.revision<0?'empty':'synced'); }
}
export const portfolioStorage = new PortfolioCloudStorage();

export function captureLocalPortfolio(): CloudData {
    const data: CloudData={};
    for(const key of PRIVATE_KEYS) { const value=localStorage.getItem(key);if(value!==null)data[key]=value; }
    if(!data.freewallet_portfolio_v1) data.freewallet_portfolio_v1=JSON.stringify({version:1,
        assets:JSON.parse(data.freewallet_assets||'[]'),transactions:JSON.parse(data.freewallet_transactions||'[]')});
    delete data.freewallet_assets;delete data.freewallet_transactions;
    data.freewallet_portfolio_v1=canonicalPortfolio(data.freewallet_portfolio_v1);
    return data;
}

export function readPrivateBackup(raw:string):CloudData {
    if(new TextEncoder().encode(raw).length>8388608)throw new Error('La copia supera el límite de 8 MB.');
    const backup=JSON.parse(raw);
    if(backup.format!=='freewallet-private-backup'||backup.version!==1||!backup.data||Array.isArray(backup.data)||typeof backup.data!=='object')throw new Error('La copia no tiene un formato compatible.');
    for(const [key,value] of Object.entries(backup.data))if(!allowed.has(key)||typeof value!=='string')throw new Error('La copia contiene campos no admitidos.');
    if(!backup.data.freewallet_portfolio_v1)throw new Error('La copia no incluye posiciones.');
    return normalized(backup.data);
}
