import { lazy, type ReactNode } from 'react';
import { RouteView } from './components/ui/RouteView';
import { PendingExpenseNotice } from './components/ui/PendingChangesGuard';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AcademyLayout } from './components/academy/layout/AcademyLayout';
import { academyRouteDefinitions } from './app/routes/academyRoutes';
const MarketHeatmap = lazy(() => import('./components/academy/tools/MarketHeatmap').then(module => ({ default: module.MarketHeatmap })));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const Planning = lazy(() => import('./pages/Planning/Planning').then(module => ({ default: module.Planning })));
const Transactions = lazy(() => import('./pages/Transactions/Transactions').then(module => ({ default: module.Transactions })));
const AddInvestment = lazy(() => import('./pages/AddInvestment/AddInvestment').then(module => ({ default: module.AddInvestment })));
const Settings = lazy(() => import('./pages/Settings/Settings').then(module => ({ default: module.Settings })));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions/TermsAndConditions').then(module => ({ default: module.TermsAndConditions })));
const NotFound = lazy(() => import('./pages/NotFound/NotFound').then(module => ({ default: module.NotFound })));
const PortfolioCsv = lazy(() => import('./pages/PortfolioCsv/PortfolioCsv').then(module => ({ default: module.PortfolioCsv })));
const FeatureLog = lazy(() => import('./pages/FeatureLog/FeatureLog').then(module => ({ default: module.FeatureLog })));
const News = lazy(() => import('./pages/News/News').then(module => ({ default: module.News })));
const NewsArticle = lazy(() => import('./pages/News/News').then(module => ({ default: module.NewsArticle })));
const NewsAdmin = lazy(() => import('./pages/NewsAdmin/NewsAdmin').then(module => ({ default: module.NewsAdmin })));
const Account = lazy(() => import('./pages/Account/Account').then(module => ({ default: module.Account })));
import './index.css';
import './styles/liquidGlass.css';
import { VersionNotice } from './components/ui/VersionNotice';
const view = (element: ReactNode) => <RouteView>{element}</RouteView>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={view(<Dashboard />)} />
          <Route path="planning" element={view(<Planning />)} />
          <Route path="transactions" element={view(<Transactions />)} />
          <Route path="add" element={view(<AddInvestment />)} />
          <Route path="settings" element={view(<Settings />)} />
          <Route path="account" element={view(<Account />)} />
          <Route path="portfolio-csv" element={view(<PortfolioCsv />)} />
          <Route path="feature-log" element={view(<FeatureLog />)} />
          <Route path="market-heatmap" element={view(<MarketHeatmap />)} />
          <Route path="news">
            <Route index element={view(<News />)} />
            <Route path=":slug" element={view(<NewsArticle />)} />
          </Route>
          <Route path="admin/news" element={view(<NewsAdmin />)} />

          {/* Academy section with nested routes */}
          <Route path="academy" element={<AcademyLayout />}>
            {academyRouteDefinitions.map(({ path, element, end }) => (
              <Route
                key={path || 'academy-index'}
                index={end}
                path={end ? undefined : path}
                element={view(element)}
              />
            ))}

            {/* Keep the previous URL working after moving the heatmap to the main sidebar. */}
            <Route path="market-heatmap" element={<Navigate to="/market-heatmap" replace />} />

            {/* Academy 404 */}
            <Route path="*" element={view(<NotFound />)} />
          </Route>
        </Route>

        {/* Terms & Conditions - outside main layout */}
        <Route path="/terms" element={view(<TermsAndConditions />)} />

        {/* Global 404 */}
        <Route path="*" element={view(<NotFound />)} />
      </Routes>
      <VersionNotice />
      <PendingExpenseNotice />
    </BrowserRouter>
  );
}

export default App;

