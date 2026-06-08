import { renew } from './authApi';
import { tokenStore } from './tokenStore';
import { emitAuthFailure } from './authEvents';

let pending = null; // promesa de renew en vuelo (single-flight)

// Renueva el access token usando uuid + refresh_token. Si varias requests fallan con 401
// al mismo tiempo, todas comparten la MISMA llamada de renew (no se dispara N veces).
export function refreshSession() {
  if (pending) return pending;

  pending = (async () => {
    const uuid = tokenStore.getUuid();
    const refresh = tokenStore.getRefreshToken();

    if (!uuid || !refresh) {
      tokenStore.clear();
      emitAuthFailure();
      throw new Error('No refresh credentials available');
    }

    try {
      const { token, refresh_token } = await renew(uuid, refresh);
      tokenStore.setSession({ token, refresh_token, uuid }); // rota el refresh
      return token;
    } catch (err) {
      tokenStore.clear();
      emitAuthFailure();
      throw err;
    } finally {
      pending = null; // permite futuros renews una vez que este termina
    }
  })();

  return pending;
}
