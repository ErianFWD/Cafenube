# Actualizar Café Nube para usar cookies

Detenga los servidores con Ctrl+C y conserve sus archivos .env. Copie los archivos nuevos y ejecute desde la raíz:

```bash
npm install
npm run setup
npm run dev
```

Si ya instaló el Día 2 no necesita modificar las tablas. Si todavía conserva las seis tablas del Día 1, ejecute npm run db:migrate antes de iniciar.

Para la configuración local use http://localhost:5173 y VITE_API_URL=http://localhost:3001/api. No mezcle localhost con 127.0.0.1. COOKIE_SECURE=false y COOKIE_SAME_SITE=lax son los valores locales; en producción se activa Secure y se requiere HTTPS.

La cookie de sesión es cafe_nube_session. El servidor la configura en backend/src/utils/sessionCookies.js y la envía desde authController.js. JavaScript no recibe el JWT. services/api.js envía credentials: include y X-CSRF-Token al escribir. Logout elimina la cookie en el servidor. El token antiguo de sessionStorage se retira automáticamente.

Importe otra vez la colección actualizada de Postman, mantenga activo su cookie jar y ejecute las carpetas en orden. Los casos negativos desactivan el jar solo para la petición correspondiente.
