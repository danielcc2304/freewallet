import assert from 'node:assert/strict';
import {marketDatabase,migration,A} from './fixtures/marketDatabase';
import {VERIFIED_STOCK_LISTINGS,verifiedStockListings} from '../supabase/functions/_shared/stockListings';
import {fetchMarketPrice,type MarketInstrument} from '../supabase/functions/daily-market-data/providers';

const db=await marketDatabase();
const B='22222222-2222-4222-8222-222222222222',S='33333333-3333-4333-8333-333333333333',T='44444444-4444-4444-8444-444444444444';
const login=async(id:string,sid:string)=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${id}',false);select set_config('request.jwt.claims','{"sub":"${id}","session_id":"${sid}","aal":"aal1"}',false);set role authenticated;`);
try {
    await db.exec(migration('unified_quote_markets.sql'));
    const registry=(await db.query<{security_isin:string;market_id:string;instrument:string;google_listing:string;currency:string;original_symbols:string[];is_default:boolean}>('select * from portfolio_private.stock_quote_listings order by security_isin,market_id')).rows;
    assert.deepEqual(registry,VERIFIED_STOCK_LISTINGS.map(row=>({security_isin:row.isin,market_id:row.marketId,instrument:row.instrument,google_listing:row.google,currency:row.currency,original_symbols:[...row.aliases],is_default:row.default})),'Browser and SQL registry agree');
    for(const isin of [undefined,'ES0126962069'])assert.equal(verifiedStockListings({type:'stock',symbol:'NXTE.XD',isin})[0].instrument,'NXT:BME');
    assert.equal(verifiedStockListings({type:'stock',symbol:'NXTE.XD',isin:'US0378331005'}).length,0);
    assert.equal(verifiedStockListings({type:'fund',symbol:'NXTE.XD'}).length,0);
    await db.exec(`insert into auth.users(id,email) values('${B}','second@example.test');insert into auth.sessions values('${S}','${A}'),('${T}','${B}');`);
    const day=new Date().toISOString().slice(0,10);
    const asset={id:'nextil',type:'stock',symbol:'NXTE.XD',name:'Nextil',quantity:10,purchasePrice:1,purchaseDate:day,currency:'EUR'};
    const tx={id:'buy-1',assetId:asset.id,assetSymbol:asset.symbol,assetName:asset.name,assetType:'stock',type:'buy',date:day,quantity:10,price:1,total:10,createdAt:day,provenance:'trade'};
    for(const [owner,sid,choice] of [[A,S,'BME'],[B,T,'original']]){
        await login(owner,sid);
        await db.query('select public.commit_portfolio(-1,gen_random_uuid(),\'import\',$1)',[JSON.stringify({freewallet_portfolio_v1:JSON.stringify({version:1,assets:[asset],transactions:[tx]}),freewallet_settings:JSON.stringify({apiEnabled:true,stockQuoteMarkets:{nextil:choice}})})]);
    }
    await db.exec('reset role');
    const run=(await db.query<{r:{id:string;instrumentsV2:MarketInstrument[]}}>("select public.begin_daily_market_refresh('fixture') r")).rows[0].r;
    const bme=run.instrumentsV2.find(i=>i.instrument==='NXT:BME')!;
    assert.equal(bme.googleListing,'NXT:BME');assert.equal(bme.quoteCurrency,'EUR');
    assert.ok(run.instrumentsV2.some(i=>i.instrument==='NXTE.XD'),'Two accounts may select distinct venues for the same security');
    const now=new Date().toISOString();
    const prices=[['NXT:BME',1.2,'Google Finance'],['NXTE.XD',1.1,'Yahoo Finance'],['IE00BYX5NX33',10,'Financial Times']].map(([instrument,price,source])=>({instrument,quoted_at:now,checked_at:now,price_eur:price,previous_close_eur:price,original_price:price,original_currency:'EUR',original_unit:'EUR',unit_scale:1,fx_rate:1,fx_at:null,source}));
    await db.query('select public.finish_daily_market_refresh($1,$2,$3)',[run.id,JSON.stringify(prices),'[]']);
    for(const [owner,instrument,price] of [[A,'NXT:BME',1.2],[B,'NXTE.XD',1.1]]){
        assert.equal((await db.query<{r:string}>('select public.capture_market_snapshot($1,$2) r',[run.id,owner])).rows[0].r,'captured');
        const snapshot=(await db.query<{assets:Array<{currentPrice:number;quoteInstrument:string;symbol:string}>}>('select assets from portfolio_private.daily_snapshots where user_id=$1',[owner])).rows[0];
        assert.equal(snapshot.assets[0].quoteInstrument,instrument);assert.equal(snapshot.assets[0].currentPrice,price);assert.equal(snapshot.assets[0].symbol,'NXTE.XD','A venue selection does not rewrite trades');
    }
    await login(A,S);
    const base=(await db.query<{r:{prices:Array<{instrument:string}>}}>('select public.read_daily_market_data() r')).rows[0].r;
    assert.ok(base.prices.some(p=>p.instrument==='NXT:BME'));
    for(const role of ['anon','authenticated','service_role']){
        await db.exec('reset role');
        assert.equal((await db.query<{v:boolean}>("select has_table_privilege($1,'portfolio_private.stock_quote_listings','SELECT') v",[role])).rows[0].v,false);
        assert.equal((await db.query<{v:boolean}>("select has_function_privilege($1,'portfolio_private.valuation_instrument(text,text,text,text,jsonb)','EXECUTE') v",[role])).rows[0].v,false);
    }
    assert.equal((await db.query<{v:string}>("select portfolio_private.valuation_instrument('stock','NXTE.XD',null,'nextil','{\"stockQuoteMarkets\":{\"nextil\":\"unknown\"}}') v")).rows[0].v,'NXT:BME','Unknown preferences fall back to the verified default as in the browser');
    await db.exec("insert into portfolio_private.stock_quote_listings values('US0378331005','NASDAQ','AAPL:NASDAQ','AAPL:NASDAQ','USD',array['AAPL'],true)");
    assert.equal((await db.query<{v:string}>("select portfolio_private.valuation_instrument('stock','AAPL',null,'apple','{}') v")).rows[0].v,'AAPL:NASDAQ','Generic resolution supports another security and venue without changing the function');
    assert.equal((await db.query<{v:string}>("select portfolio_private.valuation_instrument('stock','AAPL',null,'apple','{\"stockQuoteMarkets\":{\"apple\":\"original\"}}') v")).rows[0].v,'AAPL');
    const realFetch=globalThis.fetch;let quoteCurrency='EUR',at=Math.floor(Date.now()/1000);const requested:string[]=[];
    try {
        globalThis.fetch=async(input)=>{requested.push(String(input));const record=['/g/test',['NXT','BME'],'Nextil',0,quoteCurrency,[1.2,0,0],null,1.1,null,'ES',null,[at]];return new Response(`AF_initDataCallback({key:'test',data:${JSON.stringify([record])}, sideChannel:{}})`,{headers:{'content-type':'text/html'}});};
        const quote=await fetchMarketPrice(bme,'fixture');assert.equal(quote.instrument,'NXT:BME');assert.equal(quote.source,'Google Finance');assert.equal(quote.price_eur,1.2);
        assert.ok(requested.every(url=>url.startsWith('https://www.google.com/finance/quote/NXT%3ABME')),'No fallback to a different exchange');
        quoteCurrency='USD';await assert.rejects(fetchMarketPrice(bme,'fixture'),/no disponible/);
        quoteCurrency='EUR';at-=5*86400;await assert.rejects(fetchMarketPrice(bme,'fixture'),/no disponible/);
        await assert.rejects(fetchMarketPrice({...bme,instrument:'OTHER'},'fixture'),/no válido/);
    }finally{globalThis.fetch=realFetch;}
    console.log('PASS: verified registry parity, two users/two venues, typed worker, price source, capture identity, scoped read, permissions, arbitrary registered venue, wrong currency and stale data.');
}finally{await db.close();}
