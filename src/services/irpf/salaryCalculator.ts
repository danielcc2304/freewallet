import { SS_2026, STATE_MINIMUMS, STATE_SCALE, TAX_REGIONS, WITHHOLDING_SCALE, type Minimums, type TaxScale } from './taxData2026';

export type Disability = 'none' | '33' | '65';
export interface Dependent { age: number; disability: Disability; assistance: boolean; share: number; adoptedUnder3?: boolean }
export interface SalaryInput {
    grossAnnual: number;
    region: string;
    age: number;
    contract: 'permanent' | 'temporary' | 'under-year';
    contributionGroup: number;
    workingTime: number;
    familySituation: '1' | '2' | '3';
    disability: Disability;
    assistance: boolean;
    children: Dependent[];
    ascendants: Dependent[];
    geographicMobility: boolean;
    spousePension: number;
    childSupport: number;
    personalPension: number;
    unionFees: number;
    professionalFees: number;
    legalExpenses: number;
    stateDeductions: number;
    regionalDeductions: number;
    housingBefore2013: boolean;
    territorialRelief: boolean;
    manualWithholding: number | null;
    employerAccidentRate: number;
}
export const DEFAULT_SALARY_INPUT: SalaryInput = {
    grossAnnual: 30000, region: 'madrid', age: 30, contract: 'permanent', contributionGroup: 7, workingTime: 100,
    familySituation: '3', disability: 'none', assistance: false, children: [], ascendants: [], geographicMobility: false,
    spousePension: 0, childSupport: 0, personalPension: 0, unionFees: 0, professionalFees: 0, legalExpenses: 0,
    stateDeductions: 0, regionalDeductions: 0, housingBefore2013: false, territorialRelief: false,
    manualWithholding: null, employerAccidentRate: 1.5,
};
export const euros = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const truncatePercent = (n: number) => Math.floor((n + 1e-10) * 100) / 100;
const nonnegative = (n: number) => Math.max(0, n);

export function validateSalaryInput(input: SalaryInput): string | null {
    const ranges: Array<[string, number, number, number]> = [
        ['Sueldo bruto anual', input.grossAnnual, 0, 10000000], ['Edad', input.age, 16, 100],
        ['Jornada', input.workingTime, 1, 100], ['Grupo de cotización', input.contributionGroup, 1, 7],
        ['Tipo de accidentes de trabajo', input.employerAccidentRate, 0, 10],
        ['Pensión compensatoria', input.spousePension, 0, 10000000], ['Anualidades por alimentos', input.childSupport, 0, 10000000],
        ['Plan de pensiones', input.personalPension, 0, 10000000], ['Cuotas sindicales', input.unionFees, 0, 10000000],
        ['Colegiación obligatoria', input.professionalFees, 0, 10000000], ['Defensa jurídica', input.legalExpenses, 0, 10000000],
        ['Deducciones estatales', input.stateDeductions, 0, 10000000], ['Deducciones autonómicas', input.regionalDeductions, 0, 10000000],
    ];
    for (const [label, value, min, max] of ranges) if (!Number.isFinite(value) || value < min || value > max) return `${label}: introduce un valor entre ${min} y ${max}.`;
    if (!Number.isInteger(input.age) || !Number.isInteger(input.contributionGroup)) return 'La edad y el grupo de cotización deben ser enteros.';
    if (!TAX_REGIONS.some(r => r.id === input.region) || !['permanent', 'temporary', 'under-year'].includes(input.contract)
        || !['1', '2', '3'].includes(input.familySituation) || !['none', '33', '65'].includes(input.disability)) return 'Revisa la comunidad, el contrato y la situación personal.';
    if (input.manualWithholding !== null && (!Number.isFinite(input.manualWithholding) || input.manualWithholding < 0 || input.manualWithholding > 100)) return 'La retención de tu nómina debe estar entre el 0 % y el 100 %.';
    if (input.children.length > 16 || input.ascendants.length > 6) return 'Se admiten hasta 16 descendientes y 6 ascendientes.';
    for (const person of [...input.children, ...input.ascendants]) {
        if (!Number.isInteger(person.age) || person.age < 0 || person.age > 120 || !['none', '33', '65'].includes(person.disability)
            || !Number.isFinite(person.share) || person.share <= 0 || person.share > 1) return 'Revisa la edad, discapacidad y reparto de los familiares.';
    }
    if (input.children.some(p => p.age >= 25 && p.disability === 'none')) return 'Los descendientes de 25 años o más necesitan discapacidad reconocida para este mínimo.';
    if (input.ascendants.some(p => p.age < 65 && p.disability === 'none')) return 'Los ascendientes menores de 65 años necesitan discapacidad reconocida para este mínimo.';
    if (input.familySituation === '1' && !input.children.some(p => p.age < 18 && p.share === 1)) return 'La situación 1 requiere al menos un hijo menor de edad que conviva exclusivamente contigo.';
    if (input.childSupport > 0 && input.children.length > 0) return 'Las anualidades por alimentos no se pueden combinar aquí con el mínimo por descendientes. Consulta el cálculo oficial si tienes ambos supuestos con distintos hijos.';
    if (input.territorialRelief && !['ceuta', 'melilla', 'canarias'].includes(input.region)) return 'La reducción territorial requiere residencia y rentas con derecho a ella en Ceuta, Melilla o La Palma.';
    return null;
}

