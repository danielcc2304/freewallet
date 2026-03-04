import { useState } from 'react';
import { TrendingDown, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { CRISIS_DATA } from '../../../data/academyData';
import type { CrisisData } from '../../../types/types';
import './CrisisSimulator.css';

type ScenarioType = 'panic' | 'hold' | 'dca';

export function CrisisSimulator() {
    const [selectedCrisis, setSelectedCrisis] = useState<number>(2008);
    const [capital, setCapital] = useState<number>(10000);
    const [monthlyDCA, setMonthlyDCA] = useState<number>(300);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);

    const crisis: CrisisData = CRISIS_DATA[selectedCrisis];

    const calculateScenarios = () => {
        const panicValue = capital * (1 + crisis.maxDrawdown / 100);
        const holdValue = capital; // Recovers to initial
        const dcaInvested = capital + (monthlyDCA * crisis.monthsDown);
        // Simplified DCA calculation - in reality would need historical data
        const dcaValue = dcaInvested * 1.15; // Approximate benefit of DCA during dip

        return {
            panic: {
                value: panicValue,
                loss: panicValue - capital,
                lossPercent: crisis.maxDrawdown
            },
            hold: {
                value: holdValue,
                gain: 0,
                gainPercent: 0
            },
            dca: {
                value: dcaValue,
                gain: dcaValue - dcaInvested,
                gainPercent: ((dcaValue - dcaInvested) / dcaInvested) * 100,
                totalInvested: dcaInvested
            }
        };
    };

    const scenarios = calculateScenarios();

    return (
        <div className="crisis">
            <header className="crisis__header">
                <h1 className="crisis__title">Simulador de Crisis Históricas</h1>
                <p className="crisis__description">
                    Aprende de las caídas pasadas. Observa qué habría pasado con tu dinero en las peores crisis del mercado.
                </p>
            </header>

            <div className="crisis__warning">
                <AlertTriangle size={20} />
                <div>
                    <strong>💡 En todas las crisis de los últimos 100 años, el mercado se ha recuperado.</strong>
                    <p>
                        ⚠️ Sin embargo: Que el mercado siempre se haya recuperado no garantiza que lo haga en tu horizonte temporal concreto.
                        <strong> Por eso el plazo importa más que el activo.</strong>
                    </p>
                    <p className="crisis__warning-highlight">
                        El mayor error es vender en el mínimo por pánico.
                    </p>
                </div>
            </div>

            {/* Crisis Selector */}
            <div className="crisis__selector">
                <h3>Selecciona una crisis:</h3>
                <div className="crisis__tabs">
                    {Object.values(CRISIS_DATA).map((c) => (
                        <button
                            key={c.year}
                            className={`crisis__tab ${selectedCrisis === c.year ? 'crisis__tab--active' : ''}`}
                            onClick={() => setSelectedCrisis(c.year)}
                        >
                            <span className="crisis__tab-year">{c.year}</span>
                            <span className="crisis__tab-name">{c.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Crisis Info */}
            <div className="crisis__info">
                <h2>{crisis.name}</h2>
                <p className="crisis__info-description">{crisis.description}</p>

                <div className="crisis__stats">
                    <div className="crisis__stat crisis__stat--negative">
                        <TrendingDown className="crisis__stat-icon" />
                        <div className="crisis__stat-content">
                            <div className="crisis__stat-label">Caída Máxima</div>
                            <div className="crisis__stat-value">{crisis.maxDrawdown}%</div>
                        </div>
                    </div>

                    <div className="crisis__stat">
                        <div className="crisis__stat-content">
                            <div className="crisis__stat-label">Duración Caída</div>
                            <div className="crisis__stat-value">{crisis.monthsDown} meses</div>
                        </div>
                    </div>

                    <div className="crisis__stat crisis__stat--positive">
                        <TrendingUp className="crisis__stat-icon" />
                        <div className="crisis__stat-content">
                            <div className="crisis__stat-label">Tiempo Recuperación</div>
                            <div className="crisis__stat-value">{crisis.monthsRecovery} meses</div>
                        </div>
                    </div>

                    {crisis.return5y !== undefined && (
                        <div className="crisis__stat crisis__stat--positive">
                            <div className="crisis__stat-content">
                                <div className="crisis__stat-label">Rentabilidad +5 años</div>
                                <div className="crisis__stat-value">+{crisis.return5y}%</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Simulator */}
            <div className="crisis__simulator">
                <h3>Simula tu inversión</h3>

                <div className="crisis__inputs">
                    <div className="crisis__input-group">
                        <label htmlFor="capital">Capital inicial invertido</label>
                        <div className="crisis__input-wrapper">
                            <DollarSign size={18} />
                            <input
                                id="capital"
                                type="number"
                                value={capital}
                                onChange={(e) => setCapital(Number(e.target.value))}
                                min="100"
                                step="100"
                            />
                            <span>€</span>
                        </div>
                    </div>

                    <div className="crisis__input-group">
                        <label htmlFor="dca">Aportación mensual (para escenario DCA)</label>
                        <div className="crisis__input-wrapper">
                            <DollarSign size={18} />
                            <input
                                id="dca"
                                type="number"
                                value={monthlyDCA}
                                onChange={(e) => setMonthlyDCA(Number(e.target.value))}
                                min="0"
                                step="50"
                            />
                            <span>€/mes</span>
                        </div>
                    </div>
                </div>

                {/* Scenarios */}
                <div className="crisis__scenarios">
                    <button
                        className={`crisis__scenario ${selectedScenario === 'panic' ? 'crisis__scenario--selected' : ''} crisis__scenario--panic`}
                        onClick={() => setSelectedScenario('panic')}
                    >
                        <div className="crisis__scenario-header">
                            <span className="crisis__scenario-icon">😱</span>
                            <h4>Escenario A: PÁNICO</h4>
                        </div>
                        <p className="crisis__scenario-description">Vendes en el mínimo de la crisis</p>
                        <div className="crisis__scenario-result">
                            <div className="crisis__scenario-value crisis__scenario-value--negative">
                                {scenarios.panic.value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                            </div>
                            <div className="crisis__scenario-change">
                                {scenarios.panic.loss.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                                ({scenarios.panic.lossPercent}%)
                            </div>
                        </div>
                    </button>

                    <button
                        className={`crisis__scenario ${selectedScenario === 'hold' ? 'crisis__scenario--selected' : ''} crisis__scenario--hold`}
                        onClick={() => setSelectedScenario('hold')}
                    >
                        <div className="crisis__scenario-header">
                            <span className="crisis__scenario-icon">💎</span>
                            <h4>Escenario B: AGUANTAR</h4>
                        </div>
                        <p className="crisis__scenario-description">Mantienes y esperas la recuperación</p>
                        <div className="crisis__scenario-result">
                            <div className="crisis__scenario-value">
                                {scenarios.hold.value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                            </div>
                            <div className="crisis__scenario-change">
                                Recuperas tu capital inicial en {crisis.monthsRecovery} meses
                            </div>
                        </div>
                    </button>

                    <button
                        className={`crisis__scenario ${selectedScenario === 'dca' ? 'crisis__scenario--selected' : ''} crisis__scenario--dca`}
                        onClick={() => setSelectedScenario('dca')}
                    >
                        <div className="crisis__scenario-header">
                            <span className="crisis__scenario-icon">📈</span>
                            <h4>Escenario C: DCA DURANTE CRISIS</h4>
                        </div>
                        <p className="crisis__scenario-description">Sigues invirtiendo {monthlyDCA}€/mes durante la caída</p>
                        <div className="crisis__scenario-result">
                            <div className="crisis__scenario-value crisis__scenario-value--positive">
                                {scenarios.dca.value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                            </div>
                            <div className="crisis__scenario-change">
                                +{scenarios.dca.gain.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                                ({scenarios.dca.gainPercent.toFixed(1)}%) sobre {scenarios.dca.totalInvested.toLocaleString('es-ES')}€ invertidos
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Comparison Table */}
            <div className="crisis__comparison">
                <h3>Comparativa de las 3 Crisis</h3>
                <div className="crisis__table-wrapper">
                    <table className="crisis__table">
                        <thead>
                            <tr>
                                <th>Crisis</th>
                                <th>Caída Máx.</th>
                                <th>Meses Caída</th>
                                <th>Meses Recup.</th>
                                <th>Rent. +5 años</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(CRISIS_DATA).map((c) => (
                                <tr key={c.year} className={c.year === selectedCrisis ? 'crisis__table-row--selected' : ''}>
                                    <td><strong>{c.year}</strong></td>
                                    <td className="crisis__table-negative">{c.maxDrawdown}%</td>
                                    <td>{c.monthsDown}</td>
                                    <td>{c.monthsRecovery}</td>
                                    <td className="crisis__table-positive">
                                        {c.return5y !== undefined ? `+${c.return5y}%` : 'N/D'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="crisis__next">
                <h3>Continúa aprendiendo</h3>
                <div className="crisis__next-links">
                    <a href="/academy/timeline" className="crisis__next-link">
                        🚀 Ver tu Journey
                    </a>
                    <a href="/academy/scenarios" className="crisis__next-link">
                        🎯 Escenarios Prácticos
                    </a>
                    <a href="/academy/errors" className="crisis__next-link">
                        💡 Errores Comunes
                    </a>
                </div>
            </div>
        </div>
    );
}
