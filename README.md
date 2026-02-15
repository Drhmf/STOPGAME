# 🎮 STOP Numérico

Un juego web multijugador donde dos jugadores compiten para encontrar números del 1 al 100 de forma secuencial. Cada jugador tiene una "mano" que se llena progresivamente, y gana el primero en completar todos los números.

## 🚀 Demo en Vivo

[Jugar STOP Numérico](https://TU-USUARIO.github.io/JUEGO-STOP/)

## ✨ Características

- 🌐 **Multijugador real**: Juega desde diferentes dispositivos (móvil, tablet, PC)
- 🔥 **Tiempo real**: Sincronización instantánea con Firebase
- 🎯 **Dos modos de juego**: 
  - **Automático**: El sistema elige números aleatorios
  - **Manual**: Tú eliges qué número buscar
- 🖐️ **Mecánica de mano**: Cada jugador tiene 300 huecos que se llenan progresivamente
- 📊 **Historial**: Visualiza todos los números encontrados
- 📱 **Responsive**: Funciona perfectamente en todos los dispositivos
- 🔒 **Salas privadas**: Crea o únete a una sala con código de 4 caracteres

## 🎯 Cómo Jugar

1. Ingresa tu nombre
2. Crea una sala o únete con un código
3. Elige el modo de juego (automático o manual)
4. ¡El primer jugador en encontrar todos los números del 1 al 100 gana!

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla ES6+)
- **Backend**: Firebase (Firestore + Authentication)
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## 📦 Configuración Local

### Prerrequisitos

- Un navegador web moderno
- Un servidor local (Live Server de VS Code, Python http.server, etc.)
- Git

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/TU-USUARIO/JUEGO-STOP.git
cd JUEGO-STOP
```

2. Crea tu archivo de configuración de Firebase:
```bash
cp firebase-config.template.js firebase-config.js
```

3. Edita `firebase-config.js` con tus credenciales de Firebase (ver sección siguiente)

4. Abre el proyecto con un servidor local (necesario para ES6 modules):
   - **VS Code**: Instala Live Server y haz clic derecho en `index.html` → "Open with Live Server"
   - **Python**: `python3 -m http.server 8000` y abre http://localhost:8000
   - **Node**: `npx serve` y abre la URL que muestra

## 🔧 Configuración de Firebase

### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita **Authentication** → Sign-in method → **Anonymous**
4. Habilita **Firestore Database** (crea en modo test inicialmente)

### 2. Obtener Credenciales

1. En Firebase Console, ve a **Project Settings** (⚙️)
2. En "Your apps", haz clic en el ícono web `</>`
3. Registra tu app y copia las credenciales
4. Pega las credenciales en `firebase-config.js`

### 3. Configurar Security Rules

Ve a **Firestore Database** → **Rules** y reemplaza con:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Función auxiliar para verificar autenticación
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Reglas para las salas de juego
    match /rooms/{roomId} {
      // Permitir lectura si está autenticado
      allow read: if isSignedIn();
      
      // Permitir crear sala si está autenticado
      allow create: if isSignedIn() 
        && request.resource.data.keys().hasAll(['createdAt', 'host', 'players', 'status'])
        && request.resource.data.players.size() <= 2;
      
      // Permitir actualizar solo a los jugadores de la sala
      allow update: if isSignedIn() 
        && request.auth.uid in resource.data.players.keys();
      
      // No permitir eliminar
      allow delete: if false;
    }
  }
}
```

## 🚀 Despliegue en GitHub Pages

### 1. Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. Crea los siguientes secrets con tus credenciales de Firebase:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`

### 2. Habilitar GitHub Pages

1. Ve a **Settings** → **Pages**
2. En "Build and deployment":
   - **Source**: GitHub Actions
3. El workflow se ejecutará automáticamente en cada push a `main`

### 3. Autorizar Dominio en Firebase

1. Ve a **Firebase Console** → **Authentication** → **Settings**
2. En "Authorized domains", agrega:
   - `TU-USUARIO.github.io`

### 4. Push y Deploy

```bash
git add .
git commit -m "🚀 Deploy STOP Numérico"
git push origin main
```

El sitio estará disponible en: `https://TU-USUARIO.github.io/JUEGO-STOP/`

## 📁 Estructura del Proyecto

```
JUEGO-STOP/
├── index.html              # Estructura principal
├── styles.css              # Estilos del juego
├── script.js               # Lógica del juego
├── firebase-config.js      # Credenciales (NO se sube a Git)
├── firebase-config.template.js  # Template de configuración
├── MANO PARA JUEGO.png     # Imagen de la mano
├── .gitignore              # Archivos ignorados por Git
├── .github/
│   └── workflows/
│       └── deploy.yml      # Workflow de deployment
└── README.md               # Esta documentación
```

## 🔐 Seguridad

- **Firebase Security Rules**: Controlan el acceso a los datos
- **GitHub Secrets**: Las credenciales NO están en el código
- **Anonymous Auth**: Solo usuarios autenticados pueden crear/unirse a salas
- **Validación**: El servidor valida todas las acciones del juego

## 🐛 Problemas Comunes

### El juego no carga / Errors en consola

- Verifica que estés usando un servidor local (no `file://`)
- Comprueba que `firebase-config.js` existe con credenciales válidas
- Revisa que Firebase Auth esté habilitado en modo Anonymous

### GitHub detecta las credenciales

- Asegúrate de que `firebase-config.js` está en `.gitignore`
- Si ya lo subiste, elimínalo del historial de Git:
```bash
git rm --cached firebase-config.js
git commit -m "Remove firebase config"
```

### GitHub Pages da 404

- Espera 2-3 minutos después del deploy
- Verifica que el workflow se ejecutó exitosamente en **Actions**
- Confirma que GitHub Pages está configurado con "GitHub Actions" como source

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👤 Autor

Creado con ❤️ para aprender y divertirse

---

¿Encontraste un bug? ¿Tienes una sugerencia? [Abre un issue](https://github.com/TU-USUARIO/JUEGO-STOP/issues)
