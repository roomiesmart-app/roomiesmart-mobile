# Autenticación en roomiesmart-mobile (Kinde SSO)

## Contexto y problema original

El login de la app móvil pedía únicamente un correo (`@uce.edu.ec`) y, si el backend
respondía que ese correo ya existía (`GET /api/v1/identity/check-status/:email`),
guardaba una sesión local "de mentira" con ese email — sin verificar la identidad de
quien lo escribió. Cualquiera podía teclear el correo de otra persona y entrar como
ella.

El backend real (`roomiesmart-backend`) y el frontend web (`roomiesmart-frontend`) ya
habían migrado la autenticación a **Kinde** (SSO/OIDC, con una conexión institucional
tipo Microsoft para `@uce.edu.ec`). Las rutas protegidas del backend
(`/api/v1/identity/me`, `/api/v1/identity/onboarding`) exigen un JWT de Kinde válido
(middleware `requireKindeAuth`). El endpoint legacy de email+password
(`/api/v1/identity/login`) está roto: el DTO de registro ya ni siquiera tiene campo
`password`.

**Conclusión:** para que el login mobile sea real y seguro, tenía que hablar con Kinde
igual que el web, no solo con el backend.

## Cómo funciona ahora

1. El usuario toca "Ingresar con tu correo UCE" en [`LoginScreen.tsx`](../src/presentation/screens/LoginScreen.tsx).
2. Se abre el navegador del sistema con el flujo OAuth 2.0 + PKCE de Kinde (Authorization
   Code Flow), usando la misma conexión SSO institucional que usa el frontend web
   (`connection_id`).
3. El usuario se autentica en la página hospedada de Kinde (fuera de la app).
4. Kinde redirige de vuelta a la app vía un scheme de URL personalizado (`roomiesmart://redirect`).
5. La app intercambia el `code` recibido por tokens (`idToken`, `accessToken`,
   `refreshToken` si aplica) directamente contra el `token_endpoint` de Kinde.
6. Se decodifica el `idToken` (JWT) para sacar `email`, `sub` (id) y nombre.
7. Se llama a `GET /api/v1/identity/check-status/:email` — igual que hace el
   `AuthDispatcher` del web — para saber si el usuario ya completó su registro.
   - Si no existe: se le pide que se registre primero en la web (mismo comportamiento
     de antes).
   - Si existe: se llama a `GET /api/v1/identity/me` **con el `idToken` como
     `Authorization: Bearer`**, el backend valida el JWT contra Kinde y devuelve el
     perfil real (id, email, `departmentId`, presupuesto, etc.).
8. Se guarda todo (tokens + perfil) en `expo-secure-store` y se navega al `MainApp`.

A partir de ahí, cada llamada a la API adjunta automáticamente el `idToken` como
`Authorization: Bearer`. Si el backend responde 401 y hay `refreshToken` disponible,
se intenta refrescar una vez antes de fallar.

### Por qué no se usó el SDK oficial `@kinde/expo`

Kinde publica un paquete (`@kinde/expo`) que envuelve todo este flujo, pero ninguna
versión publicada calza con Expo 54 de este proyecto: la rama `0.5.x` trae
`expo-auth-session@^5.5.2` (apunta a ~Expo 50-51) y la `0.6.x` salta directo a
`expo-auth-session@^55.0.0` (apunta a Expo 55). Instalarlo forzaría una versión nativa
de `expo-auth-session`/`expo-web-browser` en conflicto con las que Expo 54 ya trae
(`~7.0.11` / `~15.0.11`). Por eso se implementó el flujo directamente con
`expo-auth-session` (que sí viene versionado correctamente para Expo 54), usando el
descubrimiento OIDC estándar de Kinde.

## Archivos nuevos/modificados

| Archivo | Qué hace |
|---|---|
| [`src/core/kindeAuth.ts`](../src/core/kindeAuth.ts) | **Nuevo.** Todo el flujo OAuth/PKCE: `useKindeLogin()` (hook para disparar el login desde una pantalla) y `refreshKindeTokens()` (refresh silencioso). También decodifica el `idToken` (`decodeIdToken`) con un decoder base64url manual (sin depender de `atob`, cuya disponibilidad en Hermes no está garantizada). |
| [`src/core/session.ts`](../src/core/session.ts) | Migrado de `AsyncStorage` a `expo-secure-store` (los tokens son sensibles). `getSession()` sigue devolviendo solo el perfil (`UserSession`) para no romper las pantallas existentes; se agregaron `getAuthTokens()` y `updateSessionTokens()` para uso interno de `api.ts`. |
| [`src/core/api.ts`](../src/core/api.ts) | `fetchApi` ahora adjunta `Authorization: Bearer <idToken>` en cada llamada y reintenta una vez con refresh token si recibe 401. |
| [`src/infrastructure/AuthRepository.ts`](../src/infrastructure/AuthRepository.ts) | Se agregó `getMe()` (llama a `/api/v1/identity/me`). `checkStatus()` sigue igual, ahora se usa solo como "router" post-login. |
| [`src/presentation/screens/LoginScreen.tsx`](../src/presentation/screens/LoginScreen.tsx) | Ya no pide el correo por texto. El botón dispara `useKindeLogin().login()` y encadena: validar dominio → `checkStatus` → `getMe` → guardar sesión → navegar. |
| `app.json` | Se agregó `"scheme": "roomiesmart"` (requerido para el redirect de OAuth) y, automáticamente vía `expo install`, los plugins `expo-web-browser`/`expo-secure-store`. |
| `eas.json` | **Nuevo.** Perfiles `development` (dev client) y `preview` (APK instalable standalone) y `production`. |
| `.env` | Se agregaron `EXPO_PUBLIC_KINDE_DOMAIN`, `EXPO_PUBLIC_KINDE_CLIENT_ID`, `EXPO_PUBLIC_KINDE_CONNECTION_ID`. También se corrigió `EXPO_PUBLIC_API_URL` (tenía `/api/v1` duplicado con lo que ya agregan los repositorios, causando 404 en todo). |

