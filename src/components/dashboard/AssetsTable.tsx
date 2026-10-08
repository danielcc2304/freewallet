import { Fragment, memo, useId, useState, useMemo } from 'react';
import { ArrowUpDown, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Pencil, PencilOff, PlusCircle, MinusCircle } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, ConfirmDialog } from '../ui';
import type { Asset } from '../../types/types';
import { assetPrice, assetValue, formatQuantity } from '../../services/assetValuation';
import './AssetsTable.css';
import { compareKnownReturns, filterDashboardAssets } from '../../services/dashboardIntegrity';
import { portfolioPositionGroups } from '../../services/portfolioPositionGroups';

interface AssetsTableProps {
    assets: Asset[];
    now?: number;
    onDelete?: (id: string) => void | Promise<void>;
    onEdit?: (asset: Asset) => void;
    onAddPurchase?: (asset: Asset) => void;
    onSell?: (asset: Asset) => void;
    onViewDetails?: (asset: Asset) => void;
}

type SortKey = 'symbol' | 'value' | 'change' | 'weight' | 'today';
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

export const AssetsTable = memo(function AssetsTable({ assets, now = Date.now(), onDelete, onEdit, onAddPurchase, onSell, onViewDetails }: AssetsTableProps) {
    const filterId = useId();
    const [query, setQuery] = useState('');
    const [assetType, setAssetType] = useState<Asset['type'] | 'all'>('all');
    const [sortKey, setSortKey] = useState<SortKey>('value');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteError,setDeleteError]=useState('');
    const [deleting,setDeleting]=useState(false);
    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const [showMobileActions, setShowMobileActions] = useState(false);
    const [grouped,setGrouped] = useState(true);
    const [expandedGroups,setExpandedGroups] = useState<Set<string>>(new Set());
    const hasActionHandlers = Boolean(onDelete || onEdit || onAddPurchase || onSell);

    const totalValue = assets.reduce(
        (sum, a) => sum + assetValue(a),
        0
    );

    const groups = useMemo(()=>portfolioPositionGroups(assets,now),[assets,now]);
    const processed = useMemo(() => {
        const process = (group: ReturnType<typeof portfolioPositionGroups>[number]) => {
            const asset=group.asset;
            const {currentValue,investedValue}=group;
            const gain = currentValue - investedValue;
            const changePercent = investedValue > 0 && group.estimatedCount===0 ? (gain / investedValue) * 100 : NaN;
            const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
            const variation = group;

            return {
                ...asset,
                gain,
                changePercent,
                weight,
                ...variation,
                isGroup:group.lots.length>1,
            };
        };
        return {grouped:groups.map(process),individual:assets.map(asset=>process(portfolioPositionGroups([asset],now)[0]))};
    }, [assets, groups, totalValue, now]);
    const processedAssets=grouped?processed.grouped:processed.individual;
    const toggleGroup=(id:string,manage=false)=>{
        setExpandedGroups(previous=>{const next=new Set(previous);if(manage || !next.has(id))next.add(id);else next.delete(id);return next;});
        if(manage)setShowMobileActions(true);
    };

    const sortedAssets = useMemo(() => {
        return filterDashboardAssets(processedAssets, query, assetType).sort((a, b) => {
            if (sortKey === 'change') return compareKnownReturns(a.changePercent, b.changePercent, sortDirection);
            if (sortKey === 'today') return compareKnownReturns(a.latestChangePercent, b.latestChangePercent, sortDirection);
            let comparison = 0;
            switch (sortKey) {
                case 'symbol':
                    comparison = a.name.localeCompare(b.name, 'es');
                    break;
                case 'value':
                    comparison = a.currentValue - b.currentValue;
                    break;
                case 'weight':
                    comparison = a.weight - b.weight;
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [processedAssets, sortKey, sortDirection, query, assetType]);

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

    const handleConfirmDelete = async () => {
        if(deleting)return;
        setDeleting(true);setDeleteError('');
        try {if(deleteConfirmId && onDelete)await onDelete(deleteConfirmId);setDeleteConfirmId(null);}
        catch(error){setDeleteError(error instanceof Error?error.message:'No se pudo confirmar la eliminación.');}
        finally{setDeleting(false);}
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
        return `${sign}${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    };

    const renderAssetRow=(asset: (typeof processedAssets)[number],isLot=false)=>(

        <tr
            key={asset.id}
            data-position-kind={asset.isGroup?'group':isLot?'lot':'asset'}
            onClick={() => onViewDetails?.(asset)}
            className={`clickable-row ${isLot ? 'assets-table__lot-row' : ''}`}
        >
            <td className="assets-table__column--asset">
                <div className="assets-table__asset">
                    <button type="button" className="assets-table__name assets-table__open" onClick={e => { e.stopPropagation(); onViewDetails?.(asset); }} aria-label={`Ver detalles de ${asset.name}`}>{asset.name}</button>
                    {asset.mixedPrices && asset.isGroup && asset.estimatedCount===0 && <small>Precio medio de valoración</small>}
                    {asset.estimatedCount>0 && <small>Valor con estimaciones al coste</small>}
                    <small>{asset.mixedDates ? 'Varias fechas de valoración' : asset.quotedAt && Number.isFinite(Date.parse(asset.quotedAt))
                        ? 'Valoración: ' + new Date(asset.quotedAt).toLocaleDateString('es-ES')
                        : 'Fecha de valoración no disponible'}</small>
                    {asset.isGroup && <button type="button" className="assets-table__lots-toggle"
                        aria-expanded={expandedGroups.has(asset.id)}
                        onClick={event=>{event.stopPropagation();toggleGroup(asset.id);}}>
                        {expandedGroups.has(asset.id)?<ChevronUp size={14}/>:<ChevronDown size={14}/>} {asset.lots.length} registros
                    </button>}
                    {isLot && <small>Compra: {new Date(`${asset.purchaseDate.slice(0,10)}T12:00:00`).toLocaleDateString('es-ES')}</small>}
                    <div className="assets-table__identifiers">
                        <span className="assets-table__symbol">{asset.symbol}</span>
                        {asset.isin && asset.isin !== asset.symbol && (
                            <span className="assets-table__isin">ISIN {asset.isin}</span>
                        )}
                    </div>
                </div>
            </td>
            <td className="assets-table__optional">{formatQuantity(asset)}</td>
            <td className="assets-table__optional">{formatPrice(asset.purchasePrice)}</td>
            <td className="assets-table__column--price assets-table__optional">
                <span className="assets-table__current-price">{asset.estimatedCount>0 && asset.isGroup ? 'N/D' : formatPrice(assetPrice(asset))}</span>
                {asset.estimatedCount>0 && <small className="assets-table__estimated">Incluye estimaciones</small>}
            </td>
            <td className="assets-table__column--today">
                <span className={`assets-table__today ${Number.isFinite(asset.latestChangePercent) && asset.latestChangePercent < 0
                    ? 'assets-table__change--negative'
                    : Number.isFinite(asset.latestChangePercent) && asset.latestChangePercent > 0
                        ? 'assets-table__change--positive'
                        : ''
                    }`}>
                    <strong>{formatPercent(asset.latestChangePercent)}</strong>
                    <small>{formatCurrency(asset.latestChange)}</small>
                    <small className="assets-table__variation-date">{asset.isToday ? 'Hoy' : asset.quoteDay ? new Date(`${asset.quoteDay}T12:00:00`).toLocaleDateString('es-ES') : 'Fecha no disponible'}</small>
                </span>
            </td>
            <td className="assets-table__column--value assets-table__value">
                {formatCurrency(asset.currentValue)}
                {asset.estimatedCount>0 && <small className="assets-table__estimated">Incluye estimaciones</small>}
            </td>
            <td className="assets-table__column--gain">
                <div className="assets-table__gain">
                    <span
                        className={`assets-table__change ${asset.changePercent > 0
                            ? 'assets-table__change--positive'
                            : asset.changePercent < 0 ? 'assets-table__change--negative' : ''
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
                        <strong>{formatQuantity(asset)}</strong>
                    </div>
                    <div>
                        <span>Precio medio</span>
                        <strong>{formatPrice(asset.purchasePrice)}</strong>
                    </div>
                    <div>
                        <span>Precio actual</span>
                        <strong>{asset.estimatedCount>0 && asset.isGroup ? 'N/D' : formatPrice(assetPrice(asset))}</strong>
                        {asset.estimatedCount>0 && <span className="assets-table__estimated">Estimado al coste</span>}
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
                        {asset.isGroup ? <Button variant="ghost" size="sm" icon={<Pencil size={16}/>}
                            onClick={event=>{event.stopPropagation();toggleGroup(asset.id,true);}}
                            aria-label={`Gestionar registros de ${asset.symbol}`} title="Gestionar registros"/> : <>
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
                        </>}
                    </div>
                </td>
            )}
        </tr>
    );

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
                    subtitle={`${groups.length} activos${assets.length>groups.length?` · ${assets.length} registros`:''} · Valor total: ${formatCurrency(totalValue)}`}
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
                    <div className="assets-table__filters">
                        <div>
                            <label htmlFor={`${filterId}-query`}>Buscar activo</label>
                            <input id={`${filterId}-query`} type="search" placeholder="Nombre, símbolo o ISIN" value={query} onChange={e => setQuery(e.target.value)} />
                        </div>
                        <div>
                            <label htmlFor={`${filterId}-type`}>Tipo de activo</label>
                            <select id={`${filterId}-type`} value={assetType} onChange={e => setAssetType(e.target.value as Asset['type'] | 'all')}>
                                <option value="all">Todos</option>
                                <option value="fund">Fondos</option>
                                <option value="stock">Acciones</option>
                                <option value="etf">ETF</option>
                                <option value="crypto">Criptomonedas</option>
                                <option value="cash">Liquidez</option>
                            </select>
                        </div>
                        <label className="assets-table__group-toggle">
                            <input type="checkbox" checked={grouped} onChange={event=>setGrouped(event.target.checked)} />
                            Agrupar por activo
                        </label>
                        {(query || assetType !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setAssetType('all'); }}>Limpiar filtros</Button>}
                    </div>
                    {(query || assetType !== 'all') && <p className="assets-table__filter-count" role="status">{sortedAssets.length} de {processedAssets.length} {grouped?'activos':'registros'} · Los pesos se calculan sobre toda tu cartera.</p>}
                    {sortedAssets.length === 0 && <p className="assets-table__empty">No hay activos que coincidan con los filtros.</p>}
                    <div className="assets-table__wrapper">
                        <table className={`assets-table__table ${showMobileDetails ? 'assets-table__table--show-details' : ''} ${showMobileActions ? 'assets-table__table--show-actions' : ''}`}>
                            <thead>
                                <tr>
                                    <th className="assets-table__column--asset" aria-sort={sortKey === 'symbol' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                                        <button type="button" className="assets-table__sort" onClick={() => handleSort('symbol')}>Activo <SortIcon column="symbol" sortKey={sortKey} sortDirection={sortDirection} /></button>
                                    </th>
                                    <th className="assets-table__optional">Cantidad</th>
                                    <th className="assets-table__optional">Precio medio</th>
                                    <th className="assets-table__column--price assets-table__optional">
                                        <span className="assets-table__current-price-label">Precio Actual</span>
                                    </th>
                                    <th className="assets-table__column--today" aria-sort={sortKey === 'today' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                                        <button type="button" className="assets-table__sort" onClick={() => handleSort('today')} title="Ordenar por variación de la última cotización, cuya fecha se indica en cada fila">Variación <SortIcon column="today" sortKey={sortKey} sortDirection={sortDirection} /></button>
                                    </th>
                                    <th className="assets-table__column--value" aria-sort={sortKey === 'value' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                                        <button type="button" className="assets-table__sort" onClick={() => handleSort('value')}>Valor <SortIcon column="value" sortKey={sortKey} sortDirection={sortDirection} /></button>
                                    </th>
                                    <th className="assets-table__column--gain" aria-sort={sortKey === 'change' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                                        <button type="button" className="assets-table__sort" onClick={() => handleSort('change')}>Ganancia <SortIcon column="change" sortKey={sortKey} sortDirection={sortDirection} /></button>
                                    </th>
                                    <th className="assets-table__optional" aria-sort={sortKey === 'weight' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                                        <button type="button" className="assets-table__sort" onClick={() => handleSort('weight')}>Peso <SortIcon column="weight" sortKey={sortKey} sortDirection={sortDirection} /></button>
                                    </th>
                                    {hasActionHandlers && <th className="assets-table__actions-header">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAssets.map(asset=><Fragment key={asset.id}>
                                    {renderAssetRow(asset)}
                                    {asset.isGroup && expandedGroups.has(asset.id) && asset.lots.map(lot=>{
                                        const row=processed.individual.find(row=>row.id===lot.id)!;
                                        return renderAssetRow(row,true);
                                    })}
                                </Fragment>)}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            {deleteError && <p role="alert">{deleteError}</p>}
            <ConfirmDialog
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar registro?"
                message={assetToDelete
                    ? `Eliminarás el registro de ${assetToDelete.name} (${assetToDelete.symbol}) con ${formatQuantity(assetToDelete)} unidades y precio medio ${formatPrice(assetToDelete.purchasePrice)}. Esta acción no registra una venta y no se puede deshacer.`
                    : '¿Estás seguro de que quieres eliminar este activo?'}
                confirmText={deleting?'Eliminando…':'Eliminar'}
                cancelText="Cancelar"
                variant="danger"
            />
        </>
    );
});
