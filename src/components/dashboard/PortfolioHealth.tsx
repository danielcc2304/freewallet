import { Database, Layers3, ShieldCheck, Target } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui';
import type { Asset } from '../../types/types';
import './PortfolioHealth.css';

export function PortfolioHealth({ assets }: { assets: Asset[] }) {
    const totalValue = assets.reduce((sum, asset) => sum + (asset.currentPrice || asset.purchasePrice) * asset.quantity, 0);
    const values = assets.map((asset) => ({
        asset,
        value: (asset.currentPrice || asset.purchasePrice) * asset.quantity,
    })).sort((a, b) => b.value - a.value);
    const largest = values[0];
    const largestWeight = totalValue > 0 && largest ? largest.value / totalValue * 100 : 0;
    const updated = assets.filter((asset) => !!asset.lastQuoteAt).length;
    const dataCoverage = assets.length ? updated / assets.length * 100 : 0;
    const assetTypes = new Set(assets.map((asset) => asset.type)).size;
    const concentration = largestWeight > 35 ? 'Alta' : largestWeight > 20 ? 'Media' : 'Equilibrada';

    return (
        <Card className="portfolio-health">
            <CardHeader title="Control de cartera" subtitle="Concentración, diversificación y calidad de los datos" />
            <CardContent>
                <div className="portfolio-health__grid">
                    <div className="portfolio-health__item">
                        <Target size={18} />
                        <span>Mayor posición</span>
                        <strong>{largest?.asset.symbol || '—'} · {largestWeight.toFixed(1)}%</strong>
                        <small>Concentración {concentration.toLowerCase()}</small>
                    </div>
                    <div className="portfolio-health__item">
                        <Layers3 size={18} />
                        <span>Diversificación</span>
                        <strong>{assets.length} posiciones</strong>
                        <small>{assetTypes} tipos de activo</small>
                    </div>
                    <div className="portfolio-health__item">
                        <Database size={18} />
                        <span>Cobertura de precios</span>
                        <strong>{dataCoverage.toFixed(0)}%</strong>
                        <small>{updated} de {assets.length} actualizados</small>
                    </div>
                    <div className="portfolio-health__item">
                        <ShieldCheck size={18} />
                        <span>Estado</span>
                        <strong>{dataCoverage === 100 ? 'Al día' : 'Revisar datos'}</strong>
                        <small>{largestWeight > 35 ? 'Posición principal elevada' : 'Sin alertas de concentración'}</small>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
