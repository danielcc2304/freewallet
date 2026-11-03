import {WorkspaceText,WorkspaceLink,WorkspaceField} from '../../components/ui/workspace/WorkspaceRecords';
import { SettingsStyle } from '../../components/ui/workspace/Settings.styles';

import { WorkspaceLayout,WorkspaceCard } from '../../components/ui/workspace/WorkspaceLayout';


import { NativeControl } from '../../components/ui/NativeControl';

import { PreferenceOption, PreferenceField, PreferenceSwitch } from '../../components/ui/PreferenceOption';
import { Sun, Moon, Monitor, Trash2, Database, Info, Power } from 'lucide-react';

import {CardHeader,CardContent,Button,ConfirmDialog} from '../../components/ui';
import { APP_NAME, APP_VERSION } from '../../constants/app';
import { useTheme } from '../../context/ThemeContext';
import { useAppearance } from '../../context/AppearanceContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { useState } from 'react';
import { clearAllData, isApiEnabled, updateSettings } from '../../services/storageService';
import { getFinnhubApiKey, setFinnhubApiKey as setFinnhubApiKeyAction } from '../../services/apiService';
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
        <WorkspaceLayout appearance="settings"  >
            {saveError&&<p role="alert">{saveError}</p>}
            <WorkspaceLayout appearance="settingsHeader"  >
                <WorkspaceText appearance="settingsTitle" as="h1" >Configuración</WorkspaceText>
                <WorkspaceText appearance="settingsSubtitle"  >Personaliza tu experiencia</WorkspaceText>
            </WorkspaceLayout>

            {/* Theme Settings */}
            <WorkspaceCard appearance="settingsSection"  >
                <CardHeader
                    title="Apariencia"
                    subtitle="Elige cómo se ve la aplicación"
                />
                <CardContent>
                    <WorkspaceLayout appearance="settingsThemeOptions"  >
                        {themeOptions.map((option) => (
                            <PreferenceOption appearance="theme" selected={themeMode === option.value} key={option.value} onClick={() => setThemeMode(option.value)} icon={<>{option.icon}</>} title={<>{option.label}</>} />
                        ))}
                    </WorkspaceLayout>
                    <WorkspaceText appearance="settingsHint"  >
                        {themeMode === 'system'
                            ? 'El tema cambiará automáticamente según la configuración de tu dispositivo'
                            : `Tema ${themeMode === 'dark' ? 'oscuro' : 'claro'} seleccionado`}
                    </WorkspaceText>

                    <WorkspaceLayout appearance="settingsAppearance"  >
                        <WorkspaceLayout appearance="settingsAppearanceCopy"  >
                            <WorkspaceLayout appearance="settingsAppearanceTitle"  >
                                <span>Estilo de interfaz</span>
                            </WorkspaceLayout>
                            <WorkspaceText appearance="settingsHint"  >
                                Añade un material óptico adaptable a navegación y controles sin cambiar el modo de color.
                            </WorkspaceText>
                        </WorkspaceLayout>
                        <WorkspaceLayout appearance="settingsAppearanceOptions"  role="group" aria-label="Estilo de interfaz">
                            <PreferenceOption appearance="interface" selected={appearance === 'standard'} type="button" onClick={() => setAppearance('standard')} aria-pressed={appearance === 'standard'} preview="standard" title={<>Estándar</>} description={<>Superficies sólidas y directas</>} />
                            <PreferenceOption appearance="interface" selected={appearance === 'liquid-glass'} type="button" onClick={() => setAppearance('liquid-glass')} aria-pressed={appearance === 'liquid-glass'} preview="glass" title={<>Liquid Glass</>} description={<>Controles flotantes, profundidad y refracción</>} />
                        </WorkspaceLayout>
                        <WorkspaceText appearance="settingsHint"  >
                            {appearance === 'liquid-glass'
                                ? 'Liquid Glass activado en toda la aplicación.'
                                : 'Apariencia estándar seleccionada.'}
                        </WorkspaceText>
                    </WorkspaceLayout>
                </CardContent>
            </WorkspaceCard>

            {/* Data Settings */}
            <WorkspaceCard appearance="settingsSection"  >
                <CardHeader
                    title="Datos"
                    subtitle="Gestiona los datos de tu portfolio"
                />
                <CardContent>
                    <WorkspaceLayout appearance="settingsDataInfo"  >
                        <WorkspaceLayout appearance="dataStat"  >
                            <Database size={20} />
                            <span>{state.assets.length} activos en tu portfolio</span>
                        </WorkspaceLayout>
                    </WorkspaceLayout>

                    <WorkspaceLayout appearance="settingsActions"  >
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
                    </WorkspaceLayout>
                </CardContent>
            </WorkspaceCard>

            {/* API Settings */}
            <WorkspaceCard appearance="settingsSection"  >
                <CardHeader
                    title="Mercado & APIs"
                    subtitle="Gestiona tus claves de API para mejorar la cobertura de datos"
                />
                <CardContent>
                    <WorkspaceLayout appearance="settingsApiConfig"  >
                        <PreferenceField title={<>
                                    <Power size={18} />
                                    <span>Activar peticiones a APIs</span>
                                </>} description={<>
                                    Por defecto estara desactivado. Mientras el dashboard sigue en construccion,
                                    puedes mantener el modo manual y activar las APIs solo cuando quieras probarlo.
                                </>}><PreferenceSwitch checked={apiEnabled} type="button" onClick={handleApiToggle} disabled={saving} role="switch" aria-label="Activar peticiones a APIs" aria-checked={apiEnabled} /></PreferenceField>

                        <WorkspaceField appearance="settingsInputGroup"  controlId="finnhub-key" label={<>Finnhub API Key</>}><NativeControl appearance="settings" as="input" id="finnhub-key" type="password" value={finnhubKey} onChange={(e) => setFinnhubKey(e.target.value)} placeholder="Pega aquí tu clave de Finnhub" /><WorkspaceText appearance="settingsHint" >
                                Esta clave se usa como respaldo cuando Yahoo Finance no devuelve datos.
                                Consigue una gratis en <a href="https://finnhub.io/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>finnhub.io</a>.
                            </WorkspaceText></WorkspaceField>
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
                    </WorkspaceLayout>
                </CardContent>
            </WorkspaceCard>

            {/* About */}
            <WorkspaceCard appearance="settingsSection"  >
                <CardHeader
                    title="Acerca de"
                    subtitle="Información de la aplicación"
                />
                <CardContent>
                    <WorkspaceLayout appearance="settingsAbout"  >
                        <WorkspaceLink appearance="aboutItem" className={SettingsStyle('about-item--link')} to="/feature-log">
                            <Info size={16} />
                            <span>{APP_NAME} v{APP_VERSION}</span>
                        </WorkspaceLink>
                        <WorkspaceText appearance="aboutDescription"  >
                            Aplicación de gestión de portfolio de inversiones.
                            {account.user?'Tu cartera está vinculada a tu cuenta. Consulta el estado del guardado en Mi cuenta.':'Los datos se almacenan localmente en tu navegador.'}
                        </WorkspaceText>
                        <WorkspaceText appearance="aboutApi"  >
                            Datos de mercado proporcionados por Alpha Vantage y Finnhub.
                        </WorkspaceText>
                        <WorkspaceLayout appearance="aboutLinks"  >
                            <WorkspaceLink appearance="settingsTermsLink"  to="/terms">
                                Ver Términos y Condiciones de Uso
                            </WorkspaceLink>
                        </WorkspaceLayout>
                    </WorkspaceLayout>
                </CardContent>
            </WorkspaceCard>

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
        </WorkspaceLayout>
    );
}
