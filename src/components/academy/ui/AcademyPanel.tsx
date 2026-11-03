import type { HTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/cn';

const surfaces = {
    workspace: "tw:ui-fill-surface tw:ui-border tw:rounded-[18px] tw:p-[1.25rem] tw:min-w-[0]",
    subtype: "tw:ui-fill-surface tw:ui-border-default tw:p-[1.5rem] tw:rounded-[16px]",
    step: "tw:ui-fill-surface tw:ui-border-default tw:p-[2rem] tw:rounded-[20px] tw:text-center tw:relative",
    prosCons: "tw:p-[2rem] tw:rounded-[20px] tw:ui-border-default",
    comparison: "tw:flex-[1] tw:ui-fill-surface tw:ui-border-default tw:p-[2rem] tw:rounded-[24px] tw:relative",
    geography: "tw:ui-fill-surface tw:ui-border-default tw:p-[1.25rem] tw:rounded-[16px]",
    explainer: "tw:ui-fill-surface tw:ui-border-default tw:p-[1.5rem] tw:rounded-[20px] tw:ui-stack",
    bondAnatomy: "tw:ui-fill-surface tw:p-[1.25rem] tw:rounded-[12px] tw:ui-stack tw:text-center tw:ui-border-default",
    bondSubtype: "tw:ui-fill-muted tw:p-[var(--academy-space-card)] tw:rounded-[16px] tw:ui-border-default tw:ui-stack tw:gap-[0.75rem]",
    yieldCurve: "tw:ui-fill-surface tw:ui-border-default tw:p-[1.5rem] tw:rounded-[20px]",
    glossary: "tw:ui-fill-surface tw:ui-border-default tw:rounded-[20px] tw:p-[2rem] tw:ui-stack tw:gap-[1rem]",
    risk: "tw:min-w-[0] tw:p-[clamp(1rem,_2.5vw,_1.5rem)] tw:ui-border-default tw:rounded-[18px] tw:ui-fill-surface",
    tax: "tw:ui-fill-surface tw:ui-border-default tw:rounded-[20px] tw:p-[2rem]",
    taxTool: "tw:ui-stack tw:items-start tw:gap-[.75rem] tw:min-w-[0] tw:p-[1.5rem] tw:ui-border-default tw:rounded-[18px] tw:ui-fill-surface tw:text-main",
    valuation: "tw:ui-fill-surface tw:rounded-[16px] tw:p-[1.5rem] tw:ui-border-default",
    error: "tw:ui-fill-surface tw:ui-border-default tw:rounded-[20px] tw:p-[var(--academy-space-card)] tw:ui-stack tw:gap-[var(--academy-space-stack)]",
    errorDetail: "tw:p-[1rem] tw:rounded-[12px]",
    scenario: "tw:ui-fill-surface tw:ui-border-default tw:rounded-[20px] tw:p-[2.5rem]",
    timeline: "tw:flex-[1] tw:ui-fill-surface tw:ui-border-default tw:rounded-[12px] tw:overflow-hidden",
    quiz: "tw:ui-fill-surface tw:ui-border-default tw:rounded-[24px] tw:p-[3rem] tw:relative tw:overflow-hidden",
    asset: "tw:ui-fill-surface tw:ui-border-default tw:rounded-[16px] tw:p-[0] tw:ui-stack tw:overflow-hidden",
    model: "tw:ui-fill-surface tw:ui-border-default tw:rounded-[20px] tw:p-[2rem] tw:ui-stack tw:gap-[1.5rem]",
    nextSteps: "tw:mt-[2rem] tw:ui-fill-surface tw:ui-border-default tw:rounded-[24px] tw:p-[2rem]",
    nextStep: "tw:ui-fill-muted tw:ui-border-default tw:rounded-[18px] tw:p-[1.1rem] tw:text-main",
    allocationInputs: "tw:ui-fill-surface tw:p-[var(--academy-space-card-lg)] tw:rounded-[24px] tw:ui-border-default",
    fundamentals: "tw:ui-fill-surface tw:ui-border-default tw:rounded-[16px]",
    allocation: "tw:ui-fill-surface tw:ui-border-default tw:p-[var(--academy-space-card)] tw:rounded-[20px]",
    crisis: "tw:p-[clamp(1rem,_2.5vw,_1.5rem)] tw:ui-border-default tw:rounded-[18px] tw:ui-fill-surface tw:min-w-[0]",
    strategy: "tw:min-w-[0] tw:p-[clamp(1rem,_2.5vw,_1.5rem)] tw:ui-fill-surface tw:ui-border-default tw:rounded-[18px]",
};
type Surface = keyof typeof surfaces;
interface AcademyPanelProps extends HTMLAttributes<HTMLElement> {
    variant: Surface;
    as?: 'div' | 'section' | 'article' | 'aside';
}
/** Shared lesson and simulator surfaces; callers retain content, state and semantic landmarks. */
export function AcademyPanel({ as: Tag = 'div', variant, className, ...props }: AcademyPanelProps) {
    return <Tag {...props} className={cn(surfaces[variant], className)} />;
}
/** A surface remains a native router link, including modified clicks and keyboard navigation. */
export function AcademyLinkCard({ variant, className, ...props }: LinkProps & { variant: Surface }) {
    return <Link {...props} className={cn(surfaces[variant], className)} />;
}
