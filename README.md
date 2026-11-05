# Café Nube

Mini Proyecto 1 Días 1 y 2 de Erian Badilla Fallas. Sistema de cafetería con React, Node.js, Express, MySQL y Sequelize 6. Incluye seis CRUD completos y autenticación con registro, login y perfil. Todos los usuarios autenticados comparten el mismo acceso; no hay roles.

## Actualizar el proyecto que ya funciona

Detenga el servidor con Ctrl+C y conserve una copia de su carpeta y un respaldo de MySQL. Extraiga el ZIP y copie los archivos actualizados, conservando sus `.env`. Desde la raíz:

```bash
npm install
npm run setup
```

En `backend/.env` conserve su usuario, contraseña, puerto y `DB_NAME=cafenube`. `setup` conserva la configuración existente y genera una clave JWT aleatoria solo si falta. Después:

```bash
npm run db:migrate
npm run dev
```

La migración añade `usuarios` y el registro técnico `SequelizeMeta` a las seis tablas existentes. Conserva IDs, productos, clientes, precios y ventas, y puede repetirse sin resembrar. No utiliza sync force/alter. El DDL MySQL tiene commit implícito; no se promete deshacerlo con rollback. La migración verifica la estructura y se detiene ante incompatibilidades.

Abra [http://localhost:5173](http://localhost:5173), cree su cuenta e inicie sesión. No hay usuario ni contraseña predeterminados.

## Instalación nueva

Requiere Node.js 24 LTS y MySQL Server 8.0.16 o posterior. Workbench es opcional; el servicio MySQL debe estar encendido.

```bash
npm install
npm run setup
```

Complete `backend/.env` sin compartir sus valores:

```dotenv
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cafenube
CLIENT_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SEED_DEMO=true
JWT_SECRET=
```

La línea JWT_SECRET del ejemplo está vacía intencionalmente. `npm run setup` genera la clave en el archivo real; no la copie vacía sobre la generada. Si la contraseña MySQL contiene espacios o #, colóquela entre comillas dobles. En `frontend/.env` use `VITE_API_URL=http://localhost:3001/api`.

```bash
npm run db:setup
npm run dev
```

La preparación crea una base nueva y datos ficticios. Sobre una base existente migra y valida sin volver a insertar ejemplos. Con `SEED_DEMO=false` antes de la primera preparación comienza sin registros de negocio. Usuarios comienza vacío en todos los casos.

## Uso y autenticación

Regístrese con nombre, correo y contraseña de al menos ocho caracteres y máximo 72 bytes UTF-8. Inicie sesión con correo y contraseña. El JWT HS256 vence en una hora y se guarda en la cookie HttpOnly cafe_nube_session, con Path=/api y sin Domain. No se devuelve en JSON ni se almacena en sessionStorage/localStorage. La firma, algoritmo, emisor, audiencia, vencimiento y usuario se verifican en el servidor.

React utiliza credentials: include en sus peticiones y recupera el perfil al recargar. Un 401 limpia el estado de React y vuelve al login. Cerrar sesión pide confirmación y llama a POST /api/auth/logout para borrar las cookies. No hay refresh token. Una copia externa de un JWT conserva validez hasta vencer: borrar la cookie no implementa revocación remota.

GET /api/auth/csrf prepara el token CSRF. Cada escritura, incluidos registro, login y logout, envía X-CSRF-Token. Se calcula con HMAC ligado a la sesión; antes de autenticar usa un nonce aleatorio en una cookie HttpOnly. Se rechazan valores incorrectos y orígenes ajenos. HttpOnly reduce la exposición del JWT ante JavaScript, pero no sustituye la prevención de XSS ni el control CSRF.

En desarrollo local, COOKIE_SECURE=false y COOKIE_SAME_SITE=lax. En producción se activa Secure y se requiere HTTPS. SameSite=None exige Secure. Use siempre el mismo host para frontend y API: localhost con localhost, o 127.0.0.1 con 127.0.0.1. Los puertos pueden ser distintos. Para un despliegue entre sitios distintos se deben revisar las políticas de cookies de terceros.

Esta adaptación mantiene JWT y cambia el transporte Bearer indicado en el documento académico por cookies, según la solicitud actual del usuario. La comparación y la decisión están en el informe de investigación actualizado.

Si ya instaló el Día 2, esta actualización no cambia tablas: conserve .env y ejecute npm install y npm run dev. Si aún está en el Día 1, siga el procedimiento inicial con db:migrate.

## Estructura del proyecto

Se conserva el orden solicitado: `components/`, `pages/`, `routes/`, `App.jsx`, `main.jsx`, `index.html`. `context/AuthContext.jsx` y `services/session.js` apoyan el acceso autenticado. Login y Registro están en pages; RutaProtegida está en components. api.js envía las cookies y prepara el encabezado CSRF en las escrituras.

En backend, `models/entities.js` define los catálogos y ventas; `models/usuario.js` define Usuario. `database/connection.js` configura Sequelize; `database/migrations/20261105-usuarios.js` y `database/migrate.js` preparan y registran la migración. `controllers/authController.js`, `routes/authRoutes.js` y `middleware/authMiddleware.js` implementan la autenticación. El middleware de errores conserva respuestas controladas, incluido 401.

## Modelo y reglas del negocio

Hay siete entidades: categorias, productos, clientes, metodos_pago, ventas, detalle_ventas y usuarios; además de la tabla técnica SequelizeMeta. Se mantienen cinco claves foráneas. Usuario protege el acceso y no necesita relacionarse con cada venta para este enunciado.

Las ventas contienen entre uno y cincuenta productos distintos, cantidades de 1 a 999 y cliente opcional. El servidor toma el precio del catálogo y conserva el precio histórico. Los importes físicos son DECIMAL(10,2) en colones; la API usa céntimos enteros seguros y conversión decimal exacta. Las fechas se guardan en DATETIME(3) UTC y se muestran en horario de Costa Rica.

Las operaciones relacionadas comparten transacciones Sequelize con aislamiento READ COMMITTED y bloqueo de la venta. No se permite borrar su último detalle. Eliminar una venta elimina sus detalles; los demás padres con dependencias responden 409. Una referencia inexistente al crear o actualizar responde 400 o 404. El resumen mantiene consultas SQL de agregación ejecutadas por Sequelize.

## API

| Operación                   | Método y ruta           | Respuesta                                                         |
| --------------------------- | ----------------------- | ----------------------------------------------------------------- |
| Registro público            | POST /api/auth/register | 201 sin password; 400 si es inválido o duplicado                  |
| Login público               | POST /api/auth/login    | 200 con usuario y cookie HttpOnly; 401 si las credenciales fallan |
| Perfil protegido            | GET /api/auth/me        | 200 sin password; 401 sin token válido                            |
| Estado del servidor público | GET /api/salud          | 200 sin información del negocio                                   |
| Resumen protegido           | GET /api/resumen        | 200 con estadísticas                                              |

Cada ruta base `/api/categorias`, `/api/productos`, `/api/clientes`, `/api/metodos-pago`, `/api/ventas` y `/api/detalle-ventas` admite POST, GET, GET /:id, PUT /:id y DELETE /:id. Todas requieren una cookie de sesión válida, incluidos los listados. Responden 201 al crear, 200 al leer/editar y 204 al eliminar. Sin token válido responden 401; IDs inexistentes con sesión válida dan 404. Los errores se devuelven como JSON.

Los listados admiten buscar, limit de 1 a 200 y offset de 0 a 100000. Detalles admite venta_id. El registro y login usan {correo,password}; registro añade nombre. No se aceptan roles ni campos adicionales. Las respuestas nunca contienen password/hash.

CORS permite credenciales, orígenes exactos, Content-Type y X-CSRF-Token; OPTIONS se atiende antes de autenticar. CORS no sustituye autenticación y no bloquea Postman.

## Diseño conservado

Se mantienen colores esmeralda, crema y dorado, el logo aprobado, las fotografías reales locales, Jost y Cormorant Garamond. Las fuentes de imágenes y tipografías están en frontend/public. El menú se puede mostrar/ocultar y conserva el eslogan «El gusto de cada día.». Login y Registro usan la misma identidad visual.

## Prettier y VS Code

El código compatible con Prettier se entrega formateado, con dos espacios y una configuración compartida. `.vscode/settings.json` configura Formato al guardar y el formateador Prettier; instale la extensión recomendada esbenp.prettier-vscode. También puede usar Format Document With → Prettier.

```bash
npm run format
npm run format:check
```

Se excluyen dependencias, archivos compilados, imágenes y documentos binarios. Prettier no formatea SQL de forma nativa; el SQL conserva su presentación legible y en minúsculas.

## Pruebas y Postman

```bash
npm test
npm run format:check
npm run build
```

Las pruebas HTTP utilizan MySQL real y bases temporales cafetest_ con UUID. Solo eliminan las bases ficticias que crean y requieren permisos CREATE/DROP DATABASE. No reinician la base del usuario.

Importe `postman/Cafe_Nube.postman_collection.json`, configure base_url como http://localhost:3001/api y ejecute toda la colección en orden sobre una base de demostración. La primera carpeta registra una cuenta de prueba e inicia sesión. Postman conserva las cookies en su cookie jar y obtiene CSRF antes de cada escritura. Incluye casos 400, 401 y 404, además de conflictos 409. La cuenta ficticia de prueba permanece; cada ejecución genera un correo distinto. No use datos reales en pruebas.

Las pruebas y su alcance están en documentacion/Resultados_Pruebas.md. La colección espera los productos 1 y 2 y el método 1 de la base de demostración.

## Versión compilada

```bash
npm run build
npm start
```

Abra [http://localhost:3001](http://localhost:3001). Para otro dominio, configure VITE_API_URL antes de compilar y CLIENT_ORIGINS en backend. No coloque JWT_SECRET ni credenciales MySQL en variables VITE_.

## Entregables

Incluye informe de tokens, DER editable actualizado, seis CRUD, autenticación, React protegido, colección de Postman, configuración de Prettier y documentación. La justificación del Día 1 se conserva como antecedente. El repositorio local incluye el historial; no se ha publicado un repositorio remoto de GitHub.

## Cookies y Postman

Mantenga activo el cookie jar de Postman. Las peticiones negativas que prueban ausencia de cookies lo desactivan únicamente para ese caso. Los scripts preparan CSRF automáticamente. Se agregaron GET /api/auth/csrf y POST /api/auth/logout. La cuenta de prueba permanece y el correo cambia en cada ejecución.
