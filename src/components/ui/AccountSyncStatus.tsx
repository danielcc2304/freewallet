import {Link} from 'react-router-dom';
import {useAccount} from '../../context/AccountContext';
export function AccountSyncStatus(){
    const {user,enabled,sync}=useAccount();
    if(!enabled)return null;
    const text=!user?'Cartera local · sin sincronización':sync.status==='synced'?'Cartera guardada en tu cuenta':sync.status==='saving'?'Guardando cartera…':sync.status==='empty'?'Importa tu cartera o empieza una nueva desde Mi cuenta':sync.error||'Conectando cartera…';
    return <div className="account-sync" role={sync.status==='error'||sync.status==='conflict'?'alert':'status'}><span>{text}</span><Link to="/account">Mi cuenta</Link></div>;
}
