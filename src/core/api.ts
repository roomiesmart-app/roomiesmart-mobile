// El IP de tu máquina en la red local o emulador.
// Puedes cambiarlo aquí para desarrollo o apuntar a prod.
export const API_BASE_URL = 'http://192.168.18.4:3000';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error en la petición API');
  }
  return data;
};
