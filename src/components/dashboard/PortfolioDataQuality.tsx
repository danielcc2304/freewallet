import { Info } from 'lucide-react';
import type { Asset } from '../../types/types';
import { hasValidPrice } from '../../services/assetValuation';
import { portfolioQuoteStatus, quoteDateLabel } from '../../services/portfolioQuoteStatus';
import './PortfolioDataQuality.css';
import {DashboardInfo} from './DashboardInfo';

export function PortfolioDataQuality({ assets, now, quoteFailures }: { assets: Asset[]; now: number; quoteFailures: number }) {
    const statuses = assets.map(asset => ({ asset, ...portfolioQuoteStatus(asset, now) }));
    const market = statuses.filter(s => s.asset.type !== 'cash');
    const pending = statuses.filter(s => s.valuationBlockers.length);
    const dates = market.filter(s => s.stalePrice || s.unknownPriceDate || s.futurePrice);
    const estimates = assets.filter(a => !hasValidPrice(a));
    const needsReview = new Set([...pending, ...dates].map(s => s.asset.id)).size;
    if(!needsReview&&!estimates.length&&!quoteFailures)return null;
    return <aside className="portfolio-data-quality" aria-label="Estado de los datos">
        <Info size={18} aria-hidden="true" />
        <span className="portfolio-data-quality__label">{needsReview ? `${needsReview} ${needsReview===1?'posición pendiente':'posiciones pendientes'} de revisar` : estimates.length ? `${estimates.length} posiciones estimadas` : `${quoteFailures} consultas pendientes`}</span>
        <DashboardInfo title="Revisar datos de la cartera" label="Revisar">
        <div className="portfolio-data-quality__content">
            {!!quoteFailures && <p>{quoteFailures} consultas fallidas; se reintentará automáticamente.</p>}
            {!!estimates.length && <p>El valor de {estimates.length} posiciones se estima con su precio de compra. No es una cotización actual; su rentabilidad no está disponible.</p>}
            {!!pending.length && <section><h3>Valoración completa pendiente</h3><p>El histórico existente se conserva. Se registrará una valoración cuando todas las posiciones tengan datos válidos.</p><ul>{pending.map(s => <li key={s.asset.id}><strong>{s.asset.name}</strong>: {s.valuationBlockers.join(' · ')}</li>)}</ul></section>}
            {!!dates.length && <section><h3>Fechas de precios</h3><p>Se señalan precios con más de 7 días en fondos, 4 en acciones y ETF, o 2 en criptomonedas. Son márgenes orientativos, no un calendario bursátil.</p><ul>{dates.map(s => <li key={s.asset.id}><strong>{s.asset.name}</strong> · Precio: {quoteDateLabel(s.asset.quotedAt || s.asset.lastQuoteAt)} · Consulta: {quoteDateLabel(s.asset.lastCheckedAt)}</li>)}</ul></section>}
            {assets.some(a => a.type === 'cash') && <p>Con liquidez en cartera, las compras y ventas no identifican por sí solas aportaciones externas. Los intervalos con flujos ambiguos se muestran como N/D.</p>}
        </div>
        </DashboardInfo>
    </aside>;
}
