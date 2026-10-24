import { DashboardAssetsCard, DashboardAssetsGrid, DashboardAssetRow, DashboardAssetCell, DashboardAssetSortIcon, DashboardAssetFilters, DashboardAssetTableMessage, DashboardAssetActions, DashboardAssetMobileToolbar, DashboardAssetActionButton, DashboardAssetEstimate } from './ui/DashboardAssetsGrid';


import { DashboardAssetIdentity, DashboardAssetChange, DashboardAssetWeight, DashboardMobileFacts, DashboardMobileFact, DashboardTableButton } from './ui/DashboardAssetCells';
import { DashboardFilterField } from './ui/DashboardFilterField';
import { Fragment, memo, useId, useState, useMemo, useLayoutEffect } from 'react';
import { ArrowLeftRight, ArrowUpDown, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Pencil, PencilOff, PlusCircle, MinusCircle } from 'lucide-react';
import { CardHeader, CardContent, Button, ConfirmDialog } from '../ui';
import type { Asset } from '../../types/types';
import { assetPrice, assetValue, formatQuantity } from '../../services/assetValuation';
import { compareKnownReturns, filterDashboardAssets } from '../../services/dashboardIntegrity';
import { portfolioPositionGroups } from '../../services/portfolioPositionGroups';

interface AssetsTableProps {
    assets: Asset[];
    now?: number;
    onDelete?: (id: string) => void | Promise<void>;
    onEdit?: (asset: Asset) => void;
    onAddPurchase?: (asset: Asset) => void;
    onSell?: (asset: Asset) => void;
    onTransfer?: (asset: Asset) => void;
    canTransfer?: (asset: Asset) => boolean;
    onViewDetails?: (asset: Asset) => void;
    initialViewState?: AssetsTableViewState;
    onViewStateChange?: (state: AssetsTableViewState) => void;
}

type SortKey = 'symbol' | 'value' | 'change' | 'weight' | 'today';
type SortDirection = 'asc' | 'desc';

export interface AssetsTableViewState {
    query: string;
    assetType: Asset['type'] | 'all';
    sortKey: SortKey;
    sortDirection: SortDirection;
    showMobileDetails: boolean;
    showMobileActions: boolean;
    expandedGroups: string[];
}

function SortIcon({ column, sortKey, sortDirection }: { column: SortKey; sortKey: SortKey; sortDirection: SortDirection }) {
    if (sortKey !== column) {
        return <DashboardAssetSortIcon  icon={<ArrowUpDown size={14} />} />;
    }
    return sortDirection === 'asc' ? (
        <DashboardAssetSortIcon active icon={<ChevronUp size={14} />} />
    ) : (
        <DashboardAssetSortIcon active icon={<ChevronDown size={14} />} />
    );
}

