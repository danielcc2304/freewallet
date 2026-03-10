import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Pencil, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, Input, Button } from '../../components/ui';
import { usePortfolio } from '../../context/PortfolioContext';
import type { PortfolioTransaction, PortfolioTransactionType } from '../../types/types';
import './Transactions.css';

const TYPE_META: Record<PortfolioTransactionType, { label: string; icon: typeof ShoppingCart; className: string }> = {
    buy: { label: 'Compra', icon: ShoppingCart, className: 'transactions__badge--buy' },
    edit: { label: 'Edicion', icon: Pencil, className: 'transactions__badge--edit' },
    delete: { label: 'Eliminacion', icon: Trash2, className: 'transactions__badge--delete' },
};

function formatCurrency(value?: number): string {
    if (value === undefined) return '-';
    return value.toLocaleString('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function sortTransactions(transactions: PortfolioTransaction[]): PortfolioTransaction[] {
    return [...transactions].sort((a, b) => {
        if (a.date === b.date) {
            return a.createdAt < b.createdAt ? 1 : -1;
        }
        return a.date < b.date ? 1 : -1;
    });
}

export function Transactions() {
    const { state } = usePortfolio();
    const [search, setSearch] = useState('');
    const [activeType, setActiveType] = useState<'all' | PortfolioTransactionType>('all');

    const filteredTransactions = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return sortTransactions(state.transactions).filter((transaction) => {
            const matchesType = activeType === 'all' || transaction.type === activeType;
            const matchesSearch = normalizedSearch.length === 0
                || transaction.assetSymbol.toLowerCase().includes(normalizedSearch)
                || transaction.assetName.toLowerCase().includes(normalizedSearch)
                || (transaction.notes || '').toLowerCase().includes(normalizedSearch);
            return matchesType && matchesSearch;
        });
    }, [activeType, search, state.transactions]);

    const summary = useMemo(() => {
        const purchases = state.transactions.filter((transaction) => transaction.type === 'buy').length;
        const edits = state.transactions.filter((transaction) => transaction.type === 'edit').length;
        const deletions = state.transactions.filter((transaction) => transaction.type === 'delete').length;
        return { purchases, edits, deletions };
    }, [state.transactions]);

    return (
        <div className="transactions-page">
            <div className="transactions-page__header">
                <div>
                    <h1 className="transactions-page__title">Historial de operaciones</h1>
                    <p className="transactions-page__subtitle">
                        Registro separado de compras, ediciones y eliminaciones de tu cartera.
                    </p>
                </div>
                <Link to="/add">
                    <Button icon={<ArrowRightLeft size={16} />}>Registrar inversión</Button>
                </Link>
            </div>

            <section className="transactions-page__summary">
                <Card>
                    <CardContent className="transactions-page__summary-card">
                        <span className="transactions-page__summary-label">Total</span>
                        <strong>{state.transactions.length}</strong>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="transactions-page__summary-card">
                        <span className="transactions-page__summary-label">Compras</span>
                        <strong>{summary.purchases}</strong>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="transactions-page__summary-card">
                        <span className="transactions-page__summary-label">Ediciones</span>
                        <strong>{summary.edits}</strong>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="transactions-page__summary-card">
                        <span className="transactions-page__summary-label">Eliminaciones</span>
                        <strong>{summary.deletions}</strong>
                    </CardContent>
                </Card>
            </section>

            <Card className="transactions-page__filters">
                <CardHeader
                    title="Filtros"
                    subtitle="Busca por activo o filtra por tipo de operación"
                />
                <CardContent className="transactions-page__filters-content">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por ticker, nombre o nota"
                        icon={<Search size={16} />}
                    />
                    <div className="transactions-page__chips">
                        {[
                            { value: 'all', label: 'Todas' },
                            { value: 'buy', label: 'Compras' },
                            { value: 'edit', label: 'Ediciones' },
                            { value: 'delete', label: 'Eliminaciones' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`transactions-page__chip ${activeType === option.value ? 'transactions-page__chip--active' : ''}`}
                                onClick={() => setActiveType(option.value as 'all' | PortfolioTransactionType)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="transactions-page__list-card">
                <CardHeader
                    title="Operaciones registradas"
                    subtitle={filteredTransactions.length === 0 ? 'No hay resultados para los filtros actuales' : `${filteredTransactions.length} operaciones`}
                />
                <CardContent>
                    {filteredTransactions.length === 0 ? (
                        <div className="transactions-page__empty">
                            <p>No hay operaciones registradas todavia.</p>
                            <Link to="/add">Añadir una inversión</Link>
                        </div>
                    ) : (
                        <div className="transactions-list">
                            {filteredTransactions.map((transaction) => {
                                const meta = TYPE_META[transaction.type];
                                const Icon = meta.icon;
                                return (
                                    <article key={transaction.id} className="transactions-item">
                                        <div className="transactions-item__main">
                                            <div className={`transactions__badge ${meta.className}`}>
                                                <Icon size={14} />
                                                <span>{meta.label}</span>
                                            </div>
                                            <div>
                                                <h3 className="transactions-item__title">
                                                    {transaction.assetSymbol}
                                                    <span>{transaction.assetName}</span>
                                                </h3>
                                                <p className="transactions-item__notes">
                                                    {transaction.notes || 'Sin notas'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="transactions-item__meta">
                                            <div>
                                                <span>Fecha</span>
                                                <strong>{formatDate(transaction.date)}</strong>
                                            </div>
                                            <div>
                                                <span>Cantidad</span>
                                                <strong>{transaction.quantity ?? '-'}</strong>
                                            </div>
                                            <div>
                                                <span>Precio</span>
                                                <strong>{formatCurrency(transaction.price)}</strong>
                                            </div>
                                            <div>
                                                <span>Total</span>
                                                <strong>{formatCurrency(transaction.total)}</strong>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
