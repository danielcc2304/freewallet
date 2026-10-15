import assert from 'node:assert/strict';
import {disableAuthenticator} from '../src/services/mfaManagement';

type Auth=Parameters<typeof disableAuthenticator>[0];
for(const scenario of ['success','bad-code','wrong-owner','changed-session','delete-error','invalid-code']){
    const calls:string[]=[];
    let current=true;
    const auth={
        getUser:async()=>{calls.push('owner');return {data:{user:{id:scenario==='wrong-owner'?'other':'owner'}},error:null};},
        mfa:{
            challengeAndVerify:async({factorId,code}:{factorId:string;code:string})=>{
                calls.push('verify');assert.equal(factorId,'selected');assert.equal(code,'123456');
                if(scenario==='changed-session')current=false;
                return {error:scenario==='bad-code'?new Error('Invalid code'):null};
            },
            unenroll:async({factorId}:{factorId:string})=>{
                calls.push('delete');assert.equal(factorId,'selected');
                return {error:scenario==='delete-error'?new Error('Deletion rejected'):null};
            },
        },
    } as unknown as Auth;
    const operation=()=>disableAuthenticator(auth,{factorId:'selected',code:scenario==='invalid-code'?'123':'123456',userId:'owner',isCurrent:()=>current});
    if(scenario==='success'){
        await operation();assert.deepEqual(calls,['owner','verify','owner','delete']);
    }else{
        await assert.rejects(operation);
        if(scenario!=='delete-error')assert.ok(!calls.includes('delete'),scenario);
    }
}
console.log('MFA removal: fresh verification, ownership, session changes and failures passed.');
