import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AcademyLayout } from './components/academy/layout/AcademyLayout';
import { academyRouteDefinitions } from './app/routes/academyRoutes';
import './index.css';

// Keep the shell and Dashboard entry point small. The remaining screens are
// loaded only when the user navigates to them instead of shipping the whole
// Academy and every calculator in the initial bundle.
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard').then(({ Dashboard: page }) => ({ default: page })));
const Planning = lazy(() => import('./pages/Planning/Planning').then(({ Planning: page }) => ({ default: page })));
const Transactions = lazy(() => import('./pages/Transactions/Transactions').then(({ Transactions: page }) => ({ default: page })));
const AddInvestment = lazy(() => import('./pages/AddInvestment/AddInvestment').then(({ AddInvestment: page }) => ({ default: page })));
const Settings = lazy(() => import('./pages/Settings/Settings').then(({ Settings: page }) => ({ default: page })));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions/TermsAndConditions').then(({ TermsAndConditions: page }) => ({ default: page })));
const NotFound = lazy(() => import('./pages/NotFound/NotFound').then(({ NotFound: page }) => ({ default: page })));
const PortfolioCsv = lazy(() => import('./pages/PortfolioCsv/PortfolioCsv').then(({ PortfolioCsv: page }) => ({ default: page })));
const FeatureLog = lazy(() => import('./pages/FeatureLog/FeatureLog').then(({ FeatureLog: page }) => ({ default: page })));
const News = lazy(() => import('./pages/News/News').then(({ News: page }) => ({ default: page })));
const NewsArticle = lazy(() => import('./pages/News/News').then(({ NewsArticle: page }) => ({ default: page })));
const NewsAdmin = lazy(() => import('./pages/NewsAdmin/NewsAdmin').then(({ NewsAdmin: page }) => ({ default: page })));

function RouteLoading() {
  return <div className="app-route-loading" role="status" aria-live="polite">Cargando…</div>;
}

function SuspendedRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<SuspendedRoute><Dashboard /></SuspendedRoute>} />
          <Route path="planning" element={<SuspendedRoute><Planning /></SuspendedRoute>} />
          <Route path="transactions" element={<SuspendedRoute><Transactions /></SuspendedRoute>} />
          <Route path="add" element={<SuspendedRoute><AddInvestment /></SuspendedRoute>} />
          <Route path="settings" element={<SuspendedRoute><Settings /></SuspendedRoute>} />
          <Route path="portfolio-csv" element={<SuspendedRoute><PortfolioCsv /></SuspendedRoute>} />
          <Route path="feature-log" element={<SuspendedRoute><FeatureLog /></SuspendedRoute>} />
          <Route path="news">
            <Route index element={<SuspendedRoute><News /></SuspendedRoute>} />
            <Route path=":slug" element={<SuspendedRoute><NewsArticle /></SuspendedRoute>} />
          </Route>
          <Route path="admin/news" element={<SuspendedRoute><NewsAdmin /></SuspendedRoute>} />

          {/* Academy section with nested routes */}
          <Route path="academy" element={<AcademyLayout />}>
            {academyRouteDefinitions.map(({ path, element, end }) => (
              <Route
                key={path || 'academy-index'}
                index={end}
                path={end ? undefined : path}
                element={<SuspendedRoute>{element}</SuspendedRoute>}
              />
            ))}

            {/* Academy 404 */}
            <Route path="*" element={<SuspendedRoute><NotFound /></SuspendedRoute>} />
          </Route>
        </Route>

        {/* Terms & Conditions - outside main layout */}
        <Route path="/terms" element={<SuspendedRoute><TermsAndConditions /></SuspendedRoute>} />

        {/* Global 404 */}
        <Route path="*" element={<SuspendedRoute><NotFound /></SuspendedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

