RoomieSmart - Guía de Ejecución 🚀

RoomieSmart es una plataforma integral (Backend, Web y Mobile) diseñada para conectar estudiantes universitarios con sus roomies ideales y gestionar finanzas compartidas.

A continuación se detallan las instrucciones para levantar cada uno de los microservicios en un entorno de desarrollo local.

🏗 Arquitectura del Proyecto
El proyecto está dividido en 3 carpetas principales:

Backend (roomiesmart-backend): Node.js + Express + TypeScript + Supabase.
Frontend Web (roomiesmart-frontend): React + Vite + TailwindCSS.
Frontend Móvil (roomiesmart-mobile): React Native + Expo.
IMPORTANT

Requisitos Previos

Node.js (v18 o superior).
Gestor de paquetes npm o yarn.
Aplicación Expo Go instalada en tu celular (o un emulador de Android Studio/iOS Simulator).
Las variables de entorno .env deben estar configuradas en cada proyecto (solicitar al administrador del repositorio).
1. ⚙️ Levantar el Backend (API REST)
El backend expone todos los endpoints necesarios para el funcionamiento del ecosistema.

Abre una terminal y navega a la carpeta del backend:
bash

cd roomiesmart-backend
Instala las dependencias:
bash

npm install
Ejecuta el servidor en modo desarrollo:
bash

npm run dev
NOTE

Verás en consola que el servidor inicia en http://localhost:3000 (o el puerto configurado en el .env). Asegúrate de que no haya otro servicio ocupando este puerto.

2. 💻 Levantar el Frontend Web
La plataforma web es el punto de entrada principal donde los usuarios se registran y llenan su perfil (Kinde Auth).

Abre una nueva terminal y navega a la carpeta del frontend:
bash

cd roomiesmart-frontend
Instala las dependencias:
bash

npm install
Inicia el servidor de desarrollo de Vite:
bash

npm run dev
Abre tu navegador en la URL que indique la consola (usualmente http://localhost:5173).
3. 📱 Levantar el Frontend Móvil (App)
La aplicación móvil permite chatear, hacer matchmaking y gestionar finanzas en el día a día.

WARNING

Configuración de Red para Móvil Para que tu celular (o emulador) pueda comunicarse con el backend local, la app móvil necesita saber la Dirección IP de tu computadora en tu red Wi-Fi.

Abre una terminal y escribe ipconfig (Windows) o ifconfig (Mac/Linux) para averiguar tu IP IPv4 (ej. 192.168.1.15).
Ve al archivo roomiesmart-mobile/src/core/api.ts y asegúrate de que la BASE_URL apunte a esa IP (ej. http://192.168.1.15:3000).
Abre una tercera terminal y navega a la carpeta móvil:
bash

cd roomiesmart-mobile
Instala las dependencias (se recomienda usar npx expo install para evitar conflictos nativos):
bash

npm install
Inicia el empaquetador de Expo limpiando la caché:
bash

npx expo start --clear
Para probar la app:
En tu celular físico: Escanea el código QR que aparece en la terminal usando la app de Expo Go. (Ambos dispositivos deben estar en el mismo Wi-Fi).
En Emulador: Presiona la tecla a en la terminal para abrirlo en Android, o i para abrirlo en el simulador de iOS.
🛠 Solución de Problemas Comunes
Error "Network Error" en el Móvil: Significa que el celular no puede alcanzar el backend. Verifica que la IP en api.ts sea correcta, que tu PC y el celular estén en el mismo Wi-Fi, y que el firewall de Windows no esté bloqueando el puerto 3000.
Errores extraños de navegación o caché en móvil: Apaga el servidor de Expo (Ctrl + C) y vuelve a ejecutar npx expo start --clear.
Token inválido: Recuerda que la app móvil utiliza una simulación de sesión interna para desarrollo rápido. Debes registrar el correo desde la Web primero para que exista en Supabase, y luego usar ese mismo correo (@uce.edu.ec) para iniciar sesión en la App.
