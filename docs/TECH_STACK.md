# Stack técnico — roomiesmart-mobile

Documentación de referencia de todas las tecnologías usadas para adaptar RoomieSmart a mobile. No es un changelog — describe el estado actual de la app, de punta a punta.

## 1. Runtime y framework base

| Tecnología | Versión | Rol |
|---|---|---|
| [Expo](https://docs.expo.dev/) | SDK 54 (`~54.0.34`) | Framework/toolchain sobre React Native: build system, módulos nativos, dev client, EAS. |
| React Native | `0.81.5` | Motor de renderizado nativo (Android/iOS) sobre el que corre la app. |
| React | `19.1.0` | Librería de componentes/UI. |
| TypeScript | `~5.9.2` | Tipado estático en toda la app. |

La app usa el **workflow administrado de Expo** (`app.json`), sin código nativo propio — todo se compila vía **EAS Build**.

## 2. Navegación

- **`@react-navigation/native`** + **`@react-navigation/native-stack`**: stack principal (`AppNavigation.tsx`) que decide la pantalla inicial (`Login` vs `MainApp`) según si hay sesión guardada, y aloja Login, el wizard de registro (Onboarding), Chat, PublishSpace (modal) y SpaceRequests.
- **`@react-navigation/bottom-tabs`**: navegación inferior dentro de `MainApp` (Roomies / Espacios / Mensajes / Finanzas), con iconos de `lucide-react-native`.

## 3. Autenticación — Kinde SSO (OAuth 2.0 + PKCE)

El backend (`roomiesmart-backend`) y el frontend web ya usan **Kinde** como proveedor de identidad (SSO institucional para correos `@uce.edu.ec`). Mobile replica el mismo flujo, pero implementado directamente con las piezas de Expo en vez del SDK envoltorio `@kinde/expo` (sus versiones publicadas no calzan con Expo 54 — ver `docs/AUTH.md` para el detalle).

| Paquete | Rol |
|---|---|
| `expo-auth-session` | Arma la solicitud de autorización (Authorization Code + PKCE), abre el navegador de Kinde, intercambia el `code` por tokens (`idToken`, `accessToken`, `refreshToken`) contra el `token_endpoint`, y soporta el refresh silencioso. |
| `expo-web-browser` | Abre la sesión de login de Kinde en el navegador del sistema (`ASWebAuthenticationSession`/Custom Tabs) y cierra el flujo al volver (`maybeCompleteAuthSession`). |
| `expo-crypto` | Dependencia de `expo-auth-session` para generar el `code_verifier`/`code_challenge` de PKCE. |
| `expo-secure-store` | Guarda la sesión (tokens + perfil) cifrada en el keystore/keychain del dispositivo — nunca en `AsyncStorage` en texto plano. |

Todo el flujo vive en [`src/core/kindeAuth.ts`](../src/core/kindeAuth.ts) (`useKindeLogin()`, `decodeIdToken()`, `refreshKindeTokens()`) y [`src/core/session.ts`](../src/core/session.ts) (persistencia). El `idToken` decodificado (JWT, claims `email`/`sub`/`given_name`) identifica al usuario; el backend valida ese mismo JWT contra Kinde en cada request protegido.

**Requiere un scheme de URL personalizado** (`roomiesmart://`, declarado en `app.json`) para el redirect de OAuth — por eso la app **no funciona en Expo Go**, solo en un development/preview build generado con EAS.

## 4. Capa de red (API)

[`src/core/api.ts`](../src/core/api.ts) expone `fetchApi(endpoint, options)`, un wrapper sobre `fetch` nativo (sin Axios) que:
- Antepone `EXPO_PUBLIC_API_URL` (backend en `https://prod.roomiesmart.lat`).
- Adjunta `Authorization: Bearer <idToken>` automáticamente si hay sesión.
- Si el backend responde `401` y hay `refreshToken`, refresca el token una vez (`refreshKindeTokens`) y reintenta la petición antes de rendirse.

Sobre esa base se organizan **repositorios por dominio** (patrón Repository), cada uno mapeando a un grupo de endpoints REST del backend Express:

| Repositorio | Dominio |
|---|---|
| `AuthRepository` | Identidad: `check-status`, `/identity/me`, `/identity/onboarding`. |
| `SpaceRepository` | Espacios/departamentos: publicar, listar, solicitudes de unión, miembros. |
| `CatalogRepository` | Catálogos de referencia: ciudades, áreas comunes, amenidades. |
| `MatchmakingRepository` | Perfiles de compatibilidad (matchmaking con IA). |
| `ChatRepository` | Conversaciones y mensajes (polling, no WebSockets en mobile). |
| `FinanceRepository` | Gastos compartidos, pagos, recordatorios. |

## 5. Persistencia local

- **`expo-secure-store`**: única fuente de verdad de la sesión (tokens de Kinde + perfil del usuario), cifrada por el sistema operativo.
- **`@react-native-async-storage/async-storage`**: dependencia transitiva de algunos módulos de Expo/RN Navigation; ya no se usa directamente para la sesión (se migró a SecureStore).

No hay una librería de estado global (Redux/Zustand/Context API extenso) — cada pantalla resuelve su propio estado con `useState`/`useEffect`, salvo el **wizard de registro**, que usa un `React.Context` (`OnboardingProvider`/`useOnboarding()` en `src/core/onboarding.ts`) para acumular el formulario entre sus 4 pasos.

## 6. UI

- **React Native core components** (`View`, `Text`, `ScrollView`, `Modal`, `TextInput`, `FlatList`, etc.) con `StyleSheet.create` — sin librería de UI de terceros (no NativeBase/Tamagui/Paper).
- **`lucide-react-native`**: set de iconos (tabs, acciones).
- **`expo-image-picker`**: selección de fotos desde la galería (publicar espacio).
- **`expo-status-bar`**: control del status bar del sistema.

## 7. Arquitectura de carpetas

```
src/
  core/           # transversal: sesión, cliente API, auth de Kinde, cálculo de finanzas, contexto de onboarding
  infrastructure/  # repositorios (una clase por dominio, llaman a fetchApi)
  presentation/
    screens/       # una pantalla por archivo
      onboarding/  # wizard de registro (4 pasos) + estilos compartidos
    navigation/    # AppNavigation.tsx (stack + tabs)
    components/    # componentes reutilizables (ProfileCard, FilterModal)
```

Separación por capas: **presentation** (pantallas/navegación) → **infrastructure** (repositorios, un método por endpoint) → **core** (sesión, cliente HTTP, auth). Las pantallas nunca llaman a `fetch` directo, siempre pasan por un repositorio.

## 8. Backend con el que integra

- **`roomiesmart-backend`**: Node/Express + Supabase (Postgres), desplegado en `https://prod.roomiesmart.lat`. Expone la mayoría de rutas bajo `/api/v1/...` y las de gastos bajo `/api/expenses/...` (prefijo distinto, histórico).
- **Kinde** (`https://roomiesmart.kinde.com`): proveedor de identidad, valida los JWT que llegan al backend (`requireKindeAuth` middleware).
- **Supabase**: base de datos real (usuarios, espacios/departamentos, gastos, catálogos); mobile nunca habla con Supabase directo, todo pasa por el backend.

## 9. Build y despliegue — EAS

| Herramienta | Uso |
|---|---|
| `expo-dev-client` | Permite un build de desarrollo instalable (no Expo Go) que sí soporta el scheme custom de Kinde. |
| **EAS Build** (`eas.json`) | Perfiles `development` (dev client + Metro), `preview` (APK standalone instalable, sin Metro — el que se usa para probar en dispositivos reales) y `production` (pensado a futuro para Google Play). |
| **EAS Environment Variables** | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_KINDE_DOMAIN`, `EXPO_PUBLIC_KINDE_CLIENT_ID`, `EXPO_PUBLIC_KINDE_CONNECTION_ID` — registradas por ambiente vía `eas env:create` (el `.env` local **no** se sube automáticamente a los builds en la nube). |
| `app.json` | `scheme: "roomiesmart"` (deep link de OAuth), `android.package` (`com.rpchapi.roomiesmartmobile`), plugins de Expo (`expo-web-browser`, `expo-secure-store`). |

## 10. Dependencias completas (`package.json`)

| Paquete | Versión | Para qué |
|---|---|---|
| `expo` | ~54.0.34 | Framework base |
| `expo-auth-session` | ~7.0.11 | OAuth/PKCE con Kinde |
| `expo-web-browser` | ~15.0.11 | Navegador in-app para el login |
| `expo-crypto` | ~15.0.9 | PKCE (code verifier/challenge) |
| `expo-secure-store` | ~15.0.8 | Sesión cifrada |
| `expo-dev-client` | ~6.0.21 | Development build instalable |
| `expo-image-picker` | ~17.0.11 | Subir fotos al publicar un espacio |
| `expo-status-bar` | ~3.0.9 | Status bar del sistema |
| `@react-navigation/native` | ^7.3.8 | Núcleo de navegación |
| `@react-navigation/native-stack` | ^7.17.10 | Stack de pantallas |
| `@react-navigation/bottom-tabs` | ^7.18.8 | Tabs inferiores |
| `@react-native-async-storage/async-storage` | 2.2.0 | Dependencia transitiva (ya no se usa para la sesión) |
| `react-native-safe-area-context` | ~5.6.0 | Respetar notch/status bar |
| `react-native-screens` | ~4.16.0 | Optimización nativa de pantallas para React Navigation |
| `lucide-react-native` | ^1.24.0 | Iconos |
| `react` / `react-native` | 19.1.0 / 0.81.5 | Base |
| `typescript` | ~5.9.2 | Tipado (dev) |
