import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    Award,
    BookOpen,
    Calculator,
    CircleAlert,
    Flame,
    FolderOpen,
    FileSearch,
    Gamepad2,
    LibraryBig,
    LineChart,
    PieChart,
    Scale,
    Shield,
    Sparkles,
    Target,
    TrendingUp,
} from 'lucide-react';
import { lazy } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

// Academy screens are deliberately split by route. The sidebar still has all
// labels available immediately, but the calculator or guide code is fetched
// only when the user opens it.
const AssetBonds = lazy(() => import('../../components/academy/assets/AssetBonds').then(({ AssetBonds: page }) => ({ default: page })));
const AssetCash = lazy(() => import('../../components/academy/assets/AssetCash').then(({ AssetCash: page }) => ({ default: page })));
const AssetCrypto = lazy(() => import('../../components/academy/assets/AssetCrypto').then(({ AssetCrypto: page }) => ({ default: page })));
const AssetEquities = lazy(() => import('../../components/academy/assets/AssetEquities').then(({ AssetEquities: page }) => ({ default: page })));
const AssetREITs = lazy(() => import('../../components/academy/assets/AssetREITs').then(({ AssetREITs: page }) => ({ default: page })));
const Calculators = lazy(() => import('../../components/academy/calculators/Calculators').then(({ Calculators: page }) => ({ default: page })));
const BondCalculator = lazy(() => import('../../components/academy/calculators/BondCalculator').then(({ BondCalculator: page }) => ({ default: page })));
const CompoundInterestCalc = lazy(() => import('../../components/academy/calculators/CompoundInterestCalc').then(({ CompoundInterestCalc: page }) => ({ default: page })));
const EmergencyFundCalculator = lazy(() => import('../../components/academy/calculators/EmergencyFundCalculator').then(({ EmergencyFundCalculator: page }) => ({ default: page })));
const FIRECalculator = lazy(() => import('../../components/academy/calculators/FIRECalculator').then(({ FIRECalculator: page }) => ({ default: page })));
const FundInformationCalculator = lazy(() => import('../../components/academy/calculators/FundInformationCalculator').then(({ FundInformationCalculator: page }) => ({ default: page })));
const InflationPredator = lazy(() => import('../../components/academy/calculators/InflationPredator').then(({ InflationPredator: page }) => ({ default: page })));
const RetirementCalculator = lazy(() => import('../../components/academy/calculators/RetirementCalculator').then(({ RetirementCalculator: page }) => ({ default: page })));
const TaxSimulator = lazy(() => import('../../components/academy/calculators/TaxSimulator').then(({ TaxSimulator: page }) => ({ default: page })));
const Fundamentos = lazy(() => import('../../components/academy/guides/Fundamentos').then(({ Fundamentos: page }) => ({ default: page })));
const CommonErrors = lazy(() => import('../../components/academy/guides/CommonErrors').then(({ CommonErrors: page }) => ({ default: page })));
const Glossary = lazy(() => import('../../components/academy/guides/Glossary').then(({ Glossary: page }) => ({ default: page })));
const InProcess = lazy(() => import('../../components/academy/guides/InProcess').then(({ InProcess: page }) => ({ default: page })));
const InvestorTimeline = lazy(() => import('../../components/academy/guides/InvestorTimeline').then(({ InvestorTimeline: page }) => ({ default: page })));
const RiskManagement = lazy(() => import('../../components/academy/guides/RiskManagement').then(({ RiskManagement: page }) => ({ default: page })));
const Scenarios = lazy(() => import('../../components/academy/guides/Scenarios').then(({ Scenarios: page }) => ({ default: page })));
const Strategies = lazy(() => import('../../components/academy/guides/Strategies').then(({ Strategies: page }) => ({ default: page })));
const Taxation = lazy(() => import('../../components/academy/guides/Taxation').then(({ Taxation: page }) => ({ default: page })));
const ValuationGuide = lazy(() => import('../../components/academy/guides/ValuationGuide').then(({ ValuationGuide: page }) => ({ default: page })));
const AssetAllocationSim = lazy(() => import('../../components/academy/simulators/AssetAllocationSim').then(({ AssetAllocationSim: page }) => ({ default: page })));
const CrisisSimulator = lazy(() => import('../../components/academy/simulators/CrisisSimulator').then(({ CrisisSimulator: page }) => ({ default: page })));
const FundRadar = lazy(() => import('../../components/academy/simulators/FundRadar').then(({ FundRadar: page }) => ({ default: page })));
const InvestorProfileTest = lazy(() => import('../../components/academy/simulators/InvestorProfileTest').then(({ InvestorProfileTest: page }) => ({ default: page })));
const MarketTimingGame = lazy(() => import('../../components/academy/simulators/MarketTimingGame').then(({ MarketTimingGame: page }) => ({ default: page })));
const PortfolioBuilder = lazy(() => import('../../components/academy/simulators/PortfolioBuilder').then(({ PortfolioBuilder: page }) => ({ default: page })));

