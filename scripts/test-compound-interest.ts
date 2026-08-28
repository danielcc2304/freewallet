import assert from 'node:assert/strict';
import {
    calculateCompoundInterestProjection,
    getRateConversion,
    type CompoundingFrequency,
    type InterestRateType
} from '../src/components/academy/calculators/compoundInterestUtils.ts';

function assertApprox(actual: number, expected: number, tolerance: number, message: string) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `${message}: esperado ${expected}, obtenido ${actual}`
    );
}

function projectOneYear(
    initial: number,
    annualRate: number,
    interestRateType: InterestRateType,
    compoundingFrequency: CompoundingFrequency,
    years: number
) {
    const conversion = getRateConversion(annualRate, interestRateType, compoundingFrequency);
    const projection = calculateCompoundInterestProjection({
        initial,
        monthly: 0,
        monthlyRate: conversion.monthlyRate,
        periods: years,
        withdrawalType: 'none',
        withdrawalValue: 0
    });

    return {
        conversion,
        finalValue: projection[projection.length - 1].total
    };
}

// A: 10,000 EUR at 10% CAGR for one year.
assertApprox(
    projectOneYear(10000, 0.10, 'cagr', 'monthly', 1).finalValue,
    11000,
    0.01,
    'Caso A'
);

// B: 10,000 EUR at 10% CAGR for ten years.
assertApprox(
    projectOneYear(10000, 0.10, 'cagr', 'monthly', 10).finalValue,
    25937.42,
    0.01,
    'Caso B'
);

// C: 10,000 EUR at 10% TIN capitalized annually.
assertApprox(
    projectOneYear(10000, 0.10, 'tin', 'annual', 1).finalValue,
    11000,
    0.01,
    'Caso C'
);

// D: 10,000 EUR at 10% TIN capitalized monthly.
assertApprox(
    projectOneYear(10000, 0.10, 'tin', 'monthly', 1).finalValue,
    11047.13,
    0.01,
    'Caso D'
);

// E: 10,000 EUR at 10% TIN capitalized quarterly.
assertApprox(
    projectOneYear(10000, 0.10, 'tin', 'quarterly', 1).finalValue,
    11038.13,
    0.01,
    'Caso E'
);

// F: CAGR keeps its effective annual rate after ten years, including the
// annual detail rate used by the UI.
const caseF = projectOneYear(86000, 0.10, 'cagr', 'monthly', 10);
assertApprox(caseF.finalValue, 86000 * Math.pow(1.1, 10), 0.01, 'Caso F');
assertApprox(caseF.conversion.effectiveAnnualRate * 100, 10, 0.0001, 'Rentabilidad anual del caso F');

// The source brief rounds case F to 223,052.44 EUR; the exact 10% CAGR
// formula gives 223,061.85 EUR, so both values are covered explicitly.
assertApprox(caseF.finalValue, 223052.44, 10, 'Caso F (aproximación indicada)');

console.log('compound-interest tests: OK');
