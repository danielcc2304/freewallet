import type { HTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';
import { SalaryCalculatorLayout } from './SalaryCalculatorLayout.styles';
import { BondCalculatorLayout } from './BondCalculatorLayout.styles';
import { FundInformationCalculatorLayout } from './FundInformationCalculatorLayout.styles';
const layouts = {
    'payroll-layout': SalaryCalculatorLayout('salary-calc__layout'),
    'payroll-fields': SalaryCalculatorLayout('salary-calc__fields'),
    'payroll-payment-comparison': SalaryCalculatorLayout('salary-calc__payment-comparison'),
    'payroll-scenario-grid': SalaryCalculatorLayout('salary-calc__scenario-grid'),
    'payroll-scales': SalaryCalculatorLayout('salary-calc__scales'),
    'bond-grid': BondCalculatorLayout('bond-calc__grid'),
    'bond-maturity-grid': BondCalculatorLayout('bond-calc__maturity-grid'),
    'bond-advanced-grid': BondCalculatorLayout('bond-calc__advanced-grid'),
    'result-details': BondCalculatorLayout('result-details'),
    'bond-calc-edu': BondCalculatorLayout('bond-calc-edu'),
    'fund-metric-grid':
        FundInformationCalculatorLayout('fund-info__metric-grid') +
        ' ' +
        FundInformationCalculatorLayout('fund-info__metric-grid--summary'),
    'fund-data-grid': FundInformationCalculatorLayout('fund-info__data-grid'),
    'fund-fee-grid': FundInformationCalculatorLayout('fund-info__fee-grid'),
    'fund-breakdown-grid': FundInformationCalculatorLayout('fund-info__breakdown-grid'),
    'fund-documents': FundInformationCalculatorLayout('fund-info__documents'),
    'fund-holdings-list': FundInformationCalculatorLayout('fund-info__holdings-list'),
};
/** Native grid shared by calculator inputs, result groups and comparisons. */
export function CalculatorGrid({
    variant,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { variant: keyof typeof layouts }) {
    return <div {...props} className={cn(layouts[variant], className)} />;
}
