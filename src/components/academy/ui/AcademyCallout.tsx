import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface AcademyCalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    title: ReactNode;
    icon: ReactNode;
    tone?: 'info' | 'warning';
}

/** Lesson guidance with a consistent icon, heading and body, including optional links. */
export function AcademyCallout({ title, icon, tone = 'info', children, className, ...props }: AcademyCalloutProps) {
    return <div {...props} className={cn('asset-page__callout', `asset-page__callout--${tone}`, 'tw:mt-[1.25rem] tw:p-[1rem] tw:rounded-[12px] tw:flex tw:gap-[.75rem] tw:items-start tw:[&>svg]:w-[20px] tw:[&>svg]:h-[20px] tw:[&>svg]:flex-[0_0_20px] tw:[&>svg]:mt-[.15rem] tw:[@media(max-width:480px)]:[&>svg]:w-[22px] tw:[@media(max-width:480px)]:[&>svg]:h-[22px] tw:[@media(max-width:480px)]:[&>svg]:basis-[22px]', tone === 'info' ? 'tw:bg-[rgba(59,130,246,.06)] tw:[border:1px_solid_rgba(59,130,246,.1)] tw:[&_svg]:text-[#3b82f6]' : 'tw:bg-[rgba(245,158,11,.06)] tw:[border:1px_solid_rgba(245,158,11,.1)] tw:[&_svg]:text-[#f59e0b]', className)}>
        {icon}
        <div className="tw:min-w-0 tw:[&_p]:text-[.95rem] tw:[&_p]:text-secondary tw:[&_p]:leading-[1.65] tw:[&_p]:m-0">
            <strong className="tw:block tw:mb-[.25rem] tw:font-bold">{title}</strong>
            {children}
        </div>
    </div>;
}
