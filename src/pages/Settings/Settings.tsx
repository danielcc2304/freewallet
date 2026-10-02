import { Sun, Moon, Monitor, Trash2, Database, Info, Power } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, ConfirmDialog } from '../../components/ui';
import { APP_NAME, APP_VERSION } from '../../constants/app';
import { useTheme } from '../../context/ThemeContext';
import { useAppearance } from '../../context/AppearanceContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { useState } from 'react';
import { clearAllData, isApiEnabled, updateSettings } from '../../services/storageService';
import { getFinnhubApiKey, setFinnhubApiKey as setFinnhubApiKeyAction } from '../../services/apiService';
import './Settings.css';
import {useAccount} from '../../context/AccountContext';
import {portfolioStorage} from '../../services/portfolioCloudStorage';

type ThemeMode = 'light' | 'dark' | 'system';

export function Settings() {
    const account=useAccount();
    const { themeMode, setThemeMode } = useTheme();
    const { appearance, setAppearance } = useAppearance();
    const { state, loadDemoData } = usePortfolio();
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showDemoConfirm, setShowDemoConfirm] = useState(false);
    const [finnhubKey, setFinnhubKey] = useState(getFinnhubApiKey());
    const [apiEnabled, setApiEnabled] = useState(isApiEnabled());
    const [saveError,setSaveError]=useState('');const [saving,setSaving]=useState(false);

    const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
        { value: 'light', label: 'Claro', icon: <Sun size={20} /> },
        { value: 'dark', label: 'Oscuro', icon: <Moon size={20} /> },
        { value: 'system', label: 'Sistema', icon: <Monitor size={20} /> },
    ];

    const handleClearData = () => {
        clearAllData();
        window.location.href = '/'; // Reload to root to reset state
    };

    const handleLoadDemo = () => {
        loadDemoData();
        setShowDemoConfirm(false);
    };

    const handleApiToggle = async () => {
        if(saving)return;setSaving(true);setSaveError('');
        const nextValue = !apiEnabled;
        try{updateSettings({ apiEnabled: nextValue });await portfolioStorage.flush();setApiEnabled(nextValue);}
        catch(error){setSaveError(error instanceof Error?error.message:'No se pudo confirmar la configuración.');}
        finally{setSaving(false);}
    };

    return (
        <div className="settings">
            {saveError&&<p role="alert">{saveError}</p>}
            <div className="settings__header">
                <h1 className="settings__title">Configuración</h1>
                <p className="settings__subtitle">Personaliza tu experiencia</p>
            </div>

            {/* Theme Settings */}
            <Card className="settings__section">
                <CardHeader
                    title="Apariencia"
                    subtitle="Elige cómo se ve la aplicación"
                />
                <CardContent>
                    <div className="settings__theme-options">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                className={`theme-option ${themeMode === option.value ? 'theme-option--active' : ''}`}
                                onClick={() => setThemeMode(option.value)}
                            >
                                <div className="theme-option__icon">{option.icon}</div>
                                <span className="theme-option__label">{option.label}</span>
                                {themeMode === option.value && (
                                    <span className="theme-option__check">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="settings__hint">
                        {themeMode === 'system'
                            ? 'El tema cambiará automáticamente según la configuración de tu dispositivo'
                            : `Tema ${themeMode === 'dark' ? 'oscuro' : 'claro'} seleccionado`}
                    </p>

                    <div className="settings__appearance">
                        <div className="settings__appearance-copy">
                            <div className="settings__appearance-title">
                                <span>Estilo de interfaz</span>
                            </div>
                            <p className="settings__hint">
                                Añade un material óptico adaptable a navegación y controles sin cambiar el modo de color.
                            </p>
                        </div>
                        <div className="settings__appearance-options" role="group" aria-label="Estilo de interfaz">
                            <button
                                type="button"
                                className={`appearance-option ${appearance === 'standard' ? 'appearance-option--active' : ''}`}
                                onClick={() => setAppearance('standard')}
                                aria-pressed={appearance === 'standard'}
                            >
                                <span className="appearance-option__visual appearance-option__visual--standard" aria-hidden="true">
                                    <span />
                                    <span />
                                </span>
                                <span className="appearance-option__copy">
                                    <strong>Estándar</strong>
                                    <small>Superficies sólidas y directas</small>
                                </span>
                                {appearance === 'standard' && <span className="appearance-option__check">✓</span>}
                            </button>
                            <button
                                type="button"
                                className={`appearance-option ${appearance === 'liquid-glass' ? 'appearance-option--active' : ''}`}
                                onClick={() => setAppearance('liquid-glass')}
                                aria-pressed={appearance === 'liquid-glass'}
                            >
                                <span className="appearance-option__visual appearance-option__visual--glass" aria-hidden="true">
                                    <span />
                                    <span />
                                </span>
                                <span className="appearance-option__copy">
                                    <strong>Liquid Glass</strong>
                                    <small>Controles flotantes, profundidad y refracción</small>
                                </span>
                                {appearance === 'liquid-glass' && <span className="appearance-option__check">✓</span>}
                            </button>
                        </div>
                        <p className="settings__hint">
                            {appearance === 'liquid-glass'
                                ? 'Liquid Glass activado en toda la aplicación.'
                                : 'Apariencia estándar seleccionada.'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Data Settings */}
            <Card className="settings__section">
                <CardHeader
                    title="Datos"
                    subtitle="Gestiona los datos de tu portfolio"
                />
                <CardContent>
                    <div className="settings__data-info">
                        <div className="data-stat">
                            <Database size={20} />
                            <span>{state.assets.length} activos en tu portfolio</span>
                        </div>
                    </div>

                    <div className="settings__actions">
                        <Button
                            variant="secondary"
                            icon={<Database size={16} />}
                            onClick={() => setShowDemoConfirm(true)}
                            disabled={!!account.user}
                        >
                            Cargar Datos Demo
                        </Button>
                        <Button
                            variant="danger"
                            icon={<Trash2 size={16} />}
                            onClick={() => setShowClearConfirm(true)}
                            disabled={!!account.user}
                        >
                            Borrar Todos los Datos
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* API Settings */}
            <Card className="settings__section">
                <CardHeader
                    title="Mercado & APIs"
                    subtitle="Gestiona tus claves de API para mejorar la cobertura de datos"
                />
                <CardContent>
                    <div className="settings__api-config">
                        <div className="settings__toggle-card">
                            <div className="settings__toggle-copy">
                                <div className="settings__toggle-title">
                                    <Power size={18} />
                                    <span>Activar peticiones a APIs</span>
                                </div>
                                <p className="settings__hint">
                                    Por defecto estara desactivado. Mientras el dashboard sigue en construccion,
                                    puedes mantener el modo manual y activar las APIs solo cuando quieras probarlo.
                                </p>
                            </div>
                            <button
                                type="button"
                                className={`settings__toggle ${apiEnabled ? 'settings__toggle--active' : ''}`}
                                onClick={handleApiToggle}
                                disabled={saving}
                                aria-pressed={apiEnabled}
                            >
                                <span className="settings__toggle-thumb" />
                                <span className="settings__toggle-text">{apiEnabled ? 'On' : 'Off'}</span>
                            </button>
                        </div>

                        <div className="settings__input-group">
                            <label htmlFor="finnhub-key">Finnhub API Key</label>
                            <input
                                id="finnhub-key"
                                type="password"
                                className="settings__input"
                                value={finnhubKey}
                                onChange={(e) => setFinnhubKey(e.target.value)}
                                placeholder="Pega aquí tu clave de Finnhub"
                            />
                            <p className="settings__hint">
                                Esta clave se usa como respaldo cuando Yahoo Finance no devuelve datos.
                                Consigue una gratis en <a href="https://finnhub.io/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>finnhub.io</a>.
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            icon={<Info size={16} />}
                            onClick={() => {
                                setFinnhubApiKeyAction(finnhubKey);
                                alert('Clave guardada correctamente');
                            }}
                        >
                            Guardar Clave
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* About */}
            <Card className="settings__section">
                <CardHeader
                    title="Acerca de"
                    subtitle="Información de la aplicación"
                />
                <CardContent>
                    <div className="settings__about">
                        <Link to="/feature-log" className="about-item about-item--link">
                            <Info size={16} />
                            <span>{APP_NAME} v{APP_VERSION}</span>
                        </Link>
                        <p className="about-description">
                            Aplicación de gestión de portfolio de inversiones.
                            {account.user?'Tu cartera está vinculada a tu cuenta. Consulta el estado del guardado en Mi cuenta.':'Los datos se almacenan localmente en tu navegador.'}
                        </p>
                        <p className="about-api">
                            Datos de mercado proporcionados por Alpha Vantage y Finnhub.
                        </p>
                        <div className="about-links">
                            <Link to="/terms" className="settings__terms-link">
                                Ver Términos y Condiciones de Uso
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Confirm Dialogs */}
            <ConfirmDialog
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClearData}
                title="¿Borrar todos los datos?"
                message="Esta acción eliminará todos tus activos e historial. Esta acción no se puede deshacer."
                confirmText="Sí, borrar todo"
                cancelText="Cancelar"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={showDemoConfirm}
                onClose={() => setShowDemoConfirm(false)}
                onConfirm={handleLoadDemo}
                title="¿Cargar datos de demostración?"
                message="Esto reemplazará tus datos actuales con datos de ejemplo para explorar la aplicación."
                confirmText="Cargar demo"
                cancelText="Cancelar"
                variant="warning"
            />
        </div>
    );
}
