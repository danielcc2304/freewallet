import { useState, type FormEvent } from 'react';
import { Button, Modal } from '../ui';
import type { Asset } from '../../types/types';
import './FundTransferDialog.css';

interface FundTransferDialogProps {
    source: Asset;
    destinations: Asset[];
    onClose: () => void;
    onSubmit: (sourceId: string, destinationId: string, amount: number, transferAll: boolean) => Promise<void>;
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
    const [transferAll, setTransferAll] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const destination = destinations.find(asset => asset.id === destinationId);
    const sourcePrice = source.currentPrice ?? NaN;
    const destinationPrice = destination?.currentPrice ?? NaN;
    const availableValue = source.quantity * sourcePrice;
    const requestedAmount = transferAll ? availableValue : parseAmount(amountInput);
    const sourceUnits = transferAll ? source.quantity : Math.min(source.quantity, Math.round((requestedAmount / sourcePrice) * 1e12) / 1e12);
    const amount = sourceUnits * sourcePrice;
    const destinationUnits = Math.round((amount / destinationPrice) * 1e12) / 1e12;
    const basis = sourceUnits * source.purchasePrice;
    const canSubmit = !!destination && Number.isFinite(requestedAmount) && requestedAmount > 0 && requestedAmount <= availableValue + .005
        && Number.isFinite(sourceUnits) && sourceUnits > 0 && Number.isFinite(destinationUnits) && destinationUnits > 0;

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!destination || !canSubmit || saving) return;
        setSaving(true);
        setError('');
        try {
            await onSubmit(source.id, destination.id, requestedAmount, transferAll);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'No se ha podido registrar el traspaso.');
            setSaving(false);
        }
    };

    return <Modal isOpen onClose={onClose} title={`Traspasar ${source.name}`} size="md">
        <form className="fund-transfer" onSubmit={submit}>
            <p className="fund-transfer__notice">Esto registra el movimiento en FreeWallet y conserva el coste de compra. No envía ninguna orden a tu entidad; confirma allí la operación.</p>
            {destinations.length ? <>
                <div className="fund-transfer__source">Origen: <strong>{source.name} · {source.symbol}</strong></div>
                <label className="fund-transfer__field">
                    <span>Fondo de destino</span>
                    <select value={destinationId} onChange={event => setDestinationId(event.target.value)} required>
                        {destinations.map(asset => <option key={asset.id} value={asset.id}>{asset.name} · {asset.symbol}</option>)}
                    </select>
                </label>
                <label className="fund-transfer__field">
                    <span>Importe estimado (€)</span>
                    <input type="text" inputMode="decimal" placeholder="0,00" value={amountInput} disabled={transferAll}
                        onChange={event => setAmountInput(event.target.value)} aria-describedby="fund-transfer-availability" />
                    <small id="fund-transfer-availability">Disponible según las últimas valoraciones: {currency(availableValue)} · origen {quoteDate(source)}{destination ? ` · destino ${quoteDate(destination)}` : ''}</small>
                </label>
                <label className="fund-transfer__full">
                    <input type="checkbox" checked={transferAll} onChange={event => { setTransferAll(event.target.checked); setAmountInput(''); }} />
                    <span>Traspasar la posición completa ({units(source.quantity)} participaciones)</span>
                </label>
                <dl className="fund-transfer__preview">
                    <div><dt>Valor trasladado</dt><dd>{Number.isFinite(amount) && amount > 0 ? currency(amount) : '—'}</dd></div>
                    <div><dt>Participaciones de origen</dt><dd>{units(sourceUnits)}</dd></div>
                    <div><dt>Participaciones de destino</dt><dd>{units(destinationUnits)}</dd></div>
                    <div><dt>Coste de compra que se conserva</dt><dd>{Number.isFinite(basis) && basis >= 0 ? currency(basis) : '—'}</dd></div>
                </dl>
                <p className="fund-transfer__disclaimer">El cálculo usa el último precio guardado de cada fondo. Las fechas pueden ser distintas; revisa el importe y las participaciones definitivas en tu entidad.</p>
            </> : <p role="status">No hay otro fondo con una valoración válida al que trasladar esta posición.</p>}
            {error && <p className="fund-transfer__error" role="alert">{error}</p>}
            <div className="fund-transfer__actions">
                <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={!canSubmit || saving} loading={saving}>Registrar traspaso</Button>
            </div>
        </form>
    </Modal>;
}
