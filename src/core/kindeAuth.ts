import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const KINDE_DOMAIN = process.env.EXPO_PUBLIC_KINDE_DOMAIN as string;
const KINDE_CLIENT_ID = process.env.EXPO_PUBLIC_KINDE_CLIENT_ID as string;
const KINDE_CONNECTION_ID = process.env.EXPO_PUBLIC_KINDE_CONNECTION_ID as string;

const redirectUri = AuthSession.makeRedirectUri({ scheme: 'roomiesmart', path: 'redirect' });

export interface KindeIdTokenClaims {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  [key: string]: any;
}

export interface KindeTokens {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const cleaned = base64.replace(/=+$/, '');

  let bits = '';
  for (const char of cleaned) {
    const index = BASE64_CHARS.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(6, '0');
  }

  let percentEncoded = '';
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const byte = parseInt(bits.slice(i, i + 8), 2);
    percentEncoded += '%' + byte.toString(16).padStart(2, '0');
  }
  return decodeURIComponent(percentEncoded);
}

export function decodeIdToken(idToken: string): KindeIdTokenClaims {
  const payload = idToken.split('.')[1];
  return JSON.parse(base64UrlDecode(payload));
}

export function useKindeLogin() {
  const discovery = AuthSession.useAutoDiscovery(KINDE_DOMAIN);

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: KINDE_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: true,
      extraParams: { connection_id: KINDE_CONNECTION_ID },
    },
    discovery
  );

  const login = async (): Promise<KindeTokens | null> => {
    if (!request || !discovery) {
      throw new Error('Kinde no está listo todavía. Intenta de nuevo en un momento.');
    }

    const result = await promptAsync();
    if (result.type !== 'success') {
      return null;
    }

    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId: KINDE_CLIENT_ID,
        code: result.params.code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier ?? '' },
      },
      discovery
    );

    if (!tokenResponse.idToken) {
      throw new Error('Kinde no devolvió un idToken.');
    }

    return {
      idToken: tokenResponse.idToken,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
    };
  };

  return { login, ready: !!request && !!discovery };
}

export async function refreshKindeTokens(refreshToken: string): Promise<KindeTokens | null> {
  const discovery = await AuthSession.fetchDiscoveryAsync(KINDE_DOMAIN);
  try {
    const tokenResponse = await AuthSession.refreshAsync({ clientId: KINDE_CLIENT_ID, refreshToken }, discovery);
    if (!tokenResponse.idToken) return null;
    return {
      idToken: tokenResponse.idToken,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken ?? refreshToken,
      expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
    };
  } catch {
    return null;
  }
}
