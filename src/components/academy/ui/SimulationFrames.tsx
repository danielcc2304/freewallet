import type { HTMLAttributes, ButtonHTMLAttributes, ComponentProps } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { AcademyPanel } from './AcademyPanel';
import { AcademyGrid } from './AcademyGrid';
import { simulationFrameStyle as s, strategyActionStyle, type SimulationFramePart } from './SimulationFrames.styles';
export function SimulationFrame({
    appearance,
    as: Tag = 'div',
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { appearance: SimulationFramePart; as?: 'div' | 'section' | 'nav' }) {
    return <Tag {...props} className={s(appearance, className)} />;
}
export function SimulationFramePanel({
    appearance,
    className,
    ...props
}: ComponentProps<typeof AcademyPanel> & { appearance: SimulationFramePart }) {
    return <AcademyPanel {...props} className={s(appearance, className)} />;
}
export function SimulationFrameGrid({
    appearance,
    className,
    ...props
}: ComponentProps<typeof AcademyGrid> & { appearance: SimulationFramePart }) {
    return <AcademyGrid {...props} className={s(appearance, className)} />;
}
export function SimulationFrameTitle({
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLHeadingElement> & { appearance: SimulationFramePart }) {
    return <h2 {...props} className={s(appearance, className)} />;
}
export function StrategyButton({
    primary,
    secondary,
    more,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; secondary?: boolean; more?: boolean }) {
    return <button {...props} className={strategyActionStyle(primary, secondary, more, className)} />;
}
export function StrategyActionLink({
    primary,
    secondary,
    className,
    ...props
}: LinkProps & { primary?: boolean; secondary?: boolean }) {
    return <Link {...props} className={strategyActionStyle(primary, secondary, false, className)} />;
}
export function StrategyReset({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={s('portfolioBuilderFiltersReset', className)} />;
}
export function AllocationBack({ className, ...props }: LinkProps) {
    return <Link {...props} className={s('allocSimBack', className)} />;
}
export function StrategyModelCard({
    selected,
    className,
    ...props
}: ComponentProps<typeof AcademyPanel> & { selected: boolean }) {
    return (
        <AcademyPanel
            {...props}
            className={s('strategyModel', selected ? s('strategyModelSelected', className) : className)}
        />
    );
}
