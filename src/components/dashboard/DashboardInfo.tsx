import {useState, type ReactNode} from 'react';
import {Info} from 'lucide-react';
import {Modal} from '../ui';
import {cn} from '../../utils/cn';

/** Secondary explanations stay available without expanding the dashboard. */
export function DashboardInfo({title, label, children, className=''}:{title:string;label?:string;children:ReactNode;className?:string}){
    const [open,setOpen]=useState(false);
    return <>
        <button type="button" className={cn('dashboard-info tw:inline-flex tw:items-center tw:justify-center tw:gap-[.4rem] tw:min-h-[44px] tw:p-[.4rem_.65rem] tw:[border:0] tw:rounded-control tw:ui-fill-transparent tw:text-secondary tw:[font-family:inherit] tw:[font-weight:inherit] tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit] tw:text-[.8rem] tw:cursor-pointer tw:align-middle tw:shrink-0 tw:hover:text-accent tw:hover:[background:rgba(var(--accent-rgb),.08)] tw:focus-visible:[outline:2px_solid_var(--accent-primary)] tw:focus-visible:outline-offset-2', !label && 'dashboard-info--icon tw:w-[44px] tw:p-0', className)} aria-label={label??title} aria-haspopup="dialog" onClick={()=>setOpen(true)}>
            <Info size={16} aria-hidden="true" />{label}
        </button>
        <Modal isOpen={open} onClose={()=>setOpen(false)} title={title} size="sm">
            <div className="dashboard-info__content tw:text-secondary tw:[line-height:1.6] tw:wrap-anywhere tw:[&_p+p]:mt-[.75rem] tw:[&_h3]:text-main tw:[&_h3]:text-[.95rem] tw:[&_h3]:mt-[1rem] tw:[&_ul]:pl-[1.25rem]">{children}</div>
        </Modal>
    </>;
}
