export type FundSource = 'Finect' | 'Yahoo Finance' | 'VDOS/Quefondos' | 'Cobas AM' | 'Azvalor';
export interface FundObservation {
    isin: string; className: string; currency: string; price: number; at: string;
    previous: number | null; previousAt?: string; source: FundSource;
}
export function fundSourcePriority(source: string): number {
    return source === 'Cobas AM' || source === 'Azvalor' ? 0 : source === 'VDOS/Quefondos' ? 10 : source === 'Yahoo Finance' ? 20 : 30;
}
/** Keep all share-class tokens; only expand known fund-name abbreviations. */
export function fundClassIdentity(name: string): string {
    const aliases: Record<string,string> = {em:'emerging',mkts:'markets',stk:'stock',idx:'index',invms:'investments',rtl:'retail'};
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/€/g,' eur ')
        .replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(word=>!['fund','funds','fi','class'].includes(word))
        .map(word=>aliases[word]??word).join(' ');
}
export function newestFundObservation(observations: readonly FundObservation[]): FundObservation {
    const sorted=[...observations].sort((a,b)=>b.at.slice(0,10).localeCompare(a.at.slice(0,10)) || fundSourcePriority(a.source)-fundSourcePriority(b.source));
    const selected=sorted[0];
    if(!selected)throw new Error('No hay un valor liquidativo válido para esta clase');
    const result={...selected};
    // A manager's exact current NAV can use a dated preceding NAV from a
    // corroborating series, without deriving it from a rounded percentage.
    if(result.previous===null) {
        const corroborating=sorted.find(q=>q.at.slice(0,10)===result.at.slice(0,10)&&q.currency===result.currency
            && q.previous!==null && (!q.previousAt||q.previousAt.slice(0,10)<result.at.slice(0,10))
            && Math.abs(q.price/result.price-1)<0.000001);
        if(corroborating){result.previous=corroborating.previous;result.previousAt=corroborating.previousAt;}
    }
    return result;
}
