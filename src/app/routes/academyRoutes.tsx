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
    PanelsTopLeft,
    PieChart,
    Receipt,
    WalletCards,
    Scale,
    Shield,
    Sparkles,
    Target,
    TrendingUp,
} from 'lucide-react';
import { lazy } from 'react';
import type { ReactNode } from 'react';
const ExpenseManager = lazy(() => import('../../components/expenses/ExpenseManager'));
import { Navigate } from 'react-router-dom';
const AssetBonds = lazy(() => import('../../components/academy/assets/AssetBonds').then(module => ({ default: module.AssetBonds })));
const AssetCash = lazy(() => import('../../components/academy/assets/AssetCash').then(module => ({ default: module.AssetCash })));
const AssetCrypto = lazy(() => import('../../components/academy/assets/AssetCrypto').then(module => ({ default: module.AssetCrypto })));
const AssetEquities = lazy(() => import('../../components/academy/assets/AssetEquities').then(module => ({ default: module.AssetEquities })));
const AssetREITs = lazy(() => import('../../components/academy/assets/AssetREITs').then(module => ({ default: module.AssetREITs })));
const Calculators = lazy(() => import('../../components/academy/calculators/Calculators').then(module => ({ default: module.Calculators })));
const BondCalculator = lazy(() => import('../../components/academy/calculators/BondCalculator').then(module => ({ default: module.BondCalculator })));
const CompoundInterestCalc = lazy(() => import('../../components/academy/calculators/CompoundInterestCalc').then(module => ({ default: module.CompoundInterestCalc })));
const EmergencyFundCalculator = lazy(() => import('../../components/academy/calculators/EmergencyFundCalculator').then(module => ({ default: module.EmergencyFundCalculator })));
const FIRECalculator = lazy(() => import('../../components/academy/calculators/FIRECalculator').then(module => ({ default: module.FIRECalculator })));
const FundInformationCalculator = lazy(() => import('../../components/academy/calculators/FundInformationCalculator').then(module => ({ default: module.FundInformationCalculator })));
const InflationPredator = lazy(() => import('../../components/academy/calculators/InflationPredator').then(module => ({ default: module.InflationPredator })));
const RetirementCalculator = lazy(() => import('../../components/academy/calculators/RetirementCalculator').then(module => ({ default: module.RetirementCalculator })));
const TaxSimulator = lazy(() => import('../../components/academy/calculators/TaxSimulator').then(module => ({ default: module.TaxSimulator })));
const SalaryCalculator = lazy(() => import('../../components/academy/calculators/SalaryCalculator').then(module => ({ default: module.SalaryCalculator })));
const Fundamentos = lazy(() => import('../../components/academy/guides/Fundamentos').then(module => ({ default: module.Fundamentos })));
const CommonErrors = lazy(() => import('../../components/academy/guides/CommonErrors').then(module => ({ default: module.CommonErrors })));
const Glossary = lazy(() => import('../../components/academy/guides/Glossary').then(module => ({ default: module.Glossary })));
const InProcess = lazy(() => import('../../components/academy/guides/InProcess').then(module => ({ default: module.InProcess })));
const InvestorTimeline = lazy(() => import('../../components/academy/guides/InvestorTimeline').then(module => ({ default: module.InvestorTimeline })));
const RiskManagement = lazy(() => import('../../components/academy/guides/RiskManagement').then(module => ({ default: module.RiskManagement })));
const Scenarios = lazy(() => import('../../components/academy/guides/Scenarios').then(module => ({ default: module.Scenarios })));
const Strategies = lazy(() => import('../../components/academy/guides/Strategies').then(module => ({ default: module.Strategies })));
const Taxation = lazy(() => import('../../components/academy/guides/Taxation').then(module => ({ default: module.Taxation })));
const ValuationGuide = lazy(() => import('../../components/academy/guides/ValuationGuide').then(module => ({ default: module.ValuationGuide })));
const AssetAllocationSim = lazy(() => import('../../components/academy/simulators/AssetAllocationSim').then(module => ({ default: module.AssetAllocationSim })));
const CrisisSimulator = lazy(() => import('../../components/academy/simulators/CrisisSimulator').then(module => ({ default: module.CrisisSimulator })));
const FundRadar = lazy(() => import('../../components/academy/simulators/FundRadar').then(module => ({ default: module.FundRadar })));
const InvestorProfileTest = lazy(() => import('../../components/academy/simulators/InvestorProfileTest').then(module => ({ default: module.InvestorProfileTest })));
const MarketTimingGame = lazy(() => import('../../components/academy/simulators/MarketTimingGame').then(module => ({ default: module.MarketTimingGame })));
const PortfolioBuilder = lazy(() => import('../../components/academy/simulators/PortfolioBuilder').then(module => ({ default: module.PortfolioBuilder })));

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
    { path: 'salary-calculator', label: 'IRPF y sueldo neto', element: <SalaryCalculator />, icon: Receipt, group: 'Herramientas', includeInSidebar: false },
    { path: 'expenses', label: 'Gastos y presupuesto', element: <ExpenseManager />, icon: WalletCards, group: 'Herramientas', includeInSidebar: true },
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

export const toolSidebarSections = [
    ...academySidebarSections
        .filter((route) => route.group === 'Herramientas')
        .map(({ path, label, icon, end }) => ({
            to: `/academy/${path}`,
            label,
            icon,
            end,
        })),
    { to: '/market-heatmap', label: 'Heatmap de mercados', icon: PanelsTopLeft, end: true },
];

export const academyPrerenderRoutes = academyRouteDefinitions.map(({ path }) =>
    (path ? `/academy/${path}` : '/academy'),
);
