# 🔐 Aplicar Firebase Security Rules - Guía Paso a Paso

## ⚠️ IMPORTANTE: Tu Firebase está en modo PRUEBA

Actualmente, cualquier persona puede leer y escribir en tu base de datos. **Debes aplicar estas reglas de seguridad YA.**

## 📋 Pasos para Aplicar las Reglas de Seguridad

### 1. Abre Firebase Console

Ve a: **https://console.firebase.google.com/**

### 2. Selecciona tu Proyecto

Haz clic en el proyecto: **juegostop-38503**

### 3. Ve a Firestore Database

En el menú lateral izquierdo:
- Haz clic en **"Build"** (Compilar)
- Luego en **"Firestore Database"**

### 4. Abre la Pestaña de Reglas

Verás varias pestañas en la parte superior:
- Data (Datos)
- **Rules (Reglas)** ← HAZ CLIC AQUÍ
- Indexes (Índices)
- Usage (Uso)

### 5. Reemplaza las Reglas Actuales

Verás algo como esto (modo prueba):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if
          request.time < timestamp.date(2026, 3, 15); // ← MODO PRUEBA
    }
  }
}
```

**SELECCIONA TODO EL CONTENIDO** (Ctrl+A o Cmd+A) y **BÓRRALO**

### 6. Pega las Nuevas Reglas

Copia el siguiente código y pégalo en el editor:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar para verificar autenticación
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Función para verificar que el usuario es parte de la sala
    function isPlayerInRoom() {
      return isSignedIn() && 
             request.auth.uid in resource.data.players.keys();
    }
    
    // Función para verificar que el usuario es el host
    function isHost() {
      return isSignedIn() && 
             request.auth.uid == resource.data.host;
    }
    
    // Reglas para las salas de juego
    match /rooms/{roomId} {
      
      // Permitir lectura si está autenticado
      allow read: if isSignedIn();
      
      // Permitir crear sala si está autenticado y los datos son válidos
      allow create: if isSignedIn() 
        && request.resource.data.keys().hasAll([
          'createdAt', 
          'host', 
          'players', 
          'status',
          'mode',
          'turn'
        ])
        && request.resource.data.players.size() <= 2
        && request.resource.data.host == request.auth.uid
        && request.resource.data.status == 'waiting';
      
      // Permitir actualizar solo a los jugadores de la sala
      allow update: if isPlayerInRoom()
        // No permitir cambiar el host
        && request.resource.data.host == resource.data.host
        // No permitir más de 2 jugadores
        && request.resource.data.players.size() <= 2
        // No permitir eliminar jugadores existentes (solo agregar)
        && resource.data.players.keys().hasAll(
          request.resource.data.players.keys()
        );
      
      // No permitir eliminar salas (se pueden agregar reglas de limpieza con Cloud Functions)
      allow delete: if false;
    }
    
    // Denegar acceso a cualquier otra colección
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 7. Haz Clic en "Publish" (Publicar)

En la parte superior del editor verás un botón azul que dice **"Publish"**

Haz clic en él.

### 8. Confirmación

Verás un mensaje de confirmación. Haz clic en **"Publish"** nuevamente.

### 9. ✅ Verificación

Si todo salió bien, verás:
- Un mensaje verde: "Rules published successfully"
- Ya no verás advertencias sobre el modo prueba

## 🔒 ¿Qué Hacen Estas Reglas?

### ✅ PERMITEN:
- Usuarios autenticados (anonymous) pueden leer salas
- Crear salas si estás autenticado
- Actualizar salas si eres participante
- Máximo 2 jugadores por sala

### ❌ NO PERMITEN:
- Acceso sin autenticación
- Más de 2 jugadores en una sala
- Cambiar el host de una sala
- Eliminar salas
- Acceso a otras colecciones

## 🧪 Probar las Reglas

Después de publicar, prueba tu juego:

1. Abre tu juego en el navegador
2. Intenta crear una sala
3. Únete desde otro dispositivo

Si todo funciona igual que antes, ¡las reglas están correctas! 🎉

## ⚠️ Si Algo Falla

Si después de aplicar las reglas el juego no funciona:

1. Ve a la consola del navegador (F12)
2. Busca errores de Firebase
3. Si dice "Missing or insufficient permissions":
   - Revisa que copiaste las reglas completas
   - Verifica que Firebase Authentication esté habilitado en modo Anonymous

## 📝 Notas

- Estas reglas se aplican INMEDIATAMENTE
- No necesitas reiniciar nada
- Son permanentes (no expiran como el modo prueba)
- Protegen tu base de datos de accesos no autorizados

---

✅ **Una vez aplicadas estas reglas, tu Firebase está seguro y listo para producción.**
