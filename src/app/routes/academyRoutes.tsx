import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    Award,
    BookOpen,
    Calculator,
    CircleAlert,
    Flame,
    FolderOpen,
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
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AssetBonds } from '../../components/academy/assets/AssetBonds';
import { AssetCash } from '../../components/academy/assets/AssetCash';
import { AssetCrypto } from '../../components/academy/assets/AssetCrypto';
import { AssetEquities } from '../../components/academy/assets/AssetEquities';
import { AssetREITs } from '../../components/academy/assets/AssetREITs';
import { Calculators } from '../../components/academy/calculators/Calculators';
import { BondCalculator } from '../../components/academy/calculators/BondCalculator';
import { CompoundInterestCalc } from '../../components/academy/calculators/CompoundInterestCalc';
import { EmergencyFundCalculator } from '../../components/academy/calculators/EmergencyFundCalculator';
import { FIRECalculator } from '../../components/academy/calculators/FIRECalculator';
import { InflationPredator } from '../../components/academy/calculators/InflationPredator';
import { RetirementCalculator } from '../../components/academy/calculators/RetirementCalculator';
import { TaxSimulator } from '../../components/academy/calculators/TaxSimulator';
import { Fundamentos } from '../../components/academy/guides/Fundamentos';
import { CommonErrors } from '../../components/academy/guides/CommonErrors';
import { Glossary } from '../../components/academy/guides/Glossary';
import { InProcess } from '../../components/academy/guides/InProcess';
import { InvestorTimeline } from '../../components/academy/guides/InvestorTimeline';
import { RiskManagement } from '../../components/academy/guides/RiskManagement';
import { Scenarios } from '../../components/academy/guides/Scenarios';
import { Strategies } from '../../components/academy/guides/Strategies';
import { Taxation } from '../../components/academy/guides/Taxation';
import { ValuationGuide } from '../../components/academy/guides/ValuationGuide';
import { AssetAllocationSim } from '../../components/academy/simulators/AssetAllocationSim';
import { CrisisSimulator } from '../../components/academy/simulators/CrisisSimulator';
import { FundRadar } from '../../components/academy/simulators/FundRadar';
import { InvestorProfileTest } from '../../components/academy/simulators/InvestorProfileTest';
import { MarketTimingGame } from '../../components/academy/simulators/MarketTimingGame';
import { PortfolioBuilder } from '../../components/academy/simulators/PortfolioBuilder';

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
    { path: 'risk', label: 'Gestion del riesgo', element: <RiskManagement />, icon: Shield, group: 'Construir', includeInSidebar: true },
    { path: 'tax', label: 'Fiscalidad', element: <Taxation />, icon: Scale, group: 'Construir', includeInSidebar: true },
    { path: 'strategies', label: 'Estrategias', element: <Strategies />, icon: Target, group: 'Construir', includeInSidebar: true },

    { path: 'calculators', label: 'Calculadoras', element: <Calculators />, icon: Calculator, group: 'Herramientas', includeInSidebar: true },
    { path: 'fund-radar', label: 'Radar de fondos', element: <FundRadar />, icon: Award, group: 'Herramientas', includeInSidebar: true },
    { path: 'valuation', label: 'Valoracion', element: <ValuationGuide />, icon: LineChart, group: 'Herramientas', includeInSidebar: true },
    { path: 'market-timing-game', label: 'Timing vs DCA', element: <MarketTimingGame />, icon: Gamepad2, group: 'Herramientas', includeInSidebar: true },

    { path: 'crisis', label: 'Mercado y crisis', element: <CrisisSimulator />, icon: Activity, group: 'Escenarios', includeInSidebar: true },
    { path: 'scenarios', label: 'Que hacer si...', element: <Scenarios />, icon: Target, group: 'Escenarios', includeInSidebar: true },
    { path: 'inflation-predator', label: 'Impacto de la inflacion', element: <InflationPredator />, icon: Flame, group: 'Escenarios', includeInSidebar: true },

    { path: 'resources', label: 'Recursos y guias', element: <InProcess />, icon: FolderOpen, group: 'Recursos', includeInSidebar: true },

    { path: 'compound-interest', label: 'Interes compuesto', element: <CompoundInterestCalc /> },
    { path: 'fire-calculator', label: 'Calculadora FIRE', element: <FIRECalculator /> },
    { path: 'bond-calculator', label: 'Calculadora de bonos', element: <BondCalculator /> },
    { path: 'retirement', label: 'Calculadora de jubilacion', element: <RetirementCalculator /> },
    { path: 'emergency-fund', label: 'Fondo de emergencia', element: <EmergencyFundCalculator /> },
    { path: 'taxes', label: 'Simulador de impuestos', element: <TaxSimulator /> },
    { path: 'asset-allocation', label: 'Simulador de asignacion', element: <AssetAllocationSim /> },

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
