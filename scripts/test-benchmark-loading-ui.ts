import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
const origin=process.env.FREEWALLET_TEST_URL!;
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH,args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);const errors:string[]=[];page.on('pageerror',e=>{errors.push(String(e));console.error(String(e));});
 await page.setRequestInterception(true);page.on('request',r=>{
  if(r.url()===origin+'/benchmark-loading-test')void r.respond({contentType:'text/html',body:`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">
  import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
  await Promise.all([import('/src/index.css'),import('/src/styles/tailwind.css'),import('/src/styles/liquidGlass.css')]);
  const main=await (await fetch('/src/main.tsx')).text();
  const dependency=name=>main.split(String.fromCharCode(10)).find(line=>line.includes('/'+name)).split('"')[1];
  const reactModule=await import(dependency('react.js'));const React=reactModule.default??reactModule;const dom=await import(dependency('react-dom_client.js'));const createRoot=dom.createRoot??dom.default.createRoot;const {BenchmarkChartFrame}=await import('/src/components/dashboard/ui/BenchmarkChartFrame.tsx');
  function Fixture(){const [busy,setBusy]=React.useState(true);return React.createElement('main',{style:{padding:16}},React.createElement('h1',null,'Benchmark'),React.createElement(BenchmarkChartFrame,{busy,message:'Calculando benchmark según tu cartera…'},React.createElement('div',{role:'img','aria-label':'Datos del gráfico',style:{height:230}},'Gráfico cargado')),React.createElement('button',{onClick:()=>setBusy(!busy)},'Cambiar estado'));}
  createRoot(document.getElementById('root')).render(React.createElement(Fixture));</script></body></html>`});
  else void(new URL(r.url()).origin===origin?r.continue():r.abort());
 });
 for(const width of [320,390,1280]){
  await page.setViewport({width,height:900});await page.goto(origin+'/benchmark-loading-test',{waitUntil:'networkidle2'});await page.waitForSelector('[role=status]');
  for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
   await page.evaluate((theme,appearance)=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.appearance=appearance;},theme,appearance);
   const geometry=await page.evaluate(()=>{
    const frame=document.querySelector('[role=region]')!,status=document.querySelector('[role=status]')!,icon=status.querySelector('svg')!,label=status.querySelector('span')!;
    const f=frame.getBoundingClientRect(),i=icon.getBoundingClientRect(),l=label.getBoundingClientRect();
    return {dx:Math.abs((i.left+i.right)/2-(f.left+f.right)/2),dy:Math.abs((i.top+l.bottom)/2-(f.top+f.bottom)/2),busy:frame.getAttribute('aria-busy'),hidden:getComputedStyle(document.querySelector('[role=img]')!).visibility,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert.ok(geometry.dx<2&&geometry.dy<2,JSON.stringify({width,theme,appearance,...geometry}));assert.equal(geometry.busy,'true');assert.equal(geometry.hidden,'hidden');assert.equal(geometry.overflow,false);
  }
  await page.click('button');await page.waitForFunction(()=>!document.querySelector('[role=status]'));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('[role=img]')).visibility==='visible',{timeout:3000}).catch(async error=>{console.error(await page.$eval('[role=region]',n=>n.outerHTML));throw error;});
  assert.equal(await page.$eval('[role=img]',n=>getComputedStyle(n).visibility),'visible');
  assert.equal(await page.$eval('[role=region]',n=>n.getAttribute('aria-busy')),'false');
 }
 assert.deepEqual(errors,[]);console.log('PASS: loading centred in chart, content hidden while busy, visible after load, no overflow in mobile/desktop and all theme combinations.');
}finally{await browser.close();}
