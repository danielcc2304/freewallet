/** Portfolio and workbook dates use the Europe/Madrid accounting calendar. */
const accountingFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' });
export function accountingDay(date: string | number): string {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsed = new Date(date);
    if (!Number.isFinite(parsed.getTime())) return '';
    return accountingFormatter.format(parsed);
}
