import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';

// All credentials and responses are synthetic. No external request is allowed.
const origin=process.env.FREEWALLET_TEST_URL??'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const factor={id:'synthetic-factor',status:'verified',factor_type:'totp',friendly_name:'FreeWallet',created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',
    email_confirmed_at:new Date().toISOString(),is_anonymous:false,app_metadata:{provider:'email',providers:['email']},
    user_metadata:{},created_at:new Date().toISOString(),factors:[factor]};
const session=(aal:string)=>({access_token:`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,aal,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')}.c3ludGhldGlj`,
    refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[];
const calls:string[]=[];
let rejectDeletion=true;
try{
    const page=await browser.newPage();page.setDefaultTimeout(30000);await page.setViewport({width:390,height:844});
    page.on('pageerror',error=>errors.push(String(error)));
    await page.evaluateOnNewDocument((auth,v)=>{
        localStorage.setItem('freewallet-news-auth',JSON.stringify(auth));
        localStorage.setItem('freewallet_settings','{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version',v);
    },session('aal1'),version);
    await page.setRequestInterception(true);
    page.on('request',request=>{void(async()=>{
        const url=new URL(request.url());
        if(url.hostname.endsWith('.supabase.co')){
            const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,DELETE,OPTIONS',
                'access-control-allow-headers':request.headers()['access-control-request-headers']??'*'};
            if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
            let data:unknown=null;let status=200;
            if(url.pathname==='/auth/v1/user')data=user;
            else if(url.pathname.endsWith('/challenge')){calls.push('challenge');data={id:'synthetic-challenge',type:'totp',expires_at:Math.floor(Date.now()/1000)+60};}
            else if(url.pathname.endsWith('/verify')){
                if(JSON.parse(request.postData()??'{}').code!=='123456'){
                    calls.push('invalid');status=422;data={code:'mfa_verification_failed',msg:'Invalid TOTP code'};
                }else{calls.push('verified');data=session('aal2');}
            }else if(request.method()==='DELETE'&&url.pathname==='/auth/v1/factors/synthetic-factor'){
                assert.equal(calls.at(-1),'verified','Deletion must immediately follow successful fresh verification');
                const jwt=request.headers().authorization.split(' ')[1];
                assert.equal(JSON.parse(Buffer.from(jwt.split('.')[1],'base64').toString()).aal,'aal2');
                calls.push('delete');
                if(rejectDeletion){status=403;data={code:'test_rejection',msg:'Deletion rejected'};}
                else{user.factors=[];data={id:factor.id};}
            }else if(url.pathname==='/auth/v1/token'){calls.push('refresh');data=session(user.factors.length?'aal2':'aal1');}
            else if(!url.pathname.startsWith('/rest/v1/rpc/')){status=400;data={message:'Unsupported isolated test endpoint'};}
            await request.respond({status,headers,contentType:'application/json',body:JSON.stringify(data)});
        }else if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await request.continue();
        else await request.abort();
    })().catch(error=>errors.push(String(error)));});
    await page.goto(`${origin}/account`,{waitUntil:'networkidle2'});
    const click=async(text:string)=>{const button=await page.waitForSelector(`button::-p-text(${text})`).catch(async error=>{console.error(await page.evaluate(()=>document.body.innerText),errors,calls);throw error;});assert.ok(button);await button.click();};
    await click('Desactivar autenticador');await click('Cancelar');
    assert.deepEqual(calls,[],'Cancel must not mutate authentication');
    await click('Desactivar autenticador');
    const enter=async(code:string)=>{
        await page.$eval('input[autocomplete="one-time-code"]',node=>{(node as HTMLInputElement).focus();});
        await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');await page.keyboard.type(code);
        await click('Confirmar desactivación');
    };
    await enter('000000');
    await page.waitForFunction(()=>document.body.innerText.includes('Invalid TOTP code'));
    assert.ok(!calls.includes('delete'));assert.equal(user.factors.length,1);
    await enter('123456');
    await page.waitForFunction(()=>document.body.innerText.includes('Deletion rejected'));
    assert.equal(user.factors.length,1);assert.ok(await page.$('button::-p-text(Confirmar desactivación)'));
    rejectDeletion=false;
    await enter('123456');
    await page.waitForSelector('button::-p-text(Configurar autenticador)');
    await page.waitForFunction(()=>document.body.innerText.includes('Autenticador eliminado.'));
    assert.equal(user.factors.length,0);assert.equal(calls.filter(item=>item==='delete').length,2);
    assert.ok(calls.includes('refresh'));
    assert.equal(await page.$('input[autocomplete="one-time-code"]'),null);
    assert.equal(await page.$('.account-page__mfa-qr'),null);
    assert.deepEqual(errors,[]);
    console.log('MFA UI: cancel, invalid code, server rejection, verified deletion and session refresh passed.');
}finally{await browser.close();}
