import { Sun, Moon, Monitor, Trash2, Database, Info } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { usePortfolio } from '../context/PortfolioContext';
import { ConfirmDialog } from '../components/ui/Modal';
import { useState } from 'react';
import { clearAllData } from '../services/storageService';
import { getFinnhubApiKey, setFinnhubApiKey as setFinnhubApiKeyAction } from '../services/apiService';
import './Settings.css';

type ThemeMode = 'light' | 'dark' | 'system';

export function Settings() {
    const { themeMode, setThemeMode } = useTheme();
    const { state, loadDemoData } = usePortfolio();
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showDemoConfirm, setShowDemoConfirm] = useState(false);
    const [finnhubKey, setFinnhubKey] = useState(getFinnhubApiKey());

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

    return (
        <div className="settings">
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
                        >
                            Cargar Datos Demo
                        </Button>
                        <Button
                            variant="danger"
                            icon={<Trash2 size={16} />}
                            onClick={() => setShowClearConfirm(true)}
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
                        <div className="about-item">
                            <Info size={16} />
                            <span>FreeWallet v2.2.0</span>
                        </div>
                        <p className="about-description">
                            Aplicación de gestión de portfolio de inversiones.
                            Los datos se almacenan localmente en tu navegador.
                        </p>
                        <p className="about-api">
                            Datos de mercado proporcionados por Alpha Vantage y Finnhub.
                        </p>
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