export function scaleTax(base: number, scale: TaxScale): number {
    if (base <= 0) return 0;
    const bracket = [...scale].reverse().find(([from]) => base >= from)!;
    return bracket[1] + (base - bracket[0]) * bracket[2] / 100;
}
export function workIncomeReduction(netBeforeGeneralExpenses: number): number {
    const net = nonnegative(netBeforeGeneralExpenses);
    return euros(nonnegative(net <= 14852 ? 7302 : net <= 17673.52 ? 7302 - 1.75 * (net - 14852)
        : net < 19747.5 ? 2364.34 - 1.14 * (net - 17673.52) : 0));
}
export function personalFamilyMinimum(input: SalaryInput, amounts: Minimums = STATE_MINIMUMS): number {
    const disabilityMinimum = (person: Pick<Dependent, 'disability' | 'assistance'>, child = false) => {
        const normal = child ? amounts.childDisability ?? amounts.disability : amounts.disability;
        const severe = child ? amounts.childSevereDisability ?? amounts.severeDisability : amounts.severeDisability;
        return person.disability === 'none' ? 0 : (person.disability === '65' ? severe : normal)
            + (person.disability === '65' || person.assistance ? amounts.assistance : 0);
    };
    let result = (input.age >= 65 ? amounts.personalOver65 ?? amounts.personal : amounts.personal)
        + (input.age >= 65 ? amounts.over65 : 0) + (input.age >= 75 ? amounts.over75 : 0) + disabilityMinimum(input);
    // Eldest first, as the AEAT algorithm; each child's share applies to their own ordinal.
    [...input.children].sort((a, b) => b.age - a.age).forEach((person, index) => {
        result += person.share * (amounts.children[Math.min(index, 3)]
            + (person.age < 3 || person.adoptedUnder3 ? amounts.under3 : 0) + disabilityMinimum(person, true));
    });
    for (const person of input.ascendants) result += person.share * (amounts.over65 + (person.age >= 75 ? amounts.over75 : 0) + disabilityMinimum(person));
    return euros(result);
}

export interface Contribution { name: string; rate: number | null; annual: number; monthly: number }
export interface Payslip { gross: number; irpf: number; socialSecurity: number; net: number }

