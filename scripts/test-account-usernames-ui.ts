import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';

const origin=process.env.FREEWALLET_TEST_URL??'http://127.0.0.1:5185';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',
    email_confirmed_at:new Date().toISOString(),is_anonymous:false,app_metadata:{provider:'email',providers:['email']},
    user_metadata:{username:'fixture'},created_at:new Date().toISOString(),factors:[]};
let username='fixture';let signupCount=0;let usernameLogins=0;let emailLogins=0;let renames=0;
const session=()=>({access_token:`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,aal:'aal1',exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')}.c3ludGhldGlj`,refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
try{
    const page=await browser.newPage();page.setDefaultNavigationTimeout(60000);
    const errors:string[]=[];page.on('pageerror',error=>errors.push(String(error)));
    await page.setViewport({width:390,height:900});
    await page.evaluateOnNewDocument(v=>{
        localStorage.setItem('freewallet_settings','{"apiEnabled":false}');localStorage.setItem('freewallet_last_seen_version',v);
    },version);
    await page.setRequestInterception(true);
    page.on('request',request=>{void(async()=>{
        const url=new URL(request.url());
        if(url.hostname.endsWith('.supabase.co')){
            const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':request.headers()['access-control-request-headers']??'*'};
            if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
            const body=JSON.parse(request.postData()??'{}');let status=200;let data:unknown=null;
            if(url.pathname==='/auth/v1/signup'){
                signupCount++;assert.equal(body.data.username,'new_user');assert.equal(body.email,'new@example.invalid');data={user:{...user,email:body.email},session:null};
            }else if(url.pathname==='/auth/v1/token'){
                emailLogins++;assert.equal(body.email,user.email);data=session();
            }else if(url.pathname==='/functions/v1/username-login'){
                usernameLogins++;assert.equal(body.username,'fixture');
                if(body.password==='wrong'){status=401;data={error:'Usuario o contraseña incorrectos.'};}
                else data={access_token:session().access_token,refresh_token:'synthetic'};
            }else if(url.pathname==='/auth/v1/user')data=user;
            else if(url.pathname==='/rest/v1/rpc/my_account_profile')data={userId:user.id,username,createdAt:user.created_at};
            else if(url.pathname==='/rest/v1/rpc/change_my_username'){
                renames++;assert.equal(body.expected_user_id,user.id);
                if(body.new_username==='occupied'){status=409;data={code:'23505',message:'username_taken'};}
                else{username=body.new_username;data={userId:user.id,username,createdAt:user.created_at};}
            }else if(url.pathname==='/auth/v1/logout')data={};
            else if(!url.pathname.startsWith('/rest/v1/rpc/')){status=400;data={message:'Unsupported isolated endpoint'};}
            await request.respond({status,headers,contentType:'application/json',body:JSON.stringify(data)});
        }else if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await request.continue();
        else await request.abort();
    })().catch(error=>errors.push(String(error)));});
    const click=async(text:string)=>{const button=await page.waitForSelector(`button::-p-text(${text})`);assert.ok(button);await button.click();};
    const fill=async(selector:string,value:string)=>{
        await page.focus(selector);await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');await page.keyboard.press('Backspace');await page.type(selector,value);
    };
    await page.goto(`${origin}/account`,{waitUntil:'networkidle2'});
    assert.equal(await page.$eval('#account-login',node=>(node as HTMLInputElement).type),'text');
    await click('Crear cuenta');
    await page.waitForSelector('#account-register-username');
    await fill('#account-login','new@example.invalid');await fill('input[type=password]','synthetic-password');
    await page.click('.account-page__auth button:not([type])');assert.equal(signupCount,0,'Username is required');
    await fill('#account-register-username','New_User');await page.click('.account-page__auth button:not([type])');
    await page.waitForFunction(()=>document.body.innerText.includes('Revisa tu correo'));assert.equal(signupCount,1);
    await click('Entrar');await fill('#account-login','FiXtUrE');await fill('input[type=password]','wrong');await click('Entrar');
    await page.waitForFunction(()=>document.body.innerText.includes('Usuario o contraseña incorrectos.'));
    assert.equal(await page.$('.account-page__identity'),null);
    await fill('input[type=password]','synthetic-password');await click('Entrar');
    await page.waitForSelector('.account-page__identity');
    await page.waitForFunction(()=>document.querySelector('.account-page__identity h2')?.textContent==='@fixture');
    assert.equal(usernameLogins,2);assert.equal(emailLogins,0);
    await page.click('button[aria-label="Cambiar nombre de usuario"]');await fill('#account-username','cancelled');await click('Cancelar');assert.equal(renames,0);
    await page.click('button[aria-label="Cambiar nombre de usuario"]');await fill('#account-username','occupied');await click('Guardar nombre');
    await page.waitForFunction(()=>document.body.innerText.includes('ya está ocupado'));
    assert.equal(username,'fixture');await fill('#account-username','Changed_Name');await click('Guardar nombre');
    await page.waitForFunction(()=>document.querySelector('.account-page__identity h2')?.textContent==='@changed_name');assert.equal(renames,2);
    await page.reload({waitUntil:'networkidle2'});await page.waitForFunction(()=>document.querySelector('.account-page__identity h2')?.textContent==='@changed_name');
    // Measure settled layouts instead of the sidebar's desktop/mobile transition.
    await page.addStyleTag({content:'*, *::before, *::after { transition: none !important; animation: none !important; }'});
    for(const width of [320,390,1280]){
        await page.setViewport({width,height:900});
        for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
            await page.evaluate((t,a)=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=a;},theme,appearance);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${theme}/${appearance}: no overflow`);
            if(width<1024)assert.ok(await page.$eval('.account-page',node=>node.getBoundingClientRect().width>=innerWidth-80),`${width}/${theme}/${appearance}: account uses the mobile canvas`);
        }
    }
    await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.appearance='liquid-glass';window.scrollTo({top:0,behavior:'instant'});});
    await page.screenshot({path:'/tmp/freewallet-account-usernames-desktop.png'});
    await page.setViewport({width:390,height:1000});await page.screenshot({path:'/tmp/freewallet-account-usernames-mobile.png'});
    await click('Cerrar sesión en este dispositivo');await page.waitForSelector('#account-login');
    await fill('#account-login',user.email);await fill('input[type=password]','synthetic-password');await click('Entrar');
    await page.waitForSelector('.account-page__identity');assert.equal(emailLogins,1);
    assert.deepEqual(errors,[]);
    console.log('PASS: required registration username, case-insensitive username login, email login, invalid credentials, rename/cancel/collision/persistence and responsive account in all themes.');
}finally{await browser.close();}
