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
import { InProcess } from './components/academy/InProcess';
import { Calculators } from './components/academy/Calculators';
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

            {/* Sections in process */}
            <Route path="scenarios" element={<InProcess />} />
            <Route path="errors" element={<InProcess />} />
            <Route path="portfolio" element={<InProcess />} />
            <Route path="tax" element={<InProcess />} />
            <Route path="strategies" element={<InProcess />} />
            <Route path="risk" element={<InProcess />} />
            <Route path="resources" element={<InProcess />} />
            <Route path="glossary" element={<InProcess />} />
            <Route path="asset-types" element={<InProcess />} />

            {/* Calculator specific sub-pages in process */}
            <Route path="retirement" element={<InProcess />} />
            <Route path="emergency-fund" element={<InProcess />} />
            <Route path="taxes" element={<InProcess />} />
            <Route path="asset-allocation" element={<InProcess />} />
          </Route>
        </Route>

        {/* Terms & Conditions - outside main layout */}
        <Route path="/terms" element={<TermsAndConditions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