export function calculateSalary(input: SalaryInput) {
    const error = validateSalaryInput(input);
    if (error) throw new Error(error);
    const region = TAX_REGIONS.find(r => r.id === input.region)!;
    if (region.foral && input.manualWithholding === null) throw new Error('En territorio foral, introduce el porcentaje de retención de tu nómina o del simulador de tu Hacienda.');
    const gross = input.grossAnnual;
    const monthlyGross = gross / 12;
    const minimumBase = SS_2026.minimumMonthlyBases[input.contributionGroup - 1] * input.workingTime / 100;
    const monthlyBase = gross === 0 ? 0 : Math.min(SS_2026.maximumMonthlyBase, Math.max(monthlyGross, minimumBase));
    const unemployment = input.contract === 'permanent' ? SS_2026.permanentUnemployment : SS_2026.temporaryUnemployment;
    const solidarity = nonnegative(Math.min(monthlyGross, SS_2026.maximumMonthlyBase * 1.1) - SS_2026.maximumMonthlyBase) * 0.0019
        + nonnegative(Math.min(monthlyGross, SS_2026.maximumMonthlyBase * 1.5) - SS_2026.maximumMonthlyBase * 1.1) * 0.0021
        + nonnegative(monthlyGross - SS_2026.maximumMonthlyBase * 1.5) * 0.0024;
    const contributions: Contribution[] = [
        ['Contingencias comunes', SS_2026.common], ['Desempleo', unemployment], ['Formación profesional', SS_2026.training], ['MEI', SS_2026.mei],
    ].map(([name, rate]) => { const monthly = euros(monthlyBase * Number(rate) / 100); return { name: String(name), rate: Number(rate), monthly, annual: euros(monthly * 12) }; });
    contributions.push({ name: 'Solidaridad', rate: null, monthly: euros(solidarity), annual: euros(euros(solidarity) * 12) });
    const socialSecurity = euros(contributions.reduce((sum, c) => sum + c.annual, 0));
    const netWork = nonnegative(gross - socialSecurity);
    const extraDisabilityExpense = input.disability === '65' || (input.disability === '33' && input.assistance) ? 7750 : input.disability === '33' ? 3500 : 0;
    const generalExpenses = Math.min(netWork, 2000 + (input.geographicMobility ? 2000 : 0) + extraDisabilityExpense);
    const workReduction = workIncomeReduction(netWork);
    const withholdingBase = nonnegative(netWork - generalExpenses - workReduction - input.spousePension - (input.children.length > 2 ? 600 : 0));
    const stateMinimum = personalFamilyMinimum(input);
    const charge = (base: number, minimum: number, scale: TaxScale) => {
        const split = input.childSupport > 0 && input.childSupport < base;
        return nonnegative((split ? scaleTax(base - input.childSupport, scale) + scaleTax(input.childSupport, scale) : scaleTax(base, scale))
            - scaleTax(minimum + (split ? 1980 : 0), scale));
    };
    const exemptThresholds = { '1': [0, 17644, 18694], '2': [17197, 18130, 19262], '3': [15876, 16342, 16867] };
    const exemptThreshold = exemptThresholds[input.familySituation][Math.min(input.children.length, 2)];
    let withholdingQuota = gross <= exemptThreshold ? 0 : charge(withholdingBase, stateMinimum, WITHHOLDING_SCALE);
    if (gross <= 35200) withholdingQuota = Math.min(withholdingQuota, nonnegative(gross - exemptThreshold) * 0.43);
    const relief = input.territorialRelief ? 0.4 : 1;
    const housingReduction = input.housingBefore2013 && gross < 33007.2 ? Math.floor(gross * 0.02 * 100) / 100 : 0;
    let calculatedWithholding = gross > 0 ? truncatePercent(nonnegative(withholdingQuota * relief - housingReduction) / gross * 100) : 0;
    if (input.contract === 'under-year' && gross > 0) calculatedWithholding = Math.max(calculatedWithholding, 2 * relief);
    const withholdingRate = input.manualWithholding ?? calculatedWithholding;
    const withheldAnnual = euros(gross * withholdingRate / 100);
    const netAnnual = euros(gross - socialSecurity - withheldAnnual);
    const slip = (grossPay: number, ss: number): Payslip => ({ gross: euros(grossPay), irpf: euros(grossPay * withholdingRate / 100), socialSecurity: euros(ss), net: euros(grossPay - grossPay * withholdingRate / 100 - ss) });
    const twelve = slip(gross / 12, socialSecurity / 12);
    const fourteen = slip(gross / 14, socialSecurity / 12);
    const extra = slip(gross / 14, 0);
    // Annual declaration: these expenses and personal pensions do not lower payroll withholding.
    const annualOtherExpenses = input.unionFees + Math.min(input.professionalFees, 500) + Math.min(input.legalExpenses, 300);
    const annualWorkNet = nonnegative(gross - socialSecurity - annualOtherExpenses);
    const annualGeneralExpenses = Math.min(annualWorkNet, 2000 + (input.geographicMobility ? 2000 : 0) + extraDisabilityExpense);
    const annualWorkReduction = workIncomeReduction(annualWorkNet);
    const annualIncome = nonnegative(annualWorkNet - annualGeneralExpenses - annualWorkReduction);
    const pensionReduction = Math.min(input.personalPension, 1500, nonnegative(annualWorkNet - annualGeneralExpenses) * 0.3, nonnegative(annualIncome - input.spousePension));
    const annualTaxBase = nonnegative(annualIncome - input.spousePension - pensionReduction);
    const regionalMinimum = personalFamilyMinimum(input, region.minimums ?? STATE_MINIMUMS);
    const stateQuota = euros(charge(annualTaxBase, stateMinimum, STATE_SCALE) * relief);
    const regionalQuota = region.scale ? euros(charge(annualTaxBase, regionalMinimum, region.scale) * relief) : null;
    const lowSalaryDeduction = gross === 0 ? 0 : euros(nonnegative(gross <= 17094 ? 590.89 : gross < 20048.45 ? 590.89 - 0.2 * (gross - 17094) : 0));
    const finalTax = regionalQuota === null ? null : euros(nonnegative(nonnegative(stateQuota - input.stateDeductions)
        + nonnegative(regionalQuota - input.regionalDeductions) - lowSalaryDeduction));
    const warnings: string[] = [];
    if (gross > 0 && monthlyGross < minimumBase) warnings.push('El bruto mensual queda por debajo de la base mínima del grupo. Se aplica esa base mínima; comprueba la jornada y el grupo de tu nómina.');
    if (input.manualWithholding !== null) warnings.push('El neto usa la retención que has indicado. La estimación de renta se calcula por separado.');
    if (input.personalPension > pensionReduction) warnings.push(`La reducción por plan individual se limita a ${pensionReduction.toFixed(2)} € según el límite de 1.500 €, el 30 % del rendimiento neto y la base disponible.`);
    if (input.professionalFees > 500 || input.legalExpenses > 300) warnings.push('Se aplican los límites de 500 € para colegiación obligatoria y 300 € para defensa jurídica laboral.');
    if (input.contract === 'under-year') warnings.push('Se aplica el mínimo de retención de contratos inferiores a un año. El reparto mensual sigue simulando un año completo con el bruto indicado.');
    if (region.foral) warnings.push('La declaración foral no se estima con las escalas de la AEAT. El neto y la Seguridad Social usan tu retención indicada.');
    const employerCommon = euros(monthlyBase * 0.236) * 12;
    const employerUnemployment = euros(monthlyBase * (input.contract === 'permanent' ? 0.055 : 0.067)) * 12;
    const employerSolidarity = nonnegative(Math.min(monthlyGross, SS_2026.maximumMonthlyBase * 1.1) - SS_2026.maximumMonthlyBase) * 0.0096
        + nonnegative(Math.min(monthlyGross, SS_2026.maximumMonthlyBase * 1.5) - SS_2026.maximumMonthlyBase * 1.1) * 0.0104
        + nonnegative(monthlyGross - SS_2026.maximumMonthlyBase * 1.5) * 0.0122;
    const employerContributions = euros(employerCommon + employerUnemployment + euros(monthlyBase * 0.006) * 12
        + euros(monthlyBase * 0.002) * 12 + euros(monthlyBase * 0.0075) * 12 + euros(monthlyBase * input.employerAccidentRate / 100) * 12 + euros(employerSolidarity) * 12);
    return { gross, socialSecurity, monthlyBase, minimumBase, contributions, calculatedWithholding: region.foral ? null : calculatedWithholding,
        withholdingRate, withholdingBase, withheldAnnual, netAnnual, twelve, fourteen, extra, stateMinimum, regionalMinimum,
        generalExpenses, workReduction, annualGeneralExpenses, annualWorkReduction, annualOtherExpenses, pensionReduction,
        annualTaxBase, stateQuota: region.foral ? null : stateQuota, regionalQuota, lowSalaryDeduction: region.foral ? null : lowSalaryDeduction,
        finalTax, balance: finalTax === null ? null : euros(finalTax - withheldAnnual),
        netAfterTax: finalTax === null ? null : euros(gross - socialSecurity - finalTax),
        marginalRate: region.scale ? ([...STATE_SCALE].reverse().find(([from]) => annualTaxBase >= from)![2] + [...region.scale].reverse().find(([from]) => annualTaxBase >= from)![2]) * relief : null,
        employerContributions, employerCost: euros(gross + employerContributions), warnings };
}
export type SalaryResult = ReturnType<typeof calculateSalary>;
