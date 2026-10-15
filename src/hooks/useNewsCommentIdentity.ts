import {useEffect,useState} from 'react';
import {getAppSupabaseClient} from '../services/supabaseClient';

/** News accounts work independently of portfolio synchronization. */
export function useNewsCommentIdentity(){
    const [identity,setIdentity]=useState({userId:null as string|null,confirmed:false,mfaRequired:false,loading:true,version:0});
    useEffect(()=>{
        let active=true;let sequence=0;let unsubscribe:(()=>void)|undefined;
        void getAppSupabaseClient().then(client=>{
            if(!active)return;
            const subscription=client.auth.onAuthStateChange((_event,session)=>{
                const ticket=++sequence;
                if(!session){setIdentity(current=>({userId:null,confirmed:false,mfaRequired:false,loading:false,version:current.version+1}));return;}
                window.setTimeout(()=>{
                    if(!active||ticket!==sequence)return;
                    void Promise.all([client.auth.getUser(session.access_token),client.auth.mfa.getAuthenticatorAssuranceLevel(session.access_token)]).then(([user,assurance])=>{
                        if(!active||ticket!==sequence)return;
                        if(user.error||assurance.error||user.data.user?.id!==session.user.id)throw new Error('Invalid session');
                        setIdentity(current=>({userId:user.data.user.id,confirmed:!!user.data.user.email_confirmed_at&&!user.data.user.is_anonymous,
                            mfaRequired:assurance.data.nextLevel==='aal2'&&assurance.data.currentLevel!=='aal2',loading:false,version:current.version+1}));
                    }).catch(()=>{if(active&&ticket===sequence)setIdentity(current=>({userId:null,confirmed:false,mfaRequired:false,loading:false,version:current.version+1}));});
                },0);
            });
            unsubscribe=()=>subscription.data.subscription.unsubscribe();
        }).catch(()=>{if(active)setIdentity(current=>({...current,loading:false}));});
        return()=>{active=false;sequence++;unsubscribe?.();};
    },[]);
    return identity;
}
