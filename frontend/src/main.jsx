import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import App from './App';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

// DEMO MODE: Clear any cached auth state
localStorage.removeItem('auth-storage');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fff1f2', minHeight: '100vh' }}>
          <h2 style={{ color: '#b91c1c' }}>⚠ Error en la aplicación</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#7f1d1d', background: '#fee2e2', padding: 16, borderRadius: 8 }}>
            {this.state.error.toString()}
            {'\n'}
            {this.state.error.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <ToastContainer
            position="bottom-right"
            autoClose={2000}
            hideProgressBar
            newestOnTop
            closeOnClick
            pauseOnHover={false}
            limit={3}
            toastStyle={{
              fontSize: '13px',
              padding: '8px 14px',
              minHeight: 'unset',
              borderRadius: '10px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
