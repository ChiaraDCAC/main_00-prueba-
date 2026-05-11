import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';
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

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
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

      {/* Cualquier ruta desconocida → dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
