import type {SupabaseClient} from '@supabase/supabase-js';

/** Remove only the selected factor, after a fresh challenge and an owner check.
 * Session refresh is deliberately separate: a failed refresh cannot undo deletion.
 */
export async function disableAuthenticator(
    auth: Pick<SupabaseClient['auth'], 'getUser' | 'mfa'>,
    options: {factorId:string; code:string; userId:string; isCurrent:()=>boolean},
) {
    const {factorId,code,userId,isCurrent}=options;
    if(!factorId||!userId||!/^\d{6}$/.test(code))throw new Error('Introduce un código válido de 6 cifras.');
    const checkOwner=async()=>{
        if(!isCurrent())throw new Error('La sesión ha cambiado. Vuelve a Mi cuenta.');
        const {data,error}=await auth.getUser();
        if(error)throw error;
        if(!isCurrent()||data.user?.id!==userId)throw new Error('La sesión ha cambiado. Vuelve a Mi cuenta.');
    };
    await checkOwner();
    const verification=await auth.mfa.challengeAndVerify({factorId,code});
    if(verification.error)throw verification.error;
    await checkOwner();
    const removal=await auth.mfa.unenroll({factorId});
    if(removal.error)throw removal.error;
}
