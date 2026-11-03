import { cn } from '../../../utils/cn';
import { BondCalculatorDetailStyle } from './BondCalculatorDetail.styles';
import { SalaryCalculatorDetailStyle } from './SalaryCalculatorDetail.styles';
import { FIRECalculatorDetailStyle } from './FIRECalculatorDetail.styles';
import { RetirementCalculatorDetailStyle } from './RetirementCalculatorDetail.styles';
const parts = {
    'detail-box__value': BondCalculatorDetailStyle('detail-box__value'),
    'status-badge': BondCalculatorDetailStyle('status-badge'),
    'status-badge--discount': BondCalculatorDetailStyle('status-badge--discount'),
    'status-badge--premium': BondCalculatorDetailStyle('status-badge--premium'),
    'status-badge--par': BondCalculatorDetailStyle('status-badge--par'),
    'coupon-value': BondCalculatorDetailStyle('coupon-value'),
    'coupon-value__icon': BondCalculatorDetailStyle('coupon-value__icon'),
    value: BondCalculatorDetailStyle('value'),
    'salary-calc': SalaryCalculatorDetailStyle('salary-calc'),
    'salary-calc__header': SalaryCalculatorDetailStyle('salary-calc__header'),
    'salary-calc__year': SalaryCalculatorDetailStyle('salary-calc__year'),
    'salary-calc__form': SalaryCalculatorDetailStyle('salary-calc__form'),
    'salary-calc__results': SalaryCalculatorDetailStyle('salary-calc__results'),
    'salary-calc__hint': SalaryCalculatorDetailStyle('salary-calc__hint'),
    'salary-calc__privacy': SalaryCalculatorDetailStyle('salary-calc__privacy'),
    'salary-calc__segmented': SalaryCalculatorDetailStyle('salary-calc__segmented'),
    'salary-calc__button': SalaryCalculatorDetailStyle('salary-calc__button'),
    'salary-calc__text-button': SalaryCalculatorDetailStyle('salary-calc__text-button'),
    'salary-calc__button--secondary': SalaryCalculatorDetailStyle('salary-calc__button--secondary'),
    'salary-calc__distribution': SalaryCalculatorDetailStyle('salary-calc__distribution'),
    'salary-calc__distribution--net': SalaryCalculatorDetailStyle('salary-calc__distribution--net'),
    'salary-calc__dot--net': SalaryCalculatorDetailStyle('salary-calc__dot--net'),
    'salary-calc__distribution--irpf': SalaryCalculatorDetailStyle('salary-calc__distribution--irpf'),
    'salary-calc__dot--irpf': SalaryCalculatorDetailStyle('salary-calc__dot--irpf'),
    'salary-calc__distribution--ss': SalaryCalculatorDetailStyle('salary-calc__distribution--ss'),
    'salary-calc__dot--ss': SalaryCalculatorDetailStyle('salary-calc__dot--ss'),
    'salary-calc__dot': SalaryCalculatorDetailStyle('salary-calc__dot'),
    'salary-calc__tax': SalaryCalculatorDetailStyle('salary-calc__tax'),
    'salary-calc__fold': SalaryCalculatorDetailStyle('salary-calc__fold'),
    'salary-calc__error': SalaryCalculatorDetailStyle('salary-calc__error'),
    'salary-calc__notes': SalaryCalculatorDetailStyle('salary-calc__notes'),
    'salary-calc__actions': SalaryCalculatorDetailStyle('salary-calc__actions'),
    'salary-calc__current-bracket': SalaryCalculatorDetailStyle('salary-calc__current-bracket'),
    'salary-calc__scenarios': SalaryCalculatorDetailStyle('salary-calc__scenarios'),
    'salary-calc__sources': SalaryCalculatorDetailStyle('salary-calc__sources'),
    fire: FIRECalculatorDetailStyle('fire'),
    'fire-tooltip': FIRECalculatorDetailStyle('fire-tooltip'),
    'fire-tooltip__label': FIRECalculatorDetailStyle('fire-tooltip__label'),
    'fire-tooltip__value': FIRECalculatorDetailStyle('fire-tooltip__value'),
    balance: FIRECalculatorDetailStyle('balance'),
    target: FIRECalculatorDetailStyle('target'),
    'retirement-tooltip': RetirementCalculatorDetailStyle('retirement-tooltip'),
    'retirement-tooltip__label': RetirementCalculatorDetailStyle('retirement-tooltip__label'),
    'retirement-tooltip__value': RetirementCalculatorDetailStyle('retirement-tooltip__value'),
    nominal: RetirementCalculatorDetailStyle('nominal'),
    real: RetirementCalculatorDetailStyle('real'),
};
export type CalculatorPresentationPart = keyof typeof parts;
export function calculatorPresentationStyle(part: CalculatorPresentationPart, className?: string) {
    return cn(parts[part], className);
}
/** Resolve retained integration hooks through static recipes; financial values stay with the caller. */
export function calculatorPresentationClasses(className?: string) {
    return cn(
        className
            ?.split(/\s+/)
            .map((token) => (Object.hasOwn(parts, token) ? parts[token as CalculatorPresentationPart] : token)),
    );
}
