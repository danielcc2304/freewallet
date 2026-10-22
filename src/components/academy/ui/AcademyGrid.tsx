import type { HTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

const layouts = {
    subtypes: "tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] tw:gap-[1.5rem]",
    prosCons: "tw:grid tw:grid-cols-[1fr_1fr] tw:gap-[2rem]",
    steps: "tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(240px,_1fr))] tw:gap-[1.5rem]",
    metrics: "tw:grid tw:grid-cols-[1fr_1fr] tw:gap-[1.5rem]",
    geography: "tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(180px,_1fr))] tw:gap-[1.25rem] tw:mb-[2rem]",
    bondAnatomy: "tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] tw:gap-[1.5rem]",
    bondSubtypes: "tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(240px,_1fr))] tw:gap-[1.25rem]",
    glossary: "tw:grid tw:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] tw:gap-[1.5rem]",
    risk: "tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem]",
    taxBrackets: "tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(min(100%,_160px),_1fr))] tw:gap-[1rem] tw:mt-[1.5rem]",
    taxTools: "tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem]",
    valuation: "tw:grid tw:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] tw:gap-[1.5rem]",
    errors: "tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(320px,_1fr))] tw:gap-[var(--academy-space-stack)]",
    errorDetails: "tw:grid tw:grid-cols-[1fr_1fr] tw:gap-[1.25rem] tw:mt-[0.5rem]",
    scenarios: "tw:ui-stack tw:gap-[2rem]",
    assets: "tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(280px,_1fr))] tw:gap-[1.5rem] tw:mb-[3rem]",
    nextSteps: "tw:mt-[1.5rem] tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))] tw:gap-[1rem]",
    models: "tw:grid tw:grid-cols-[repeat(2,minmax(0,1fr))] tw:gap-[1rem]",
    weights: "tw:grid tw:grid-cols-[repeat(3,minmax(0,1fr))] tw:gap-[.75rem] tw:m-[1.25rem_0]",
    profiles: "tw:grid tw:grid-cols-[repeat(3,minmax(0,1fr))] tw:gap-[1rem]",
    strategyAssets: "tw:grid tw:grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] tw:gap-[1rem] tw:mt-[1rem]",
    allocationStats: "tw:grid tw:grid-cols-[1fr_1fr] tw:gap-[var(--academy-space-stack)]",
    shocks: "tw:grid tw:grid-cols-[repeat(3,minmax(0,1fr))] tw:gap-[1rem]",
    crisisStats: "tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[.75rem]",
    crisisInputs: "tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem] tw:mb-[1.5rem]",
    crisisScenarios: "tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[.75rem]",
    crisisTabs: "tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[.75rem]",
    timingStats: "tw:grid tw:grid-cols-[repeat(4,_minmax(0,_1fr))] tw:gap-[.8rem] tw:mb-[1.25rem]",
};
interface AcademyGridProps extends HTMLAttributes<HTMLElement> {
    variant: keyof typeof layouts;
    as?: 'div' | 'section' | 'ul';
}
/** Layout only: media/container queries and chart-specific rules remain local. */
export function AcademyGrid({ as: Tag = 'div', variant, className, ...props }: AcademyGridProps) {
    return <Tag {...props} className={cn(layouts[variant], className)} />;
}
