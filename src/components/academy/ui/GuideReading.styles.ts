import { cn } from '../../../utils/cn';
import { ValuationGuideReadingStyle } from './ValuationGuideReading.styles';
import { CommonErrorsReadingStyle } from './CommonErrorsReading.styles';
import { InvestorTimelineReadingStyle } from './InvestorTimelineReading.styles';
import { GlossaryReadingStyle } from './GlossaryReading.styles';
import { ScenariosReadingStyle } from './ScenariosReading.styles';
import { StrategiesReadingStyle } from './StrategiesReading.styles';
const parts = {
    valuationGuide: ValuationGuideReadingStyle('valuation-guide'),
    valuationGuideBack: ValuationGuideReadingStyle('valuation-guide__back'),
    valuationGuideHero: ValuationGuideReadingStyle('valuation-guide__hero'),
    valuationGuideHeroIcon: ValuationGuideReadingStyle('valuation-guide__hero-icon'),
    valuationGuideSection: ValuationGuideReadingStyle('valuation-guide__section'),
    metricCard: ValuationGuideReadingStyle('metric-card'),
    checklistGrid: ValuationGuideReadingStyle('checklist-grid'),
    valuationGuideNextGrid: ValuationGuideReadingStyle('valuation-guide__next-grid'),
    valuationGuideNextCard: ValuationGuideReadingStyle('valuation-guide__next-card'),
    valuationGuideGrid: ValuationGuideReadingStyle('valuation-guide__grid'),
    errorsPage: CommonErrorsReadingStyle('errors-page'),
    errorsPageHeader: CommonErrorsReadingStyle('errors-page__header'),
    errorsPageTitle: CommonErrorsReadingStyle('errors-page__title'),
    errorsPageSubtitle: CommonErrorsReadingStyle('errors-page__subtitle'),
    errorDetailCard: CommonErrorsReadingStyle('error-detail-card'),
    errorDetailCardDesc: CommonErrorsReadingStyle('error-detail-card__desc'),
    errorsPageGrid: CommonErrorsReadingStyle('errors-page__grid'),
    errorDetailCardGrid: CommonErrorsReadingStyle('error-detail-card__grid'),
    timeline: InvestorTimelineReadingStyle('timeline'),
    timelineHeader: InvestorTimelineReadingStyle('timeline__header'),
    timelineTitle: InvestorTimelineReadingStyle('timeline__title'),
    timelineDescription: InvestorTimelineReadingStyle('timeline__description'),
    timelineContainer: InvestorTimelineReadingStyle('timeline__container'),
    timelineCrisisError: InvestorTimelineReadingStyle('timeline__crisis-error'),
    timelineErrorsCta: InvestorTimelineReadingStyle('timeline__errors-cta'),
    timelineErrorsLink: InvestorTimelineReadingStyle('timeline__errors-link'),
    glossaryPage: GlossaryReadingStyle('glossary-page'),
    glossaryPageHeader: GlossaryReadingStyle('glossary-page__header'),
    glossaryPageTitle: GlossaryReadingStyle('glossary-page__title'),
    glossaryPageSubtitle: GlossaryReadingStyle('glossary-page__subtitle'),
    glossaryControls: GlossaryReadingStyle('glossary-controls'),
    glossaryFilters: GlossaryReadingStyle('glossary-filters'),
    glossaryEmpty: GlossaryReadingStyle('glossary-empty'),
    glossaryGrid: GlossaryReadingStyle('glossary-grid'),
    scenarios: ScenariosReadingStyle('scenarios'),
    scenariosHeader: ScenariosReadingStyle('scenarios__header'),
    scenariosTitle: ScenariosReadingStyle('scenarios__title'),
    scenariosSubtitle: ScenariosReadingStyle('scenarios__subtitle'),
    scenarioCard: ScenariosReadingStyle('scenario-card'),
    scenarioActions: ScenariosReadingStyle('scenario-actions'),
    strategies: StrategiesReadingStyle('strategies'),
    strategiesSection: StrategiesReadingStyle('strategies__section'),
    strategiesGrid: StrategiesReadingStyle('strategies__grid'),
    strategiesApproachCard: StrategiesReadingStyle('strategies__approach-card'),
    strategiesApproachCardActive: StrategiesReadingStyle('strategies__approach-card--active'),
    strategiesCardHeading: StrategiesReadingStyle('strategies__card-heading'),
    strategiesIcon: StrategiesReadingStyle('strategies__icon'),
    strategiesTag: StrategiesReadingStyle('strategies__tag'),
    strategiesTerm: StrategiesReadingStyle('strategies__term'),
    strategiesTakeaway: StrategiesReadingStyle('strategies__takeaway'),
    strategiesEntryCard: StrategiesReadingStyle('strategies__entry-card'),
    strategiesChartHeading: StrategiesReadingStyle('strategies__chart-heading'),
    strategiesBalanceGrid: StrategiesReadingStyle('strategies__balance-grid'),
    strategiesLegend: StrategiesReadingStyle('strategies__legend'),
    strategiesTools: StrategiesReadingStyle('strategies__tools'),
};
export type GuidePart = keyof typeof parts;
export function guideReadingStyle(part: GuidePart, className?: string) {
    return cn(parts[part], className);
}
