import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, Modal } from '../ui';
import type { Asset } from '../../types/types';
import { getFundRelevance, normalizeIsin } from '../../services/finect/finectService';
import { generateId, isApiEnabled } from '../../services/storageService';
import type { NewTransferFund } from '../../services/fundTransfer';
import './FundTransferDialog.css';

interface FundTransferDialogProps {
    source: Asset;
    destinations: Asset[];
    onClose: () => void;
    onSubmit: (sourceId: string, destinationId: string, amount: number, transferAll: boolean, executionPrices: { sourcePrice?: number; destinationPrice?: number }, newDestination?: NewTransferFund) => Promise<void>;
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
    const [newFund, setNewFund] = useState(destinations.length === 0);
    const [newId] = useState(generateId);
    const [isin, setIsin] = useState('');
    const [name, setName] = useState('');
    const [lookupPrice, setLookupPrice] = useState<number>();
    const [lookupDate, setLookupDate] = useState<string>();
    const [lookingUp, setLookingUp] = useState(false);
    const [lookupNotice, setLookupNotice] = useState('');
    const lookup = useRef<AbortController | null>(null);
    useEffect(() => () => lookup.current?.abort(), []);
    const [amountInput, setAmountInput] = useState('');
    const [sourceExecutionPriceInput, setSourceExecutionPriceInput] = useState('');
    const [destinationExecutionPriceInput, setDestinationExecutionPriceInput] = useState('');
    const [transferAll, setTransferAll] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const matching = destinations.find(asset => (asset.isin || asset.symbol).replace(/\s/g, '').toUpperCase() === isin);
    const sameSource = (source.isin || source.symbol).replace(/\s/g, '').toUpperCase() === isin;
    let validIsin = false;
    try { validIsin = normalizeIsin(isin) === isin; } catch { /* Incomplete or invalid identifier. */ }
    const validNewFund = validIsin && name.trim().length > 0 && !sameSource && !matching;
    const newDestination: Asset = { id: newId, symbol: isin, isin, name: name.trim(), type: 'fund', quantity: 0,
        purchasePrice: 0, purchaseDate: source.purchaseDate, currency: 'EUR', currentPrice: lookupPrice,
        ...(lookupDate ? { quotedAt: lookupDate, quoteSource: 'Finect' as const } : {}) };
    const destination = newFund ? validNewFund ? newDestination : undefined : destinations.find(asset => asset.id === destinationId);
    const findFund = async () => {
        lookup.current?.abort();
        const controller = new AbortController();
        lookup.current = controller;
        setLookingUp(true);
        setLookupNotice('');
        const deadline = window.setTimeout(() => controller.abort(), 15000);
        try {
            const fund = await getFundRelevance(isin, controller.signal);
            if (lookup.current !== controller || controller.signal.aborted) return;
            setName(fund.className || fund.name);
            if (fund.currencyCode === 'EUR' && Number.isFinite(fund.lastQuote?.price) && fund.lastQuote!.price! > 0) {
                setLookupPrice(fund.lastQuote!.price);
                setLookupDate(fund.lastQuote?.datetime);
                setLookupNotice('Fondo encontrado. Comprueba el precio de ejecución.');
            } else setLookupNotice('Fondo encontrado. Introduce el precio ejecutado en euros por participación.');
        } catch {
            if (lookup.current === controller) setLookupNotice('No se ha podido consultar el fondo. Puedes introducir su nombre y precio manualmente.');
        } finally {
            window.clearTimeout(deadline);
            if (lookup.current === controller) setLookingUp(false);
        }
    };
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
    const canSubmit = !lookingUp && !!destination && Number.isFinite(requestedAmount) && requestedAmount > 0 && requestedAmount <= availableValue + .005
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
            }, newFund ? { ...destination, currentPrice: lookupPrice ?? destinationExecutionPrice } : undefined);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'No se ha podido registrar el traspaso.');
            setSaving(false);
        }
    };

    return <Modal isOpen onClose={() => { if (!saving) onClose(); }} title={`Traspasar ${source.name}`} size="md">
        <form className="fund-transfer" onSubmit={submit}>
            <fieldset className="fund-transfer__fieldset" disabled={saving}>
            <p className="fund-transfer__notice">FreeWallet no envía órdenes a tu entidad. Cuando tengas los datos de ejecución, introdúcelos abajo. Si dejas los precios en blanco, se usarán las últimas valoraciones y el traspaso quedará marcado como estimado.</p>
            <>
                <div className="fund-transfer__source">Origen: <strong>{source.name} · {source.symbol}</strong></div>
                <div className="fund-transfer__destination-mode" role="group" aria-label="Tipo de destino">
                    <Button type="button" variant={!newFund ? 'primary' : 'secondary'} aria-pressed={!newFund} disabled={saving || !destinations.length} onClick={() => { setNewFund(false); setDestinationExecutionPriceInput(''); }}>Fondo existente</Button>
                    <Button type="button" variant={newFund ? 'primary' : 'secondary'} aria-pressed={newFund} disabled={saving} onClick={() => { setNewFund(true); setDestinationExecutionPriceInput(''); }}>Nuevo fondo</Button>
                </div>
                {newFund ? <div className="fund-transfer__new-fund">
                    <label className="fund-transfer__field">
                        <span>ISIN del nuevo fondo</span>
                        <input value={isin} maxLength={12} autoCapitalize="characters" placeholder="IE00…" required disabled={saving}
                            onChange={event => {
                                lookup.current?.abort(); lookup.current = null; setLookingUp(false);
                                setIsin(event.target.value.replace(/\s/g, '').toUpperCase());
                                setName(''); setLookupPrice(undefined); setLookupDate(undefined); setLookupNotice('');
                                setDestinationExecutionPriceInput('');
                            }} />
                    </label>
                    <Button type="button" variant="secondary" loading={lookingUp} disabled={saving || lookingUp || !isApiEnabled() || !validIsin || sameSource || !!matching} onClick={findFund}>Buscar fondo por ISIN</Button>
                    {isin.length === 12 && !validIsin && <p className="fund-transfer__error" role="alert">Revisa el ISIN: el formato o el dígito de control no es válido.</p>}
                    {sameSource && <p className="fund-transfer__error" role="alert">El destino debe ser distinto al fondo de origen.</p>}
                    {matching && <p role="status">Este fondo ya está en tu cartera. <Button type="button" variant="ghost" onClick={() => { setDestinationId(matching.id); setNewFund(false); setDestinationExecutionPriceInput(''); }}>Usar fondo existente</Button></p>}
                    {lookupNotice && <p role="status">{lookupNotice}</p>}
                    <label className="fund-transfer__field">
                        <span>Nombre del fondo</span>
                        <input value={name} maxLength={200} placeholder="Nombre y clase del fondo" required disabled={saving} onChange={event => setName(event.target.value)} />
                    </label>
                    <small>Se añadirá a tu cartera al registrar el traspaso. Puedes completar los datos manualmente.</small>
                </div> : <label className="fund-transfer__field">
                    <span>Fondo de destino</span>
                    <select value={destinationId} onChange={event => { setDestinationId(event.target.value); setDestinationExecutionPriceInput(''); }} required>
                        {destinations.map(asset => <option key={asset.id} value={asset.id}>{asset.name} · {asset.symbol}</option>)}
                    </select>
                </label>}
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
            </>
            {error && <p className="fund-transfer__error" role="alert">{error}</p>}
            <div className="fund-transfer__actions">
                <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={!canSubmit || saving} loading={saving}>Registrar traspaso</Button>
            </div>
            </fieldset>
        </form>
    </Modal>;
}
