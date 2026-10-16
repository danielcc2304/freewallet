/** Continuous relative score. Median = 50; distances, not ordinal ranks, matter.
 * MAD is converted to a robust sigma (normal consistency factor). A minimum
 * spread of 0.5 ratio units prevents tiny differences becoming huge grades.
 * At least two observations are required; two to four are marked provisional
 * by the caller. No rounding occurs until presentation.
 */
export function categoryScores(values: number[]): number[] | null {
    if (values.length < 2 || values.some(value => !Number.isFinite(value))) return null;
    const median = (items: number[]) => {
        const sorted = [...items].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : sorted[mid - 1] / 2 + sorted[mid] / 2;
    };
    const center = median(values);
    const deviations = values.map(value => Math.abs(value - center));
    const scale = Math.max(0.5, Math.min(Number.MAX_VALUE, 1.482602218505602 * median(deviations)));
    if (!Number.isFinite(scale)) return null;
    return values.map(value => 50 + 50 * Math.tanh((value - center) / scale / 2));
}
