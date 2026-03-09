import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { getRoleInfo } from '../config/permissions';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  FileWarning,
  FileX,
  FileText,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './theme-toggle';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Sidebar abierto solo en Dashboard ("/"), cerrado en las demás páginas
  const [sidebarCollapsed, setSidebarCollapsed] = useState(location.pathname !== '/');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients/onboarding', icon: ClipboardCheck, label: 'Alta Usuario', roles: ['admin', 'supervisor'] },
    { to: '/clients', icon: Users, label: 'Clientes' },
    { to: '/unusual-operations', icon: FileWarning, label: 'Op. Inusuales' },
    { to: '/reports', icon: FileText, label: 'Reportes' },
    { to: '/users', icon: Settings, label: 'Usuarios', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 bg-[#3879a3] dark:bg-slate-950 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-56'} w-56`}
      >
        {/* Header with Logo */}
        <div className={`flex items-center h-16 bg-[#2d6a8a] dark:bg-slate-900 ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'}`}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <img
                src="/images/logo-dark.png"
                alt="deCampoaCampo Logo"
                className="h-11 w-auto object-contain"
              />
              <div className="leading-tight">
                <p className="text-white font-semibold text-sm">Herramienta</p>
                <p className="text-slate-300 font-medium text-xs">Compliance</p>
              </div>
            </div>
          ) : (
            <img
              src="/images/logo-dark.png"
              alt="deCampoaCampo"
              className="h-10 w-auto object-contain"
            />
          )}
          <button
            className="lg:hidden text-white p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Collapse toggle button - desktop only */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full items-center justify-center text-white shadow-lg z-40 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <nav className="mt-2 px-2 flex-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 transition-colors ${isActive
                  ? 'text-white bg-[#3879a3]'
                  : 'text-white/80 hover:bg-white/10 dark:text-slate-300 dark:hover:bg-slate-800'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className={`absolute bottom-0 left-0 right-0 p-2 border-t border-slate-700 ${sidebarCollapsed ? 'px-1' : 'px-3'}`}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#3879a3' }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-slate-400 text-[10px]">{getRoleInfo(user?.role)?.shortLabel || user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-white/80 hover:text-white w-full px-2 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800 transition-colors text-sm"
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: '#3879a3' }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 dark:hover:bg-slate-800 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-card shadow-sm flex items-center justify-between px-4 border-b border-border">
          <button
            className="lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-5 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
