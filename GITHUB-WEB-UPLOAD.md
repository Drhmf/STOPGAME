# 🌐 Subir el Juego a GitHub desde el Navegador

Guía paso a paso para subir tu código sin usar comandos de git.

---

## ⚠️ ARCHIVOS QUE **NO** DEBES SUBIR

**❌ NO SUBAS ESTOS ARCHIVOS:**
- `firebase-config.js` (¡CONTIENE TUS CREDENCIALES!)
- `.DS_Store`
- `verify.sh` (opcional, es solo para verificación local)

**✅ SÍ DEBES SUBIR:**
- `index.html`
- `script.js`
- `styles.css`
- `MANO PARA JUEGO.png`
- `firebase-config.template.js`
- `.gitignore`
- `firestore.rules`
- `README.md`
- `DEPLOYMENT.md`
- `CHECKLIST.md`
- `FIREBASE-SECURITY.md`
- `GITHUB-WEB-UPLOAD.md`
- `.github/workflows/deploy.yml`

---

## 📋 PARTE 1: Crear el Repositorio en GitHub

### 1. Inicia Sesión en GitHub

Ve a: **https://github.com/login**

### 2. Crear Nuevo Repositorio

- Haz clic en el **+** en la esquina superior derecha
- Selecciona **"New repository"**

### 3. Configurar el Repositorio

Llena el formulario:

- **Repository name**: `JUEGO-STOP` (o el nombre que prefieras)
- **Description**: `🎮 Juego multijugador STOP Numérico`
- **Public** o **Private**: Elige (recomiendo **Public** para GitHub Pages gratis)
- **❌ NO** marques "Add a README file" (ya lo tenemos)
- **❌ NO** marques "Add .gitignore" (ya lo tenemos)
- **❌ NO** marques "Choose a license" (opcional)

### 4. Clic en "Create repository"

¡Repositorio creado! Ahora verás una página con instrucciones.

---

## 📤 PARTE 2: Subir los Archivos

### Opción A: Subir Archivos Uno por Uno (Recomendado)

#### 1. En la página de tu repo, haz clic en "creating a new file"

O ve directamente a: `https://github.com/TU-USUARIO/JUEGO-STOP`

#### 2. Crear la estructura de carpetas primero

En "Name your file...", escribe: `.github/workflows/deploy.yml`

Esto creará automáticamente las carpetas `.github` y `workflows`.

#### 3. Pega el contenido

Abre el archivo `deploy.yml` de tu computadora y copia todo el contenido.

Pégalo en el editor de GitHub.

#### 4. Commit

Al final de la página:
- **Commit message**: `Add GitHub Actions workflow`
- Haz clic en **"Commit new file"**

#### 5. Repite para cada archivo

Haz clic en **"Add file" → "Create new file"** y repite:

| Ruta en GitHub | Archivo de tu computadora | Commit message |
|---------------|---------------------------|----------------|
| `.gitignore` | `.gitignore` | `Add gitignore` |
| `index.html` | `index.html` | `Add main HTML` |
| `script.js` | `script.js` | `Add game logic` |
| `styles.css` | `styles.css` | `Add styles` |
| `firebase-config.template.js` | `firebase-config.template.js` | `Add Firebase config template` |
| `firestore.rules` | `firestore.rules` | `Add Firestore security rules` |
| `README.md` | `README.md` | `Add README` |
| `DEPLOYMENT.md` | `DEPLOYMENT.md` | `Add deployment guide` |
| `CHECKLIST.md` | `CHECKLIST.md` | `Add checklist` |
| `FIREBASE-SECURITY.md` | `FIREBASE-SECURITY.md` | `Add Firebase security guide` |
| `GITHUB-WEB-UPLOAD.md` | `GITHUB-WEB-UPLOAD.md` | `Add GitHub upload guide` |

#### 6. Subir la Imagen

Para `MANO PARA JUEGO.png`:

- Haz clic en **"Add file" → "Upload files"**
- Arrastra `MANO PARA JUEGO.png` a la zona de arrastrar
- **Commit message**: `Add hand image`
- Haz clic en **"Commit changes"**

### Opción B: Subir Múltiples Archivos a la Vez

#### 1. En tu repo, haz clic en "uploading an existing file"

O **"Add file" → "Upload files"**

#### 2. Selecciona SOLO los archivos permitidos

⚠️ **IMPORTANTE**: Abre otra ventana del Finder y:

1. Crea una carpeta temporal en tu escritorio llamada `temp-upload`
2. Copia SOLO estos archivos a esa carpeta:
   - `index.html`
   - `script.js`
   - `styles.css`
   - `MANO PARA JUEGO.png`
   - `firebase-config.template.js`
   - `.gitignore`
   - `firestore.rules`
   - `README.md`
   - `DEPLOYMENT.md`
   - `CHECKLIST.md`
   - `FIREBASE-SECURITY.md`
   - `GITHUB-WEB-UPLOAD.md`

3. **Verifica que NO esté `firebase-config.js`**

#### 3. Arrastra los archivos

Arrastra todos los archivos de la carpeta `temp-upload` a GitHub.

#### 4. La carpeta `.github/workflows/`

⚠️ Esta NO se puede subir fácil por arrastrar (carpetas ocultas).

Debes crearla manualmente:
- **"Add file" → "Create new file"**
- Nombre: `.github/workflows/deploy.yml`
- Pega el contenido del archivo
- Commit

#### 5. Commit

