import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { toast } from 'react-toastify';
import { Loader2, Moon, Sun } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Bienvenido al sistema');
      navigate('/');
    } catch (error) {
      // Error handling is done in the API interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 relative">
      {/* Theme toggle button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
        title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      >
        {theme === 'light' ? (
          <Moon size={20} className="text-white" />
        ) : (
          <Sun size={20} className="text-yellow-400" />
        )}
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          {/* Logo for light mode */}
          <img
            src="/images/logo-light.png"
            alt="deCampoaCampo Logo"
            className="h-28 w-auto object-contain mb-4 dark:hidden"
          />
          {/* Logo for dark mode */}
          <img
            src="/images/logo-dark.png"
            alt="deCampoaCampo Logo"
            className="h-28 w-auto object-contain mb-4 hidden dark:block"
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sistema de Compliance</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">KYC / AML / PLA</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Sistema protegido. Acceso solo para personal autorizado.
        </p>
      </div>
    </div>
  );
};

export default Login;
