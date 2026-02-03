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
                                        <span className={`value risk-${asset.risk.toLowerCase().split(' ')[0]}`}>
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

            <section style={{ marginTop: '5rem', background: 'var(--bg-tertiary)', padding: '3rem', borderRadius: '24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>¿Cómo combinarlos?</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
                    Ahora que conoces las piezas del tablero, el siguiente paso es aprender a combinarlas según tu perfil de riesgo y objetivos.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <a href="/academy/portfolio" style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.85rem 2rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>
                        Construir mi Cartera
                    </a>
                </div>
            </section>
        </div>
    );
}
