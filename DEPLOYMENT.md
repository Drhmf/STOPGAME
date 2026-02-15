# 🚀 Guía Rápida de Deployment a GitHub Pages

## Pasos para Subir el Juego

### 1. Inicializar Git (si no lo has hecho)

```bash
cd "/Users/drhmf/Documents/JUEGO STOP"
git init
```

### 2. Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `JUEGO-STOP` (o el que prefieras)
3. Descripción: `🎮 Juego multijugador STOP Numérico`
4. **NO** marques "Add a README file" (ya lo tenemos)
5. Haz clic en "Create repository"

### 3. Conectar y Subir el Código

```bash
# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "🎮 Initial commit: STOP Numérico"

# Conectar con GitHub (reemplaza TU-USUARIO y JUEGO-STOP)
git remote add origin https://github.com/TU-USUARIO/JUEGO-STOP.git

# Renombrar la rama a main si es necesario
git branch -M main

# Subir el código
git push -u origin main
```

### 4. Configurar GitHub Secrets

Ve a: `https://github.com/TU-USUARIO/JUEGO-STOP/settings/secrets/actions`

Crea estos secrets (copia los valores de tu archivo `firebase-config.js`):

| Secret Name | Valor desde firebase-config.js |
|------------|-------------------------------|
| `FIREBASE_API_KEY` | AIzaSyDYAXQd90SODq-KmsJe5BVw5NBhGt4IjmU |
| `FIREBASE_AUTH_DOMAIN` | juegostop-38503.firebaseapp.com |
| `FIREBASE_PROJECT_ID` | juegostop-38503 |
| `FIREBASE_STORAGE_BUCKET` | juegostop-38503.firebasestorage.app |
| `FIREBASE_MESSAGING_SENDER_ID` | 314545938593 |
| `FIREBASE_APP_ID` | 1:314545938593:web:445fc62240474d6c8dd0e0 |
| `FIREBASE_MEASUREMENT_ID` | G-FRCNWZCN00 |

**¿Cómo agregar un secret?**
1. Haz clic en "New repository secret"
2. En "Name", escribe el nombre exacto (ej: `FIREBASE_API_KEY`)
3. En "Secret", pega el valor correspondiente
4. Haz clic en "Add secret"
5. Repite para cada secret

### 5. Habilitar GitHub Pages

1. Ve a: `https://github.com/TU-USUARIO/JUEGO-STOP/settings/pages`
2. En "Build and deployment":
   - **Source**: Selecciona `GitHub Actions`
3. Guarda los cambios

### 6. Verificar el Deployment

1. Ve a la pestaña **Actions**: `https://github.com/TU-USUARIO/JUEGO-STOP/actions`
2. Verás el workflow "Deploy to GitHub Pages" ejecutándose
3. Espera a que aparezca el ✅ verde (2-3 minutos)
4. Tu juego estará en: `https://TU-USUARIO.github.io/JUEGO-STOP/`

### 7. Autorizar el Dominio en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `juegostop-38503`
3. Ve a **Authentication** → **Settings** → **Authorized domains**
4. Haz clic en **Add domain**
5. Agrega: `TU-USUARIO.github.io`
6. Guarda

### 8. Configurar Firebase Security Rules

1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en la pestaña **Rules**
3. Copia el contenido del archivo `firestore.rules` de este proyecto
4. Pégalo en el editor
5. Haz clic en **Publish**

## ✅ Verificación Final

- [ ] El código está en GitHub
- [ ] Los 7 secrets están configurados
- [ ] GitHub Pages está habilitado con source "GitHub Actions"
- [ ] El workflow se ejecutó exitosamente (✅ en Actions)
- [ ] El dominio está autorizado en Firebase
- [ ] Las Security Rules están aplicadas
- [ ] El juego carga en: `https://TU-USUARIO.github.io/JUEGO-STOP/`

## 🔄 Futuras Actualizaciones

Para hacer cambios y actualizar el juego:

```bash
# Hacer cambios en el código...

# Agregar cambios
git add .

# Commit
git commit -m "Descripción de los cambios"

# Subir
git push

# GitHub Actions desplegará automáticamente 🚀
```

## ⚠️ Importante

- **NUNCA** subas el archivo `firebase-config.js` a GitHub
- Está en `.gitignore` para protegerlo
- GitHub Actions inyectará las credenciales desde los secrets
- Si accidentalmente lo subes:
  ```bash
  git rm --cached firebase-config.js
  git commit -m "Remove firebase config"
  git push
  ```

## 🆘 Problemas Comunes

### Error: "remote: Support for password authentication was removed"
Necesitas usar un Personal Access Token:
1. Ve a: https://github.com/settings/tokens/new
2. Marca `repo` scope
3. Genera el token
4. Úsalo como contraseña cuando Git te lo pida

### El workflow falla con "Secret not found"
Verifica que los nombres de los secrets sean exactos (sensible a mayúsculas)

### GitHub Pages da 404
- Espera 2-3 minutos
- Verifica que el workflow terminó exitosamente
- Limpia el caché del navegador (Ctrl+Shift+R)

## 🎉 ¡Listo!

Tu juego ya está en línea y accesible desde cualquier dispositivo. ¡Comparte el link y a jugar! 🎮
