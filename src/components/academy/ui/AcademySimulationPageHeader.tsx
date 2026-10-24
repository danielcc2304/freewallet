import { cloneElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { cn } from '../../../utils/cn';
import { allocationHeaderStyle as a } from './AcademyAllocationHeader.styles';
import { strategyHeaderStyle as s } from './AcademyStrategyHeader.styles';
type Props = Omit<ComponentProps<typeof AcademyPageHeader>, 'children' | 'title'> & {
    title: ReactNode;
    description: ReactNode;
} & (
        | { appearance: 'allocation'; icon: ReactElement<{ className?: string }> }
        | { appearance: 'strategy'; icon?: never }
    );
/** Shared Academy header chrome with each simulator's existing title structure. */
export function AcademySimulationPageHeader({ appearance, title, description, icon, className, ...props }: Props) {
    if (appearance === 'allocation')
        return (
            <AcademyPageHeader {...props} className={cn(a('alloc-sim__header'), className)}>
                <div className={a('alloc-sim__title-group')}>
                    {cloneElement(icon, { className: cn(a('alloc-sim__title-icon'), icon.props.className) })}
                    <div>
                        <h1 className={a('alloc-sim__title')}>{title}</h1>
                        <p className={a('alloc-sim__subtitle')}>{description}</p>
                    </div>
                </div>
            </AcademyPageHeader>
        );
    return (
        <AcademyPageHeader {...props} className={cn(s('portfolio-builder__header'), className)}>
            <h1 className={s('portfolio-builder__title')}>{title}</h1>
            <p className={s('portfolio-builder__subtitle')}>{description}</p>
        </AcademyPageHeader>
    );
}
