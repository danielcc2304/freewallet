import { DashboardMetric } from './ui/DashboardMetric';
import { AlertTriangle, CheckCircle2, Database, Layers3, ShieldCheck, Target } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui';
import type { Asset } from '../../types/types';
import { getHistory } from '../../services/storageService';
import './PortfolioHealth.css';

export function PortfolioHealth({ assets, now }: { assets: Asset[]; now: number }) {
    const quoteWindow = 15 * 60 * 1000;
    const totalValue = assets.reduce((sum, asset) => sum + (asset.currentPrice || asset.purchasePrice) * asset.quantity, 0);
    const values = assets.map((asset) => ({
        asset,
        value: (asset.currentPrice || asset.purchasePrice) * asset.quantity,
    })).sort((a, b) => b.value - a.value);
    const largest = values[0];
    const largestWeight = totalValue > 0 && largest ? largest.value / totalValue * 100 : 0;
    const updated = assets.filter((asset) => {
        if (!asset.lastQuoteAt) return false;
        const timestamp = new Date(asset.lastQuoteAt).getTime();
        return Number.isFinite(timestamp) && now - timestamp <= quoteWindow;
    }).length;
    const dataCoverage = assets.length ? updated / assets.length * 100 : 0;
    const assetTypes = new Set(assets.map((asset) => asset.type)).size;
    const concentration = largestWeight > 35 ? 'Alta' : largestWeight > 20 ? 'Media' : 'Equilibrada';
    const duplicates = assets.filter((asset, index) => assets.findIndex(other => other.symbol.toUpperCase() === asset.symbol.toUpperCase()) !== index);
    const invalid = assets.filter(asset => asset.quantity <= 0 || asset.purchasePrice <= 0);
    const stale = assets.filter(asset => !asset.lastQuoteAt || now - new Date(asset.lastQuoteAt).getTime() > 15 * 60 * 1000);
    const history = getHistory();
    const controls = [
        { label: 'Posiciones duplicadas', value: duplicates.length, ok: duplicates.length === 0 },
        { label: 'Cantidades o precios inválidos', value: invalid.length, ok: invalid.length === 0 },
        { label: 'Cotizaciones sin actualizar', value: stale.length, ok: stale.length === 0 },
        { label: 'Histórico de la cartera', value: history.length + ' registros', ok: history.length >= 2 },
        { label: 'Suma de pesos', value: totalValue > 0 ? '100,0%' : 'N/D', ok: totalValue > 0 },
        { label: 'Divisa normalizada', value: assets.every(asset => !asset.currency || asset.currency === 'EUR') ? 'EUR' : 'Revisar', ok: assets.every(asset => !asset.currency || asset.currency === 'EUR') },
    ];

    return (
        <Card className="portfolio-health">
            <CardHeader title="Control de cartera" subtitle="Concentración, diversificación y calidad de los datos" />
            <CardContent>
                <div className="portfolio-health__grid">
                    <DashboardMetric variant="health" className="portfolio-health__item" label="Mayor posición" value={<>{largest?.asset.symbol || '—'} · {largestWeight.toFixed(1)}%</>} icon={<Target size={18} />} detail={<>Concentración {concentration.toLowerCase()}</>} />
                    <DashboardMetric variant="health" className="portfolio-health__item" label="Diversificación" value={<>{assets.length} posiciones</>} icon={<Layers3 size={18} />} detail={<>{assetTypes} tipos de activo</>} />
                    <DashboardMetric variant="health" className="portfolio-health__item" label="Cobertura de precios" value={<>{dataCoverage.toFixed(0)}%</>} icon={<Database size={18} />} detail={<>{updated} de {assets.length} actualizados</>} />
                    <DashboardMetric variant="health" className="portfolio-health__item" label="Estado" value={<>{dataCoverage === 100 ? 'Al día' : 'Revisar datos'}</>} icon={<ShieldCheck size={18} />} detail={<>{largestWeight > 35 ? 'Posición principal elevada' : 'Sin alertas de concentración'}</>} />
                </div>
                <div className="portfolio-health__checks">
                    {controls.map(control => <div key={control.label} className={control.ok ? 'is-ok' : 'is-warning'}>
                        {control.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        <span>{control.label}</span><strong>{control.value}</strong>
                    </div>)}
                </div>
            </CardContent>
        </Card>
    );
}
