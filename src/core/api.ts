import { getAuthTokens, updateSessionTokens, clearSession } from './session';
import { refreshKindeTokens } from './kindeAuth';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const doFetch = async (endpoint: string, options: RequestInit, idToken?: string) => {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      ...(options.headers || {}),
    },
  });
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const tokens = await getAuthTokens();
  let response = await doFetch(endpoint, options, tokens?.idToken);

  if (response.status === 401 && tokens?.refreshToken) {
    const refreshed = await refreshKindeTokens(tokens.refreshToken);
    if (refreshed) {
      await updateSessionTokens(refreshed);
      response = await doFetch(endpoint, options, refreshed.idToken);
    } else {
      await clearSession();
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error en la petición API');
  }
  return data;
};