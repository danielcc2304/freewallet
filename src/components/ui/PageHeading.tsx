import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface PageHeadingProps {
    title: ReactNode;
    description: ReactNode;
    actions?: ReactNode;
    className?: string;
    titleClassName?: string;
    descriptionClassName?: string;
}

/** Compact page heading with actions that stack on small screens. */
export function PageHeading({ title, description, actions, className, titleClassName, descriptionClassName }: PageHeadingProps) {
    return <div className={cn('tw:flex tw:items-start tw:justify-between tw:gap-[1rem] tw:[@media(max-width:640px)]:grid tw:[@media(max-width:640px)]:grid-cols-1', className)}>
        <div>
            <h1 className={cn('tw:m-0 tw:text-[1.875rem] tw:font-bold', titleClassName)}>{title}</h1>
            <p className={cn('tw:m-[.5rem_0_0] tw:text-secondary', descriptionClassName)}>{description}</p>
        </div>
        {actions}
    </div>;
}
