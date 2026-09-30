export const chartColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'];

export function getColorForIndex(index: number): string {
    return chartColors[index % chartColors.length];
}
