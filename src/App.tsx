import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { AddInvestment } from './pages/AddInvestment';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="add" element={<AddInvestment />} />
          <Route path="settings" element={<SettingsPlaceholder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Placeholder for settings page
function SettingsPlaceholder() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      gap: '1rem'
    }}>
      <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Configuración</h2>
      <p style={{ color: 'var(--text-muted)' }}>Próximamente...</p>
    </div>
  );
}

export default App;
