import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { investmentClass } from './investmentStyles';

interface ActionGroupProps extends HTMLAttributes<HTMLDivElement> {
    appearance?: 'default' | 'investment';
    align?: 'start' | 'end';
    stackOnMobile?: boolean;
}

export function ActionGroup({ appearance = 'default', align = 'start', stackOnMobile = false, className, ...props }: ActionGroupProps) {
    if (appearance === 'investment') return <div {...props} className={cn(investmentClass('form-actions'), className)} />;
    return <div {...props} className={cn(
        'tw:flex tw:flex-wrap tw:gap-3 tw:my-4',
        align === 'end' && 'tw:justify-end',
        stackOnMobile && 'tw:max-[600px]:flex-col tw:max-[600px]:[&>*]:w-full',
        className,
    )} />;
}
