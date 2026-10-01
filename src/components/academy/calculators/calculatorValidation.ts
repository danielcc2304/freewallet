export type NumericInput = number | string;
export function validateCalculatorInputs(fields: Array<{ label: string; value: NumericInput; min?: number; max?: number; integer?: boolean }>): string | null {
    for (const { label, value, min = 0, max = 1e12, integer } of fields) {
        const number = Number(value);
        if (String(value).trim() === '' || !Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) return `${label}: introduce un valor ${integer ? 'entero ' : ''}entre ${min} y ${max}.`;
    }
    return null;
}

/** Keep the original date anchor and the end-of-month convention. */
export function addMonthsClampedUtc(date: Date, months: number): Date {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    const sourceLast = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(date.getUTCDate() === sourceLast ? last : Math.min(date.getUTCDate(), last));
    return target;
}
