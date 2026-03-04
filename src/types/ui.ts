export interface PerformerData {
    id: string;
    symbol: string;
    name: string;
    change: number;
    changePercent: number;
    value: number;
}

export interface HeatmapItem {
    id: string;
    symbol: string;
    name: string;
    value: number;
    weight: number;
    change: number;
    changePercent: number;
    children?: HeatmapItem[];
}

export interface CompositionItem {
    id: string;
    symbol: string;
    name: string;
    value: number;
    percentage: number;
    color: string;
}
