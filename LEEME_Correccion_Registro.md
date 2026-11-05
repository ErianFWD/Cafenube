# Corrección del registro y cookies locales

Se reprodujo CSRF_INVALID con HTTP 403 cuando la página utilizaba localhost y la API 127.0.0.1. El navegador no enviaba una cookie SameSite=Lax en esa comunicación entre sitios.

En desarrollo, /api ahora pasa por el proxy de Vite al backend. El navegador usa el origen de la propia página para sus cookies. La dirección local antigua de VITE_API_URL sigue siendo compatible y permite elegir el puerto del backend; VITE_API_PROXY_TARGET también puede configurarlo. No se requieren cambios de tablas ni de credenciales MySQL.

El cliente renueva la comprobación CSRF y reintenta una única vez únicamente si el servidor devolvió CSRF_INVALID antes de escribir. Si las cookies siguen sin llegar, muestra una explicación concreta y detiene los intentos. No se repiten errores de red ni escrituras ya aceptadas.

## Aplicar el parche

1. Detenga npm con Ctrl+C.
2. Extraiga el parche y copie su carpeta frontend dentro de Cafe_Nube, reemplazando los tres archivos indicados. Conserve sus .env.
3. Ejecute npm run dev de nuevo y recargue la página.

Si usa HTTP local, backend/.env debe usar COOKIE_SECURE=false y COOKIE_SAME_SITE=lax, o dejar esos valores por defecto. En producción con HTTPS se mantiene Secure. Las cookies deben estar permitidas para la página. Para una API externa explícita se conserva su configuración y deben revisarse CORS y SameSite.

## Comprobaciones realizadas

- 28 pruebas HTTP de backend aprobadas sobre MySQL 8.0.46 real y aislado.
- 3 pruebas de resolución de la dirección de API aprobadas.
- 6 comprobaciones de navegador aprobadas: reproducción del fallo previo, registro con localhost, registro con 127.0.0.1, renovación CSRF única, login/recarga/cookie HttpOnly/escritura y mensaje claro si no llega la cookie.
- La API continúa rechazando una escritura sin X-CSRF-Token.
- Compilación Vite correcta, 58 módulos.

Fuentes consultadas el 5 de noviembre de 2026: https://vite.dev/config/server-options#server-proxy y https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie.
