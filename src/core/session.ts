import * as SecureStore from 'expo-secure-store';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  departmentId?: string | null;
}

export interface AuthSessionData {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: UserSession;
}

const SESSION_KEY = 'roomiesmart_session';

const getAuthSessionData = async (): Promise<AuthSessionData | null> => {
  try {
    const session = await SecureStore.getItemAsync(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('Error cargando la sesión', error);
    return null;
  }
};

export const saveSession = async (session: AuthSessionData) => {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error guardando la sesión', error);
  }
};

// Mantiene la firma histórica (solo el perfil) para no tocar las pantallas que ya consumen getSession().
export const getSession = async (): Promise<UserSession | null> => {
  const session = await getAuthSessionData();
  return session?.user ?? null;
};

type AuthTokens = Pick<AuthSessionData, 'idToken' | 'accessToken' | 'refreshToken' | 'expiresAt'>;

export const getAuthTokens = async (): Promise<AuthTokens | null> => {
  const session = await getAuthSessionData();
  if (!session) return null;
  const { idToken, accessToken, refreshToken, expiresAt } = session;
  return { idToken, accessToken, refreshToken, expiresAt };
};

export const updateSessionTokens = async (tokens: AuthTokens) => {
  const session = await getAuthSessionData();
  if (!session) return;
  await saveSession({ ...session, ...tokens });
};

export const updateSessionUser = async (user: UserSession) => {
  const session = await getAuthSessionData();
  if (!session) return;
  await saveSession({ ...session, user });
};

export const clearSession = async () => {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    console.error('Error limpiando la sesión', error);
  }
};
