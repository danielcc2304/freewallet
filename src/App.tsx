import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard, AddInvestment, Settings, TermsAndConditions, NotFound, PortfolioCsv } from './pages';
import { AcademyLayout } from './components/academy/layout/AcademyLayout';
import { Fundamentos } from './components/academy/guides/Fundamentos';
import { InvestorTimeline } from './components/academy/guides/InvestorTimeline';
import { CrisisSimulator } from './components/academy/simulators/CrisisSimulator';
import { CompoundInterestCalc } from './components/academy/calculators/CompoundInterestCalc';
import { FIRECalculator } from './components/academy/calculators/FIRECalculator';
import { RetirementCalculator } from './components/academy/calculators/RetirementCalculator';
import { EmergencyFundCalculator } from './components/academy/calculators/EmergencyFundCalculator';
import { TaxSimulator } from './components/academy/calculators/TaxSimulator';
import { AssetAllocationSim } from './components/academy/simulators/AssetAllocationSim';
import { InProcess } from './components/academy/guides/InProcess';
import { Calculators } from './components/academy/calculators/Calculators';
import { PortfolioBuilder } from './components/academy/simulators/PortfolioBuilder';
import { Taxation } from './components/academy/guides/Taxation';
import { Strategies } from './components/academy/guides/Strategies';
import { RiskManagement } from './components/academy/guides/RiskManagement';
import { Scenarios } from './components/academy/guides/Scenarios';
import { CommonErrors } from './components/academy/guides/CommonErrors';
import { Glossary } from './components/academy/guides/Glossary';
import { BondCalculator } from './components/academy/calculators/BondCalculator';
import { AssetEquities } from './components/academy/assets/AssetEquities';
import { AssetBonds } from './components/academy/assets/AssetBonds';
import { AssetCash } from './components/academy/assets/AssetCash';
import { AssetREITs } from './components/academy/assets/AssetREITs';
import { AssetCrypto } from './components/academy/assets/AssetCrypto';
import { ValuationGuide } from './components/academy/guides/ValuationGuide';
import { InvestorProfileTest } from './components/academy/simulators/InvestorProfileTest';
import { InflationPredator } from './components/academy/calculators/InflationPredator';
import { MarketTimingGame } from './components/academy/simulators/MarketTimingGame';
import { FundRadar } from './components/academy/simulators/FundRadar';
import './index.css';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
