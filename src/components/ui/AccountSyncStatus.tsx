import {useAccount} from '../../context/AccountContext';
export function AccountSyncStatus(){
    const {user,enabled,sync}=useAccount();
    if(!enabled)return null;
    const needsAttention=!!user && (sync.status==='error'||sync.status==='conflict');
    const text=!user?'Solo en este dispositivo':sync.status==='synced'?'Sincronizada':sync.status==='saving'?'Guardando…':sync.status==='empty'?'Importación pendiente':needsAttention?'Revisar sincronización':'Conectando…';
    return <span className={`sidebar__account-status${needsAttention?' sidebar__account-status--warning':''}`}
        role={needsAttention?'alert':'status'} title={needsAttention ? sync.error : text}>{text}</span>;
}
