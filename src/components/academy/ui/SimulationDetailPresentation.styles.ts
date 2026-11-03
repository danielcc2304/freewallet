import { cn } from '../../../utils/cn';
import { CrisisSimulatorDetailStyle } from './CrisisSimulatorDetail.styles';
import { MarketTimingGameDetailStyle } from './MarketTimingGameDetail.styles';
const parts = {
    crisis: CrisisSimulatorDetailStyle('crisis'),
    'crisis__header-tags': CrisisSimulatorDetailStyle('crisis__header-tags'),
    crisis__selector: CrisisSimulatorDetailStyle('crisis__selector'),
    'crisis__tab--active': CrisisSimulatorDetailStyle('crisis__tab--active'),
    'crisis__tab-name': CrisisSimulatorDetailStyle('crisis__tab-name'),
    crisis__eyebrow: CrisisSimulatorDetailStyle('crisis__eyebrow'),
    crisis__copy: CrisisSimulatorDetailStyle('crisis__copy'),
    crisis__stat: CrisisSimulatorDetailStyle('crisis__stat'),
    crisis__footnote: CrisisSimulatorDetailStyle('crisis__footnote'),
    'crisis__input-group': CrisisSimulatorDetailStyle('crisis__input-group'),
    'crisis__input-wrapper': CrisisSimulatorDetailStyle('crisis__input-wrapper'),
    crisis__impact: CrisisSimulatorDetailStyle('crisis__impact'),
    'crisis__impact-row--low': CrisisSimulatorDetailStyle('crisis__impact-row--low'),
    crisis__bar: CrisisSimulatorDetailStyle('crisis__bar'),
    'crisis__decision-title': CrisisSimulatorDetailStyle('crisis__decision-title'),
    'crisis__scenario--selected': CrisisSimulatorDetailStyle('crisis__scenario--selected'),
    crisis__comparison: CrisisSimulatorDetailStyle('crisis__comparison'),
    crisis__next: CrisisSimulatorDetailStyle('crisis__next'),
    'crisis__table-wrapper': CrisisSimulatorDetailStyle('crisis__table-wrapper'),
    crisis__table: CrisisSimulatorDetailStyle('crisis__table'),
    'crisis__table-row--selected': CrisisSimulatorDetailStyle('crisis__table-row--selected'),
    'crisis__next-links': CrisisSimulatorDetailStyle('crisis__next-links'),
    crisis__stats: CrisisSimulatorDetailStyle('crisis__stats'),
    crisis__inputs: CrisisSimulatorDetailStyle('crisis__inputs'),
    crisis__scenarios: CrisisSimulatorDetailStyle('crisis__scenarios'),
    'market-timing-game': MarketTimingGameDetailStyle('market-timing-game'),
    'market-timing-game__header': MarketTimingGameDetailStyle('market-timing-game__header'),
    'timing-board': MarketTimingGameDetailStyle('timing-board'),
    'timing-round-header': MarketTimingGameDetailStyle('timing-round-header'),
    'timing-clock': MarketTimingGameDetailStyle('timing-clock'),
    'timing-progress': MarketTimingGameDetailStyle('timing-progress'),
    'timing-stats': MarketTimingGameDetailStyle('timing-stats'),
    'timing-chart': MarketTimingGameDetailStyle('timing-chart'),
    'timing-chart-note': MarketTimingGameDetailStyle('timing-chart-note'),
    'timing-controls': MarketTimingGameDetailStyle('timing-controls'),
    'timing-trade-buttons': MarketTimingGameDetailStyle('timing-trade-buttons'),
    btn: MarketTimingGameDetailStyle('btn'),
    'timing-sell': MarketTimingGameDetailStyle('timing-sell'),
    'timing-order-status': MarketTimingGameDetailStyle('timing-order-status'),
    'timing-shortcuts': MarketTimingGameDetailStyle('timing-shortcuts'),
    'timing-results': MarketTimingGameDetailStyle('timing-results'),
    'timing-round-list': MarketTimingGameDetailStyle('timing-round-list'),
    'timing-result-costs': MarketTimingGameDetailStyle('timing-result-costs'),
    positive: MarketTimingGameDetailStyle('positive'),
    negative: MarketTimingGameDetailStyle('negative'),
    'timing-rules': MarketTimingGameDetailStyle('timing-rules'),
};
export type SimulationPresentationPart = keyof typeof parts;
export function simulationPresentationStyle(part: SimulationPresentationPart, className?: string) {
    return cn(parts[part], className);
}
/** Resolve retained integration hooks through static recipes; financial values stay with the caller. */
export function simulationPresentationClasses(className?: string) {
    return cn(
        className
            ?.split(/\s+/)
            .map((token) => (Object.hasOwn(parts, token) ? parts[token as SimulationPresentationPart] : token)),
    );
}
