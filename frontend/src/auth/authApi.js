import axios from 'axios';
import { API_BASE } from '../config/env';

// Instancia BARE: sin interceptores. Se usa solo para los dos endpoints públicos de auth,
// así un renew nunca puede re-disparar el interceptor de 401 y entrar en recursión.
export const authHttp = axios.create({
  baseURL: API_BASE,
});

// El gateway espera form-data (multipart), lee post['mail'] / post['password'].
export async function login(mail, password) {
  const form = new FormData();
  form.append('mail', mail);
  form.append('password', password);
  const { data } = await authHttp.post('/auth/login', form);
  return data; // { token, refresh_token }
}

// Renew: el gateway lee post['uuid'] / post['refresh_token'].
export async function renew(uuid, refresh_token) {
  const form = new FormData();
  form.append('uuid', uuid);
  form.append('refresh_token', refresh_token);
  const { data } = await authHttp.post('/auth/login/renew', form);
  return data; // { token, refresh_token } (refresh rotado)
}
