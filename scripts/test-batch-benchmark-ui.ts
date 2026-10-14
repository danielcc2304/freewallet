import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const origin=process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5178';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const owner='11111111-1111-4111-8111-111111111111';
const at='2026-10-14T19:00:00Z';
const user={id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',email_confirmed_at:at,is_anonymous:false,app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:at};
const token=`header.${btoa(JSON.stringify({sub:owner,exp:Date.parse(at)/1000+3600,session_id:'33333333-3333-4333-8333-333333333333',role:'authenticated'}))}.fixture`;
const asset={id:'fund',symbol:'IE00BYX5NX33',isin:'IE00BYX5NX33',name:'Synthetic fund',type:'fund',quantity:100,purchasePrice:10,purchaseDate:'2025-02-28',currency:'EUR'};
const trade={id:'active',assetId:asset.id,assetSymbol:asset.symbol,assetName:asset.name,assetType:'fund',type:'buy',date:'2025-02-28',quantity:100,price:10,total:1000,createdAt:'2025-02-28T12:00:00Z'};
const archive={version:1,identity:'synthetic',label:'Synthetic history',importedAt:at,linkedAssetIds:[asset.id],riskFreeAnnualPct:null,evolutionCount:3,dailyCount:0,cashFlows:[],benchmarkNavs:[],
    valuations:[...Array.from({length:20},(_,i)=>({date:new Date(Date.UTC(2025,2+i,0,18)).toISOString(),value:i===19?1100:1000,invested:1000,cadence:'monthly'})),{date:'2026-10-08T18:00:00Z',value:1120,invested:1000,cadence:'daily'}],
    benchmarkReturns:[{date:'2025-02-28T18:00:00Z',benchmarkAccumPct:0,portfolioAccumPct:0},{date:'2026-09-30T18:00:00Z',benchmarkAccumPct:20,portfolioAccumPct:10}]};
const data={benchmark:{isin:asset.isin,name:'Fidelity MSCI World ACC EUR'},
    prices:[['2026-09-30',99],['2026-10-08',100],['2026-10-11',101],['2026-10-12',102],['2026-10-13',103]].map(([date,value])=>({instrument:asset.isin,quoted_at:date+'T00:00:00Z',checked_at:'2026-10-14T14:00:00Z',price_eur:value,previous_close_eur:null,source:'Financial Times'})),
    ledger:[{entry:1,transaction:{...trade,id:'retired'}},{entry:2,transaction:trade}],
    snapshots:[{at:'2026-10-11T18:00:00Z',assets:[{...asset,currentPrice:11.2,quotedAt:'2026-10-08T00:00:00Z',lastCheckedAt:'2026-10-11T18:00:00Z'}],ledgerVersion:2,legacyLedgerIds:null},
        {at,assets:[{...asset,currentPrice:11.4,quotedAt:'2026-10-13T00:00:00Z',lastCheckedAt:'2026-10-14T14:00:00Z'}],ledgerVersion:2,legacyLedgerIds:['active']}],
    lastRun:{startedAt:at,finishedAt:at,status:'success',failures:[]}};
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[];
try {
    const page=await browser.newPage();
    page.on('pageerror',e=>errors.push(String(e)));
    await page.setViewport({width:1280,height:900});
    await page.evaluateOnNewDocument((auth,at)=>{
        const NativeDate=Date;
        // Freeze the regression date without changing parsing of stored dates.
        window.Date=class extends NativeDate {
            constructor(...args: ConstructorParameters<DateConstructor>){
                if(args.length===0)super(at);
                else if(args.length===1)super(args[0]);
                else super(args[0],args[1],args[2]??1,args[3]??0,args[4]??0,args[5]??0,args[6]??0);
            }
            static now(){return NativeDate.parse(at);}
        } as DateConstructor;
        localStorage.setItem('freewallet-news-auth',JSON.stringify(auth));
        localStorage.setItem('freewallet_last_seen_version','6.3.2');
        localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
        localStorage.setItem('freewallet_benchmark_mode_v1','msci');
    },{access_token:token,refresh_token:'fixture',expires_at:Date.parse(at)/1000+3600,expires_in:3600,token_type:'bearer',user},at);
    await page.setRequestInterception(true);
    page.on('request',request=>{void(async()=>{
        const url=new URL(request.url());
        const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'*'};
        if(url.hostname.endsWith('.supabase.co')){
            if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
            let result:unknown;
            if(url.pathname==='/auth/v1/user')result=user;
            else if(url.pathname.endsWith('read_portfolio'))result={revision:0,data:{freewallet_portfolio_v1:JSON.stringify({version:1,assets:[asset],transactions:[trade]}),freewallet_history_archive_v1:JSON.stringify(archive),freewallet_settings:'{"apiEnabled":true}'}};
            else if(url.pathname.endsWith('read_portfolio_history'))result={revision:0,archive,updatedAt:at};
            else if(url.pathname.endsWith('read_daily_market_data_v2'))result=data;
            else {await request.respond({status:404,headers,body:'{}'});return;}
            await request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(result)});
        }else if(url.origin===origin && !url.pathname.startsWith('/__market/') && !url.pathname.startsWith('/__finect/'))await request.continue();
        else if(url.protocol==='data:' || url.protocol==='blob:')await request.continue();
        else await request.abort();
    })().catch(e=>errors.push(String(e)));});
    await page.goto(origin,{waitUntil:'networkidle2'});
    await page.waitForSelector('.portfolio-excel-insights__tabs');
    await page.click('.portfolio-excel-insights__tabs button:nth-child(2)');
    await page.waitForFunction(()=>document.querySelector('.portfolio-excel-insights__panel')?.textContent?.includes('al 13 oct 26'));
    const text=await page.$eval('.portfolio-excel-insights__panel',el=>el.textContent||'');
    assert.match(text,/Tu cartera · periodo seleccionado\+14%/,'Exact membership restores the current portfolio valuation');
    assert.match(text,/Fidelity MSCI World\+24,85%/,'Show the real latest NAV beyond the last comparable portfolio observation');
    assert.match(text,/Diferencia hasta 8 oct 26/,'Never subtract returns from different dates');
    assert.deepEqual(errors,[]);
    console.log('PASS: browser API ledger membership, cached fund checks, portfolio through October 14, benchmark through October 13 and explicitly dated difference.');
}finally{await browser.close();}
