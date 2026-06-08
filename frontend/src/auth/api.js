import axios from 'axios';
import { API_BASE } from '../config/env';
import { tokenStore } from './tokenStore';
import { refreshSession } from './refreshSession';

// Instancia interceptada para llamadas a la API real (/v1). Es la que usarán los endpoints
// protegidos a medida que se migren. El login/renew NO la usan (usan authHttp bare).
export const api = axios.create({
  baseURL: API_BASE,
});

// Adjunta el access token (en memoria) a cada request saliente.
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ante 401: renueva una vez y reintenta el request original con el token nuevo.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const newToken = await refreshSession();
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original); // reintento con token fresco
      } catch (renewErr) {
        return Promise.reject(renewErr); // renew falló → la sesión ya se limpió
      }
    }

    return Promise.reject(error);
  }
);
