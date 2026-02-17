import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { AddInvestment } from './pages/AddInvestment';
import { Settings } from './pages/Settings';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { AcademyLayout } from './components/academy/AcademyLayout';
import { Fundamentos } from './components/academy/Fundamentos';
import { InvestorTimeline } from './components/academy/InvestorTimeline';
import { CrisisSimulator } from './components/academy/CrisisSimulator';
import { CompoundInterestCalc } from './components/academy/CompoundInterestCalc';
import { FIRECalculator } from './components/academy/FIRECalculator';
import { RetirementCalculator } from './components/academy/RetirementCalculator';
import { EmergencyFundCalculator } from './components/academy/EmergencyFundCalculator';
import { TaxSimulator } from './components/academy/TaxSimulator';
import { AssetAllocationSim } from './components/academy/AssetAllocationSim';
import { InProcess } from './components/academy/InProcess';
import { Calculators } from './components/academy/Calculators';
import { PortfolioBuilder } from './components/academy/PortfolioBuilder';
import { Taxation } from './components/academy/Taxation';
import { Strategies } from './components/academy/Strategies';
import { RiskManagement } from './components/academy/RiskManagement';
import { Scenarios } from './components/academy/Scenarios';
import { CommonErrors } from './components/academy/CommonErrors';
import { Glossary } from './components/academy/Glossary';
import { AssetTypes } from './components/academy/AssetTypes';
import { BondCalculator } from './components/academy/BondCalculator';
import { AssetEquities } from './components/academy/assets/AssetEquities';
import { AssetBonds } from './components/academy/assets/AssetBonds';
import { AssetCash } from './components/academy/assets/AssetCash';
import { AssetREITs } from './components/academy/assets/AssetREITs';
import { AssetCrypto } from './components/academy/assets/AssetCrypto';
import { NotFound } from './pages/NotFound';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="add" element={<AddInvestment />} />
          <Route path="settings" element={<Settings />} />

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
            <Route path="asset-types" element={<AssetTypes />} />

            {/* Asset Deep Dives */}
            <Route path="assets/equities" element={<AssetEquities />} />
            <Route path="assets/bonds" element={<AssetBonds />} />
            <Route path="assets/cash" element={<AssetCash />} />
            <Route path="assets/reits" element={<AssetREITs />} />
            <Route path="assets/crypto" element={<AssetCrypto />} />

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
