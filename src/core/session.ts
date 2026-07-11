import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  departmentId?: string | null;
}

const SESSION_KEY = '@roomiesmart_session';

export const saveSession = async (user: UserSession) => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error guardando la sesión', error);
  }
};

export const getSession = async (): Promise<UserSession | null> => {
  try {
    const session = await AsyncStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('Error cargando la sesión', error);
    return null;
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error limpiando la sesión', error);
  }
};
