import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/clients/ClientList';
import ClientForm from './pages/clients/ClientForm';
import ClientDetail from './pages/clients/ClientDetail';
import ClientOnboarding from './pages/clients/ClientOnboarding';
import ClientReview from './pages/clients/ClientReview';
import ClientContractStatus from './pages/clients/ClientContractStatus';
import AlertList from './pages/alerts/AlertList';
import AlertDetail from './pages/alerts/AlertDetail';
import UnusualOperationList from './pages/unusual-operations/UnusualOperationList';
import UnusualOperationDetail from './pages/unusual-operations/UnusualOperationDetail';
import UnusualOperationForm from './pages/unusual-operations/UnusualOperationForm';
import Reports from './pages/reports/Reports';
import DueDiligence from './pages/due-diligence/DueDiligence';
import Users from './pages/users/Users';

// DEMO MODE - bypass authentication
const DEMO_MODE = false;

const App = () => {
  return (
    <Routes>
      {/* In demo mode, redirect login to dashboard */}
      <Route path="/login" element={DEMO_MODE ? <Navigate to="/" /> : <Login />} />

      {/* All routes accessible in demo mode */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />

        {/* Clientes */}
        <Route path="clients" element={<ClientList />} />
        <Route path="clients/onboarding" element={<ClientOnboarding />} />
        <Route path="clients/:id/review" element={<ClientReview />} />
        <Route path="clients/:id/contract" element={<ClientContractStatus />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="clients/:id/edit" element={<ClientForm />} />

        {/* Alertas */}
        <Route path="alerts" element={<AlertList />} />
        <Route path="alerts/:id" element={<AlertDetail />} />

        {/* Operaciones Inusuales */}
        <Route path="unusual-operations" element={<UnusualOperationList />} />
        <Route path="unusual-operations/new" element={<UnusualOperationForm />} />
        <Route path="unusual-operations/:id" element={<UnusualOperationDetail />} />

        {/* Reportes */}
        <Route path="reports" element={<Reports />} />

        {/* Debida Diligencia */}
        <Route path="due-diligence" element={<DueDiligence />} />

        {/* Usuarios */}
        <Route path="users" element={<Users />} />
      </Route>
    </Routes >
  );
};

export default App;
