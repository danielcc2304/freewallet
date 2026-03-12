import { useState } from 'react';
import { TrendingDown, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
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
        const holdValue = capital;
        const dcaInvested = capital + (monthlyDCA * crisis.monthsDown);
        const dcaValue = dcaInvested * 1.15;

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
                <h1 className="crisis__title">Simulador de crisis historicas</h1>
                <p className="crisis__description">
                    Aprende de las caidas pasadas. Observa que habria pasado con tu dinero en las peores crisis del mercado.
                </p>
            </header>

            <div className="crisis__warning">
                <AlertTriangle size={20} />
                <div>
                    <strong>En todas las crisis de los ultimos 100 anos, el mercado se ha recuperado.</strong>
                    <p>
                        Sin embargo, que el mercado siempre se haya recuperado no garantiza que lo haga en tu horizonte temporal concreto.
                        <strong> Por eso el plazo importa mas que el activo.</strong>
                    </p>
                    <p className="crisis__warning-highlight">
                        El mayor error es vender en el minimo por panico.
                    </p>
                </div>
            </div>

            <div className="crisis__selector">
                <h3>Selecciona una crisis:</h3>
                <div className="crisis__tabs">
                    {Object.values(CRISIS_DATA).map((item) => (
                        <button
                            key={item.year}
                            className={`crisis__tab ${selectedCrisis === item.year ? 'crisis__tab--active' : ''}`}
                            onClick={() => setSelectedCrisis(item.year)}
                        >
                            <span className="crisis__tab-year">{item.year}</span>
                            <span className="crisis__tab-name">{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="crisis__info">
                <h2>{crisis.name}</h2>
                <p className="crisis__info-description">{crisis.description}</p>

                <div className="crisis__stats">
                    <div className="crisis__stat crisis__stat--negative">
                        <TrendingDown className="crisis__stat-icon" />
                        <div className="crisis__stat-content">
                            <div className="crisis__stat-label">Caida maxima</div>
                            <div className="crisis__stat-value">{crisis.maxDrawdown}%</div>
                        </div>
                    </div>

                    <div className="crisis__stat">
                        <div className="crisis__stat-content">
                            <div className="crisis__stat-label">Duracion de la caida</div>
                            <div className="crisis__stat-value">{crisis.monthsDown} meses</div>
                        </div>
                    </div>

                    <div className="crisis__stat crisis__stat--positive">
                        <TrendingUp className="crisis__stat-icon" />
                        <div className="crisis__stat-content">
                            <div className="crisis__stat-label">Tiempo de recuperacion</div>
                            <div className="crisis__stat-value">{crisis.monthsRecovery} meses</div>
                        </div>
                    </div>

                    {crisis.return5y !== undefined && (
                        <div className="crisis__stat crisis__stat--positive">
                            <div className="crisis__stat-content">
                                <div className="crisis__stat-label">Rentabilidad a 5 anos</div>
                                <div className="crisis__stat-value">+{crisis.return5y}%</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="crisis__simulator">
                <h3>Simula tu inversion</h3>

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
                            <span>EUR</span>
                        </div>
                    </div>

                    <div className="crisis__input-group">
                        <label htmlFor="dca">Aportacion mensual para el escenario DCA</label>
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
                            <span>EUR/mes</span>
                        </div>
                    </div>
                </div>

                <div className="crisis__scenarios">
                    <button
                        className={`crisis__scenario ${selectedScenario === 'panic' ? 'crisis__scenario--selected' : ''} crisis__scenario--panic`}
                        onClick={() => setSelectedScenario('panic')}
                    >
                        <div className="crisis__scenario-header">
                            <span className="crisis__scenario-icon">A</span>
                            <h4>Escenario A: Panico</h4>
                        </div>
                        <p className="crisis__scenario-description">Vendes en el minimo de la crisis</p>
                        <div className="crisis__scenario-result">
                            <div className="crisis__scenario-value crisis__scenario-value--negative">
                                {scenarios.panic.value.toLocaleString('es-ES', { maximumFractionDigits: 0 })} EUR
                            </div>
                            <div className="crisis__scenario-change">
                                {scenarios.panic.loss.toLocaleString('es-ES', { maximumFractionDigits: 0 })} EUR
                                ({scenarios.panic.lossPercent}%)
                            </div>
                        </div>
                    </button>

                    <button
                        className={`crisis__scenario ${selectedScenario === 'hold' ? 'crisis__scenario--selected' : ''} crisis__scenario--hold`}
                        onClick={() => setSelectedScenario('hold')}
                    >
                        <div className="crisis__scenario-header">
                            <span className="crisis__scenario-icon">B</span>
                            <h4>Escenario B: Aguantar</h4>
                        </div>
                        <p className="crisis__scenario-description">Mantienes y esperas la recuperacion</p>
                        <div className="crisis__scenario-result">
                            <div className="crisis__scenario-value">
                                {scenarios.hold.value.toLocaleString('es-ES', { maximumFractionDigits: 0 })} EUR
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
                            <span className="crisis__scenario-icon">C</span>
                            <h4>Escenario C: DCA durante la crisis</h4>
                        </div>
                        <p className="crisis__scenario-description">Sigues invirtiendo {monthlyDCA} EUR al mes durante la caida</p>
                        <div className="crisis__scenario-result">
                            <div className="crisis__scenario-value crisis__scenario-value--positive">
                                {scenarios.dca.value.toLocaleString('es-ES', { maximumFractionDigits: 0 })} EUR
                            </div>
                            <div className="crisis__scenario-change">
                                +{scenarios.dca.gain.toLocaleString('es-ES', { maximumFractionDigits: 0 })} EUR
                                ({scenarios.dca.gainPercent.toFixed(1)}%) sobre {scenarios.dca.totalInvested.toLocaleString('es-ES')} EUR invertidos
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="crisis__comparison">
                <h3>Comparativa de las crisis</h3>
                <div className="crisis__table-wrapper">
                    <table className="crisis__table">
                        <thead>
                            <tr>
                                <th>Crisis</th>
                                <th>Caida max.</th>
                                <th>Meses de caida</th>
                                <th>Meses de recuperacion</th>
                                <th>Rent. +5 anos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(CRISIS_DATA).map((item) => (
                                <tr key={item.year} className={item.year === selectedCrisis ? 'crisis__table-row--selected' : ''}>
                                    <td><strong>{item.year}</strong></td>
                                    <td className="crisis__table-negative">{item.maxDrawdown}%</td>
                                    <td>{item.monthsDown}</td>
                                    <td>{item.monthsRecovery}</td>
                                    <td className="crisis__table-positive">
                                        {item.return5y !== undefined ? `+${item.return5y}%` : 'N/D'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="crisis__next">
                <h3>Si vienes de una crisis, sigue por aqui</h3>
                <p className="crisis__next-copy">Pasa del impacto emocional a la construccion de un plan mas robusto para la siguiente caida.</p>
                <div className="crisis__next-links">
                    <Link to="/academy/timeline" className="crisis__next-link">
                        <strong>Tu recorrido</strong>
                        <span>Para entender en que fase suele aparecer el panico y como evitarlo.</span>
                    </Link>
                    <Link to="/academy/scenarios" className="crisis__next-link">
                        <strong>Qué hacer si...</strong>
                        <span>Para ensayar decisiones concretas cuando el mercado se complica.</span>
                    </Link>
                    <Link to="/academy/errors" className="crisis__next-link">
                        <strong>Errores comunes</strong>
                        <span>Para identificar sesgos y fallos repetidos en momentos de estres.</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
