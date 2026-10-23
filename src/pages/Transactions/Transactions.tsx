import { StatusPill } from '../../components/ui/StatusPill';
import { DataItem } from '../../components/ui/DataItem';
import { PageHeading } from '../../components/ui/PageHeading';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, MinusCircle, Pencil, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, Input, Button } from '../../components/ui';
import { usePortfolio } from '../../context/PortfolioContext';
import type { PortfolioTransaction, PortfolioTransactionType } from '../../types/types';
import './Transactions.css';

const TYPE_META: Record<PortfolioTransactionType, { label: string; icon: typeof ShoppingCart; className: string }> = {
    buy: { label: 'Compra', icon: ShoppingCart, className: 'transactions__badge--buy' },
    sell: { label: 'Venta', icon: MinusCircle, className: 'transactions__badge--sell' },
    transfer: { label: 'Traspaso', icon: ArrowRightLeft, className: 'transactions__badge--transfer' },
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

function formatPrice(value?: number): string {
    if (value === undefined) return '-';
    return value.toLocaleString('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
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
                || (transaction.transferToAssetSymbol || '').toLowerCase().includes(normalizedSearch)
                || (transaction.transferToAssetName || '').toLowerCase().includes(normalizedSearch)
                || (transaction.notes || '').toLowerCase().includes(normalizedSearch);
            return matchesType && matchesSearch;
        });
    }, [activeType, search, state.transactions]);

    const summary = useMemo(() => {
        const purchases = state.transactions.filter((transaction) => transaction.type === 'buy').length;
        const sales = state.transactions.filter((transaction) => transaction.type === 'sell').length;
        const transfers = state.transactions.filter((transaction) => transaction.type === 'transfer').length;
        const edits = state.transactions.filter((transaction) => transaction.type === 'edit').length;
        const deletions = state.transactions.filter((transaction) => transaction.type === 'delete').length;
        return { purchases, sales, transfers, edits, deletions };
    }, [state.transactions]);

    return (
        <div className="transactions-page">
            <PageHeading className="transactions-page__header" titleClassName="transactions-page__title" descriptionClassName="transactions-page__subtitle" title={'Historial de operaciones'} description={'Registro separado de compras, ventas, traspasos, ediciones y eliminaciones de tu cartera.'} actions={<Link to="/add">
                    <Button icon={<ArrowRightLeft size={16} />}>Registrar inversión</Button>
                </Link>} />

            <section className="transactions-page__summary">
                <Card>
                    <DataItem as="content" layout="transactions" className="transactions-page__summary-card" labelClassName="transactions-page__summary-label" label={'Total'} value={state.transactions.length} />
                </Card>
                <Card>
                    <DataItem as="content" layout="transactions" className="transactions-page__summary-card" labelClassName="transactions-page__summary-label" label={'Compras'} value={summary.purchases} />
                </Card>
                <Card>
                    <DataItem as="content" layout="transactions" className="transactions-page__summary-card" labelClassName="transactions-page__summary-label" label={'Ventas'} value={summary.sales} />
                </Card>
                <Card>
                    <DataItem as="content" layout="transactions" className="transactions-page__summary-card" labelClassName="transactions-page__summary-label" label={'Traspasos'} value={summary.transfers} />
                </Card>
                <Card>
                    <DataItem as="content" layout="transactions" className="transactions-page__summary-card" labelClassName="transactions-page__summary-label" label={'Ediciones'} value={summary.edits} />
                </Card>
                <Card>
                    <DataItem as="content" layout="transactions" className="transactions-page__summary-card" labelClassName="transactions-page__summary-label" label={'Eliminaciones'} value={summary.deletions} />
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
                            { value: 'sell', label: 'Ventas' },
                            { value: 'transfer', label: 'Traspasos' },
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
                                            <StatusPill as="div" appearance="transaction" tone={transaction.type} className={meta.className} icon={<Icon size={14} />}>{meta.label}</StatusPill>
                                            <div>
                                                <h3 className="transactions-item__title">
                                                    {transaction.assetSymbol}
                                                    <span>{transaction.assetName}</span>
                                                    {transaction.type === 'transfer' && <span>→ {transaction.transferToAssetSymbol || transaction.transferToAssetName || 'Fondo destino'}</span>}
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
                                            {transaction.type === 'transfer' && <div>
                                                <span>Participaciones compradas</span>
                                                <strong>{transaction.transferQuantity ?? '-'}</strong>
                                            </div>}
                                            <div>
                                                <span>{transaction.type === 'transfer' ? 'Precio de venta' : 'Precio'}</span>
                                                <strong>{formatPrice(transaction.price)}</strong>
                                            </div>
                                            {transaction.type === 'transfer' && <div>
                                                <span>Precio de compra</span>
                                                <strong>{formatPrice(transaction.transferToPrice)}</strong>
                                            </div>}
                                            <div>
                                                <span>{transaction.type === 'transfer' ? transaction.estimated ? 'Venta estimada' : 'Importe de venta' : 'Total'}</span>
                                                <strong>{formatCurrency(transaction.total)}</strong>
                                            </div>
                                            {transaction.type === 'transfer' && transaction.transferQuantity !== undefined && transaction.transferToPrice !== undefined && <div>
                                                <span>{transaction.estimated ? 'Compra estimada' : 'Importe de compra'}</span>
                                                <strong>{formatCurrency(transaction.transferQuantity * transaction.transferToPrice)}</strong>
                                            </div>}
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
