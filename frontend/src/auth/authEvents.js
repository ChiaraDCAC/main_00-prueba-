// Pub/sub mínimo para desacoplar el interceptor (JS plano) de React.
// Cuando un renew falla, el interceptor emite "authFailure" y AuthContext reacciona (logout).
const listeners = new Set();

export function onAuthFailure(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb); // unsubscribe
}

export function emitAuthFailure() {
  for (const cb of listeners) cb();
}
