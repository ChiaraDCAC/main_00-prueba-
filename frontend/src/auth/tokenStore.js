// Fuente única de verdad para los tokens.
// - Access token: SOLO en memoria (se pierde en un reload completo → limita exposición a XSS).
// - Refresh token + uuid: en localStorage, para sobrevivir recargas y poder renovar.
const REFRESH_KEY = 'auth.refresh_token';
const UUID_KEY = 'auth.uuid';

let accessToken = null; // en memoria

export const tokenStore = {
  getAccessToken: () => accessToken,
  setAccessToken: (t) => { accessToken = t; },

  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  getUuid: () => localStorage.getItem(UUID_KEY),

  setSession: ({ token, refresh_token, uuid }) => {
    accessToken = token;
    localStorage.setItem(REFRESH_KEY, refresh_token);
    localStorage.setItem(UUID_KEY, uuid);
  },

  clear: () => {
    accessToken = null;
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(UUID_KEY);
  },
};
