import { WalletCards } from 'lucide-react';
import type React from 'react';

export function ExpenseEmptyState({
    title,
    children,
    action,
}: {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div className="expense-empty tw:p-[1.7rem_1rem] tw:text-center tw:text-secondary">
            <WalletCards className="tw:text-accent tw:opacity-[.6] tw:mb-[.8rem]" size={36} />
            <h3 className="tw:text-main tw:mb-[.5rem] tw:text-[length:.95rem]">{title}</h3>
            <p className="tw:text-[length:.82rem] tw:[line-height:1.6] tw:max-w-[340px] tw:m-[0_auto_.8rem]">{children}</p>
            {action}
        </div>
    );
}
