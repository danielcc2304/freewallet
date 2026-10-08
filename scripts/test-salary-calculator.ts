import assert from 'node:assert/strict';
import { calculateSalary, DEFAULT_SALARY_INPUT, personalFamilyMinimum, scaleTax, validateSalaryInput, workIncomeReduction } from '../src/services/irpf/salaryCalculator';
import { STATE_SCALE, TAX_REGIONS, WITHHOLDING_SCALE } from '../src/services/irpf/taxData2026';

const close = (actual: number, expected: number, tolerance = 0.011) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const base = structuredClone(DEFAULT_SALARY_INPUT);
// Independently calculated AEAT example: 30,000 - 1,950 SS - 2,000 expenses.
// Quota = 4,225.50 + (26,050 - 20,200)*30% - 5,550*19% = 4,926.
const regular = calculateSalary(base);
assert.equal(regular.socialSecurity, 1950);
assert.equal(regular.withholdingBase, 26050);
assert.equal(regular.withholdingRate, 16.42);
assert.equal(regular.withheldAnnual, 4926);
assert.equal(regular.netAnnual, 23124);
assert.equal(regular.twelve.net, 1927);
close(regular.stateQuota!, 2463);
close(regular.regionalQuota!, 1739.53 + (26050 - 19004.63) * .128 - 5956.65 * .085);
assert.equal(regular.finalTax, 4598.02);
assert.equal(regular.balance, -327.98);
close(regular.netAnnual, regular.fourteen.net * 12 + regular.extra.net * 2, .08);
assert.equal(regular.extra.socialSecurity, 0);
assert.equal(regular.fourteen.socialSecurity, regular.twelve.socialSecurity);
assert.equal(regular.netAnnual + regular.socialSecurity + regular.withheldAnnual, 30000);
assert.equal(regular.employerContributions, 9645);
assert.equal(regular.employerCost, 39645);
// AEAT's published scale example, not a copy of the implementation.
assert.equal(scaleTax(24000, WITHHOLDING_SCALE), 5365.5);
assert.equal(scaleTax(24000, STATE_SCALE), 2682.75);
assert.equal(workIncomeReduction(14852), 7302);
assert.equal(workIncomeReduction(17673.52), 2364.34);
assert.equal(workIncomeReduction(19747.5), 0);

for (const region of TAX_REGIONS.filter(r => !r.foral)) {
    const result = calculateSalary({ ...base, region: region.id });
    assert.equal(result.withholdingRate, regular.withholdingRate, 'Common-territory withholding must not change with residence');
    assert.ok(Number.isFinite(result.finalTax) && result.finalTax! >= 0);
    for (const [from, quota] of region.scale!) close(scaleTax(from, region.scale!), quota);
}
assert.notEqual(calculateSalary({ ...base, region: 'cataluna' }).finalTax, regular.finalTax);
assert.equal(TAX_REGIONS.find(r => r.id === 'valencia')!.scale![0][2], 8.8, '2026 scale, not 2025 or 2027');
assert.equal(TAX_REGIONS.find(r => r.id === 'extremadura')!.scale![0][2], 7.75);
assert.equal(calculateSalary({ ...base, grossAnnual: 17094 }).finalTax, 0, '2026 low-salary deduction covers SMI');
assert.equal(calculateSalary({ ...base, grossAnnual: 17094 }).lowSalaryDeduction, 590.89);
assert.equal(calculateSalary({ ...base, grossAnnual: 18000 }).lowSalaryDeduction, 409.69);
const zero = calculateSalary({ ...base, grossAnnual: 0 });
assert.equal(zero.netAnnual, 0); assert.equal(zero.finalTax, 0); assert.equal(zero.socialSecurity, 0); assert.equal(zero.withholdingRate, 0);

const children = [{ age: 5, disability: 'none' as const, share: .5, assistance: false }, { age: 1, disability: 'none' as const, share: 1, assistance: false }];
assert.equal(personalFamilyMinimum({ ...base, children }), 12250);
assert.equal(personalFamilyMinimum({ ...base, children: [...children].reverse() }), 12250, 'Ordinal is determined by age, not insertion order');
assert.equal(personalFamilyMinimum({ ...base, age: 75 }), 8100);
assert.equal(personalFamilyMinimum({ ...base, disability: '65' }), 17550);
assert.equal(personalFamilyMinimum({ ...base, ascendants: [{ age: 76, share: .5, disability: '65', assistance: true }] }), 12825);
const baleares = TAX_REGIONS.find(r => r.id === 'baleares')!.minimums!;
assert.equal(personalFamilyMinimum({ ...base, age: 66 }, baleares), 7370, 'Balearic elderly general minimum also increases');
assert.equal(personalFamilyMinimum(base, baleares), 5550);
const disabled = calculateSalary({ ...base, disability: '65' });
assert.equal(disabled.generalExpenses, 9750);
assert.ok(disabled.withholdingRate < regular.withholdingRate);
assert.ok(calculateSalary({ ...base, children }).withholdingRate < regular.withholdingRate);

