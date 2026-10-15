import {useState, type ReactNode} from 'react';
import {Info} from 'lucide-react';
import {Modal} from '../ui';
import './DashboardInfo.css';

/** Secondary explanations stay available without expanding the dashboard. */
export function DashboardInfo({title, label, children, className=''}:{title:string;label?:string;children:ReactNode;className?:string}){
    const [open,setOpen]=useState(false);
    return <>
        <button type="button" className={`dashboard-info ${label?'':'dashboard-info--icon'} ${className}`} aria-label={label??title} aria-haspopup="dialog" onClick={()=>setOpen(true)}>
            <Info size={16} aria-hidden="true" />{label}
        </button>
        <Modal isOpen={open} onClose={()=>setOpen(false)} title={title} size="sm">
            <div className="dashboard-info__content">{children}</div>
        </Modal>
    </>;
}