export const AssetsTable = memo(function AssetsTable({ assets, now = Date.now(), onDelete, onEdit, onAddPurchase, onSell, onTransfer, canTransfer, onViewDetails, initialViewState, onViewStateChange }: AssetsTableProps) {
    const filterId = useId();
    const [query, setQuery] = useState(initialViewState?.query ?? '');
    const [assetType, setAssetType] = useState<Asset['type'] | 'all'>(initialViewState?.assetType ?? 'all');
    const [sortKey, setSortKey] = useState<SortKey>(initialViewState?.sortKey ?? 'value');
    const [sortDirection, setSortDirection] = useState<SortDirection>(initialViewState?.sortDirection ?? 'desc');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteError,setDeleteError]=useState('');
    const [deleting,setDeleting]=useState(false);
    const [showMobileDetails, setShowMobileDetails] = useState(initialViewState?.showMobileDetails ?? false);
    const [showMobileActions, setShowMobileActions] = useState(initialViewState?.showMobileActions ?? false);
    const [expandedGroups,setExpandedGroups] = useState<Set<string>>(() => new Set(initialViewState?.expandedGroups));
    useLayoutEffect(() => {
        onViewStateChange?.({ query, assetType, sortKey, sortDirection, showMobileDetails, showMobileActions, expandedGroups: [...expandedGroups] });
    }, [query, assetType, sortKey, sortDirection, showMobileDetails, showMobileActions, expandedGroups, onViewStateChange]);
    const hasActionHandlers = Boolean(onDelete || onEdit || onAddPurchase || onSell || onTransfer);

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
    const processedAssets=processed.grouped;
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

        <DashboardAssetRow lot={isLot} key={asset.id} data-position-kind={asset.isGroup?'group':isLot?'lot':'asset'} onClick={() => onViewDetails?.(asset)}>
            <DashboardAssetCell  column="asset"   >
                <DashboardAssetIdentity name={<>{asset.name}</>} symbol={asset.symbol} isin={asset.isin !== asset.symbol ? asset.isin : undefined} onOpen={e => { e.stopPropagation(); onViewDetails?.(asset); }} ariaLabel={`Ver detalles de ${asset.name}`}>{asset.mixedPrices && asset.isGroup && asset.estimatedCount===0 && <small>Precio medio de valoración</small>}{asset.estimatedCount>0 && <small>Valor con estimaciones al coste</small>}<small>{asset.mixedDates ? 'Varias fechas de valoración' : asset.quotedAt && Number.isFinite(Date.parse(asset.quotedAt))
                        ? 'Valoración: ' + new Date(asset.quotedAt).toLocaleDateString('es-ES')
                        : 'Fecha de valoración no disponible'}</small>{asset.isGroup && <DashboardTableButton appearance="lots" type="button" aria-expanded={expandedGroups.has(asset.id)} onClick={event=>{event.stopPropagation();toggleGroup(asset.id);}}>
                        {expandedGroups.has(asset.id)?<ChevronUp size={14}/>:<ChevronDown size={14}/>} {asset.lots.length} registros
                    </DashboardTableButton>}{isLot && <small>Compra: {new Date(`${asset.purchaseDate.slice(0,10)}T12:00:00`).toLocaleDateString('es-ES')}</small>}</DashboardAssetIdentity>
            </DashboardAssetCell>
            <DashboardAssetCell  column="optional"   >{formatQuantity(asset)}</DashboardAssetCell>
            <DashboardAssetCell  column="optional"   >{formatPrice(asset.purchasePrice)}</DashboardAssetCell>
            <DashboardAssetCell  column="price" optional  >
                <span className="assets-table__current-price">{asset.estimatedCount>0 && asset.isGroup ? 'N/D' : formatPrice(assetPrice(asset))}</span>
                {asset.estimatedCount>0 && <DashboardAssetEstimate  >Incluye estimaciones</DashboardAssetEstimate>}
            </DashboardAssetCell>
            <DashboardAssetCell  column="today"   >
                <DashboardAssetChange appearance="daily" tone={Number.isFinite(asset.latestChangePercent) && asset.latestChangePercent < 0
                    ? 'negative'
                    : Number.isFinite(asset.latestChangePercent) && asset.latestChangePercent > 0
                        ? 'positive'
                        : ''} percent={<>{formatPercent(asset.latestChangePercent)}</>} amount={<>{formatCurrency(asset.latestChange)}</>} date={<>{asset.isToday ? 'Hoy' : asset.quoteDay ? new Date(`${asset.quoteDay}T12:00:00`).toLocaleDateString('es-ES') : 'Fecha no disponible'}</>} />
            </DashboardAssetCell>
            <DashboardAssetCell  column="value"  valueEmphasis >
                {formatCurrency(asset.currentValue)}
                {asset.estimatedCount>0 && <DashboardAssetEstimate  >Incluye estimaciones</DashboardAssetEstimate>}
            </DashboardAssetCell>
            <DashboardAssetCell  column="gain"   >
                <DashboardAssetChange appearance="gain" tone={asset.changePercent > 0
                            ? 'positive'
                            : asset.changePercent < 0 ? 'negative' : ''} percent={<>
                        {formatPercent(asset.changePercent)}
                    </>} amount={<>
                        {formatCurrency(asset.gain)}
                    </>} />
            </DashboardAssetCell>
            <DashboardAssetCell  column="optional"   >
                <DashboardAssetWeight width={`${Math.min(asset.weight, 100)}%`}>{asset.weight.toFixed(1)}%</DashboardAssetWeight>
            </DashboardAssetCell>
            <DashboardAssetCell  column="mobile"   >
                <DashboardMobileFacts>
                    <DashboardMobileFact label={<>Cantidad</>} value={<>{formatQuantity(asset)}</>}></DashboardMobileFact>
                    <DashboardMobileFact label={<>Precio medio</>} value={<>{formatPrice(asset.purchasePrice)}</>}></DashboardMobileFact>
                    <DashboardMobileFact label={<>Precio actual</>} value={<>{asset.estimatedCount>0 && asset.isGroup ? 'N/D' : formatPrice(assetPrice(asset))}</>}>{asset.estimatedCount>0 && <DashboardAssetEstimate as="span" >Estimado al coste</DashboardAssetEstimate>}</DashboardMobileFact>
                    <DashboardMobileFact label={<>Peso</>} value={<>{asset.weight.toFixed(1)}%</>}></DashboardMobileFact>
                </DashboardMobileFacts>
            </DashboardAssetCell>
            {hasActionHandlers && (
                <DashboardAssetCell  column="actions"   >
                    <DashboardAssetActions id={`asset-actions-${asset.id}`}>
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
                        {onTransfer && asset.type === 'fund' && (canTransfer?.(asset) ?? true) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(event) => { event.stopPropagation(); onTransfer(asset); }}
                                icon={<ArrowLeftRight size={16} />}
                                aria-label={`Traspasar ${asset.symbol}`}
                                title="Traspasar a otro fondo"
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
                            <DashboardAssetActionButton destructive variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); handleDeleteClick(asset.id); }} icon={<Trash2 size={16} />} aria-label={`Eliminar ${asset.symbol}`} title="Eliminar activo"></DashboardAssetActionButton>
                        )}
                        </>}
                    </DashboardAssetActions>
                </DashboardAssetCell>
            )}
        </DashboardAssetRow>
    );

    if (assets.length === 0) {
        return (
            <DashboardAssetsCard >
                <CardHeader title="Mis Activos" subtitle="Desglose completo del portfolio" />
                <CardContent>
                    <DashboardAssetTableMessage empty >
                        No tienes activos en tu cartera. ¡Añade tu primera inversión!
                    </DashboardAssetTableMessage>
                </CardContent>
            </DashboardAssetsCard>
        );
    }

    return (
        <>
            <DashboardAssetsCard >
                <CardHeader
                    title="Mis Activos"
                    subtitle={`${groups.length} activos${assets.length>groups.length?` · ${assets.length} registros`:''} · Valor total: ${formatCurrency(totalValue)}`}
                    action={
                        <DashboardAssetMobileToolbar  aria-label="Opciones de Mis Activos">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMobileDetails((current) => !current)}
                                icon={showMobileDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                                aria-pressed={showMobileDetails}
                                title={showMobileDetails ? 'Ocultar información adicional' : 'Ver toda la información'}>
                                {showMobileDetails ? 'Ocultar' : 'Ver todo'}
                            </Button>
                            {hasActionHandlers && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowMobileActions((current) => !current)}
                                    icon={showMobileActions ? <PencilOff size={16} /> : <Pencil size={16} />}
                                    aria-pressed={showMobileActions}
                                    title={showMobileActions ? 'Ocultar acciones' : 'Editar y gestionar activos'}>
                                    {showMobileActions ? 'Cerrar' : 'Editar'}
                                </Button>
                            )}
                        </DashboardAssetMobileToolbar>
                    }
                />
                <CardContent>
                    <DashboardAssetFilters  >
                        <DashboardFilterField controlId={`${filterId}-query`} label="Buscar activo">
                            <input id={`${filterId}-query`} type="search" placeholder="Nombre, símbolo o ISIN" value={query} onChange={e => setQuery(e.target.value)} />
                        </DashboardFilterField>
                        <DashboardFilterField controlId={`${filterId}-type`} label="Tipo de activo">
                            <select id={`${filterId}-type`} value={assetType} onChange={e => setAssetType(e.target.value as Asset['type'] | 'all')}>
                                <option value="all">Todos</option>
                                <option value="fund">Fondos</option>
                                <option value="stock">Acciones</option>
                                <option value="etf">ETF</option>
                                <option value="crypto">Criptomonedas</option>
                                <option value="cash">Liquidez</option>
                            </select>
                        </DashboardFilterField>
                        {(query || assetType !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setAssetType('all'); }}>Limpiar filtros</Button>}
                    </DashboardAssetFilters>
                    {(query || assetType !== 'all') && <DashboardAssetTableMessage  role="status">{sortedAssets.length} de {processedAssets.length} activos · Los pesos se calculan sobre toda tu cartera.</DashboardAssetTableMessage>}
                    {sortedAssets.length === 0 && <DashboardAssetTableMessage empty >No hay activos que coincidan con los filtros.</DashboardAssetTableMessage>}
                    <DashboardAssetsGrid showDetails={showMobileDetails} showActions={showMobileActions}>
                            <thead>
                                <tr>
                                    <DashboardAssetCell as="th" column="asset"   aria-sort={sortKey === 'symbol' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                                        <DashboardTableButton appearance="sort" type="button" onClick={() => handleSort('symbol')}>Activo <SortIcon column="symbol" sortKey={sortKey} sortDirection={sortDirection} /></DashboardTableButton>
                                    </DashboardAssetCell>
                                    <DashboardAssetCell as="th" column="optional"   >Cantidad</DashboardAssetCell>
                                    <DashboardAssetCell as="th" column="optional"   >Precio medio</DashboardAssetCell>
                                    <DashboardAssetCell as="th" column="price" optional  >
                                        <span className="assets-table__current-price-label">Precio Actual</span>
                                    </DashboardAssetCell>
                                    <DashboardAssetCell as="th" column="today"   aria-sort={sortKey === 'today' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                                        <DashboardTableButton appearance="sort" type="button" onClick={() => handleSort('today')} title="Ordenar por variación de la última cotización, cuya fecha se indica en cada fila">Variación <SortIcon column="today" sortKey={sortKey} sortDirection={sortDirection} /></DashboardTableButton>
                                    </DashboardAssetCell>
                                    <DashboardAssetCell as="th" column="value"   aria-sort={sortKey === 'value' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                                        <DashboardTableButton appearance="sort" type="button" onClick={() => handleSort('value')}>Valor <SortIcon column="value" sortKey={sortKey} sortDirection={sortDirection} /></DashboardTableButton>
                                    </DashboardAssetCell>
                                    <DashboardAssetCell as="th" column="gain"   aria-sort={sortKey === 'change' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                                        <DashboardTableButton appearance="sort" type="button" onClick={() => handleSort('change')}>Ganancia <SortIcon column="change" sortKey={sortKey} sortDirection={sortDirection} /></DashboardTableButton>
                                    </DashboardAssetCell>
                                    <DashboardAssetCell as="th" column="optional"   aria-sort={sortKey === 'weight' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                                        <DashboardTableButton appearance="sort" type="button" onClick={() => handleSort('weight')}>Peso <SortIcon column="weight" sortKey={sortKey} sortDirection={sortDirection} /></DashboardTableButton>
                                    </DashboardAssetCell>
                                    {hasActionHandlers && <DashboardAssetCell as="th" column="actions"   >Acciones</DashboardAssetCell>}
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
                        </DashboardAssetsGrid>
                </CardContent>
            </DashboardAssetsCard>

            {/* Delete Confirmation Dialog */}
            {deleteError && <p role="alert">{deleteError}</p>}
            <ConfirmDialog
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar registro?"
                message={assetToDelete
                    ? `Eliminarás el registro de ${assetToDelete.name} (${assetToDelete.symbol}) con ${formatQuantity(assetToDelete)} unidades y precio medio ${formatPrice(assetToDelete.purchasePrice)}. Para una venta usa «Vender». Si era una entrada errónea, podrás clasificarla en «Ver motivo» del resumen. El registro eliminado no se recupera al deshacer esa clasificación.`
                    : '¿Estás seguro de que quieres eliminar este activo?'}
                confirmText={deleting?'Eliminando…':'Eliminar'}
                cancelText="Cancelar"
                variant="danger"
            />
        </>
    );
});
