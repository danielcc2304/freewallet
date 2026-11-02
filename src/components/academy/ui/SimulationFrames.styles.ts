import { cn } from '../../../utils/cn';
import { PortfolioBuilderFrameStyle as p } from './PortfolioBuilderFrame.styles';
import { AssetAllocationSimFrameStyle as a } from './AssetAllocationSimFrame.styles';
const parts = {
    portfolioBuilder: p('portfolio-builder'),
    portfolioBuilderSectionTitle: p('portfolio-builder__section-title'),
    portfolioBuilderFilters: p('portfolio-builder__filters'),
    portfolioBuilderFiltersReset: p('portfolio-builder__filters-reset'),
    strategyPage: p('strategy-page'),
    strategyNav: p('strategy-nav'),
    strategyButton: p('strategy-button'),
    strategyLinks: p('strategy-links'),
    strategyButtonPrimary: p('strategy-button--primary'),
    portfolioBuilderFilterChip: p('portfolio-builder__filter-chip'),
    strategyModel: p('strategy-model'),
    strategyModelSelected: p('strategy-model--selected'),
    strategyModelMix: p('strategy-model__mix'),
    strategyShowMore: p('strategy-show-more'),
    strategyPlan: p('strategy-plan'),
    strategyComparison: p('strategy-comparison'),
    strategyProfile: p('strategy-profile'),
    strategyAssets: p('strategy-assets'),
    strategyWeight: p('strategy-weight'),
    strategyProfileGrid: p('strategy-profile__grid'),
    strategyAsset: p('strategy-asset'),
    strategyModelGrid: p('strategy-model-grid'),
    strategyWeightGrid: p('strategy-weight-grid'),
    allocSim: a('alloc-sim'),
    allocSimContent: a('alloc-sim__content'),
    allocSimStatCard: a('alloc-sim__stat-card'),
    label: a('label'),
    value: a('value'),
    allocSimChartBox: a('alloc-sim__chart-box'),
    boxTitle: a('box-title'),
    allocSimTopSection: a('alloc-sim__top-section'),
    allocSimTopSectionThree: a('alloc-sim__top-section--three'),
    desc: a('desc'),
    calcInputWrapper: a('calc__input-wrapper'),
    allocSimShockGrid: a('alloc-sim__shock-grid'),
    allocSimBack: a('alloc-sim__back'),
    allocSimInputsArea: a('alloc-sim__inputs-area'),
    allocSimInfoBox: a('alloc-sim__info-box'),
    allocSimDisclaimer: a('alloc-sim__disclaimer'),
};
export type SimulationFramePart = keyof typeof parts;
export function simulationFrameStyle(p: SimulationFramePart, className?: string) {
    return cn(parts[p], className);
}
export function strategyActionStyle(primary = false, secondary = false, more = false, className?: string) {
    return cn(
        p('strategy-button'),
        primary && p('strategy-button--primary'),
        secondary && 'strategy-button--secondary',
        more && p('strategy-show-more'),
        className,
    );
}
