import { memo, useState, useMemo } from 'react';
import { ArrowUpDown, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Pencil, PencilOff, PlusCircle, MinusCircle } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, ConfirmDialog } from '../ui';
import type { Asset } from '../../types/types';
import './AssetsTable.css';

interface AssetsTableProps {
    assets: Asset[];
    onDelete?: (id: string) => void;
    onEdit?: (asset: Asset) => void;
    onAddPurchase?: (asset: Asset) => void;
    onSell?: (asset: Asset) => void;
    onViewDetails?: (asset: Asset) => void;
}

type SortKey = 'symbol' | 'value' | 'change' | 'weight';
type SortDirection = 'asc' | 'desc';

function SortIcon({ column, sortKey, sortDirection }: { column: SortKey; sortKey: SortKey; sortDirection: SortDirection }) {
    if (sortKey !== column) {
        return <ArrowUpDown size={14} className="sort-icon" />;
    }
    return sortDirection === 'asc' ? (
        <ChevronUp size={14} className="sort-icon sort-icon--active" />
    ) : (
        <ChevronDown size={14} className="sort-icon sort-icon--active" />
    );
}

export const AssetsTable = memo(function AssetsTable({ assets, onDelete, onEdit, onAddPurchase, onSell, onViewDetails }: AssetsTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('value');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const [showMobileActions, setShowMobileActions] = useState(false);
    const hasActionHandlers = Boolean(onDelete || onEdit || onAddPurchase || onSell);

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
            const hasCurrentPrice = Number.isFinite(asset.currentPrice) && asset.currentPrice! > 0;
            const hasPreviousClose = Number.isFinite(asset.previousClose) && asset.previousClose! > 0;
            const todayChange = hasCurrentPrice && hasPreviousClose
                ? (asset.currentPrice! - asset.previousClose!) * asset.quantity
                : NaN;
            const todayChangePercent = hasCurrentPrice && hasPreviousClose
                ? (asset.currentPrice! - asset.previousClose!) / asset.previousClose! * 100
                : NaN;

            return {
                ...asset,
                currentValue,
                investedValue,
                gain,
                changePercent,
                weight,
                todayChange,
                todayChangePercent,
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

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const handleConfirmDelete = () => {
        if (deleteConfirmId && onDelete) {
            onDelete(deleteConfirmId);
        }
        setDeleteConfirmId(null);
    };

    const assetToDelete = deleteConfirmId
        ? assets.find(a => a.id === deleteConfirmId)
        : null;

    const formatCurrency = (value: number): string => {
        if (!Number.isFinite(value)) return 'N/D';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatPrice = (value: number): string => {
        if (!Number.isFinite(value)) return 'N/D';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
        }).format(value);
    };

    const formatPercent = (value: number): string => {
        if (!Number.isFinite(value)) return 'N/D';
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
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
        <>
            <Card className="assets-table">
                <CardHeader
                    title="Mis Activos"
                    subtitle={`${assets.length} activos · Valor total: ${formatCurrency(totalValue)}`}
                    action={
                        <div className="assets-table__mobile-toolbar" aria-label="Opciones de Mis Activos">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMobileDetails((current) => !current)}
                                icon={showMobileDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                                aria-pressed={showMobileDetails}
                                title={showMobileDetails ? 'Ocultar información adicional' : 'Ver toda la información'}
                            >
                                {showMobileDetails ? 'Ocultar' : 'Ver todo'}
                            </Button>
                            {hasActionHandlers && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowMobileActions((current) => !current)}
                                    icon={showMobileActions ? <PencilOff size={16} /> : <Pencil size={16} />}
                                    aria-pressed={showMobileActions}
                                    title={showMobileActions ? 'Ocultar acciones' : 'Editar y gestionar activos'}
                                >
                                    {showMobileActions ? 'Cerrar' : 'Editar'}
                                </Button>
                            )}
                        </div>
                    }
                />
                <CardContent>
                    <div className="assets-table__wrapper">
                        <table className={`assets-table__table ${showMobileDetails ? 'assets-table__table--show-details' : ''} ${showMobileActions ? 'assets-table__table--show-actions' : ''}`}>
                            <thead>
                                <tr>
                                    <th className="assets-table__column--asset" onClick={() => handleSort('symbol')}>
                                        Activo <SortIcon column="symbol" sortKey={sortKey} sortDirection={sortDirection} />
                                    </th>
                                    <th className="assets-table__optional">Cantidad</th>
                                    <th className="assets-table__optional">Precio Compra</th>
                                    <th className="assets-table__column--price">
                                        <span className="assets-table__current-price-label">Precio Actual</span>
                                        <span className="assets-table__today-label">Variación hoy</span>
                                    </th>
                                    <th className="assets-table__column--value" onClick={() => handleSort('value')}>
                                        Valor <SortIcon column="value" sortKey={sortKey} sortDirection={sortDirection} />
                                    </th>
                                    <th className="assets-table__column--gain" onClick={() => handleSort('change')}>
                                        Ganancia <SortIcon column="change" sortKey={sortKey} sortDirection={sortDirection} />
                                    </th>
                                    <th className="assets-table__optional" onClick={() => handleSort('weight')}>
                                        Peso <SortIcon column="weight" sortKey={sortKey} sortDirection={sortDirection} />
                                    </th>
                                    {hasActionHandlers && <th className="assets-table__actions-header">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAssets.map((asset) => (
                                    <tr
                                        key={asset.id}
                                        onClick={() => onViewDetails?.(asset)}
                                        className="clickable-row"
                                    >
                                        <td className="assets-table__column--asset">
                                            <div className="assets-table__asset">
                                                <span className="assets-table__name">{asset.name}</span>
                                                <div className="assets-table__identifiers">
                                                    <span className="assets-table__symbol">{asset.symbol}</span>
                                                    {asset.isin && asset.isin !== asset.symbol && (
                                                        <span className="assets-table__isin">ISIN {asset.isin}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="assets-table__optional">{asset.quantity}</td>
                                        <td className="assets-table__optional">{formatPrice(asset.purchasePrice)}</td>
                                        <td className="assets-table__column--price">
                                            <span className="assets-table__current-price">{formatPrice(asset.currentPrice || asset.purchasePrice)}</span>
                                            <span className={`assets-table__today ${Number.isFinite(asset.todayChangePercent) && asset.todayChangePercent < 0
                                                ? 'assets-table__change--negative'
                                                : Number.isFinite(asset.todayChangePercent) && asset.todayChangePercent > 0
                                                    ? 'assets-table__change--positive'
                                                    : ''
                                                }`}>
                                                <strong>{formatPercent(asset.todayChangePercent)}</strong>
                                                <small>{formatCurrency(asset.todayChange)}</small>
                                            </span>
                                        </td>
                                        <td className="assets-table__column--value assets-table__value">
                                            {formatCurrency(asset.currentValue)}
                                        </td>
                                        <td className="assets-table__column--gain">
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
                                        <td className="assets-table__optional">
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
                                        <td className="assets-table__mobile-details-cell">
                                            <div className="assets-table__mobile-details">
                                                <div>
                                                    <span>Cantidad</span>
                                                    <strong>{asset.quantity}</strong>
                                                </div>
                                                <div>
                                                    <span>Precio compra</span>
                                                    <strong>{formatPrice(asset.purchasePrice)}</strong>
                                                </div>
                                                <div>
                                                    <span>Peso</span>
                                                    <strong>{asset.weight.toFixed(1)}%</strong>
                                                </div>
                                            </div>
                                        </td>
                                        {hasActionHandlers && (
                                            <td className="assets-table__actions-cell">
                                                <div id={`asset-actions-${asset.id}`} className="assets-table__actions">
                                                    {onAddPurchase && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(event) => { event.stopPropagation(); onAddPurchase(asset); }}
                                                            icon={<PlusCircle size={16} />}
                                                            aria-label={`Añadir compra de ${asset.symbol}`}
                                                            title="Añadir Compra (DCA)"
                                                        />
                                                    )}
                                                    {onSell && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(event) => { event.stopPropagation(); onSell(asset); }}
                                                            icon={<MinusCircle size={16} />}
                                                            aria-label={`Registrar venta de ${asset.symbol}`}
                                                            title="Registrar venta"
                                                        />
                                                    )}
                                                    {onEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(event) => { event.stopPropagation(); onEdit(asset); }}
                                                            icon={<Pencil size={16} />}
                                                            aria-label={`Editar ${asset.symbol}`}
                                                            title="Editar activo"
                                                        />
                                                    )}
                                                    {onDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(event) => { event.stopPropagation(); handleDeleteClick(asset.id); }}
                                                            icon={<Trash2 size={16} />}
                                                            className="assets-table__delete-btn"
                                                            aria-label={`Eliminar ${asset.symbol}`}
                                                            title="Eliminar activo"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar activo?"
                message={assetToDelete
                    ? `¿Estás seguro de que quieres eliminar ${assetToDelete.symbol} (${assetToDelete.name}) de tu portfolio? Esta acción no se puede deshacer.`
                    : '¿Estás seguro de que quieres eliminar este activo?'}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </>
    );
});
