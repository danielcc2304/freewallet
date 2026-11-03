import type { HTMLAttributes, ComponentProps } from 'react';
import { cn } from '../../../utils/cn';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { CalculatorDataItem } from './CalculatorDataItem';
import { fundSheetFrameStyle as s } from './FundSheetFrame.styles';
export function FundSheetFrame({
    appearance,
    as: Tag = 'div',
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { appearance: Parameters<typeof s>[0]; as?: 'div' | 'p' | 'span' | 'caption' }) {
    return <Tag {...props} className={cn(s(appearance), className)} />;
}
export function FundSheetHeader({ className, ...props }: ComponentProps<typeof AcademyPageHeader>) {
    return <AcademyPageHeader {...props} className={cn(s('fund-info__header'), className)} />;
}
export function FundIdentityItem({ className, ...props }: ComponentProps<typeof CalculatorDataItem>) {
    return <CalculatorDataItem {...props} layout="identity" className={cn(s('fund-info__data-item'), className)} />;
}
