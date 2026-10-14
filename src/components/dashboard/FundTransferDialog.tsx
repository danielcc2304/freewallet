import { useState, type FormEvent } from 'react';
import { Button, Modal } from '../ui';
import type { Asset } from '../../types/types';
import './FundTransferDialog.css';

interface FundTransferDialogProps {
    source: Asset;
    destinations: Asset[];
    onClose: () => void;
    onSubmit: (sourceId: string, destinationId: string, amount: number, transferAll: boolean, executionPrices: { sourcePrice?: number; destinationPrice?: number }) => Promise<void>;
}

function parseAmount(value: string): number {
    const normalized = value.trim().replace(/\s/g, '');
    if (!normalized) return NaN;
    const decimal = normalized.includes(',') ? normalized.replace(/\./g, '').replace(',', '.') : normalized;
    return Number(decimal);
}

function currency(value: number): string {
    return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function unitPrice(value: number): string {
    return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

function units(value: number): string {
    return Number.isFinite(value) ? value.toLocaleString('es-ES', { maximumFractionDigits: 10 }) : '—';
}

function quoteDate(asset: Asset): string {
    const date = asset.quotedAt || asset.lastQuoteAt;
    return date && Number.isFinite(Date.parse(date)) ? new Date(date).toLocaleDateString('es-ES') : 'fecha no disponible';
}

export function FundTransferDialog({ source, destinations, onClose, onSubmit }: FundTransferDialogProps) {
    const [destinationId, setDestinationId] = useState(destinations[0]?.id ?? '');
    const [amountInput, setAmountInput] = useState('');
    const [sourceExecutionPriceInput, setSourceExecutionPriceInput] = useState('');
    const [destinationExecutionPriceInput, setDestinationExecutionPriceInput] = useState('');
    const [transferAll, setTransferAll] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const destination = destinations.find(asset => asset.id === destinationId);
    const sourcePrice = source.currentPrice ?? NaN;
    const destinationPrice = destination?.currentPrice ?? NaN;
    const availableValue = source.quantity * sourcePrice;
    const requestedAmount = transferAll ? availableValue : parseAmount(amountInput);
    const sourceUnits = transferAll ? source.quantity : Math.min(source.quantity, Math.round((requestedAmount / sourcePrice) * 1e12) / 1e12);
    const hasSourceExecutionPrice = sourceExecutionPriceInput.trim() !== '';
    const hasDestinationExecutionPrice = destinationExecutionPriceInput.trim() !== '';
    const sourceExecutionPrice = hasSourceExecutionPrice ? parseAmount(sourceExecutionPriceInput) : sourcePrice;
    const destinationExecutionPrice = hasDestinationExecutionPrice ? parseAmount(destinationExecutionPriceInput) : destinationPrice;
    const amount = sourceUnits * sourceExecutionPrice;
    const destinationUnits = Math.round((amount / destinationExecutionPrice) * 1e12) / 1e12;
    const destinationAmount = destinationUnits * destinationExecutionPrice;
    const basis = sourceUnits * source.purchasePrice;
    const canSubmit = !!destination && Number.isFinite(requestedAmount) && requestedAmount > 0 && requestedAmount <= availableValue + .005
        && Number.isFinite(sourceExecutionPrice) && sourceExecutionPrice > 0 && Number.isFinite(destinationExecutionPrice) && destinationExecutionPrice > 0
        && Number.isFinite(sourceUnits) && sourceUnits > 0 && Number.isFinite(destinationUnits) && destinationUnits > 0;

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!destination || !canSubmit || saving) return;
        setSaving(true);
        setError('');
        try {
            await onSubmit(source.id, destination.id, requestedAmount, transferAll, {
                ...(hasSourceExecutionPrice ? { sourcePrice: sourceExecutionPrice } : {}),
                ...(hasDestinationExecutionPrice ? { destinationPrice: destinationExecutionPrice } : {}),
            });
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'No se ha podido registrar el traspaso.');
            setSaving(false);
        }
    };

    return <Modal isOpen onClose={onClose} title={`Traspasar ${source.name}`} size="md">
        <form className="fund-transfer" onSubmit={submit}>
            <p className="fund-transfer__notice">FreeWallet no envía órdenes a tu entidad. Cuando tengas los datos de ejecución, introdúcelos abajo. Si dejas los precios en blanco, se usarán las últimas valoraciones y el traspaso quedará marcado como estimado.</p>
            {destinations.length ? <>
                <div className="fund-transfer__source">Origen: <strong>{source.name} · {source.symbol}</strong></div>
                <label className="fund-transfer__field">
                    <span>Fondo de destino</span>
                    <select value={destinationId} onChange={event => { setDestinationId(event.target.value); setDestinationExecutionPriceInput(''); }} required>
                        {destinations.map(asset => <option key={asset.id} value={asset.id}>{asset.name} · {asset.symbol}</option>)}
                    </select>
                </label>
                <label className="fund-transfer__field">
                    <span>Importe estimado (€)</span>
                    <input type="text" inputMode="decimal" placeholder="0,00" value={amountInput} disabled={transferAll}
                        onChange={event => setAmountInput(event.target.value)} aria-describedby="fund-transfer-availability" />
                    <small id="fund-transfer-availability">El importe elige cuántas participaciones de origen trasladar según la última valoración: {currency(availableValue)} · origen {quoteDate(source)}{destination ? ` · destino ${quoteDate(destination)}` : ''}.</small>
                </label>
                <div className="fund-transfer__execution-grid">
                    <label className="fund-transfer__field">
                        <span>Precio real de venta del origen (€/participación)</span>
                        <input type="text" inputMode="decimal" placeholder={Number.isFinite(sourcePrice) ? unitPrice(sourcePrice) : 'Última valoración'} value={sourceExecutionPriceInput}
                            onChange={event => setSourceExecutionPriceInput(event.target.value)} />
                        <small>En blanco: última valoración {Number.isFinite(sourcePrice) ? unitPrice(sourcePrice) : 'no disponible'}.</small>
                    </label>
                    <label className="fund-transfer__field">
                        <span>Precio real de compra del destino (€/participación)</span>
                        <input type="text" inputMode="decimal" placeholder={Number.isFinite(destinationPrice) ? unitPrice(destinationPrice) : 'Última valoración'} value={destinationExecutionPriceInput}
                            onChange={event => setDestinationExecutionPriceInput(event.target.value)} />
                        <small>En blanco: última valoración {Number.isFinite(destinationPrice) ? unitPrice(destinationPrice) : 'no disponible'}.</small>
                    </label>
                </div>
                <label className="fund-transfer__full">
                    <input type="checkbox" checked={transferAll} onChange={event => { setTransferAll(event.target.checked); setAmountInput(''); }} />
                    <span>Traspasar la posición completa ({units(source.quantity)} participaciones)</span>
                </label>
                <dl className="fund-transfer__preview">
                    <div><dt>{hasSourceExecutionPrice ? 'Importe de venta' : 'Importe de venta estimado'}</dt><dd>{Number.isFinite(amount) && amount > 0 ? currency(amount) : '—'}</dd></div>
                    <div><dt>Participaciones de origen</dt><dd>{units(sourceUnits)}</dd></div>
                    <div><dt>{hasDestinationExecutionPrice ? 'Precio real de compra' : 'Precio de compra estimado'}</dt><dd>{Number.isFinite(destinationExecutionPrice) ? unitPrice(destinationExecutionPrice) : '—'}</dd></div>
                    <div><dt>{hasDestinationExecutionPrice ? 'Importe de compra' : 'Importe de compra estimado'}</dt><dd>{Number.isFinite(destinationAmount) && destinationAmount > 0 ? currency(destinationAmount) : '—'}</dd></div>
                    <div><dt>Participaciones de destino</dt><dd>{units(destinationUnits)}</dd></div>
                    <div><dt>Coste de compra que se conserva</dt><dd>{Number.isFinite(basis) && basis >= 0 ? currency(basis) : '—'}</dd></div>
                </dl>
                <p className="fund-transfer__disclaimer">Las participaciones se calculan con el precio de venta dividido por el precio de compra. El coste fiscal de origen se conserva aunque cambie el valor de mercado; revisa los datos ejecutados en tu entidad antes de registrarlo.</p>
            </> : <p role="status">No hay otro fondo con una valoración válida al que trasladar esta posición.</p>}
            {error && <p className="fund-transfer__error" role="alert">{error}</p>}
            <div className="fund-transfer__actions">
                <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={!canSubmit || saving} loading={saving}>Registrar traspaso</Button>
            </div>
        </form>
    </Modal>;
}
