# ✅ Checklist Pre-Deploy

Usa esta lista antes de subir tu código a GitHub:

## Archivos

- [ ] Existe `.gitignore` con `firebase-config.js` listado
- [ ] Existe `firebase-config.js` con tus credenciales reales (NO se subirá)
- [ ] Existe `firebase-config.template.js` con placeholders (SÍ se sube)
- [ ] Existe `.github/workflows/deploy.yml`
- [ ] Existe `README.md` y `DEPLOYMENT.md`
- [ ] Existe `firestore.rules`

## Verificación Local

- [ ] El juego funciona correctamente en tu servidor local
- [ ] Puedes crear una sala
- [ ] Puedes unirte a una sala desde otro dispositivo/ventana
- [ ] La sincronización funciona en tiempo real

## Git Status

Ejecuta en terminal:
```bash
cd "/Users/drhmf/Documents/JUEGO STOP"
git status
```

Verifica que **firebase-config.js NO aparezca** en la lista de archivos a subir.

Si aparece, verifica tu `.gitignore`.

## Comando de Verificación Rápida

```bash
# Ver qué archivos se subirían
git add .
git status

# Si firebase-config.js aparece, DETENTE y verifica .gitignore
# Si NO aparece, puedes continuar:
git commit -m "🎮 Initial commit: STOP Numérico"
```

## Después del Deploy

- [ ] El workflow de GitHub Actions terminó exitosamente (✅)
- [ ] El sitio carga en `https://TU-USUARIO.github.io/JUEGO-STOP/`
- [ ] No hay errores en la consola del navegador
- [ ] Puedes crear y unirte a salas desde el sitio en vivo

---

**¿Todo listo?** Sigue la guía en [DEPLOYMENT.md](DEPLOYMENT.md) 🚀
