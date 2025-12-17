import { useState, useMemo } from 'react';
import { ArrowUpDown, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Asset } from '../../types/types';
import './AssetsTable.css';

interface AssetsTableProps {
    assets: Asset[];
    onDelete?: (id: string) => void;
}

type SortKey = 'symbol' | 'value' | 'change' | 'weight';
type SortDirection = 'asc' | 'desc';

export function AssetsTable({ assets, onDelete }: AssetsTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('value');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const totalValue = assets.reduce(
        (sum, a) => sum + (a.currentPrice || a.purchasePrice) * a.quantity,
        0
    );

    const processedAssets = useMemo(() => {
        return assets.map((asset) => {
            const currentValue = (asset.currentPrice || asset.purchasePrice) * asset.quantity;
            const investedValue = asset.purchasePrice * asset.quantity;
            const gain = currentValue - investedValue;
            const changePercent = investedValue > 0 ? (gain / investedValue) * 100 : 0;
            const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

            return {
                ...asset,
                currentValue,
                investedValue,
                gain,
                changePercent,
                weight,
            };
        });
    }, [assets, totalValue]);

    const sortedAssets = useMemo(() => {
        return [...processedAssets].sort((a, b) => {
            let comparison = 0;
            switch (sortKey) {
                case 'symbol':
                    comparison = a.symbol.localeCompare(b.symbol);
                    break;
                case 'value':
                    comparison = a.currentValue - b.currentValue;
                    break;
                case 'change':
                    comparison = a.changePercent - b.changePercent;
                    break;
                case 'weight':
                    comparison = a.weight - b.weight;
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [processedAssets, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const formatPercent = (value: number): string => {
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortKey !== column) {
            return <ArrowUpDown size={14} className="sort-icon" />;
        }
        return sortDirection === 'asc' ? (
            <ChevronUp size={14} className="sort-icon sort-icon--active" />
        ) : (
            <ChevronDown size={14} className="sort-icon sort-icon--active" />
        );
    };

    if (assets.length === 0) {
        return (
            <Card className="assets-table">
                <CardHeader title="Mis Activos" subtitle="Desglose completo del portfolio" />
                <CardContent>
                    <p className="assets-table__empty">
                        No tienes activos en tu cartera. ¡Añade tu primera inversión!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="assets-table">
            <CardHeader
                title="Mis Activos"
                subtitle={`${assets.length} activos · Valor total: ${formatCurrency(totalValue)}`}
            />
            <CardContent>
                <div className="assets-table__wrapper">
                    <table className="assets-table__table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('symbol')}>
                                    Activo <SortIcon column="symbol" />
                                </th>
                                <th>Cantidad</th>
                                <th>Precio Compra</th>
                                <th>Precio Actual</th>
                                <th onClick={() => handleSort('value')}>
                                    Valor <SortIcon column="value" />
                                </th>
                                <th onClick={() => handleSort('change')}>
                                    Ganancia <SortIcon column="change" />
                                </th>
                                <th onClick={() => handleSort('weight')}>
                                    Peso <SortIcon column="weight" />
                                </th>
                                {onDelete && <th></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAssets.map((asset) => (
                                <tr key={asset.id}>
                                    <td>
                                        <div className="assets-table__asset">
                                            <span className="assets-table__symbol">{asset.symbol}</span>
                                            <span className="assets-table__name">{asset.name}</span>
                                        </div>
                                    </td>
                                    <td>{asset.quantity}</td>
                                    <td>{formatCurrency(asset.purchasePrice)}</td>
                                    <td>{formatCurrency(asset.currentPrice || asset.purchasePrice)}</td>
                                    <td className="assets-table__value">
                                        {formatCurrency(asset.currentValue)}
                                    </td>
                                    <td>
                                        <div className="assets-table__gain">
                                            <span
                                                className={`assets-table__change ${asset.changePercent >= 0
                                                        ? 'assets-table__change--positive'
                                                        : 'assets-table__change--negative'
                                                    }`}
                                            >
                                                {formatPercent(asset.changePercent)}
                                            </span>
                                            <span className="assets-table__gain-value">
                                                {formatCurrency(asset.gain)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="assets-table__weight">
                                            <div className="assets-table__weight-bar">
                                                <div
                                                    className="assets-table__weight-fill"
                                                    style={{ width: `${Math.min(asset.weight, 100)}%` }}
                                                />
                                            </div>
                                            <span>{asset.weight.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    {onDelete && (
                                        <td>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(asset.id)}
                                                icon={<Trash2 size={16} />}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