export type AcademySidebarGroup =
    | 'Aprender'
    | 'Construir'
    | 'Herramientas'
    | 'Escenarios'
    | 'Recursos';

type AcademyRouteDefinition = {
    path: string;
    label: string;
    element: ReactNode;
    icon?: LucideIcon;
    group?: AcademySidebarGroup;
    end?: boolean;
    includeInSidebar?: boolean;
};

export const academyRouteDefinitions: AcademyRouteDefinition[] = [
    { path: '', label: 'Fundamentos', element: <Fundamentos />, icon: BookOpen, group: 'Aprender', end: true, includeInSidebar: true },
    { path: 'glossary', label: 'Glosario', element: <Glossary />, icon: LibraryBig, group: 'Aprender', includeInSidebar: true },
    { path: 'timeline', label: 'Tu recorrido', element: <InvestorTimeline />, icon: TrendingUp, group: 'Aprender', includeInSidebar: true },
    { path: 'errors', label: 'Errores comunes', element: <CommonErrors />, icon: CircleAlert, group: 'Aprender', includeInSidebar: true },

    { path: 'investor-profile-test', label: 'Perfil inversor', element: <InvestorProfileTest />, icon: Sparkles, group: 'Construir', includeInSidebar: true },
    { path: 'portfolio', label: 'Estrategia y cartera', element: <PortfolioBuilder />, icon: PieChart, group: 'Construir', includeInSidebar: true },
    { path: 'risk', label: 'Gestión del riesgo', element: <RiskManagement />, icon: Shield, group: 'Construir', includeInSidebar: true },
    { path: 'tax', label: 'Fiscalidad', element: <Taxation />, icon: Scale, group: 'Construir', includeInSidebar: true },
    { path: 'strategies', label: 'Estrategias', element: <Strategies />, icon: Target, group: 'Construir', includeInSidebar: true },

    { path: 'calculators', label: 'Calculadoras', element: <Calculators />, icon: Calculator, group: 'Herramientas', includeInSidebar: true },
    { path: 'fund-information', label: 'Ficha de fondos', element: <FundInformationCalculator />, icon: FileSearch, group: 'Herramientas', includeInSidebar: true },
    { path: 'fund-radar', label: 'Radar de fondos', element: <FundRadar />, icon: Award, group: 'Herramientas', includeInSidebar: true },
    { path: 'valuation', label: 'Valoración', element: <ValuationGuide />, icon: LineChart, group: 'Herramientas', includeInSidebar: true },
    { path: 'market-timing-game', label: 'Timing vs DCA', element: <MarketTimingGame />, icon: Gamepad2, group: 'Herramientas', includeInSidebar: true },

    { path: 'crisis', label: 'Mercado y crisis', element: <CrisisSimulator />, icon: Activity, group: 'Escenarios', includeInSidebar: true },
    { path: 'scenarios', label: 'Qué hacer si...', element: <Scenarios />, icon: Target, group: 'Escenarios', includeInSidebar: true },
    { path: 'inflation-predator', label: 'Impacto de la inflación', element: <InflationPredator />, icon: Flame, group: 'Escenarios', includeInSidebar: true },

    { path: 'resources', label: 'Recursos y guías', element: <InProcess />, icon: FolderOpen, group: 'Recursos', includeInSidebar: true },

    { path: 'compound-interest', label: 'Interés compuesto', element: <CompoundInterestCalc /> },
    { path: 'fire-calculator', label: 'Calculadora FIRE', element: <FIRECalculator /> },
    { path: 'bond-calculator', label: 'Calculadora de bonos', element: <BondCalculator /> },
    { path: 'retirement', label: 'Calculadora de jubilación', element: <RetirementCalculator /> },
    { path: 'emergency-fund', label: 'Fondo de emergencia', element: <EmergencyFundCalculator /> },
    { path: 'taxes', label: 'Simulador de impuestos', element: <TaxSimulator /> },
    { path: 'asset-allocation', label: 'Simulador de asignación', element: <AssetAllocationSim /> },

    { path: 'assets/equities', label: 'Acciones', element: <AssetEquities /> },
    { path: 'assets/bonds', label: 'Bonos', element: <AssetBonds /> },
    { path: 'assets/cash', label: 'Liquidez', element: <AssetCash /> },
    { path: 'assets/reits', label: 'REITs', element: <AssetREITs /> },
    { path: 'assets/crypto', label: 'Crypto', element: <AssetCrypto /> },

    { path: 'asset-types', label: 'Tipos de activos', element: <Navigate to="/academy/portfolio" replace /> },
];

export const academySidebarGroups: AcademySidebarGroup[] = ['Aprender', 'Construir', 'Herramientas', 'Escenarios', 'Recursos'];

export const academySidebarSections = academyRouteDefinitions.filter(
    (route): route is AcademyRouteDefinition & { icon: LucideIcon; group: AcademySidebarGroup } =>
        Boolean(route.includeInSidebar && route.icon && route.group),
);

export const academyPrerenderRoutes = academyRouteDefinitions.map(({ path }) =>
    (path ? `/academy/${path}` : '/academy'),
);
