import { ShieldCheck, Info } from 'lucide-react';
import type { Asset } from '../../types/types';
import { hasValidPrice } from '../../services/assetValuation';
import { portfolioQuoteStatus, quoteDateLabel } from '../../services/portfolioQuoteStatus';
import './PortfolioDataQuality.css';

export function PortfolioDataQuality({ assets, now, quoteFailures }: { assets: Asset[]; now: number; quoteFailures: number }) {
    const statuses = assets.map(asset => ({ asset, ...portfolioQuoteStatus(asset, now) }));
    const market = statuses.filter(s => s.asset.type !== 'cash');
    const pending = statuses.filter(s => s.blockers.length);
    const dates = market.filter(s => s.stalePrice || s.unknownPriceDate);
    const estimates = assets.filter(a => !hasValidPrice(a));
    const needsReview = new Set([...pending, ...dates].map(s => s.asset.id)).size;
    return <details className="portfolio-data-quality">
        <summary>
            {needsReview || estimates.length ? <Info size={18} /> : <ShieldCheck size={18} />}
            <span><strong>{needsReview || estimates.length ? 'Revisar datos de la cartera' : 'Datos de la cartera completos'}</strong>
                <small>{needsReview ? `${needsReview} ${needsReview === 1 ? 'posición pendiente' : 'posiciones pendientes'} de revisar` : `${market.length} posiciones de mercado verificadas`}{estimates.length ? ` · ${estimates.length} ${estimates.length === 1 ? 'valorada' : 'valoradas'} al coste` : ''}</small>
            </span>
            <span className="portfolio-data-quality__expand">Detalles</span>
        </summary>
        <div className="portfolio-data-quality__content">
            <p>{market.filter(s => s.recentlyChecked).length} de {market.length} posiciones consultadas recientemente{quoteFailures ? ` · ${quoteFailures} consultas fallidas; se reintentará automáticamente` : ''}. Consultar un activo no significa que su precio sea de hoy.</p>
            {!!estimates.length && <p>El valor de {estimates.length} posiciones se estima con su precio de compra. No es una cotización actual; su rentabilidad no está disponible.</p>}
            {!!pending.length && <section><h3>Valoración completa pendiente</h3><p>El histórico existente se conserva. Se registrará una valoración cuando todas las posiciones tengan datos válidos.</p><ul>{pending.map(s => <li key={s.asset.id}><strong>{s.asset.name}</strong>: {s.blockers.join(' · ')}</li>)}</ul></section>}
            {!!dates.length && <section><h3>Fechas de precios</h3><p>Se señalan precios con más de 7 días en fondos, 4 en acciones y ETF, o 2 en criptomonedas. Son márgenes orientativos, no un calendario bursátil.</p><ul>{dates.map(s => <li key={s.asset.id}><strong>{s.asset.name}</strong> · Precio: {quoteDateLabel(s.asset.quotedAt || s.asset.lastQuoteAt)} · Consulta: {quoteDateLabel(s.asset.lastCheckedAt)}</li>)}</ul></section>}
            {assets.some(a => a.type === 'cash') && <p>Con liquidez en cartera, las compras y ventas no identifican por sí solas aportaciones externas. Los intervalos con flujos ambiguos se muestran como N/D.</p>}
        </div>
    </details>;
}
