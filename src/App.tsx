import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard, AddInvestment, Settings, TermsAndConditions, NotFound, PortfolioCsv } from './pages';
import './index.css';

const AcademyLayout = lazy(() => import('./components/academy/layout/AcademyLayout').then((m) => ({ default: m.AcademyLayout })));
const Fundamentos = lazy(() => import('./components/academy/guides/Fundamentos').then((m) => ({ default: m.Fundamentos })));
const InvestorTimeline = lazy(() => import('./components/academy/guides/InvestorTimeline').then((m) => ({ default: m.InvestorTimeline })));
const CrisisSimulator = lazy(() => import('./components/academy/simulators/CrisisSimulator').then((m) => ({ default: m.CrisisSimulator })));
const Calculators = lazy(() => import('./components/academy/calculators/Calculators').then((m) => ({ default: m.Calculators })));
const CompoundInterestCalc = lazy(() => import('./components/academy/calculators/CompoundInterestCalc').then((m) => ({ default: m.CompoundInterestCalc })));
const FIRECalculator = lazy(() => import('./components/academy/calculators/FIRECalculator').then((m) => ({ default: m.FIRECalculator })));
const BondCalculator = lazy(() => import('./components/academy/calculators/BondCalculator').then((m) => ({ default: m.BondCalculator })));
const Scenarios = lazy(() => import('./components/academy/guides/Scenarios').then((m) => ({ default: m.Scenarios })));
const CommonErrors = lazy(() => import('./components/academy/guides/CommonErrors').then((m) => ({ default: m.CommonErrors })));
const PortfolioBuilder = lazy(() => import('./components/academy/simulators/PortfolioBuilder').then((m) => ({ default: m.PortfolioBuilder })));
const Taxation = lazy(() => import('./components/academy/guides/Taxation').then((m) => ({ default: m.Taxation })));
const Strategies = lazy(() => import('./components/academy/guides/Strategies').then((m) => ({ default: m.Strategies })));
const RiskManagement = lazy(() => import('./components/academy/guides/RiskManagement').then((m) => ({ default: m.RiskManagement })));
const InProcess = lazy(() => import('./components/academy/guides/InProcess').then((m) => ({ default: m.InProcess })));
const Glossary = lazy(() => import('./components/academy/guides/Glossary').then((m) => ({ default: m.Glossary })));
const AssetEquities = lazy(() => import('./components/academy/assets/AssetEquities').then((m) => ({ default: m.AssetEquities })));
const AssetBonds = lazy(() => import('./components/academy/assets/AssetBonds').then((m) => ({ default: m.AssetBonds })));
const AssetCash = lazy(() => import('./components/academy/assets/AssetCash').then((m) => ({ default: m.AssetCash })));
const AssetREITs = lazy(() => import('./components/academy/assets/AssetREITs').then((m) => ({ default: m.AssetREITs })));
const AssetCrypto = lazy(() => import('./components/academy/assets/AssetCrypto').then((m) => ({ default: m.AssetCrypto })));
const ValuationGuide = lazy(() => import('./components/academy/guides/ValuationGuide').then((m) => ({ default: m.ValuationGuide })));
const InvestorProfileTest = lazy(() => import('./components/academy/simulators/InvestorProfileTest').then((m) => ({ default: m.InvestorProfileTest })));
const InflationPredator = lazy(() => import('./components/academy/calculators/InflationPredator').then((m) => ({ default: m.InflationPredator })));
const MarketTimingGame = lazy(() => import('./components/academy/simulators/MarketTimingGame').then((m) => ({ default: m.MarketTimingGame })));
const FundRadar = lazy(() => import('./components/academy/simulators/FundRadar').then((m) => ({ default: m.FundRadar })));
const RetirementCalculator = lazy(() => import('./components/academy/calculators/RetirementCalculator').then((m) => ({ default: m.RetirementCalculator })));
const EmergencyFundCalculator = lazy(() => import('./components/academy/calculators/EmergencyFundCalculator').then((m) => ({ default: m.EmergencyFundCalculator })));
const TaxSimulator = lazy(() => import('./components/academy/calculators/TaxSimulator').then((m) => ({ default: m.TaxSimulator })));
const AssetAllocationSim = lazy(() => import('./components/academy/simulators/AssetAllocationSim').then((m) => ({ default: m.AssetAllocationSim })));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={(
        <div style={{ padding: '2rem', color: 'var(--text-primary)', background: 'var(--bg-primary)', minHeight: '100vh' }}>
          Cargando...
        </div>
      )}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="add" element={<AddInvestment />} />
            <Route path="settings" element={<Settings />} />
            <Route path="portfolio-csv" element={<PortfolioCsv />} />

            {/* Academy section with nested routes */}
            <Route path="academy" element={<AcademyLayout />}>
              <Route index element={<Fundamentos />} />
              <Route path="timeline" element={<InvestorTimeline />} />
              <Route path="crisis" element={<CrisisSimulator />} />
              <Route path="calculators" element={<Calculators />} />
              <Route path="compound-interest" element={<CompoundInterestCalc />} />
              <Route path="fire-calculator" element={<FIRECalculator />} />
              <Route path="bond-calculator" element={<BondCalculator />} />

              {/* Sections in process */}
              <Route path="scenarios" element={<Scenarios />} />
              <Route path="errors" element={<CommonErrors />} />
              <Route path="portfolio" element={<PortfolioBuilder />} />
              <Route path="tax" element={<Taxation />} />
              <Route path="strategies" element={<Strategies />} />
              <Route path="risk" element={<RiskManagement />} />
              <Route path="resources" element={<InProcess />} />
              <Route path="glossary" element={<Glossary />} />
              <Route path="asset-types" element={<Navigate to="/academy/portfolio" replace />} />

              {/* Asset Deep Dives */}
              <Route path="assets/equities" element={<AssetEquities />} />
              <Route path="assets/bonds" element={<AssetBonds />} />
              <Route path="assets/cash" element={<AssetCash />} />
              <Route path="assets/reits" element={<AssetREITs />} />
              <Route path="assets/crypto" element={<AssetCrypto />} />

              {/* Valuation Guide */}
              <Route path="valuation" element={<ValuationGuide />} />

              {/* Investor Profile Test */}
              <Route path="investor-profile-test" element={<InvestorProfileTest />} />

              {/* Inflation Predator */}
              <Route path="inflation-predator" element={<InflationPredator />} />

              {/* Market Timing Game */}
              <Route path="market-timing-game" element={<MarketTimingGame />} />

              {/* Fund Radar */}
              <Route path="fund-radar" element={<FundRadar />} />

              {/* Calculator specific sub-pages */}
              <Route path="retirement" element={<RetirementCalculator />} />
              <Route path="emergency-fund" element={<EmergencyFundCalculator />} />
              <Route path="taxes" element={<TaxSimulator />} />
              <Route path="asset-allocation" element={<AssetAllocationSim />} />

              {/* Academy 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          {/* Terms & Conditions - outside main layout */}
          <Route path="/terms" element={<TermsAndConditions />} />

          {/* Global 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
