// Decodifica el payload del JWT SIN verificar la firma. La firma es responsabilidad
// del servidor; el cliente solo necesita leer claims (uuid, exp, etc.).
export function decodeJwt(token) {
  const part = token.split('.')[1];
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(json);
}

// El uuid necesario para el renew vive en data.uuid del JWT.
export function getUuidFromToken(token) {
  return decodeJwt(token).data.uuid;
}
