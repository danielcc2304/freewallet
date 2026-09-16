import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AcademyLayout } from './components/academy/layout/AcademyLayout';
import { academyRouteDefinitions } from './app/routes/academyRoutes';
import { MarketHeatmap } from './components/academy/tools/MarketHeatmap';
import {
  Dashboard,
  Planning,
  Transactions,
  AddInvestment,
  Settings,
  TermsAndConditions,
  NotFound,
  PortfolioCsv,
  FeatureLog,
  News,
  NewsArticle,
  NewsAdmin,
} from './pages';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="planning" element={<Planning />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="add" element={<AddInvestment />} />
          <Route path="settings" element={<Settings />} />
          <Route path="portfolio-csv" element={<PortfolioCsv />} />
          <Route path="feature-log" element={<FeatureLog />} />
          <Route path="market-heatmap" element={<MarketHeatmap />} />
          <Route path="news">
            <Route index element={<News />} />
            <Route path=":slug" element={<NewsArticle />} />
          </Route>
          <Route path="admin/news" element={<NewsAdmin />} />

          {/* Academy section with nested routes */}
          <Route path="academy" element={<AcademyLayout />}>
            {academyRouteDefinitions.map(({ path, element, end }) => (
              <Route
                key={path || 'academy-index'}
                index={end}
                path={end ? undefined : path}
                element={element}
              />
            ))}

            {/* Keep the previous URL working after moving the heatmap to the main sidebar. */}
            <Route path="market-heatmap" element={<Navigate to="/market-heatmap" replace />} />

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

