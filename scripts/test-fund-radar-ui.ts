import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';
import {BEST_FUNDS} from '../src/data/academy/funds';
import type {RadarFund} from '../src/services/fundRadar/types';
const origin=process.env.FREEWALLET_TEST_URL??'http://127.0.0.1:5191';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const editor='22222222-2222-4222-8222-222222222222',reader='11111111-1111-4111-8111-111111111111';
const appVersion=JSON.parse(readFileSync('package.json','utf8')).version;
const stamp='2026-10-16T10:00:00Z';
const user=(id:string)=>({id,email:'fixture@example.invalid',email_confirmed_at:stamp,aud:'authenticated',role:'authenticated',is_anonymous:false,app_metadata:{},user_metadata:{role:'editor'},created_at:stamp,factors:[]});
const session=(id:string)=>({access_token:`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:id,aal:'aal1',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.fixture`,refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:user(id)});
const seed:RadarFund[]=process.env.RADAR_LIVE_FIXTURE?JSON.parse(readFileSync(process.env.RADAR_LIVE_FIXTURE,'utf8')):BEST_FUNDS.map(f=>({id:f.id,isin:f.isin,name:f.name,category:f.category,manager:f.manager,description:f.description??'',source_url:f.link??null,manual_metrics:{...f.returns,volatility:f.volatility,maxDrawdown:f.maxDrawdown,ter:f.ter,risk:f.risk,dates:{}},extra:{},auto_refresh:true,is_active:true,version:1,created_at:stamp,updated_at:stamp,updated_by:null,fund_radar_data:null}));
const browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH,args:['--no-sandbox']});
try{
 for(const scenario of [{name:'visitor',identity:null,allowed:false},{name:'registered reader',identity:reader,allowed:false},{name:'revoked editor',identity:editor,allowed:false},{name:'active editor',identity:editor,allowed:true}]){
  const p=await browser.newPage();p.setDefaultTimeout(60000);p.setDefaultNavigationTimeout(60000);
  const errors:string[]=[];p.on('pageerror',e=>errors.push(String(e)));
  const rows=structuredClone(seed);let writes=0,refreshes=0;
  rows.push({...rows[0],id:'fixture-archived',isin:'IE00B4L5Y983',name:'Archivado de prueba',is_active:false});
  await p.setViewport({width:390,height:844});await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await p.evaluateOnNewDocument((auth,version)=>{if(auth)localStorage.setItem('freewallet-news-auth',JSON.stringify(auth));localStorage.setItem('freewallet_settings','{"apiEnabled":false}');localStorage.setItem('freewallet_last_seen_version',version);},scenario.identity?session(scenario.identity):null,appVersion);
  await p.setRequestInterception(true);
  p.on('request',request=>{void(async()=>{
   const u=new URL(request.url());
   if(u.hostname.endsWith('.supabase.co')){
    const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PATCH,OPTIONS','access-control-allow-headers':request.headers()['access-control-request-headers']??'*'};
    if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
    let data:unknown=null,status=200;
    if(u.pathname==='/auth/v1/user')data=scenario.identity?user(scenario.identity):null;
    else if(u.pathname==='/rest/v1/rpc/is_news_admin')data=scenario.allowed;
    else if(u.pathname==='/functions/v1/fund-radar-refresh'){refreshes++;assert.ok(scenario.allowed);data={updated:1,failed:0,skipped:0,requested:1};}
    else if(u.pathname==='/rest/v1/fund_radar_catalog'){
     if(request.method()==='GET')data=rows.filter(f=>scenario.allowed||f.is_active);
     else{
      assert.ok(scenario.allowed,'non-editors cannot reach mutation controls');
      const body=JSON.parse(request.postData()??'{}');
      if(request.method()==='POST'){
       writes++;const row={...body,id:'fixture-added',version:1,created_at:stamp,updated_at:stamp,updated_by:editor,fund_radar_data:null} as RadarFund;rows.push(row);data=row;
      }else if(request.method()==='PATCH'){
       const id=u.searchParams.get('id')?.slice(3);const version=Number(u.searchParams.get('version')?.slice(3));const i=rows.findIndex(f=>f.id===id);
       if(i<0||rows[i].version!==version){status=406;data={code:'PGRST116',message:'JSON object requested, multiple (or no) rows returned',details:'The result contains 0 rows'};}
       else{writes++;rows[i]={...rows[i],...body,version:rows[i].version+1};data=rows[i];}
      }else throw new Error(`Unexpected mutation ${request.method()}`);
     }
    }
    await request.respond({status,headers,contentType:'application/json',body:JSON.stringify(data)});return;
   }
   if(u.origin===origin){await request.continue();return;}
   await request.abort();
  })().catch(async error=>{errors.push(String(error));await request.abort().catch(()=>{});});});
  const settle=()=>p.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
  const click=async(selector:string)=>{await settle();const el=await p.$(selector);assert.ok(el,selector);await el.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));await el.click();};
  const fill=async(selector:string,value:string)=>{const el=await p.$(selector);assert.ok(el);await el.focus();await p.keyboard.down('Control');await p.keyboard.press('A');await p.keyboard.up('Control');await p.keyboard.type(value);};
  await p.goto(`${origin}/academy/fund-radar`,{waitUntil:'networkidle0'});
  await p.waitForSelector('.radar-card');assert.equal(await p.$('[role=dialog]'),null,'construction notice removed');
  const metricSizes=await p.$eval('.radar-card',card=>({root:parseFloat(getComputedStyle(document.documentElement).fontSize),hero:parseFloat(getComputedStyle(card.querySelector('.radar-card__metric--hero dd')!).fontSize),compact:parseFloat(getComputedStyle(card.querySelector('.radar-card__summary--compact dd')!).fontSize)}));
  assert.ok(metricSizes.hero>=2*metricSizes.root,'The headline metric keeps its visual hierarchy');
  assert.equal(metricSizes.compact,metricSizes.root,'Compact metrics keep their 1rem size independently of generated CSS order');
  assert.equal(await p.$$eval('.radar-card',els=>els.length),20);
  assert.equal(await p.$$eval('.radar-card__score',els=>els.every(el=>el.textContent?.includes('Nota en su categoría'))),true);
  if(process.env.RADAR_LIVE_FIXTURE){
   await fill('.radar-filters input[type=search]','azvalor');await p.waitForFunction(()=>document.querySelectorAll('.radar-card').length===1);
   const ratio=await p.$eval('.radar-card__ratio',el=>el.textContent);
   const grade=await p.$eval('.radar-card__grade-meter',el=>(el as HTMLMeterElement).value);
   assert.ok(grade>0&&grade<100);
   assert.ok(await p.$eval('.radar-card__score strong',el=>el.textContent?.includes('/ 100')));
   assert.equal(ratio,'Retorno / volatilidad · 1,13×','The observed 17.40317 / 15.45808 ratio appears without percentile steps');
   assert.ok(await p.$eval('.radar-card__score',el=>el.textContent?.includes('Renta Variable Activa · 5 fondos')),'Grades use the general categories requested by the user');
   await click('.radar-card__footer button');assert.ok(await p.$eval('.radar-card__score-note',el=>el.textContent?.includes('17,4%')));
   await click('.radar-card__footer button');
   await click('.radar-results button');await p.waitForFunction(()=>document.querySelectorAll('.radar-card').length===20);
   const after=await p.$$eval('.radar-card',els=>els.find(el=>el.querySelector('h2')?.textContent?.includes('Azvalor'))?.querySelector('.radar-card__ratio')?.textContent);
   assert.equal(after,ratio,'Filtering never changes the fund ratio');
   const afterGrade=await p.$$eval('.radar-card',els=>(els.find(el=>el.querySelector('h2')?.textContent?.includes('Azvalor'))?.querySelector('.radar-card__grade-meter') as HTMLMeterElement).value);
   assert.equal(afterGrade,grade,'Filtering never changes the category grade');
  }
  if(scenario.allowed)await p.waitForSelector('.radar-card__editor');
  else assert.equal(await p.$('.radar-card__editor'),null);
  await click('.radar-card__footer button');assert.equal(await p.$$eval('.radar-card__details',els=>els.length),1,'expansion is per card');await click('.radar-card__footer button');
  await fill('.radar-filters input[type=search]','abaco');await p.waitForFunction(()=>document.querySelectorAll('.radar-card').length===1);
  await fill('.radar-filters input[type=search]','no-such-fund');await p.waitForSelector('.radar-empty');await click('.radar-results button');await p.waitForFunction(()=>document.querySelectorAll('.radar-card').length===20);
  if(!scenario.allowed){assert.equal(writes,0);assert.equal(refreshes,0);assert.deepEqual(errors,[]);await p.close();console.log('Radar permissions/UI:',scenario.name,'passed');continue;}
  for(const width of [320,390,768,1440]){
   await p.setViewport({width,height:900});
   for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
    await p.evaluate((t,a)=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=a;},theme,appearance);await settle();
    const bad=await p.$$eval('.fund-radar *',els=>els.filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.left< -2||r.right>innerWidth+2)}).map(el=>el.className));assert.deepEqual(bad,[],JSON.stringify({width,theme,appearance}));
    if(theme==='light'&&appearance==='liquid-glass'&&(width===390||width===1440)){await p.$eval('.radar-grid',el=>window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-28,behavior:'instant'}));await p.screenshot({path:`/tmp/freewallet-radar-${width}.png`});}
   }
  }
  const byText=async(selector:string,match:string)=>{const els=await p.$$(selector);for(const el of els)if((await el.evaluate(e=>e.textContent))?.includes(match)){await el.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));await el.click();return;}throw new Error('Missing control '+match);};
  const editorField=async(prefix:string,value:string)=>{const labels=await p.$$('.radar-editor label');for(const label of labels)if((await label.evaluate(e=>e.textContent))?.trim().startsWith(prefix)){const input=await label.$('input');assert.ok(input);await input.focus();await p.keyboard.down('Control');await p.keyboard.press('A');await p.keyboard.up('Control');await p.keyboard.type(value);return;}throw new Error('Missing field '+prefix);};
  await byText('.radar-toolbar button','Añadir fondo');await p.waitForSelector('.radar-editor');
  for(const width of [320,390,1440]){await p.setViewport({width,height:900});await settle();const bad=await p.$$eval('.radar-editor *',els=>els.filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.left< -2||r.right>innerWidth+2)}).map(el=>el.className));assert.deepEqual(bad,[]);}
  await editorField('Nombre de la clase','Fondo editorial de prueba');await editorField('ISIN','IE00BYX5NX32');await editorField('Categoría editorial','Global prueba');
  await click('.radar-editor button[type=submit]');await p.waitForSelector('.radar-editor [role=alert]');assert.equal(writes,0,'invalid ISIN never reaches API');
  await editorField('ISIN','LU0996179007');await click('.radar-editor button[type=submit]');await p.waitForFunction(()=>!document.querySelector('.radar-editor'));await p.waitForFunction(()=>[...document.querySelectorAll('.radar-card h2')].some(el=>el.textContent==='Fondo editorial de prueba'));assert.equal(writes,1);
  const addedCard=async()=>{const all=await p.$$('.radar-card');for(const card of all)if((await card.$eval('h2',e=>e.textContent))?.includes('Fondo editorial'))return card;throw new Error('Missing added card');};
  let card=await addedCard();let button=await card.$('.radar-card__editor button');assert.ok(button);await button.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));await button.click();await p.waitForSelector('.radar-editor');
  await editorField('Nombre de la clase','Fondo editorial modificado');await click('.radar-editor button[type=submit]');await p.waitForFunction(()=>!document.querySelector('.radar-editor'));assert.equal(writes,2);
  // A concurrent editor advances the server version while this form is open.
  card=await addedCard();button=await card.$('.radar-card__editor button');assert.ok(button);await button.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));await button.click();await p.waitForSelector('.radar-editor');rows.find(f=>f.id==='fixture-added')!.version++;
  await editorField('Nombre de la clase','Fondo editorial edición obsoleta');await click('.radar-editor button[type=submit]');await p.waitForSelector('.radar-editor [role=alert]');assert.equal(writes,2);await byText('.radar-editor button','Cancelar');
  await byText('.radar-toolbar button','Recargar');await p.waitForFunction(()=>!document.querySelector('.radar-grid[aria-busy=true]'));
  card=await addedCard();button=(await card.$$('.radar-card__editor button'))[1];await button.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));await button.click();await p.waitForSelector('.confirm-dialog');await click('.confirm-dialog .btn--primary');await p.waitForFunction(()=>!document.querySelector('.confirm-dialog'));
  assert.equal(rows.find(f=>f.id==='fixture-added')!.is_active,false);assert.equal(writes,3);
  const statusSelect=await p.$$('.radar-filters select');await statusSelect.at(-1)!.select('archived');await p.waitForFunction(()=>document.querySelectorAll('.radar-card').length===2);
  card=await addedCard();button=(await card.$$('.radar-card__editor button'))[1];await button.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));await button.click();await p.waitForSelector('.confirm-dialog');await click('.confirm-dialog .btn--primary');await p.waitForFunction(()=>!document.querySelector('.confirm-dialog'));assert.equal(rows.find(f=>f.id==='fixture-added')!.is_active,true);assert.equal(writes,4);
  await click('.radar-results button');await p.waitForFunction(()=>document.querySelectorAll('.radar-card').length===21);
  // The editor can return to Finect without touching browser backend settings.
  await byText('.radar-toolbar button','Actualizar Finect');await p.waitForFunction(()=>document.querySelector('.radar-notice')?.textContent?.includes('actualizados'));assert.ok(refreshes>=1);
  assert.deepEqual(errors,[]);console.log('Radar editor CRUD, optimistic conflict, restore, refresh and 16 layouts/themes passed');await p.close();
 }
}finally{await browser.close();}
