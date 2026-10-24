import { Card } from '../../ui/Card';
import {
    cloneElement,
    type ReactElement,
    type ReactNode,
    type HTMLAttributes,
    type TdHTMLAttributes,
    type ThHTMLAttributes,
    type ComponentProps,
} from 'react';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui/Button';
import { assetsGridStyle as s } from './DashboardAssetsGrid.styles';
/** A native table becomes the same compact grid on mobile, without changing row semantics. */
export function DashboardAssetsGrid({
    showDetails,
    showActions,
    children,
}: {
    showDetails: boolean;
    showActions: boolean;
    children: ReactNode;
}) {
    return (
        <div className={s('assets-table__wrapper')}>
            <table
                className={cn(
                    s('assets-table__table'),
                    showDetails && s('assets-table__table--show-details'),
                    showActions && s('assets-table__table--show-actions'),
                )}
            >
                {children}
            </table>
        </div>
    );
}
export function DashboardAssetRow({
    lot,
    className,
    ...props
}: HTMLAttributes<HTMLTableRowElement> & { lot: boolean }) {
    return <tr {...props} className={cn(s('clickable-row'), lot && s('assets-table__lot-row'), className)} />;
}
export function DashboardAssetsCard({ className, ...props }: ComponentProps<typeof Card>) {
    return <Card {...props} className={cn('assets-table tw:w-full', className)} />;
}
const columns = {
    asset: 'assets-table__column--asset',
    price: s('assets-table__column--price'),
    today: s('assets-table__column--today'),
    value: s('assets-table__column--value'),
    gain: s('assets-table__column--gain'),
    optional: 'assets-table__optional',
    mobile: s('assets-table__mobile-details-cell'),
    actions: s('assets-table__actions-cell'),
} as const;
export function DashboardAssetCell({
    as: Tag = 'td',
    column,
    optional,
    valueEmphasis,
    className,
    ...props
}: TdHTMLAttributes<HTMLTableCellElement> &
    ThHTMLAttributes<HTMLTableCellElement> & {
        as?: 'td' | 'th';
        column?: keyof typeof columns;
        optional?: boolean;
        valueEmphasis?: boolean;
    }) {
    const key =
        column === 'actions' && Tag === 'th' ? s('assets-table__actions-header') : column ? columns[column] : undefined;
    return (
        <Tag
            {...props}
            className={cn(
                key,
                optional && 'assets-table__optional',
                valueEmphasis && s('assets-table__value'),
                className,
            )}
        />
    );
}
export function DashboardAssetSortIcon({
    icon,
    active = false,
}: {
    icon: ReactElement<{ className?: string }>;
    active?: boolean;
}) {
    return cloneElement(icon, {
        className: cn(s('sort-icon'), active && s('sort-icon--active'), icon.props.className),
    });
}
export function DashboardAssetFilters({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('assets-table__filters'), className)} />;
}
export function DashboardAssetTableMessage({
    empty,
    className,
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { empty?: boolean }) {
    return <p {...props} className={cn(s(empty ? 'assets-table__empty' : 'assets-table__filter-count'), className)} />;
}
export function DashboardAssetActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('assets-table__actions'), className)} />;
}
export function DashboardAssetMobileToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('assets-table__mobile-toolbar'), className)} />;
}
export function DashboardAssetActionButton({
    destructive,
    className,
    ...props
}: ComponentProps<typeof Button> & { destructive?: boolean }) {
    return <Button {...props} className={cn(destructive && s('assets-table__delete-btn'), className)} />;
}
export function DashboardAssetEstimate({
    as: Tag = 'small',
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { as?: 'small' | 'span' }) {
    return <Tag {...props} className={cn(s('assets-table__estimated'), className)} />;
}
