import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { ActionGroup, Card } from '../../components/ui';
import { cn } from '../../utils/cn';

/** Account composition uses the same primitives as other migrated screens. */
export function AccountPanel({ className, ...props }: ComponentProps<typeof Card>) {
    return <Card {...props} className={cn(
        'tw:p-6 tw:max-[640px]:p-6 tw:max-[600px]:p-4 tw:wrap-anywhere tw:[&_p]:leading-[1.55]',
        'tw:[&_.btn]:min-h-[44px] tw:[&_.btn]:whitespace-normal tw:[&_.btn]:text-center',
        className,
    )} />;
}

export function AccountActions({ className, ...props }: ComponentProps<typeof ActionGroup>) {
    return <ActionGroup {...props} stackOnMobile className={cn('account-page__actions', className)} />;
}

export function AccountHelp({ as: Tag = 'p', className, ...props }: HTMLAttributes<HTMLElement> & { as?: 'p' | 'small' }) {
    return <Tag {...props} className={cn('account-page__help tw:text-secondary tw:text-sm tw:leading-[1.55]', className)} />;
}

export function AccountHeading({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
    return <div className="account-page__section-heading tw:flex tw:items-center tw:gap-[.6rem] tw:[&>svg]:text-accent tw:[&>svg]:shrink-0">
        {icon}<h2 className="tw:m-0 tw:text-xl tw:leading-[1.35]">{children}</h2>
    </div>;
}

export function AccountInset({ as: Tag = 'div', className, ...props }: HTMLAttributes<HTMLElement> & { as?: 'div' | 'form' }) {
    return <Tag {...props} className={cn(
        'tw:min-w-0 tw:p-4 tw:border tw:border-line tw:rounded-control tw:bg-surface-muted',
        'tw:glass:bg-glass-content tw:glass:border-glass-edge tw:glass:shadow-[inset_0_1px_0_var(--glass-edge-bright)]',
        className,
    )} />;
}

export function AccountDetail({ icon, label, className, children }: { icon: ReactNode; label: string; className?: string; children: ReactNode }) {
    return <AccountInset className="tw:max-[600px]:p-[.85rem]">
        <dt className="tw:flex tw:items-center tw:gap-[.4rem] tw:text-secondary tw:text-[.8rem]">{icon}{label}</dt>
        <dd className={cn('tw:flex tw:items-center tw:justify-between tw:flex-wrap tw:gap-2 tw:mt-[.65rem] tw:mx-0 tw:mb-0 tw:wrap-anywhere tw:text-[.95rem] tw:[&>.btn]:-my-[.35rem]', className)}>{children}</dd>
    </AccountInset>;
}
