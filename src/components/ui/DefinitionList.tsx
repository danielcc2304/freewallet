import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface DefinitionItem {
    label: string;
    value: ReactNode;
}
interface DefinitionListProps extends HTMLAttributes<HTMLDListElement> {
    items: readonly DefinitionItem[];
    layout?: 'stacked' | 'inline';
}

/** Semantic label/value rows shared by calculator snapshots and portfolio details. */
export function DefinitionList({ items, layout = 'stacked', className, ...props }: DefinitionListProps) {
    const inline = layout === 'inline';
    return <dl {...props} className={cn(inline ? 'tw:grid tw:gap-[.5rem] tw:m-0 tw:text-[.8rem]' : 'tw:my-[.75rem] tw:mx-0', className)}>
        {items.map(item => <div key={item.label} className={inline ? 'tw:flex tw:flex-wrap tw:justify-between tw:gap-[.5rem]' : 'tw:my-[.75rem] tw:mx-0'}>
            <dt className={cn('tw:text-secondary', !inline && 'tw:text-[.875rem]')}>{item.label}</dt>
            <dd className={cn('tw:text-main', inline ? 'tw:m-0' : 'tw:m-[.2rem_0_0] tw:font-semibold tw:wrap-anywhere')}>{item.value}</dd>
        </div>)}
    </dl>;
}
