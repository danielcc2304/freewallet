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
            {/* TODO: Add more academy routes as components are created */}
          </Route>
        </Route>

        {/* Terms & Conditions - outside main layout */}
        <Route path="/terms" element={<TermsAndConditions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
