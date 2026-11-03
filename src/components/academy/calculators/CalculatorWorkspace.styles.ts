import { cn } from '../../../utils/cn';
import { CompoundInterestCalcWorkspaceStyle } from './CompoundInterestCalcWorkspace.styles';
import { RetirementCalculatorWorkspaceStyle } from './RetirementCalculatorWorkspace.styles';
import { BondCalculatorWorkspaceStyle } from './BondCalculatorWorkspace.styles';
export const calculatorWorkspaces = {
    compound: CompoundInterestCalcWorkspaceStyle('compound'),
    compoundHeader: CompoundInterestCalcWorkspaceStyle('compound__header'),
    compoundModeSelector: CompoundInterestCalcWorkspaceStyle('compound__mode-selector'),
    compoundContainer: CompoundInterestCalcWorkspaceStyle('compound__container'),
    compoundInputs: CompoundInterestCalcWorkspaceStyle('compound__inputs'),
    compoundInputHint: CompoundInterestCalcWorkspaceStyle('compound__input-hint'),
    compoundRadioGroup: CompoundInterestCalcWorkspaceStyle('compound__radio-group'),
    compoundResults: CompoundInterestCalcWorkspaceStyle('compound__results'),
    compoundResultCards: CompoundInterestCalcWorkspaceStyle('compound__result-cards'),
    compoundBreakdown: CompoundInterestCalcWorkspaceStyle('compound__breakdown'),
    compoundDetailPositive: CompoundInterestCalcWorkspaceStyle('compound__detail-positive'),
    retirement: RetirementCalculatorWorkspaceStyle('retirement'),
    retirementHeader: RetirementCalculatorWorkspaceStyle('retirement__header'),
    retirementSummaryBadge: RetirementCalculatorWorkspaceStyle('retirement__summary-badge'),
    retirementSummaryLabel: RetirementCalculatorWorkspaceStyle('retirement__summary-label'),
    retirementSummaryValue: RetirementCalculatorWorkspaceStyle('retirement__summary-value'),
    retirementGrid: RetirementCalculatorWorkspaceStyle('retirement__grid'),
    retirementInputs: RetirementCalculatorWorkspaceStyle('retirement__inputs'),
    retirementInputSection: RetirementCalculatorWorkspaceStyle('retirement__input-section'),
    retirementSectionHeader: RetirementCalculatorWorkspaceStyle('retirement__section-header'),
    retirementInputGrid: RetirementCalculatorWorkspaceStyle('retirement__input-grid'),
    retirementInputGridStacked: RetirementCalculatorWorkspaceStyle('retirement__input-grid--stacked'),
    retirementMetrics: RetirementCalculatorWorkspaceStyle('retirement__metrics'),
    bondCalc: BondCalculatorWorkspaceStyle('bond-calc'),
    bondCalcHeader: BondCalculatorWorkspaceStyle('bond-calc__header'),
    bondCalcTitle: BondCalculatorWorkspaceStyle('bond-calc__title'),
    bondCalcSubtitle: BondCalculatorWorkspaceStyle('bond-calc__subtitle'),
    bondCalcInputs: BondCalculatorWorkspaceStyle('bond-calc__inputs'),
    bondCalcInputsHeader: BondCalculatorWorkspaceStyle('bond-calc__inputs-header'),
    bondCalcAdvanced: BondCalculatorWorkspaceStyle('bond-calc__advanced'),
    bondCalcAdvancedToggle: BondCalculatorWorkspaceStyle('bond-calc__advanced-toggle'),
    bondCalcAdvancedContent: BondCalculatorWorkspaceStyle('bond-calc__advanced-content'),
    bondCalcResults: BondCalculatorWorkspaceStyle('bond-calc__results'),
    bondCalcCalculationDetails: BondCalculatorWorkspaceStyle('bond-calc__calculation-details'),
};
export type Appearance = keyof typeof calculatorWorkspaces;
export function calculatorWorkspaceStyle(a: Appearance, className?: string) {
    return cn(calculatorWorkspaces[a], className);
}