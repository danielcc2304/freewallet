import { normalizeIsin } from './finect/finectService';
import type { Asset, PortfolioTransaction } from '../types/types';

/** Zero-unit draft; the transfer itself supplies units and carried tax cost. */
export type NewTransferFund = Asset;
export interface TransferExecutionPrices { sourcePrice?: number; destinationPrice?: number }

/** Build both positions and their one ledger entry before the atomic storage commit. */
export function prepareFundTransfer(previous: Asset[], sourceId: string, destinationId: string, amount: number, transferAll: boolean, executionPrices: TransferExecutionPrices, day: string, newDestination?: NewTransferFund): { assets: Asset[]; transaction: Omit<PortfolioTransaction, 'id' | 'createdAt'> } {
    const assets = previous;
    const source = assets.find(asset => asset.id === sourceId);
    const existing = assets.find(asset => asset.id === destinationId);
    if (newDestination && (existing || newDestination.id !== destinationId || newDestination.quantity !== 0 || newDestination.purchasePrice !== 0))
        throw new Error('El nuevo fondo debe partir sin participaciones ni coste.');
    if (newDestination) normalizeIsin(newDestination.isin || newDestination.symbol);
    const destination = existing ?? newDestination;
    if (!source || !destination || source.id === destination.id || source.type !== 'fund' || destination.type !== 'fund')
        throw new Error('Elige dos fondos distintos para registrar el traspaso.');
    const identity = (asset: Asset) => (asset.isin || asset.symbol).replace(/\s/g, '').toUpperCase();
    if (newDestination && (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(identity(newDestination)) || !newDestination.name.trim()
        || assets.some(asset => identity(asset) === identity(newDestination))))
        throw new Error('Introduce un ISIN y nombre válidos de un fondo que aún no esté en tu cartera.');
    if (identity(source) === identity(destination))
        throw new Error('El fondo de destino debe ser distinto al de origen.');
    if (!Number.isFinite(source.currentPrice) || source.currentPrice! <= 0 || !Number.isFinite(destination.currentPrice) || destination.currentPrice! <= 0
        || (source.currency && source.currency !== 'EUR') || (destination.currency && destination.currency !== 'EUR'))
        throw new Error('Hace falta una última valoración válida en euros para los dos fondos.');
    const sourceExecutionPrice = executionPrices.sourcePrice ?? source.currentPrice!;
    const destinationExecutionPrice = executionPrices.destinationPrice ?? destination.currentPrice!;
    if (!Number.isFinite(sourceExecutionPrice) || sourceExecutionPrice <= 0 || !Number.isFinite(destinationExecutionPrice) || destinationExecutionPrice <= 0)
        throw new Error('Los precios de ejecución deben ser mayores que cero.');
    if (!Number.isFinite(source.quantity) || source.quantity <= 0 || !Number.isFinite(source.purchasePrice) || source.purchasePrice < 0)
        throw new Error('La posición de origen no tiene participaciones o coste válido.');
    if (!Number.isFinite(destination.quantity) || destination.quantity < 0 || !Number.isFinite(destination.purchasePrice) || destination.purchasePrice < 0)
        throw new Error('La posición de destino no tiene participaciones o coste válido.');
    const sourceValue = source.quantity * source.currentPrice!;
    if (!Number.isFinite(sourceValue)) throw new Error('No se ha podido calcular el valor del traspaso.');
    if (!transferAll && (!Number.isFinite(amount) || amount <= 0 || amount > sourceValue + .005))
        throw new Error('El importe debe ser mayor que cero y no superar el valor de la posición.');
    const sourceQuantity = transferAll ? source.quantity : Math.min(source.quantity, Math.round((amount / source.currentPrice!) * 1e12) / 1e12);
    const transferredValue = sourceQuantity * sourceExecutionPrice;
    const destinationQuantity = Math.round((transferredValue / destinationExecutionPrice) * 1e12) / 1e12;
    if (!Number.isFinite(destination.quantity + destinationQuantity)) throw new Error('No se han podido calcular las participaciones de destino.');
    const transferBasis = Math.min(source.purchasePrice * sourceQuantity, source.purchasePrice * source.quantity);
    if (!Number.isFinite(transferredValue) || !Number.isFinite(transferBasis) || sourceQuantity <= 0 || destinationQuantity <= 0 || transferredValue <= 0)
        throw new Error('El importe es demasiado pequeño para calcular participaciones válidas.');
    const remaining = Math.max(0, source.quantity - sourceQuantity);
    const destinationTotalQuantity = destination.quantity + destinationQuantity;
    const nextAssets = [...assets, ...(existing ? [] : [destination])].flatMap(asset => {
        if (asset.id === source.id) return remaining > 1e-10 ? [{ ...asset, quantity: remaining }] : [];
        if (asset.id === destination.id) return [{ ...asset,
            quantity: destinationTotalQuantity,
            purchasePrice: (asset.purchasePrice * asset.quantity + transferBasis) / destinationTotalQuantity,
            purchaseDate: asset.purchaseDate < source.purchaseDate ? asset.purchaseDate : source.purchaseDate,
        }];
        return [asset];
    });
    return { assets: nextAssets, transaction: {
        assetId: source.id, assetSymbol: source.symbol, assetName: source.name, assetType: source.type,
        type: 'transfer', date: day, quantity: sourceQuantity, price: sourceExecutionPrice, total: transferredValue,
        transferToAssetId: destination.id, transferToAssetSymbol: destination.symbol, transferToAssetName: destination.name,
        transferToAssetType: destination.type, transferQuantity: destinationQuantity, transferToPrice: destinationExecutionPrice, transferBasis,
        estimated: executionPrices.sourcePrice === undefined || executionPrices.destinationPrice === undefined,
        notes: 'Traspaso interno registrado en FreeWallet; no ejecuta la operación en la entidad.',
    } };
}
