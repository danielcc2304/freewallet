import { useEffect, useState } from 'react';
import { portfolioStorage } from '../services/portfolioCloudStorage';
import { readDailyMarketData } from '../services/dailyMarketData';
import type { DailyMarketData } from '../services/dailyMarketData';

/** Owner and account generation gate both pending responses and rendered data. */
export function useDailyMarketData(revision: number | string | null) {
    const epoch = portfolioStorage.epoch;
    const owner = portfolioStorage.getSnapshot().userId;
    const [result, setResult] = useState<{ epoch: number; data: DailyMarketData | null; error: string }>({ epoch: -1, data: null, error: '' });
    useEffect(() => {
        if (!owner) return;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        void readDailyMarketData(controller.signal).then(data => {
            if (!controller.signal.aborted && portfolioStorage.epoch === epoch) setResult({ epoch, data, error: '' });
        }).catch(() => {
            if (portfolioStorage.epoch === epoch) setResult(previous => ({ epoch, data: previous.epoch === epoch ? previous.data : null, error: 'No se pudo consultar el histórico diario. Se conserva el último dato disponible.' }));
        }).finally(() => clearTimeout(timeout));
        return () => { controller.abort(); clearTimeout(timeout); };
    }, [epoch, owner, revision]);
    return result.epoch === epoch ? result : { epoch, data: null, error: '' };
}