const pension = calculateSalary({ ...base, personalPension: 5000, unionFees: 300, professionalFees: 1000, legalExpenses: 600 });
assert.equal(pension.pensionReduction, 1500); assert.equal(pension.annualOtherExpenses, 1100);
assert.equal(pension.withholdingRate, regular.withholdingRate, 'Declaration-only adjustments do not lower payroll withholding');
assert.ok(pension.finalTax! < regular.finalTax!); assert.ok(pension.warnings.length > 0);
const deductions = calculateSalary({ ...base, stateDeductions: 1e6, regionalDeductions: 1e6 });
assert.equal(deductions.finalTax, 0);
const manual = calculateSalary({ ...base, manualWithholding: 20 });
assert.equal(manual.withheldAnnual, 6000); assert.equal(manual.finalTax, regular.finalTax);
assert.equal(manual.netAnnual, 22050);
const housing = calculateSalary({ ...base, housingBefore2013: true });
assert.equal(housing.withholdingRate, 14.42); assert.equal(housing.finalTax, regular.finalTax);
assert.equal(calculateSalary({ ...base, grossAnnual: 33007.2, housingBefore2013: true }).withholdingRate, calculateSalary({ ...base, grossAnnual: 33007.2 }).withholdingRate);
const relief = calculateSalary({ ...base, region: 'ceuta', territorialRelief: true });
close(relief.finalTax!, calculateSalary({ ...base, region: 'ceuta' }).finalTax! * .4);
const high = calculateSalary({ ...base, grossAnnual: 120000 });
assert.equal(high.monthlyBase, 5101.2);
const monthlySolidarity = 510.12 * .0019 + 2040.48 * .0021 + (10000 - 7651.8) * .0024;
close(high.contributions.at(-1)!.monthly, monthlySolidarity);
assert.ok(high.contributions.at(-1)!.annual > 0);
assert.equal(calculateSalary({ ...base, grossAnnual: 5101.2 * 12 }).contributions.at(-1)!.annual, 0);
assert.equal(calculateSalary({ ...base, contract: 'temporary' }).contributions[1].rate, 1.6);
assert.equal(calculateSalary({ ...base, grossAnnual: 15000, contract: 'under-year' }).withholdingRate, 2);
const part = calculateSalary({ ...base, grossAnnual: 10000, workingTime: 50 });
close(part.monthlyBase, 10000 / 12);
const belowMinimum = calculateSalary({ ...base, grossAnnual: 10000 });
assert.equal(belowMinimum.monthlyBase, 1424.4); assert.ok(belowMinimum.warnings.length);
const alimony = calculateSalary({ ...base, childSupport: 3000 });
const splitQuota = scaleTax(26050 - 3000, WITHHOLDING_SCALE) + scaleTax(3000, WITHHOLDING_SCALE) - scaleTax(5550 + 1980, WITHHOLDING_SCALE);
assert.equal(alimony.withholdingRate, Math.floor(splitQuota / 30000 * 10000) / 100);
for (const region of TAX_REGIONS.filter(r => r.foral)) {
    assert.throws(() => calculateSalary({ ...base, region: region.id }), /territorio foral/);
    const result = calculateSalary({ ...base, region: region.id, manualWithholding: 15 });
    assert.equal(result.withholdingRate, 15); assert.equal(result.finalTax, null); assert.equal(result.calculatedWithholding, null);
}
for (const patch of [{ grossAnnual: NaN }, { grossAnnual: -1 }, { age: 30.5 }, { workingTime: 0 }, { manualWithholding: 101 }, { region: 'invalid' }, { contributionGroup: 8 }, { familySituation: '1' as const }, { children, childSupport: 1000 }]) {
    assert.ok(validateSalaryInput({ ...base, ...patch })); assert.throws(() => calculateSalary({ ...base, ...patch }));
}
// Monetary identities and finiteness across every supported community and salary range.
for (const region of TAX_REGIONS.filter(r => !r.foral)) for (const grossAnnual of [10000, 15876, 17094, 17673.52, 20048.45, 24000, 35200, 60000, 61214.4, 100000, 300000, 1000000]) {
    const r = calculateSalary({ ...base, region: region.id, grossAnnual });
    assert.ok(Number.isFinite(r.netAnnual) && Number.isFinite(r.finalTax) && Number.isFinite(r.employerCost));
    close(r.gross, r.netAnnual + r.socialSecurity + r.withheldAnnual);
    close(r.netAfterTax!, r.gross - r.socialSecurity - r.finalTax!);
    close(r.balance!, r.finalTax! - r.withheldAnnual);
    close(r.netAnnual, r.fourteen.net * 12 + r.extra.net * 2, .1);
}
console.log('PASS: AEAT scale and independently calculated payroll, 2026 regional quotas/minimums, SMI deduction, family shares, pensions, alimony, minimum/maximum SS bases, solidarity, 12/14 payslips, employer costs, foral safeguards and invalid inputs.');
