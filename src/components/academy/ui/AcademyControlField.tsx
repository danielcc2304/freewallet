import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface AcademyControlFieldProps extends HTMLAttributes<HTMLDivElement> {
    variant: 'strategy' | 'crisis';
    controlId: string;
    label: ReactNode;
    unit: ReactNode;
    detail?: ReactNode;
}
/** Label, native control frame and unit; controls and validation remain with each simulator. */
export function AcademyControlField({ variant, controlId, label, unit, detail, className, children, ...props }: AcademyControlFieldProps) {
    const crisis = variant === 'crisis';
    return <div {...props} className={cn(crisis ? 'crisis__input-group' : 'strategy-weight tw:grid tw:gap-[.5rem] tw:p-[.85rem] tw:ui-border tw:rounded-[12px] tw:min-w-[0]', className)}>
        <label htmlFor={controlId} className={crisis ? 'tw:block tw:text-[length:.85rem] tw:mb-[.5rem]' : 'tw:text-[length:.85rem] tw:text-main'}>{label}</label>
        <div className={crisis ? 'crisis__input-wrapper tw:ui-row tw:gap-[.5rem] tw:ui-border-default tw:rounded-[10px] tw:ui-fill-muted tw:p-[.5rem_.85rem] tw:[&_input]:min-w-0 tw:[&_input]:w-full tw:[&_input]:min-h-[44px] tw:[&_input]:ui-fill-transparent tw:[&_input]:text-main' : 'tw:ui-row tw:gap-[.5rem]'}>
            {children}<span className={crisis ? 'tw:text-[length:.8rem] tw:text-secondary tw:shrink-[0]' : undefined}>{unit}</span>
        </div>
        {detail != null && <small className="tw:text-[length:.8rem] tw:text-muted tw:wrap-anywhere">{detail}</small>}
    </div>;
}