- **Commit message**: `🎮 Initial commit: STOP Numérico`
- Haz clic en **"Commit changes"**

---

## 🔑 PARTE 3: Configurar GitHub Secrets

### 1. Ve a Settings

En tu repositorio, haz clic en **"Settings"** (pestaña superior)

### 2. Ve a Secrets

En el menú lateral izquierdo:
- **"Secrets and variables"**
- **"Actions"**

### 3. Agregar cada Secret

Haz clic en **"New repository secret"** para cada uno:

#### Secret 1: FIREBASE_API_KEY
- **Name**: `FIREBASE_API_KEY`
- **Secret**: `AIzaSyDYAXQd90SODq-KmsJe5BVw5NBhGt4IjmU`
- Clic en **"Add secret"**

#### Secret 2: FIREBASE_AUTH_DOMAIN
- **Name**: `FIREBASE_AUTH_DOMAIN`
- **Secret**: `juegostop-38503.firebaseapp.com`
- Clic en **"Add secret"**

#### Secret 3: FIREBASE_PROJECT_ID
- **Name**: `FIREBASE_PROJECT_ID`
- **Secret**: `juegostop-38503`
- Clic en **"Add secret"**

#### Secret 4: FIREBASE_STORAGE_BUCKET
- **Name**: `FIREBASE_STORAGE_BUCKET`
- **Secret**: `juegostop-38503.firebasestorage.app`
- Clic en **"Add secret"**

#### Secret 5: FIREBASE_MESSAGING_SENDER_ID
- **Name**: `FIREBASE_MESSAGING_SENDER_ID`
- **Secret**: `314545938593`
- Clic en **"Add secret"**

#### Secret 6: FIREBASE_APP_ID
- **Name**: `FIREBASE_APP_ID`
- **Secret**: `1:314545938593:web:445fc62240474d6c8dd0e0`
- Clic en **"Add secret"**

#### Secret 7: FIREBASE_MEASUREMENT_ID
- **Name**: `FIREBASE_MEASUREMENT_ID`
- **Secret**: `G-FRCNWZCN00`
- Clic en **"Add secret"**

### 4. Verificar

Debes ver 7 secrets listados. ✅

---

## 📄 PARTE 4: Habilitar GitHub Pages

### 1. Ve a Settings → Pages

En el menú lateral izquierdo de Settings, busca **"Pages"**

### 2. Configurar Source

En **"Build and deployment"**:
- **Source**: Selecciona **"GitHub Actions"**
- No necesitas seleccionar ninguna rama

### 3. Guardar

Los cambios se guardan automáticamente.

---

## 🚀 PARTE 5: Desplegar

### 1. Ve a la pestaña "Actions"

En la parte superior de tu repo, haz clic en **"Actions"**

### 2. Verifica el Workflow

Verás un workflow llamado **"Deploy to GitHub Pages"**

- Si hay un círculo amarillo 🟡: Está ejecutándose
- Si hay un check verde ✅: ¡Éxito!
- Si hay una X roja ❌: Hubo un error (revisa los logs)

### 3. Espera 2-3 Minutos

El primer deployment toma un poco más de tiempo.

### 4. Accede a tu Sitio

Tu juego estará en: `https://TU-USUARIO.github.io/JUEGO-STOP/`

(Reemplaza TU-USUARIO con tu nombre de usuario de GitHub)

---

## 🔧 PARTE 6: Configurar Firebase

### 1. Autorizar el Dominio en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `juegostop-38503`
3. Ve a **Authentication** → **Settings**
4. En **"Authorized domains"**, haz clic en **"Add domain"**
5. Agrega: `TU-USUARIO.github.io` (reemplaza TU-USUARIO)
6. Guarda

### 2. Aplicar Security Rules

Sigue la guía en **`FIREBASE-SECURITY.md`** para aplicar las reglas de seguridad.

---

## ✅ Verificación Final

- [ ] Todos los archivos están en GitHub (excepto firebase-config.js)
- [ ] Los 7 secrets están configurados
- [ ] GitHub Pages está habilitado con source "GitHub Actions"
- [ ] El workflow se ejecutó exitosamente (✅)
- [ ] El dominio está autorizado en Firebase
- [ ] Las Security Rules están aplicadas
- [ ] El juego carga en: `https://TU-USUARIO.github.io/JUEGO-STOP/`

---

## 🔄 Hacer Actualizaciones Futuras

Para actualizar el juego después:

1. Ve a tu repositorio en GitHub
2. Navega al archivo que quieres editar
3. Haz clic en el ícono del lápiz ✏️ (Edit)
4. Haz tus cambios
5. Scroll hasta abajo, escribe un commit message
6. Clic en **"Commit changes"**
7. El workflow se ejecutará automáticamente y actualizará tu sitio

---

## 🆘 Problemas Comunes

### El workflow falla con "Secret not found"

- Verifica que los nombres de los secrets sean EXACTOS (mayúsculas/minúsculas)
- Deben ser exactamente: `FIREBASE_API_KEY`, etc.

### GitHub Pages da 404

- Espera 5 minutos más
- Limpia el caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)
- Verifica que el workflow terminó exitosamente

### El juego no carga / Errores en consola

- Verifica que el dominio esté autorizado en Firebase
- Revisa que TODOS los 7 secrets estén configurados
- Mira los logs del workflow en Actions

---

## 🎉 ¡Listo!

Tu juego ya está en línea y accesible desde cualquier dispositivo. Comparte el link y a jugar! 🎮
