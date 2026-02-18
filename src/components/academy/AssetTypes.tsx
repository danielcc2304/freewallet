import { TrendingUp, ShieldCheck, Building2, Coins, Wallet, Landmark, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ASSET_CLASSES_DETAIL } from '../../data/academyData';
import './AssetTypes.css';

const IconMap: Record<string, any> = {
    acciones: TrendingUp,
    bonos: ShieldCheck,
    reits: Building2,
    cash: Wallet,
    crypto: Coins,
    oro: Landmark
};

export function AssetTypes() {
    return (
        <div className="asset-types-page">
            <header className="asset-types-page__header">
                <h1 className="asset-types-page__title">Explorando los Activos</h1>
                <p className="asset-types-page__subtitle">
                    Cada clase de activo tiene una personalidad única. Entender cómo se comportan es vital para construir una cartera que sobreviva a cualquier clima económico.
                </p>
            </header>

            <div className="asset-types-grid">
                {ASSET_CLASSES_DETAIL.map((asset) => {
                    const Icon = IconMap[asset.id] || Info;
                    return (
                        <article key={asset.id} className="asset-detail-card">
                            <div className="asset-detail-card__main">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <Icon size={40} className="icon" style={{ color: 'var(--accent-primary)' }} />
                                    <h2>{asset.title}</h2>
                                </div>
                                <p className="asset-detail-card__desc">{asset.description}</p>

                                <div className="asset-stats">
                                    <div className="stat-item">
                                        <span className="label">Riesgo</span>
                                        <span className={`value risk-${asset.risk?.toLowerCase().split(' ')[0]}`}>
                                            {asset.risk}
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="label">Retorno Esperado</span>
                                        <span className="value">{asset.return}</span>
                                    </div>
                                </div>

                                <div className="asset-instruments">
                                    <h4>Instrumentos Comunes</h4>
                                    <div className="instruments-tags">
                                        {asset.instruments.map(tag => (
                                            <span key={tag} className="instr-tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="asset-detail-card__side">
                                <div className="asset-pros">
                                    <h3><CheckCircle2 size={18} /> Ventajas</h3>
                                    <ul>
                                        {asset.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                                    </ul>
                                </div>
                                <div className="asset-cons">
                                    <h3><AlertTriangle size={18} /> Desventajas / Riesgos</h3>
                                    <ul>
                                        {asset.cons.map((con, i) => <li key={i}>{con}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            <section className="asset-types-footer-cta">
                <h2>¿Cómo combinarlos?</h2>
                <p>
                    Ahora que conoces las piezas del tablero, el siguiente paso es aprender a combinarlas según tu perfil de riesgo y objetivos.
                </p>
                <div className="cta-container">
                    <a href="/academy/portfolio" className="cta-button">
                        Construir mi Cartera
                    </a>
                </div>
            </section>
        </div>
    );
}
