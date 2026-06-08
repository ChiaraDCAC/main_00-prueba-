// Host de la API, configurable por entorno (VITE_API_URL en .env / .env.dist).
// Fallback a '/' para preservar el comportamiento relativo si la var no está definida.
const rawHost = import.meta.env.VITE_API_URL ?? '/';

// Normaliza la barra final para ser robusto ante valores con o sin '/'.
export const API_URL = rawHost.endsWith('/') ? rawHost : `${rawHost}/`;

// Base de la API real en migración (versionada bajo /v1). Ej: https://api.dcac.ar/v1
// Migración incremental: por ahora la usa SOLO el login (authStore). El resto de las
// requests siguen pegando relativo a /api contra el backend local.
export const API_BASE = `${API_URL}v1`;
