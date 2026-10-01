import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { calculateCompoundInterestProjection as project, calculateRequiredMonthly as required, calculateTimeToGoal as time, getRateConversion } from '../src/components/academy/calculators/compoundInterestUtils';
import { addMonthsClampedUtc, validateCalculatorInputs } from '../src/components/academy/calculators/calculatorValidation';

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
for (const annual of [0, 0.07, 0.1, -0.1, 1e-10]) {
    const monthlyRate = getRateConversion(annual, 'cagr', 'monthly').monthlyRate;
    for (const years of [1, 10]) {
        const monthly = required(1000, monthlyRate, years, 100000);
        const final = project({ initial: 1000, monthly, monthlyRate, periods: years, withdrawalType: 'none', withdrawalValue: 0 }).at(-1)!;
        near(final.total, 100000);
    }
}
assert.ok(Number.isNaN(required(0, 0, 0, 1000)));
assert.equal(required(10000, 0.01, 1, 1000), 0);
assert.equal(time(100, 0, 0, 1000), Infinity);
assert.equal(time(1000, 0, 0, 1000), 0);
assert.equal(time(0, 100, 0, 120000), 100);
assert.equal(time(0, 100, 0, 120001), Infinity);
assert.ok(Number.isNaN(time(-1, 100, 0, 1000)));
for (const withdrawalType of ['fixed', 'percentage'] as const) {
    const final = project({ initial: 100, monthly: 0, monthlyRate: 0, periods: 2, withdrawalType, withdrawalValue: 200 }).at(-1)!;
    assert.equal(final.total, 0);
    assert.equal(final.withdrawal, 100);
}
assert.deepEqual(project({ initial: 0, monthly: 100, monthlyRate: 0, periods: Infinity, withdrawalType: 'none', withdrawalValue: 0 }), []);
assert.ok(validateCalculatorInputs([{ label: 'Retirada', value: '', min: .01, max: 100 }]));
assert.ok(validateCalculatorInputs([{ label: 'Retirada', value: 0, min: .01, max: 100 }]));
assert.ok(validateCalculatorInputs([{ label: 'Edad', value: 30.5, integer: true, max: 120 }]));
assert.equal(validateCalculatorInputs([{ label: 'Capital', value: 0 }]), null);
assert.equal(addMonthsClampedUtc(new Date('2024-01-31'), 1).toISOString().slice(0, 10), '2024-02-29');
assert.equal(addMonthsClampedUtc(new Date('2026-01-30'), 2).toISOString().slice(0, 10), '2026-03-30');

// Test the production non-React helpers without mounting components or making requests.
function helpers(name: string) {
    const file = new URL(`../src/components/academy/calculators/${name}.tsx`, import.meta.url);
    const source = ts.createSourceFile(file.pathname, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const functions = source.statements.filter(s => ts.isFunctionDeclaration(s) && /^[a-z]/.test(s.name?.text || '')).map(s => s.getText(source)).join('\n');
    const javascript = ts.transpileModule(functions, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
    const context = vm.createContext({ addMonthsClampedUtc, validateCalculatorInputs });
    vm.runInContext(javascript, context);
    return context;
}
const bond = helpers('BondCalculator');
const schedule: Date[] = bond.buildCouponSchedule(bond.parseIsoDate('2026-01-31'), bond.parseIsoDate('2027-01-31'), 12);
assert.equal(schedule.length, 12);
assert.equal(schedule[0].toISOString().slice(0, 10), '2026-02-28');
assert.equal(schedule[1].toISOString().slice(0, 10), '2026-03-31');
assert.equal(bond.parseIsoDate('2026-02-31'), null);
assert.ok(Number.isNaN(bond.solveBasicBond({ price: 0, couponRate: .05, yearsToMaturity: 1 }).ytm));
near(bond.solveBasicBond({ price: 100, couponRate: .05, yearsToMaturity: 1 }).ytm, .05);
const fire = helpers('FIRECalculator');
assert.ok(Number.isNaN(fire.calculateYearsToFire({ fireNumber: NaN, savings: 1000, monthlySavings: 100, inflationAnnualFactor: 1, nominalMonthlyRate: 0, adjustForInflation: false })));
assert.equal(fire.calculateYearsToFire({ fireNumber: 1200, savings: 0, monthlySavings: 100, inflationAnnualFactor: 1, nominalMonthlyRate: 0, adjustForInflation: false }), 1);
for (const name of ['CompoundInterestCalc', 'FIRECalculator', 'RetirementCalculator', 'InflationPredator', 'TaxSimulator', 'EmergencyFundCalculator']) {
    const source = readFileSync(new URL(`../src/components/academy/calculators/${name}.tsx`, import.meta.url), 'utf8');
    assert.match(source, /calculationError \? <p role="alert">/);
}
console.log('Calculator integrity passed: contribution inverse, unreachable goals, capped withdrawals, input boundaries, FIRE, bond month anchors and invalid dates.');
