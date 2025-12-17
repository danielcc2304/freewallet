import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Calendar, DollarSign, Hash, ArrowLeft, Check, AlertCircle, Edit3 } from 'lucide-react';
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

    // Check if we are in edit mode
    const editAsset = location.state?.editAsset as Asset | undefined;
    const isEditMode = !!editAsset;

    const [formData, setFormData] = useState<FormData>({
        symbol: editAsset?.symbol || '',
        name: editAsset?.name || '',
        type: editAsset?.type || 'fund',
        purchasePrice: editAsset?.purchasePrice.toString() || '',
        purchaseDate: editAsset?.purchaseDate || new Date().toISOString().split('T')[0],
        quantity: editAsset?.quantity.toString() || '',
        isin: editAsset?.isin || '',
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [searchQuery, setSearchQuery] = useState(editAsset?.symbol || '');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [manualMode, setManualMode] = useState(isEditMode); // Default to manual in edit mode
    const [noResultsFound, setNoResultsFound] = useState(false);

    // Detect if search query looks like an ISIN
    const isISIN = (query: string): boolean => {
        // ISIN format: 2 letters + 10 alphanumeric characters (e.g., IE00BYX5NX33)
        return /^[A-Z]{2}[A-Z0-9]{10}$/i.test(query.trim());
    };

    // Debounced search - only if not in edit mode (or if user clears it)
    useEffect(() => {
        if (isEditMode && searchQuery === editAsset?.symbol) return;

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
    }, [searchQuery, isEditMode, editAsset]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setFormData(prev => ({ ...prev, symbol: value }));
        // Only reset name if we are not editing or if the symbol changed significantly
        if (!isEditMode) {
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
        // If it looks like an ISIN, set it in the ISIN field and use it as symbol
        const query = searchQuery.trim().toUpperCase();
        if (isISIN(query)) {
            setFormData(prev => ({
                ...prev,
                symbol: query,
                isin: query,
                type: 'fund', // ISINs are typically funds
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
                // Update existing asset
                updateAsset(editAsset.id, {
                    symbol: formData.symbol.toUpperCase(),
                    name: formData.name || formData.symbol,
                    type: formData.type,
                    purchasePrice: parseFloat(formData.purchasePrice),
                    purchaseDate: formData.purchaseDate,
                    quantity: parseFloat(formData.quantity),
                    isin: formData.isin || undefined,
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
                    currentPrice: parseFloat(formData.purchasePrice), // Will be updated by API
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
                            <h2>{isEditMode ? '¡Activo Actualizado!' : '¡Inversión Añadida!'}</h2>
                            <p>{formData.name || formData.symbol} se ha {isEditMode ? 'actualizado' : 'añadido'} correctamente</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                    title={isEditMode ? "Editar Inversión" : "Añadir Inversión"}
                    subtitle={isEditMode ? "Modifica los datos de tu inversión" : "Introduce los datos de tu nueva inversión"}
                />
                <CardContent>
                    <form onSubmit={handleSubmit} className="add-investment__form">
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
                                    disabled={isEditMode} // Disable symbol editing in edit mode to prevent ID confusion? Or allow it? Let's allow but careful.
                                // Actually usually we don't change symbol on edit, but maybe quantity/price.
                                // User might want to fix a mistake though.
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
                                {noResultsFound && !isSearching && searchQuery.length >= 2 && !isEditMode && (
                                    <div className="no-results">
                                        <AlertCircle size={18} />
                                        <div className="no-results__text">
                                            <p>No se encontró "{searchQuery}"</p>
                                            <span>
                                                {isISIN(searchQuery)
                                                    ? 'Los fondos europeos con ISIN no están en la base de datos, pero puedes añadirlo manualmente.'
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
                            {/* Manual mode indicator */}
                            {manualMode && (
                                <div className="manual-mode-badge">
                                    <Edit3 size={14} />
                                    <span>Modo manual</span>
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
                                    label="Precio de Compra (€)"
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
                                    label="Cantidad"
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
                                {isEditMode ? 'Guardar Cambios' : 'Añadir Inversión'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
