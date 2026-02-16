# 🎮 STOP Numérico - Juego Multiplayer en Tiempo Real

Un juego web multijugador donde dos jugadores compiten para encontrar números secuenciales antes de que su "mano" se llene completamente. El primero en completar 300 puntos gana la partida.

[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-blue.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-10.8.1-orange.svg)](https://firebase.google.com/)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-yellow.svg)](https://developer.mozilla.org/es/docs/Web/JavaScript)

---

## 🚀 Demo en Vivo

🎯 **[Jugar Ahora](https://drhmf.github.io/STOPGAME/)**

> **Nota:** Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub después del despliegue.

---

## ✨ Características Principales

### 🎯 Mecánicas de Juego

- **🌐 Multijugador Real-Time**: Juega con amigos desde cualquier dispositivo
- **🖐️ Sistema de Mano**: 300 puntos que se llenan progresivamente (1 por segundo)
- **🎲 Modos de Selección**:
  - **Automático**: El sistema elige números aleatorios
  - **Manual**: Tú decides qué número buscar
- **🔒 Salas Privadas**: Códigos de 4 caracteres para jugar con quien quieras

### 🎨 Sistema de Progresión

- **🏆 8 Logros Desbloqueables**: Primera partida, victorias, rachas, y más
- **⬆️ Sistema de Niveles**: Gana XP y sube de nivel (Novato → Leyenda)
- **👤 Perfiles Personalizables**: Nombre de usuario + avatar emoji
- **📊 Estadísticas Completas**: Victorias, derrotas, partidas jugadas

### ⚙️ Personalización

- **🎚️ 4 Niveles de Dificultad**:
  - 🟢 Fácil: 1-50 números
  - 🟡 Normal: 1-100 números
  - 🔴 Difícil: 1-200 números
  - ⚫ Extremo: 1-500 números
- **☀️ Temas Claro/Oscuro**: Cambia el tema según tu preferencia
- **💾 Persistencia Automática**: Si actualizas la página, tus datos se mantienen

### 🛡️ Funcionalidades Técnicas

- **⏱️ Expiración de Salas**: Las salas se borran automáticamente después de 24h sin actividad
- **🚫 Prevención de Duplicados**: No puedes crear salas con códigos ya existentes
- **🔄 Reconexión Automática**: Si recargas la página, vuelves a tu partida
- **📱 Responsive Design**: Funciona perfectamente en móviles, tablets y PC

---

## 🎯 Cómo Jugar

### Paso 1: Configuración Inicial
1. **Ingresa tu nombre** (obligatorio)
2. **Selecciona dificultad**: Fácil, Normal, Difícil o Extremo
3. **Elige el modo de juego**: Clásico, Infinito o Desafío

### Paso 2: Crear o Unirse a una Sala
- **Crear Sala**: Click en "Crear sala" (genera código automático)
- **Unirse**: Ingresa el código de 4 caracteres y click en "Unirse"

### Paso 3: Jugar
1. **Jugador 1** inicia la partida con el botón "Iniciar juego"
2. Los jugadores se turnan para elegir números
3. El rival debe encontrar el número en su tablero antes de que la mano se llene (300 segundos)
4. **¡El primero en llenar su mano pierde!** ⚠️

### Objetivo
🏆 **Encuentra todos los números que puedas y haz que tu rival tarde más que tú.**

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Frontend** | HTML5, CSS3 | - |
| **JavaScript** | Vanilla ES6+ (Módulos) | - |
| **Base de Datos** | Firebase Firestore | 10.8.1 |
| **Autenticación** | Firebase Anonymous Auth | 10.8.1 |
| **Hosting** | GitHub Pages | - |
| **CI/CD** | GitHub Actions | - |
| **Tipografías** | Google Fonts (Sora, Space Grotesk) | - |

---

## 📦 Instalación y Configuración

### Prerrequisitos

- 🌐 Navegador web moderno (Chrome, Firefox, Safari, Edge)
- 🔥 Cuenta de Firebase (gratuita)
- 📝 Editor de código (VS Code recomendado)
- 🌍 Git instalado

### 1. Clonar el Repositorio

```bash
git clone https://github.com/TU-USUARIO/JUEGO-STOP-NUMERICO.git
cd JUEGO-STOP-NUMERICO
```

### 2. Configurar Firebase

#### A. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto"
3. Nombre: `STOP-Numerico` (o el que prefieras)
4. Deshabilita Google Analytics (opcional)
5. Click en "Crear proyecto"

#### B. Habilitar Firestore

1. En el menú lateral: **Firestore Database**
2. Click en "Crear base de datos"
3. Selecciona **modo de prueba** (por ahora)
4. Elige ubicación: `us-central` o la más cercana
5. Click en "Habilitar"

#### C. Configurar Reglas de Seguridad

1. Ve a la pestaña **Reglas** en Firestore
2. Copia y pega el contenido de `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomCode} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click en **Publicar**

#### D. Habilitar Autenticación Anónima

1. En el menú lateral: **Authentication**
2. Click en "Comenzar"
3. Click en la pestaña **Métodos de acceso**
4. Habilita **Anónimo**
5. Click en "Guardar"

#### E. Obtener Credenciales

1. En el menú lateral: **Configuración del proyecto** (⚙️)
2. En "Tus apps", click en **</>** (Web)
3. Registra la app: Nombre `STOP Numerico Web`
4. **NO marques** "Firebase Hosting"
5. Copia las credenciales que aparecen

#### F. Configurar Credenciales Localmente

1. Copia `firebase-config.template.js` a `firebase-config.js`:

```bash
cp firebase-config.template.js firebase-config.js
```

2. Edita `firebase-config.js` con tus credenciales:

```javascript
export const firebaseConfig = {
	apiKey: "TU_API_KEY_AQUI",
	authDomain: "tu-proyecto.firebaseapp.com",
	projectId: "tu-proyecto",
	storageBucket: "tu-proyecto.appspot.com",
	messagingSenderId: "123456789",
	appId: "1:123456789:web:abcdef123456"
};
```

> ⚠️ **IMPORTANTE:** `firebase-config.js` está en `.gitignore` y **NUNCA** debe subirse a GitHub.

### 3. Probar Localmente

#### Opción A: VS Code Live Server

1. Instala la extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Click derecho en `index.html` → "Open with Live Server"
3. Navega a `http://localhost:5500`

#### Opción B: Python HTTP Server

```bash
python3 -m http.server 8000
```

Navega a `http://localhost:8000`

#### Opción C: Node.js http-server

```bash
npx http-server -p 8000
```

Navega a `http://localhost:8000`

### 4. Verificar Funcionamiento

✅ Deberías poder:
- Crear una sala
- Unirte a una sala
- Ver el tablero de números
- Jugar una partida completa

---

## 🚀 Desplegar en GitHub Pages

### 1. Crear Repositorio en GitHub

1. Ve a [GitHub.com](https://github.com/)
2. Click en **New repository**
3. Nombre: `JUEGO-STOP-NUMERICO`
4. **Público** (para GitHub Pages gratis)
5. **NO inicialices** con README
6. Click en "Create repository"

### 2. Configurar GitHub Secrets

1. En tu repositorio: **Settings** → **Secrets and variables** → **Actions**
2. Click en **New repository secret**
3. Agrega cada valor de tu `firebase-config.js`:

| Name | Secret |
|------|--------|
| `FIREBASE_API_KEY` | Tu `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | Tu `authDomain` |
| `FIREBASE_PROJECT_ID` | Tu `projectId` |
| `FIREBASE_STORAGE_BUCKET` | Tu `storageBucket` |
| `FIREBASE_MESSAGING_SENDER_ID` | Tu `messagingSenderId` |
| `FIREBASE_APP_ID` | Tu `appId` |

### 3. Subir Archivos

#### Método 1: Interfaz Web (Fácil)

1. Ve a tu repositorio en GitHub
2. Click en **Add file** → **Upload files**
3. Arrastra TODOS los archivos **EXCEPTO** `firebase-config.js` y `script-backup.js`
4. Commit: `Initial commit: STOP Numérico game`

#### Método 2: Git CLI (Recomendado)

```bash
# Inicializar repositorio
git init
git add .
git commit -m "Initial commit: STOP Numérico game"

# Conectar con GitHub
git branch -M main
git remote add origin https://github.com/TU-USUARIO/JUEGO-STOP-NUMERICO.git
git push -u origin main
```

### 4. Activar GitHub Pages

1. En tu repositorio: **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main` → carpeta `/root`
4. Click en **Save**
5. Espera 2-3 minutos

### 5. Verificar Despliegue

Tu juego estará disponible en:
```
https://TU-USUARIO.github.io/JUEGO-STOP-NUMERICO/
```

---

## 📁 Estructura del Proyecto

```
JUEGO-STOP-NUMERICO/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions para deployment
├── docs/                        # Documentación adicional
│   ├── TOP-8-MEJORAS.md        # Características implementadas
│   ├── PERSISTENCIA.md         # Sistema de persistencia
│   ├── ARREGLOS.md             # Changelog de bugs corregidos
│   └── FIREBASE-SECURITY.md    # Configuración de seguridad
├── index.html                   # Página principal
├── script.js                    # Lógica del juego (1400+ líneas)
├── styles.css                   # Estilos visuales (1000+ líneas)
├── firestore.rules              # Reglas de seguridad de Firestore
├── firebase-config.template.js  # Plantilla de configuración
├── MANO PARA JUEGO.png         # Asset visual de la mano
├── .gitignore                   # Archivos ignorados por Git
└── README.md                    # Este archivo
```

### Archivos NO Incluidos (En .gitignore)

- `firebase-config.js` - **CREDENCIALES** (nunca subir)
- `script-backup.js` - Backup de desarrollo
- `*.backup` - Archivos temporales

---

## 🎮 Guía de Uso

### Crear y Gestionar Perfiles

1. Click en el botón **👤** (arriba derecha)
2. Ingresa tu nombre de usuario y emoji
3. Click en "Guardar cambios"
4. Tu perfil se guarda localmente (localStorage)

### Ver Logros

1. Click en el botón **🏆** (arriba derecha)
2. Verás 8 logros:
   - 🎮 **Primera Partida**: Juega tu primer juego
   - 🏆 **Primer Ganador**: Gana tu primera partida
   - 🔥 **Racha Triple**: Gana 3 partidas seguidas
   - 🌟 **Racha de Fuego**: Gana 5 partidas seguidas
   - ⬆️ **Nivel 10**: Alcanza el nivel 10
   - 👑 **Maestro**: Alcanza el nivel 25
   - ⚡ **Velocity**: Gana en menos de 60 segundos
   - ✅ **Rutina**: Juega 10 partidas

### Cambiar Tema

- Click en **☀️/🌙** (arriba derecha)
- Alterna entre tema claro y oscuro
- La preferencia se guarda automáticamente

### Persistencia de Sesión

- Si actualizas la página accidentalmente, **tus datos persisten**
- Solo se borran con el botón **"Salir de la partida"**
- O al cerrar el navegador completamente

---

## 🔒 Seguridad

### Datos del Usuario

- ✅ **Autenticación anónima**: No se requiere email ni contraseña
- ✅ **Sin datos personales**: Solo nombres de usuario locales
- ✅ **Perfiles locales**: Todo se guarda en localStorage del navegador

### Firebase Rules

Las reglas de Firestore están configuradas para:
- ✅ Solo usuarios autenticados pueden leer/escribir
- ✅ Las salas expiran después de 24h sin actividad
- ✅ No se puede crear salas duplicadas

### Mejoras Futuras de Seguridad

- [ ] Validación de datos en el cliente antes de escribir
- [ ] Rate limiting para prevenir spam
- [ ] Encriptación de códigos de sala

---

## 🐛 Solución de Problemas

### "No se pudo autenticar con Firebase"

**Causa:** Firebase no está configurado correctamente.

**Solución:**
1. Verifica que `firebase-config.js` existe y tiene las credenciales correctas
2. Verifica que Authentication está habilitado en Firebase Console
3. Limpia caché: `Ctrl+Shift+R`

### "Ya existe una sala con ese código"

**Causa:** El código de 4 caracteres ya está en uso.

**Solución:**
1. Deja el campo vacío para que genere un código automáticamente
2. O usa otro código diferente

### "La sala no existe"

**Causa:** El código es incorrecto o la sala expiró (24h).

**Solución:**
1. Verifica que el código esté correcto (4 caracteres)
2. Pide al host que cree una nueva sala

### El progreso se reinicia al actualizar

**Causa:** Bug ya corregido en versiones recientes.

**Solución:**
1. Asegúrate de tener la última versión de `script.js`
2. Verifica que `lastResetVersion` esté inicializado

### El botón "Salir de la partida" no aparece

**Causa:** Archivos desactualizados en GitHub.

**Solución:**
1. Actualiza `index.html`, `script.js` y `styles.css` en GitHub
2. Espera 2 minutos y limpia caché: `Ctrl+Shift+R`

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. **Fork** el proyecto
2. Crea una **branch** para tu feature: `git checkout -b feature/nueva-caracteristica`
3. **Commit** tus cambios: `git commit -m 'Agregar nueva característica'`
4. **Push** a la branch: `git push origin feature/nueva-caracteristica`
5. Abre un **Pull Request**

### Lineamientos

- ✅ Código limpio y comentado
- ✅ Prueba tus cambios localmente
- ✅ Actualiza documentación si es necesario
- ✅ Sigue el estilo de código existente

---

## 📝 Changelog

### v2.0.0 (2025-02-16)

#### 🆕 Nuevas Características
- ✨ Sistema de perfiles con avatares
- 🏆 8 logros desbloqueables
- ⬆️ Sistema de niveles y experiencia
- 🎚️ 4 niveles de dificultad (Fácil a Extremo)
- ☀️ Temas claro/oscuro
- 💾 Persistencia automática de sesión

#### 🐛 Bugs Corregidos
- ✅ Dificultad generando números incorrectos
- ✅ Progreso de mano reiniciándose al actualizar
- ✅ Botón "Salir de la partida" no visible

#### 🔧 Mejoras Técnicas
- ✅ Código refactorizado y optimizado
- ✅ Documentación completa
- ✅ GitHub Actions para CI/CD

### v1.0.0 (2025-02-14)

- 🎉 Lanzamiento inicial
- 🌐 Juego multijugador básico
- 🖐️ Sistema de mano con 300 puntos
- 🔒 Salas privadas con códigos

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👤 Autor

Proyecto desarrollado como parte de un ejercicio de desarrollo web full-stack con tecnologías modernas.

---

## 🙏 Agradecimientos

- Firebase por la infraestructura backend gratuita
- GitHub Pages por el hosting gratuito
- Google Fonts por las tipografías
- La comunidad de JavaScript por los recursos

---

## 🔗 Enlaces Útiles

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de GitHub Pages](https://docs.github.com/pages)
- [Guía de JavaScript Modules](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Modules)

---

<div align="center">

**⭐ Si te gustó el proyecto, dale una estrella! ⭐**

Hecho con ❤️ y ☕

</div>
