import { Link } from 'react-router-dom';
import {
    Coins, ArrowLeft, Globe, CheckCircle2, AlertTriangle,
    Lightbulb, Shield, Database, Lock
} from 'lucide-react';
import './AssetPage.css';

const CRYPTO_CATEGORIES = [
    {
        title: 'Bitcoin (Reserva de Valor)',
        desc: 'El "Oro Digital". Suministro limitado a 21 millones. El activo más seguro dentro de la red descentralizada.',
        ticker: 'BTC',
        color: '#f59e0b'
    },
    {
        title: 'Contratos Inteligentes',
        desc: 'Plataformas programables donde se construyen aplicaciones descentralizadas (dApps) y finanzas (DeFi).',
        ticker: 'ETH, SOL, AVAX',
        color: '#6366f1'
    },
    {
        title: 'Stablecoins',
        desc: 'Activos vinculados al valor del dólar o euro. Utilizados para mantener liquidez dentro del ecosistema.',
        ticker: 'USDC, USDT',
        color: '#10b981'
    },
    {
        title: 'Web3 y Capa 2',
        desc: 'Proyectos que escalan las redes principales o proporcionan infraestructura descentralizada.',
        ticker: 'MATIC, LINK, DOT',
        color: '#8b5cf6'
    }
];

export function AssetCrypto() {
    return (
        <div className="asset-page">
            <Link to="/academy/portfolio" className="asset-page__back">
                <ArrowLeft size={18} /> Volver a Carteras
            </Link>

            <header className="asset-page__hero" style={{ '--hero-color': '#f59e0b' } as React.CSSProperties}>
                <div className="asset-page__hero-icon">
                    <Coins size={48} />
                </div>
                <h1>Criptoactivos</h1>
                <p className="asset-page__hero-sub">
                    La frontera tecnológica de las finanzas. Descubre el potencial de la descentralización
                    y cómo gestionar el activo más volátil que existe hoy en día.
                </p>
                <div className="asset-page__hero-stats">
                    <div className="hero-stat">
                        <span className="hero-stat__value">Impredecible</span>
                        <span className="hero-stat__label">Retorno esperado</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">50-80%</span>
                        <span className="hero-stat__label">Volatilidad anual</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">365 / 24 / 7</span>
                        <span className="hero-stat__label">Disponibilidad mercado</span>
                    </div>
                </div>
            </header>

            <section className="asset-page__section">
                <h2><Globe size={22} /> ¿Por qué invertir en Cripto?</h2>
                <div className="asset-page__text-block">
                    <p>
                        Invertir en criptoactivos no es solo comprar "monedas", es comprar <strong>opcionalidad sobre una nueva infraestructura tecnológica</strong>: la Blockchain.
                    </p>
                    <p>
                        Bitcoin, en particular, se ha comportado históricamente como un activo descorrelacionado, permitiendo mejorar el perfil de riesgo/recompensa de carteras tradicionales gracias a su escasez matemática programada.
                    </p>
                </div>

                <div className="asset-page__callout asset-page__callout--warning">
                    <AlertTriangle size={20} />
                    <div>
                        <strong>Advertencia de Volatilidad</strong>
                        <p>Las caídas de más del 80% han sucedido varias veces en la historia de Bitcoin. Invertir aquí requiere una tolerancia al riesgo extrema y un horizonte temporal largo.</p>
                    </div>
                </div>
            </section>

            <section className="asset-page__section">
                <h2><Database size={22} /> El Ecosistema Cripto</h2>
                <div className="asset-page__subtype-grid">
                    {CRYPTO_CATEGORIES.map((cat) => (
                        <div key={cat.title} className="subtype-card" style={{ '--subtype-color': cat.color } as React.CSSProperties}>
                            <div className="subtype-card__header">
                                <div className="subtype-card__dot" />
                                <h3>{cat.title}</h3>
                            </div>
                            <p className="subtype-card__desc">{cat.desc}</p>
                            <div className="subtype-card__footer">
                                <span>Principales: <strong>{cat.ticker}</strong></span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="asset-page__section">
                <h2><Lock size={22} /> Custodia: El Gran Diferenciador</h2>
                <div className="asset-page__text-block">
                    <p>
                        A diferencia de las acciones, donde siempre hay un custodio, en cripto tú puedes ser tu propio banco ("Self-Custody").
                    </p>
                </div>
                <div className="asset-page__steps">
                    <div className="step-card">
                        <div className="step-card__number">1</div>
                        <h4>Exchange (Custodiado)</h4>
                        <p>Plataformas como Coinbase o Kraken. Fácil de usar pero dependes de la empresa.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">2</div>
                        <h4>ETFs de Bitcoin Spot</h4>
                        <p>La opción más sencilla para el inversor tradicional. Compras Bitcoin en la bolsa regulada.</p>
                        <span className="step-card__badge step-card__badge--recommended">Recomendado</span>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">3</div>
                        <h4>Cold Wallet (Propia)</h4>
                        <p>Máxima seguridad. Tú controlas las llaves privadas. Ideal para el largo plazo.</p>
                    </div>
                </div>
            </section>

            <section className="asset-page__section">
                <h2><Shield size={22} /> Ventajas y Riesgos</h2>
                <div className="asset-page__pros-cons">
                    <div className="pc-column pc-column--pros">
                        <h3><CheckCircle2 size={18} /> Ventajas</h3>
                        <ul>
                            <li>Retorno asimétrico exponencial histórico</li>
                            <li>Suministro limitado (anti-inflación en BTC)</li>
                            <li>Mercado abierto 24/7 sin fronteras</li>
                            <li>Acceso directo sin intermediarios financieros</li>
                        </ul>
                    </div>
                    <div className="pc-column pc-column--cons">
                        <h3><AlertTriangle size={18} /> Riesgos</h3>
                        <ul>
                            <li>Volatilidad extrema e impredecible</li>
                            <li>Riesgo regulatorio por parte de gobiernos</li>
                            <li>Riesgo de pérdida permanente por errores de seguridad</li>
                            <li>Muchas altcoins son proyectos fallidos o estafas</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="asset-page__final-tip">
                <Lightbulb size={28} />
                <div>
                    <h3>Consejo Final</h3>
                    <p>
                        Si decides invertir en criptoactivos, hazlo con una posición pequeña (<strong>1-5% de tu cartera total</strong>).
                        Céntrate en proyectos con valor real comprobado como Bitcoin o Ethereum.
                        <strong> Si no puedes dormir con una caída del 50%, este activo no es para ti.</strong>
                    </p>
                </div>
            </section>
        </div>
    );
}