## Variables de entorno requeridas

```
EXPO_PUBLIC_API_URL=https://prod.roomiesmart.lat
EXPO_PUBLIC_KINDE_DOMAIN=https://roomiesmart.kinde.com
EXPO_PUBLIC_KINDE_CLIENT_ID=<client_id de la app "Native" en Kinde>
EXPO_PUBLIC_KINDE_CONNECTION_ID=conn_019effc8ade0c6776f395e6ad86557f6
```

Para builds locales (`npx expo start`), estas se leen de `.env`. Para builds en la nube
(`eas build`), **`.env` no se sube automáticamente** — hay que registrarlas como
variables de entorno del proyecto en EAS:

```
npx eas env:create --scope project --name <NOMBRE> --value "<valor>" \
  --visibility plaintext --environment production preview development
```

Ver todas las configuradas: `npx eas env:list <environment>`.

## Configuración necesaria en el dashboard de Kinde

En `roomiesmart.kinde.com` → Settings → Applications, se creó una app tipo **Native**
(distinta de la app "Single Page App" que usa el frontend web) con:

- **Allowed callback URLs:** `roomiesmart://redirect`
- **Allowed logout redirect URLs:** `roomiesmart://redirect`
- La conexión SSO institucional (`conn_019effc8ade0c6776f395e6ad86557f6`) habilitada
  para esta app.
- Scopes solicitados: `openid`, `profile`, `email` (**sin** `offline_access` — el
  client de Kinde no lo tiene habilitado; si se quiere refresh token real habría que
  activarlo ahí primero).

## Cómo generar un build

- **Development build** (para probar con Metro corriendo, permite hot reload):
  ```
  eas build --profile development --platform android
  ```
  Requiere correr `npx expo start --dev-client` y conectar el dev client a la IP LAN
  de la máquina (`http://<tu-ip-local>:8081`), no funciona con Expo Go por el scheme
  custom.

- **Preview build** (APK standalone, instalable directo, sin Metro — "como una app
  normal"):
  ```
  eas build --profile preview --platform android
  ```
  Al terminar, EAS da un link/QR para instalar el APK directamente en un dispositivo
  Android.

- **Production**: mismo perfil `production` de `eas.json`, pensado para generar el AAB
  y subirlo a Google Play (requiere cuenta de Play Console, ficha de tienda, etc. —
  no configurado todavía).

## Problemas encontrados durante la implementación (por si reaparecen)

- **Login "no me deja entrar" con correo ya registrado:** `EXPO_PUBLIC_API_URL` tenía
  `/api/v1` de más, duplicando la ruta (`/api/v1/api/v1/...` → 404). Corregido dejando
  solo el dominio en la env var.
- **`{"error":"invalid_scope", ... 'offline_access'}`:** la app Native en Kinde no
  tenía habilitado ese scope. Se quitó del `scopes` en `kindeAuth.ts`. Si se necesita
  refresh token real, hay que habilitarlo en el dashboard de Kinde y volver a agregarlo.
- **`Unable to load script` en el dev build:** el dev client no sabía a qué Metro
  conectarse (se abrió sin pasar por el QR). Solución: en el dev client, "Enter URL
  manually" → `http://<ip-lan-de-la-pc>:8081`.
- **Build de EAS sin las variables de entorno:** EAS Build no lee `.env` local — hay
  que registrar las variables con `eas env:create` para cada ambiente
  (`development`/`preview`/`production`) o el build queda con `undefined` en las URLs
  de API/Kinde.

## Fuera de alcance / deuda conocida

- `FinanceRepository.ts` llama a `/api/expenses/:departmentId`, ruta que no existe en
  el backend (que expone todo bajo `/api/v1/...`). Bug preexistente, no relacionado con
  este trabajo.
- No hay pantalla de onboarding en mobile: si el correo no existe todavía en la base,
  se le pide al usuario que complete el registro en la web (mismo comportamiento que
  ya existía).
- No se implementó publicación en Google Play (solo el build `preview` para instalar
  manualmente).
