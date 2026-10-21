import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ActionGroupProps extends HTMLAttributes<HTMLDivElement> {
    align?: 'start' | 'end';
    stackOnMobile?: boolean;
}

export function ActionGroup({ align = 'start', stackOnMobile = false, className, ...props }: ActionGroupProps) {
    return <div {...props} className={cn(
        'tw:flex tw:flex-wrap tw:gap-3 tw:my-4',
        align === 'end' && 'tw:justify-end',
        stackOnMobile && 'tw:max-[600px]:flex-col tw:max-[600px]:[&>*]:w-full',
        className,
    )} />;
}
