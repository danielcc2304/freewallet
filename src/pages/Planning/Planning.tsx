import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Eye, PlusCircle, Target, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, Input } from '../../components/ui';
import { usePortfolio } from '../../context/PortfolioContext';
import { addGoal, addWatchlistItem, deleteGoal, deleteWatchlistItem, generateId, getGoals, getWatchlist } from '../../services/storageService';
import type { AssetType, PortfolioGoal, PortfolioGoalCategory, WatchlistItem } from '../../types/types';
import './Planning.css';

type GoalFormState = {
    title: string;
    category: PortfolioGoalCategory;
    targetAmount: string;
    currentAmount: string;
    targetDate: string;
    notes: string;
};

type WatchlistFormState = {
    symbol: string;
    name: string;
    assetType: AssetType;
    targetPrice: string;
    notes: string;
};

const GOAL_CATEGORY_LABELS: Record<PortfolioGoalCategory, string> = {
    retirement: 'Jubilacion',
    home: 'Vivienda',
    emergency: 'Colchon',
    education: 'Educacion',
    other: 'Otro',
};

function formatCurrency(value: number): string {
    return value.toLocaleString('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

function monthsUntil(date?: string): number | null {
    if (!date) return null;
    const today = new Date();
    const targetDate = new Date(date);
    const months = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
    return Math.max(months, 0);
}

export function Planning() {
    const { state } = usePortfolio();
    const [goals, setGoals] = useState<PortfolioGoal[]>(() => getGoals());
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => getWatchlist());
    const [goalForm, setGoalForm] = useState<GoalFormState>({
        title: '',
        category: 'other',
        targetAmount: '',
        currentAmount: '',
        targetDate: '',
        notes: '',
    });
    const [watchlistForm, setWatchlistForm] = useState<WatchlistFormState>({
        symbol: '',
        name: '',
        assetType: 'stock',
        targetPrice: '',
        notes: '',
    });

    const totalInvested = useMemo(
        () => state.assets.reduce((sum, asset) => sum + (asset.purchasePrice * asset.quantity), 0),
        [state.assets]
    );

    const portfolioChecks = useMemo(() => {
        const checks: Array<{ severity: 'good' | 'warn'; title: string; description: string }> = [];
        const total = totalInvested;
        const sortedByWeight = [...state.assets]
            .map((asset) => ({
                ...asset,
                investedValue: asset.purchasePrice * asset.quantity,
                weight: total > 0 ? ((asset.purchasePrice * asset.quantity) / total) * 100 : 0,
            }))
            .sort((a, b) => b.weight - a.weight);

        const topPosition = sortedByWeight[0];
        if (topPosition && topPosition.weight > 35) {
            checks.push({
                severity: 'warn',
                title: 'Concentracion elevada',
                description: `${topPosition.symbol} pesa ${topPosition.weight.toFixed(1)}% del capital invertido.`,
            });
        } else {
            checks.push({
                severity: 'good',
                title: 'Concentracion principal razonable',
                description: topPosition ? `La mayor posicion es ${topPosition.symbol} con ${topPosition.weight.toFixed(1)}%.` : 'Aun no hay posiciones cargadas.',
            });
        }

        const singleNames = state.assets.filter((asset) => asset.type === 'stock').length;
        if (singleNames > 8) {
            checks.push({
                severity: 'warn',
                title: 'Muchas acciones individuales',
                description: `Tienes ${singleNames} acciones individuales. Revisa si la cartera se esta volviendo dificil de seguir.`,
            });
        }

        const missingPrices = state.assets.filter((asset) => !asset.currentPrice).length;
        if (missingPrices > 0) {
            checks.push({
                severity: 'warn',
                title: 'Precios sin actualizar',
                description: `${missingPrices} posiciones siguen sin precio actual. Mientras las APIs esten pausadas, el coste sera tu referencia.`,
            });
        } else {
            checks.push({
                severity: 'good',
                title: 'Precios disponibles',
                description: 'Todas las posiciones tienen al menos un precio de referencia guardado.',
            });
        }

        if (state.assets.length > 0 && state.assets.length < 3) {
            checks.push({
                severity: 'warn',
                title: 'Cartera poco diversificada',
                description: `Solo hay ${state.assets.length} posiciones registradas. Revisa si eso encaja con tu plan.`,
            });
        }

        return checks;
    }, [state.assets, totalInvested]);

    const handleGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!goalForm.title.trim() || !goalForm.targetAmount.trim()) {
            return;
        }

        const goal: PortfolioGoal = {
            id: generateId(),
            title: goalForm.title.trim(),
            category: goalForm.category,
            targetAmount: Number(goalForm.targetAmount),
            currentAmount: Number(goalForm.currentAmount || 0),
            targetDate: goalForm.targetDate || undefined,
            notes: goalForm.notes.trim() || undefined,
            createdAt: new Date().toISOString(),
        };

        addGoal(goal);
        setGoals((current) => [goal, ...current]);
        setGoalForm({
            title: '',
            category: 'other',
            targetAmount: '',
            currentAmount: '',
            targetDate: '',
            notes: '',
        });
    };

    const handleWatchlistSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!watchlistForm.symbol.trim() || !watchlistForm.name.trim()) {
            return;
        }

        const item: WatchlistItem = {
            id: generateId(),
            symbol: watchlistForm.symbol.trim().toUpperCase(),
            name: watchlistForm.name.trim(),
            assetType: watchlistForm.assetType,
            targetPrice: watchlistForm.targetPrice ? Number(watchlistForm.targetPrice) : undefined,
            notes: watchlistForm.notes.trim() || undefined,
            createdAt: new Date().toISOString(),
        };

        addWatchlistItem(item);
        setWatchlist((current) => [item, ...current]);
        setWatchlistForm({
            symbol: '',
            name: '',
            assetType: 'stock',
            targetPrice: '',
            notes: '',
        });
    };

    return (
        <div className="planning-page">
            <div className="planning-page__header">
                <div>
                    <h1 className="planning-page__title">Planificacion</h1>
                    <p className="planning-page__subtitle">
                        Objetivos, control de cartera y watchlist manual en una vista separada del dashboard.
                    </p>
                </div>
                <Link to="/add">
                    <Button icon={<PlusCircle size={16} />}>Añadir inversión</Button>
                </Link>
            </div>

            <section className="planning-page__grid">
                <Card>
                    <CardHeader
                        title="Checks de control"
                        subtitle="Reglas simples para vigilar concentracion y cobertura"
                    />
                    <CardContent className="planning-page__checks">
                        {portfolioChecks.map((check) => (
                            <div key={check.title} className={`planning-check planning-check--${check.severity}`}>
                                <div className="planning-check__icon">
                                    {check.severity === 'good' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                                </div>
                                <div>
                                    <strong>{check.title}</strong>
                                    <p>{check.description}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader
                        title="Resumen"
                        subtitle="Contexto rapido para decidir siguientes pasos"
                    />
                    <CardContent className="planning-page__summary">
                        <div className="planning-stat">
                            <span>Capital invertido</span>
                            <strong>{formatCurrency(totalInvested)}</strong>
                        </div>
                        <div className="planning-stat">
                            <span>Posiciones</span>
                            <strong>{state.assets.length}</strong>
                        </div>
                        <div className="planning-stat">
                            <span>Objetivos activos</span>
                            <strong>{goals.length}</strong>
                        </div>
                        <div className="planning-stat">
                            <span>Watchlist</span>
                            <strong>{watchlist.length}</strong>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="planning-page__split">
                <Card>
                    <CardHeader
                        title="Objetivos"
                        subtitle="Guarda metas de capital sin depender de una calculadora"
                    />
                    <CardContent className="planning-section">
                        <form className="planning-form" onSubmit={handleGoalSubmit}>
                            <Input
                                value={goalForm.title}
                                onChange={(e) => setGoalForm((current) => ({ ...current, title: e.target.value }))}
                                placeholder="Ej. Entrada vivienda, FIRE parcial..."
                            />
                            <div className="planning-form__row">
                                <select
                                    className="planning-select"
                                    value={goalForm.category}
                                    onChange={(e) => setGoalForm((current) => ({ ...current, category: e.target.value as PortfolioGoalCategory }))}
                                >
                                    {Object.entries(GOAL_CATEGORY_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                                <Input
                                    type="number"
                                    value={goalForm.targetAmount}
                                    onChange={(e) => setGoalForm((current) => ({ ...current, targetAmount: e.target.value }))}
                                    placeholder="Capital objetivo"
                                />
                            </div>
                            <div className="planning-form__row">
                                <Input
                                    type="number"
                                    value={goalForm.currentAmount}
                                    onChange={(e) => setGoalForm((current) => ({ ...current, currentAmount: e.target.value }))}
                                    placeholder="Capital actual"
                                />
                                <Input
                                    type="date"
                                    value={goalForm.targetDate}
                                    onChange={(e) => setGoalForm((current) => ({ ...current, targetDate: e.target.value }))}
                                />
                            </div>
                            <Input
                                value={goalForm.notes}
                                onChange={(e) => setGoalForm((current) => ({ ...current, notes: e.target.value }))}
                                placeholder="Notas opcionales"
                            />
                            <Button type="submit" icon={<Target size={16} />}>Guardar objetivo</Button>
                        </form>

                        <div className="planning-list">
                            {goals.length === 0 ? (
                                <p className="planning-empty">Aun no has definido objetivos.</p>
                            ) : goals.map((goal) => {
                                const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                                const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
                                const months = monthsUntil(goal.targetDate);
                                const monthlyNeed = months && months > 0 ? remaining / months : null;
                                return (
                                    <article key={goal.id} className="planning-item">
                                        <div className="planning-item__header">
                                            <div>
                                                <h3>{goal.title}</h3>
                                                <span>{GOAL_CATEGORY_LABELS[goal.category]}</span>
                                            </div>
                                            <button type="button" className="planning-item__icon-button" onClick={() => {
                                                deleteGoal(goal.id);
                                                setGoals((current) => current.filter((item) => item.id !== goal.id));
                                            }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="planning-progress">
                                            <div className="planning-progress__bar">
                                                <span style={{ width: `${progress}%` }} />
                                            </div>
                                            <strong>{progress.toFixed(1)}%</strong>
                                        </div>
                                        <div className="planning-item__meta">
                                            <span>Actual: {formatCurrency(goal.currentAmount)}</span>
                                            <span>Meta: {formatCurrency(goal.targetAmount)}</span>
                                            {monthlyNeed !== null && <span>Ahorro orientativo: {formatCurrency(monthlyNeed)}/mes</span>}
                                        </div>
                                        {goal.notes && <p className="planning-item__notes">{goal.notes}</p>}
                                    </article>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader
                        title="Watchlist manual"
                        subtitle="Ideas a vigilar sin mezclarlas con posiciones reales"
                    />
                    <CardContent className="planning-section">
                        <form className="planning-form" onSubmit={handleWatchlistSubmit}>
                            <div className="planning-form__row">
                                <Input
                                    value={watchlistForm.symbol}
                                    onChange={(e) => setWatchlistForm((current) => ({ ...current, symbol: e.target.value }))}
                                    placeholder="Ticker"
                                />
                                <Input
                                    value={watchlistForm.name}
                                    onChange={(e) => setWatchlistForm((current) => ({ ...current, name: e.target.value }))}
                                    placeholder="Nombre"
                                />
                            </div>
                            <div className="planning-form__row">
                                <select
                                    className="planning-select"
                                    value={watchlistForm.assetType}
                                    onChange={(e) => setWatchlistForm((current) => ({ ...current, assetType: e.target.value as AssetType }))}
                                >
                                    <option value="stock">Accion</option>
                                    <option value="etf">ETF</option>
                                    <option value="fund">Fondo</option>
                                    <option value="crypto">Crypto</option>
                                </select>
                                <Input
                                    type="number"
                                    value={watchlistForm.targetPrice}
                                    onChange={(e) => setWatchlistForm((current) => ({ ...current, targetPrice: e.target.value }))}
                                    placeholder="Precio objetivo opcional"
                                />
                            </div>
                            <Input
                                value={watchlistForm.notes}
                                onChange={(e) => setWatchlistForm((current) => ({ ...current, notes: e.target.value }))}
                                placeholder="Tesis, nivel de interés, qué quieres vigilar..."
                            />
                            <Button type="submit" variant="secondary" icon={<Eye size={16} />}>Guardar en watchlist</Button>
                        </form>

                        <div className="planning-list">
                            {watchlist.length === 0 ? (
                                <p className="planning-empty">No hay activos vigilados todavia.</p>
                            ) : watchlist.map((item) => (
                                <article key={item.id} className="planning-item">
                                    <div className="planning-item__header">
                                        <div>
                                            <h3>{item.symbol}</h3>
                                            <span>{item.name}</span>
                                        </div>
                                        <button type="button" className="planning-item__icon-button" onClick={() => {
                                            deleteWatchlistItem(item.id);
                                            setWatchlist((current) => current.filter((watch) => watch.id !== item.id));
                                        }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="planning-item__meta">
                                        <span>Tipo: {item.assetType.toUpperCase()}</span>
                                        {item.targetPrice !== undefined && <span>Objetivo: {formatCurrency(item.targetPrice)}</span>}
                                    </div>
                                    {item.notes && <p className="planning-item__notes">{item.notes}</p>}
                                </article>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
