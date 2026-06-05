import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { tokenStore } from './tokenStore';
import { login as apiLogin } from './authApi';
import { decodeJwt, getUuidFromToken } from './decodeJwt';
import { onAuthFailure } from './authEvents';
import { refreshSession } from './refreshSession';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Si hay refresh_token persistido, consideramos la sesión iniciada (el access token
  // se restaura con el bootstrap de abajo).
  const [isAuthenticated, setAuthenticated] = useState(() => !!tokenStore.getRefreshToken());
  const [user, setUser] = useState(null);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setAuthenticated(false);
  }, []);

  const login = useCallback(async (mail, password) => {
    const { token, refresh_token } = await apiLogin(mail, password);
    tokenStore.setSession({ token, refresh_token, uuid: getUuidFromToken(token) });
    setUser(decodeJwt(token).data); // datos del usuario embebidos en el JWT (sin role)
    setAuthenticated(true);
  }, []);

  // Un renew fallido en cualquier parte de la app termina la sesión.
  useEffect(() => onAuthFailure(logout), [logout]);

  // Tras un reload tenemos refresh_token pero no access token en memoria:
  // renovamos para restaurar la sesión sin re-pedir credenciales.
  useEffect(() => {
    if (tokenStore.getRefreshToken() && !tokenStore.getAccessToken()) {
      refreshSession()
        .then((token) => setUser(decodeJwt(token).data))
        .catch(() => {}); // el fallo ya dispara authFailure → logout
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
