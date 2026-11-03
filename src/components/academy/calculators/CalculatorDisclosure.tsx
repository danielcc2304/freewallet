import type { DetailsHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface CalculatorDisclosureProps extends Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'title'> {
    title: ReactNode;
    summary?: ReactNode;
    appearance?: 'form' | 'plain';
}

/** Native keyboard-accessible disclosure; closed by default unless requested. */
export function CalculatorDisclosure({ title, summary, appearance = 'form', className, children, ...props }: CalculatorDisclosureProps) {
    const form = appearance === 'form';
    return <details {...props} className={cn(form
        ? 'salary-calc__fold tw:ui-fill-panel tw:ui-border-strong tw:rounded-[22px] tw:overflow-hidden tw:[&[open]>summary_svg]:rotate-180 tw:[[data-appearance=liquid-glass]_&]:backdrop-blur-[20px]'
        : 'tw:mt-[1rem] tw:p-[1rem] tw:ui-border-default tw:rounded-[16px] tw:ui-fill-surface tw:text-main tw:[&_p]:text-secondary tw:[&_p]:text-[.85rem] tw:[&_p]:leading-[1.5]', className)}>
        <summary className={form
            ? 'tw:ui-row tw:justify-between tw:gap-[.6rem] tw:p-[1.1rem_1.3rem] tw:text-[.94rem] tw:font-[650] tw:list-none tw:cursor-pointer tw:min-h-[64px] tw:[&::-webkit-details-marker]:hidden tw:[@media(max-width:480px)]:p-[1rem] tw:[&_small]:block tw:[&_small]:mt-[.3rem] tw:[&_small]:text-secondary tw:[&_small]:text-[.77rem] tw:[&_small]:font-normal tw:[&_svg]:shrink-0 tw:[&_svg]:text-secondary tw:[&_svg]:[transition:transform_.15s] tw:[@media(prefers-reduced-motion:reduce)]:[&_svg]:transition-none'
            : 'tw:cursor-pointer tw:font-semibold'}>
            {form ? <><span>{title}{summary && <small>{summary}</small>}</span><ChevronDown size={18} /></> : title}
        </summary>
        {form ? <div className="salary-calc__fold-body tw:p-[0_1.3rem_1.3rem] tw:[@media(max-width:480px)]:p-[0_1rem_1rem] tw:[&>p]:text-secondary tw:[&>p]:text-[.85rem] tw:[&>p]:leading-[1.7] tw:[&>p]:mb-[.9rem]">{children}</div> : children}
    </details>;
}
