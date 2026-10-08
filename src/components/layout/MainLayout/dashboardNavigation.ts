import type { Dispatch, SetStateAction } from 'react';
import type { AssetsTableViewState } from '../../dashboard/AssetsTable';
import type { TimePeriod } from '../../../types/types';

// Kept in the layout for this navigation only; never persisted with portfolio data.
export interface DashboardReturnSnapshot {
    key: string;
    scrollX: number;
    scrollY: number;
    period: TimePeriod;
    table?: AssetsTableViewState;
}

export interface DashboardNavigationContext {
    dashboardReturn: DashboardReturnSnapshot | null;
    setDashboardReturn: Dispatch<SetStateAction<DashboardReturnSnapshot | null>>;
}
