export const COMPOUNDING_FREQUENCY_OPTIONS = [
    { value: 'daily', label: 'Diaria', periodsPerYear: 365 },
    { value: 'monthly', label: 'Mensual', periodsPerYear: 12 },
    { value: 'quarterly', label: 'Trimestral', periodsPerYear: 4 },
    { value: 'semiannual', label: 'Semestral', periodsPerYear: 2 },
    { value: 'annual', label: 'Anual', periodsPerYear: 1 }
] as const;

export type InterestRateType = 'cagr' | 'tin';
export type CompoundingFrequency = typeof COMPOUNDING_FREQUENCY_OPTIONS[number]['value'];
export type WithdrawalType = 'none' | 'percentage' | 'fixed';

export interface RateConversion {
    effectiveAnnualRate: number;
    monthlyRate: number;
    periodicRate: number;
    periodsPerYear: number;
}

export interface CompoundProjectionPoint {
    year: number;
    contributed: number;
    interest: number;
    total: number;
    withdrawal: number;
    grossInterest: number;
    yearLabel: string;
}

export interface CompoundProjectionInput {
    initial: number;
    monthly: number;
    monthlyRate: number;
    periods: number;
    withdrawalType: WithdrawalType;
    withdrawalValue: number;
}

export function isInterestRateType(value: unknown): value is InterestRateType {
    return value === 'cagr' || value === 'tin';
}

export function isCompoundingFrequency(value: unknown): value is CompoundingFrequency {
    return COMPOUNDING_FREQUENCY_OPTIONS.some((option) => option.value === value);
}

export function getRateConversion(
    annualRate: number,
    interestRateType: InterestRateType,
    compoundingFrequency: CompoundingFrequency
): RateConversion {
    const normalizedAnnualRate = Number.isFinite(annualRate) ? annualRate : 0;
    const frequency = COMPOUNDING_FREQUENCY_OPTIONS.find(
        (option) => option.value === compoundingFrequency
    ) ?? COMPOUNDING_FREQUENCY_OPTIONS[1];
    const periodicRate = interestRateType === 'tin'
        ? normalizedAnnualRate / frequency.periodsPerYear
        : normalizedAnnualRate;
    const effectiveAnnualRate = interestRateType === 'cagr'
        ? normalizedAnnualRate
        : Math.pow(1 + periodicRate, frequency.periodsPerYear) - 1;

    return {
        effectiveAnnualRate,
        periodicRate,
        periodsPerYear: frequency.periodsPerYear,
        // The calculator simulates month by month so monthly contributions
        // behave consistently regardless of the selected capitalization.
        monthlyRate: Math.pow(1 + effectiveAnnualRate, 1 / 12) - 1
    };
}

export function calculateCompoundInterestProjection({
    initial,
    monthly,
    monthlyRate,
    periods,
    withdrawalType,
    withdrawalValue
}: CompoundProjectionInput): CompoundProjectionPoint[] {
    const data: CompoundProjectionPoint[] = [];

    let totalContributed = initial;
    let totalInterest = 0;
    let currentValue = initial;
    let totalWithdrawals = 0;
    let totalGrossInterest = 0;

    for (let year = 0; year <= periods; year++) {
        if (year > 0) {
            for (let month = 1; month <= 12; month++) {
                // Contributions remain monthly; capitalization is represented
                // by the equivalent monthly rate returned above.
                currentValue += monthly;
                totalContributed += monthly;

                const interestEarned = currentValue * monthlyRate;
                currentValue += interestEarned;
                totalInterest += interestEarned;
                totalGrossInterest += interestEarned;

                if (month === 12 && withdrawalType !== 'none') {
                    const withdrawalAmount = withdrawalType === 'percentage'
                        ? currentValue * (withdrawalValue / 100)
                        : withdrawalValue;

                    currentValue -= withdrawalAmount;
                    totalWithdrawals += withdrawalAmount;
                    totalInterest -= withdrawalAmount;
                }
            }
        }

        data.push({
            year,
            contributed: totalContributed,
            interest: totalInterest,
            total: currentValue,
            withdrawal: totalWithdrawals,
            grossInterest: totalGrossInterest,
            yearLabel: `Año ${year}`
        });
    }

    return data;
}

export function calculateTimeToGoal(
    initial: number,
    monthly: number,
    monthlyRate: number,
    goal: number
): number {
    let currentValue = initial;
    let months = 0;
    const maxMonths = 100 * 12;

    while (currentValue < goal && months < maxMonths) {
        currentValue += monthly;
        currentValue *= (1 + monthlyRate);
        months++;
    }

    return months / 12;
}

export function calculateRequiredMonthly(
    initial: number,
    monthlyRate: number,
    years: number,
    goal: number
): number {
    const totalMonths = years * 12;
    const growthFactor = Math.pow(1 + monthlyRate, totalMonths);
    const futureValueOfInitial = initial * growthFactor;
    const annuityFactor = monthlyRate === 0
        ? totalMonths
        : (growthFactor - 1) / monthlyRate;

    return (goal - futureValueOfInitial) / annuityFactor;
}
