import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Calendar, DollarSign, Hash, ArrowLeft, Check, AlertCircle, Edit3, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { searchSymbol } from '../services/apiService';
import { generateId } from '../services/storageService';
import { usePortfolio } from '../context/PortfolioContext';
import type { SearchResult, AssetType, Asset } from '../types/types';
import './AddInvestment.css';

interface FormData {
    symbol: string;
    name: string;
    type: AssetType;
    purchasePrice: string;
    purchaseDate: string;
    quantity: string;
    isin: string;
}

interface FormErrors {
    symbol?: string;
    name?: string;
    purchasePrice?: string;
    purchaseDate?: string;
    quantity?: string;
}

export function AddInvestment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { addAsset, updateAsset } = usePortfolio();

    // Check modes
    const editAsset = location.state?.editAsset as Asset | undefined;
    const dcaAsset = location.state?.dcaAsset as Asset | undefined;

    const isEditMode = !!editAsset;
    const isDcaMode = !!dcaAsset;
    const targetAsset = editAsset || dcaAsset;

    const [formData, setFormData] = useState<FormData>({
        symbol: targetAsset?.symbol || '',
        name: targetAsset?.name || '',
        type: targetAsset?.type || 'fund',
        // In DCA mode, start empty to ask for NEW purchase price. In Edit mode, show OLD price.
        purchasePrice: isEditMode ? targetAsset?.purchasePrice.toString() || '' : '',
        purchaseDate: new Date().toISOString().split('T')[0],
        // In DCA mode, start empty. In Edit mode, show OLD quantity.
        quantity: isEditMode ? targetAsset?.quantity.toString() || '' : '',
        isin: targetAsset?.isin || '',
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [searchQuery, setSearchQuery] = useState(targetAsset?.symbol || '');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [manualMode, setManualMode] = useState(!!targetAsset);
    const [noResultsFound, setNoResultsFound] = useState(false);

    // Detect if search query looks like an ISIN
    const isISIN = (query: string): boolean => {
        return /^[A-Z]{2}[A-Z0-9]{10}$/i.test(query.trim());
    };

    // Debounced search
    useEffect(() => {
        if ((isEditMode || isDcaMode) && searchQuery === targetAsset?.symbol) return;

        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                setNoResultsFound(false);
                const results = await searchSymbol(searchQuery);
                setSearchResults(results);
                setShowResults(true);
                setNoResultsFound(results.length === 0);
                setIsSearching(false);
            } else {
                setSearchResults([]);
                setShowResults(false);
                setNoResultsFound(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, isEditMode, isDcaMode, targetAsset]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setFormData(prev => ({ ...prev, symbol: value }));
        if (!targetAsset) {
            setFormData(prev => ({ ...prev, name: '' }));
            setManualMode(false);
        }
    };

    const handleSelectResult = (result: SearchResult) => {
        setFormData(prev => ({
            ...prev,
            symbol: result.symbol,
            name: result.name,
            type: result.type,
        }));
        setSearchQuery(result.symbol);
        setShowResults(false);
        setNoResultsFound(false);
        setManualMode(false);
        setErrors(prev => ({ ...prev, symbol: undefined }));
    };

    const handleManualEntry = () => {
        const query = searchQuery.trim().toUpperCase();
        if (isISIN(query)) {
            setFormData(prev => ({
                ...prev,
                symbol: query,
                isin: query,
                type: 'fund',
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                symbol: query,
            }));
        }
        setManualMode(true);
        setShowResults(false);
        setNoResultsFound(false);
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.symbol.trim()) {
            newErrors.symbol = 'El símbolo o ISIN es requerido';
        }

        if (manualMode && !formData.name.trim()) {
            newErrors.name = 'El nombre del activo es requerido';
        }

        const price = parseFloat(formData.purchasePrice);
        if (!formData.purchasePrice || isNaN(price) || price <= 0) {
            newErrors.purchasePrice = 'Introduce un precio válido mayor que 0';
        }

        if (!formData.purchaseDate) {
            newErrors.purchaseDate = 'La fecha de compra es requerida';
        }

        const qty = parseFloat(formData.quantity);
        if (!formData.quantity || isNaN(qty) || qty <= 0) {
            newErrors.quantity = 'Introduce una cantidad válida mayor que 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditMode && editAsset) {
                // Update existing asset (Overwrite)
                updateAsset(editAsset.id, {
                    symbol: formData.symbol.toUpperCase(),
                    name: formData.name || formData.symbol,
                    type: formData.type,
                    purchasePrice: parseFloat(formData.purchasePrice),
                    purchaseDate: formData.purchaseDate,
                    quantity: parseFloat(formData.quantity),
                    isin: formData.isin || undefined,
                });
            } else if (isDcaMode && dcaAsset) {
                // DCA Logic: Calculate weighted average
                const newQty = parseFloat(formData.quantity);
                const newPrice = parseFloat(formData.purchasePrice);
                const oldQty = dcaAsset.quantity;
                const oldAvgPrice = dcaAsset.purchasePrice;

                const totalQty = oldQty + newQty;
                // Calculate new average price: (OldVal + NewVal) / TotalQty
                const totalCost = (oldQty * oldAvgPrice) + (newQty * newPrice);
                const newAvgPrice = totalCost / totalQty;

                updateAsset(dcaAsset.id, {
                    quantity: totalQty,
                    purchasePrice: newAvgPrice,
                    purchaseDate: formData.purchaseDate,
                });
            } else {
                // Add new asset
                const newAsset: Asset = {
                    id: generateId(),
                    symbol: formData.symbol.toUpperCase(),
                    name: formData.name || formData.symbol,
                    type: formData.type,
                    purchasePrice: parseFloat(formData.purchasePrice),
                    purchaseDate: formData.purchaseDate,
                    quantity: parseFloat(formData.quantity),
                    isin: formData.isin || undefined,
                    currentPrice: parseFloat(formData.purchasePrice),
                    previousClose: parseFloat(formData.purchasePrice),
                };
                addAsset(newAsset);
            }

            setSubmitSuccess(true);

            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (error) {
            console.error('Error saving asset:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const assetTypes: { value: AssetType; label: string }[] = [
        { value: 'stock', label: 'Acción' },
        { value: 'etf', label: 'ETF' },
        { value: 'fund', label: 'Fondo' },
        { value: 'crypto', label: 'Crypto' },
    ];

    if (submitSuccess) {
        return (
            <div className="add-investment add-investment--success">
                <Card className="success-card">
                    <CardContent>
                        <div className="success-content">
                            <div className="success-content__icon">
                                <Check size={48} />
                            </div>
                            <h2>
                                {isEditMode ? '¡Activo Actualizado!' :
                                    isDcaMode ? '¡Compra Añadida!' : '¡Inversión Añadida!'}
                            </h2>
                            <p>{formData.name || formData.symbol} se ha {isEditMode ? 'actualizado' :
                                (isDcaMode ? 'promediado' : 'añadido')} correctamente</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getPageTitle = () => {
        if (isEditMode) return "Editar Inversión";
        if (isDcaMode) return "Añadir Compra (DCA)";
        return "Añadir Inversión";
    };

    const getPageSubtitle = () => {
        if (isEditMode) return "Modifica los datos de tu inversión";
        if (isDcaMode) return "Promedia tu precio de compra añadiendo más cantidad";
        return "Introduce los datos de tu nueva inversión";
    };

    return (
        <div className="add-investment">
            <div className="add-investment__header">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    icon={<ArrowLeft size={18} />}
                >
                    Volver
                </Button>
            </div>

            <Card className="add-investment__form-card">
                <CardHeader
                    title={getPageTitle()}
                    subtitle={getPageSubtitle()}
                />
                <CardContent>
                    <form onSubmit={handleSubmit} className="add-investment__form">

                        {/* DCA Current Position Info */}
                        {isDcaMode && dcaAsset && (
                            <div className="dca-info-box" style={{
                                background: 'var(--bg-tertiary)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1.5rem',
                                borderLeft: '4px solid var(--accent-primary)'
                            }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <TrendingUp size={16} color="var(--accent-primary)" />
                                    Posición Actual
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cantidad Total</span>
                                        <p style={{ fontWeight: '600', fontSize: '1.125rem' }}>{dcaAsset.quantity}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Precio Medio</span>
                                        <p style={{ fontWeight: '600', fontSize: '1.125rem' }}>{dcaAsset.purchasePrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Symbol / ISIN Search */}
                        <div className="form-group form-group--search">
                            <label className="form-label">Símbolo o ISIN</label>
                            <div className="search-container">
                                <Input
                                    placeholder="Ej: AAPL, MSFT, IE00BYX5NX33..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    icon={<Search size={18} />}
                                    error={errors.symbol}
                                    disabled={isEditMode || isDcaMode}
                                />
                                {showResults && searchResults.length > 0 && (
                                    <ul className="search-results">
                                        {searchResults.map((result) => (
                                            <li
                                                key={result.symbol}
                                                className="search-results__item"
                                                onClick={() => handleSelectResult(result)}
                                            >
                                                <span className="search-results__symbol">{result.symbol}</span>
                                                <span className="search-results__name">{result.name}</span>
                                                <span className="search-results__type">{result.type}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {isSearching && (
                                    <div className="search-loading">Buscando...</div>
                                )}
                                {/* No results found - show manual entry option */}
                                {noResultsFound && !isSearching && searchQuery.length >= 2 && !targetAsset && (
                                    <div className="no-results">
                                        <AlertCircle size={18} />
                                        <div className="no-results__text">
                                            <p>No se encontró "{searchQuery}"</p>
                                            <span>
                                                {isISIN(searchQuery)
                                                    ? 'ISIN no encontrado en la base de datos, pero puedes añadirlo manualmente.'
                                                    : 'Puedes añadir este activo manualmente.'}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleManualEntry}
                                            icon={<Edit3 size={14} />}
                                        >
                                            Añadir Manualmente
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {/* Selected asset indicator */}
                            {formData.name && (
                                <div className="selected-asset">
                                    <span className="selected-asset__symbol">{formData.symbol}</span>
                                    <span className="selected-asset__name">{formData.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Name field - only shown in manual mode */}
                        {manualMode && (
                            <div className="form-group">
                                <Input
                                    label="Nombre del Activo"
                                    placeholder="Ej: Fidelity MSCI World Index Fund"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    error={errors.name}
                                    disabled={isDcaMode} // Disable name edit in DCA mode
                                />
                            </div>
                        )}

                        {/* Asset Type */}
                        <div className="form-group">
                            <label className="form-label">Tipo de Activo</label>
                            <div className="asset-type-selector">
                                {assetTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        className={`asset-type-btn ${formData.type === type.value ? 'asset-type-btn--active' : ''
                                            }`}
                                        onClick={() => handleInputChange('type', type.value)}
                                        disabled={isDcaMode && formData.type !== type.value} // Disable changing type in DCA
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price, Quantity, Date in row */}
                        <div className="form-row">
                            <div className="form-group">
                                <Input
                                    label={isDcaMode ? "Precio de NUEVA Compra (€)" : "Precio de Compra (€)"}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.purchasePrice}
                                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                                    icon={<DollarSign size={18} />}
                                    error={errors.purchasePrice}
                                />
                            </div>

                            <div className="form-group">
                                <Input
                                    label={isDcaMode ? "Cantidad a AÑADIR" : "Cantidad"}
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    placeholder="0"
                                    value={formData.quantity}
                                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                                    icon={<Hash size={18} />}
                                    error={errors.quantity}
                                />
                            </div>

                            <div className="form-group">
                                <Input
                                    label="Fecha de Compra"
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                                    icon={<Calendar size={18} />}
                                    error={errors.purchaseDate}
                                />
                            </div>
                        </div>

                        {/* Optional ISIN - hidden if already set from manual mode */}
                        {!manualMode && (
                            <div className="form-group">
                                <Input
                                    label="ISIN (Opcional)"
                                    placeholder="IE00BYX5NX33"
                                    value={formData.isin}
                                    onChange={(e) => handleInputChange('isin', e.target.value)}
                                    hint="Identificador internacional para fondos europeos"
                                />
                            </div>
                        )}

                        {/* Show ISIN in manual mode if it was detected */}
                        {manualMode && formData.isin && (
                            <div className="form-group">
                                <Input
                                    label="ISIN"
                                    value={formData.isin}
                                    onChange={(e) => handleInputChange('isin', e.target.value)}
                                    disabled
                                />
                            </div>
                        )}

                        {/* Submit */}
                        <div className="form-actions">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate('/')}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                {isEditMode ? 'Guardar Cambios' :
                                    isDcaMode ? 'Añadir Compra' : 'Añadir Inversión'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
