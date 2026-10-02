import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {mfaQrImage} from '../src/services/mfaQr';

// Synthetic credentials only; every external request is blocked or mocked.
const origin=process.env.FREEWALLET_TEST_URL??'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const secret='JBSWY3DPEHPK3PXP';
const uri=`otpauth://totp/FreeWallet:fixture%40example.invalid?secret=${secret}&issuer=FreeWallet`;
const svg=await QRCode.toString(uri,{type:'svg',margin:0,color:{light:'#00000000'}});
const normalized=mfaQrImage(svg);
assert.equal(mfaQrImage(`data:image/svg+xml;utf-8,${svg}`),normalized);
assert.equal(mfaQrImage(normalized),normalized);
assert.equal(mfaQrImage(`data:image/svg+xml,${encodeURIComponent(svg)}`),normalized);
const base64=`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
assert.equal(mfaQrImage(base64),base64);
assert.throws(()=>mfaQrImage('https://example.invalid/qr.svg'));
assert.throws(()=>mfaQrImage('data:image/svg+xml,%invalid'));
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',
    email:'fixture@example.invalid',email_confirmed_at:new Date().toISOString(),is_anonymous:false,
    app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:new Date().toISOString(),
    factors:[] as {id:string;status:string;factor_type:string;friendly_name:string;created_at:string;updated_at:string}[]};
const session=(aal:string)=>({access_token:`${btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))}.${btoa(JSON.stringify({sub:user.id,aal,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'}))}.synthetic`,
    refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user});
const browser=await puppeteer.launch({headless:true});
const errors:string[]=[];
let enrollments=0;let verifications=0;
try{
    const page=await browser.newPage();await page.setViewport({width:390,height:844});
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
            const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS',
                'access-control-allow-headers':request.headers()['access-control-request-headers']??'*'};
            if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
            let data:unknown=null;let status=200;
            if(url.pathname==='/auth/v1/user')data=user;
            else if(url.pathname==='/auth/v1/factors'&&request.method()==='POST'){
                enrollments++;data={id:'synthetic-factor',type:'totp',totp:{qr_code:svg,secret,uri}};
                assert.equal(JSON.parse(request.postData()??'{}').issuer,'FreeWallet');
            }else if(url.pathname.endsWith('/challenge'))data={id:'synthetic-challenge',type:'totp',expires_at:Math.floor(Date.now()/1000)+60};
            else if(url.pathname.endsWith('/verify')){
                verifications++;
                if(JSON.parse(request.postData()??'{}').code!=='123456'){
                    status=422;data={code:'mfa_verification_failed',msg:'Invalid TOTP code'};
                }else{
                    user.factors=[{id:'synthetic-factor',status:'verified',factor_type:'totp',friendly_name:'FreeWallet',created_at:new Date().toISOString(),updated_at:new Date().toISOString()}];
                    data=session('aal2');
                }
            }else if(!url.pathname.startsWith('/rest/v1/rpc/')){
                status=400;data={message:'Unsupported isolated test endpoint'};
            }
            await request.respond({status,headers,contentType:'application/json',body:JSON.stringify(data)});
        }else if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await request.continue();
        else await request.abort();
    })().catch(error=>errors.push(String(error)));});

    await page.goto(`${origin}/academy`,{waitUntil:'networkidle2'});
    console.log('Checking academy');
    await page.waitForSelector('.fundamentos__level-card');
    const all=await page.$$eval('.fundamentos__level-card .fundamentos__mini-card',nodes=>nodes.length);
    assert.ok(all>6);
    const toggle=await page.$('button[aria-expanded="true"]');assert.ok(toggle);
    await toggle.click();
    await page.waitForFunction(()=>document.querySelectorAll('.fundamentos__level-card .fundamentos__mini-card').length===6);
    await toggle.click();
    assert.equal(await page.$$eval('.fundamentos__level-card .fundamentos__mini-card',nodes=>nodes.length),all);

    await page.goto(`${origin}/settings`,{waitUntil:'networkidle2'});
    console.log('Checking appearance preview');
    const preview=await page.waitForSelector('.appearance-option__visual--glass');assert.ok(preview);
    assert.equal(await preview.evaluate(node=>node.children.length),2);
    assert.ok(['none','normal'].includes(await preview.evaluate(node=>getComputedStyle(node,'::after').content)));
    assert.match(await preview.evaluate(node=>getComputedStyle(node).backgroundImage),/radial-gradient/);
    await preview.screenshot({path:join(tmpdir(),'freewallet-glass-preview-test.png')});

    await page.goto(`${origin}/account`,{waitUntil:'networkidle2'});
    console.log('Checking mocked authenticator setup');
    const configure=await page.waitForSelector('button::-p-text(Configurar autenticador)');assert.ok(configure);
    await configure.click();await page.waitForSelector('.account-page__mfa-qr');
    await (await page.$('.account-page__mfa-setup'))!.screenshot({path:join(tmpdir(),'freewallet-mfa-synthetic-test.png')});
    for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
        await page.evaluate((t,a)=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=a;},theme,appearance);
        const pixels=await page.$eval('.account-page__mfa-qr',async element=>{
            const img=element as HTMLImageElement;await img.decode();
            const style=getComputedStyle(img);const size=Math.round(img.getBoundingClientRect().width);
            const padding=parseFloat(style.paddingLeft);
            const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
            const context=canvas.getContext('2d')!;context.fillStyle=style.backgroundColor;context.fillRect(0,0,size,size);
            context.drawImage(img,padding,padding,size-2*padding,size-2*padding);
            return {size,data:Array.from(context.getImageData(0,0,size,size).data)};
        });
        assert.equal(jsQR(new Uint8ClampedArray(pixels.data),pixels.size,pixels.size)?.data,uri,`${theme}/${appearance}: displayed QR must decode`);
    }
    const manual=await page.$('button::-p-text(No puedo escanear)');assert.ok(manual);await manual.click();
    assert.equal(await page.$eval('#account-mfa-manual input',node=>(node as HTMLInputElement).value),secret);
    const code=await page.$('input[autocomplete="one-time-code"]');assert.ok(code);
    await code.type('000000');await (await page.$('button::-p-text(Verificar código)'))!.click();
    await page.waitForFunction(()=>document.body.innerText.includes('Invalid TOTP code')).catch(async error=>{
        console.error('Verification fixture state:',await page.evaluate(()=>document.body.innerText),errors,enrollments,verifications);throw error;
    });
    assert.ok(await page.$('.account-page__mfa-qr'),'Invalid code must preserve setup');
    await code.focus();await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');await code.type('123456');
    assert.equal(await code.evaluate(node=>(node as HTMLInputElement).value),'123456');
    await (await page.$('button::-p-text(Verificar código)'))!.click();
    await page.waitForFunction(()=>document.body.innerText.includes('Tu cuenta tiene un autenticador configurado.')).catch(async error=>{
        console.error('Successful verification fixture state:',await page.evaluate(()=>document.body.innerText),errors,enrollments,verifications);throw error;
    });
    assert.equal(await page.$('.account-page__mfa-qr'),null);
    assert.equal(await page.$('#account-mfa-manual'),null,'Secret must disappear after verification');
    assert.equal(enrollments,1);assert.equal(verifications,2);assert.deepEqual(errors,[]);
    console.log('PASS: expanded academy, glass preview, QR normalization/decoding in four themes, manual setup and mocked MFA success/error. No production requests.');
}finally{await browser.close();}
