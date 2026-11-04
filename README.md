# Café Nube

Sistema de gestión de cafetería desarrollado para el Mini Proyecto 1 Día 1 de Erian Badilla Fallas. Gestiona categorías, productos, clientes, métodos de pago, ventas y detalles de ventas mediante una API REST y una interfaz React.

El enunciado exige al menos tres entidades y permite elegir la base de datos. Este proyecto utiliza **seis tablas** según la petición del usuario, Node.js con Express, React con Vite y MySQL. Se respeta la indicación de trabajar sin login, registro, tokens ni roles. No se incluyen rutas privadas.

## Iniciar el proyecto

Requisitos: **Node.js 24 LTS** y **MySQL Server 8.0.16 o posterior** (recomendado MySQL 8.4). MySQL Workbench sirve para administrar el servidor; el servicio MySQL debe estar encendido.

Desde la carpeta que contiene este README:

```bash
npm install
npm run setup
```

Abrir `backend/.env` y completar la conexión con los datos del MySQL local:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cafeteria
```

Escribir la contraseña local después de `DB_PASSWORD=`. Si contiene `#` o espacios, encerrarla entre comillas dobles. No colocar credenciales SQL en el frontend ni compartir el archivo `.env`. Si el puerto del servicio es distinto, ajustar `DB_PORT`.

Preparar la base e iniciar la aplicación:

```bash
npm run db:setup
npm run dev
```

`db:setup` crea la base `cafeteria` y las seis tablas cuando está vacía; necesita un usuario local con permisos para crear base y tablas. Incluye datos ficticios de demostración. Si detecta tablas existentes, las conserva y comprueba que pertenezcan al proyecto; no borra ni vuelve a sembrar datos. Si la estructura es parcial o diferente, se detiene para que se revise. Los DDL MySQL tienen commit implícito: un fallo de creación puede dejar tablas parciales y no se resuelve borrándolas automáticamente.

Abrir [http://localhost:5173](http://localhost:5173). El backend escucha en [http://localhost:3001](http://localhost:3001); su comprobación está en [/api/salud](http://localhost:3001/api/salud). Mantener la terminal abierta; Ctrl+C detiene los servidores.

Los precios de demostración son ficticios en colones costarricenses. Los datos se conservan en el servidor MySQL. Para comenzar sin ejemplos, poner `SEED_DEMO=false` en `backend/.env` antes de ejecutar `db:setup` por primera vez. Crear primero categorías y métodos de pago, después productos y ventas; el cliente puede omitirse.

La estructura también está disponible en `backend/sql/cafeteria_mysql.sql` para revisarla o importarla en Workbench sobre una base nueva. Ese archivo crea únicamente las tablas; la vía recomendada para comenzar con ejemplos es `npm run db:setup`.

## Preparar la versión compilada

```bash
npm run build
npm start
```

Abrir [http://localhost:3001](http://localhost:3001). El backend sirve el frontend compilado y su API. La configuración frontend incluida apunta a la API local en 3001; si se usa otro puerto, actualizar `frontend/.env` y volver a compilar. Para servir frontend y API desde el mismo dominio, se puede usar `VITE_API_URL=/api` antes de compilar. El proyecto se entrega para ejecución local.

## Organización de React

| Orden | Archivo o carpeta | Responsabilidad |
| --- | --- | --- |
| 1 | `frontend/src/components/` | Formularios, tablas, diálogos, confirmaciones y diseño compartido |
| 2 | `frontend/src/pages/` | Una página por entidad, inicio y página no encontrada |
| 3 | `frontend/src/routes/AppRoutes.jsx` | Define las rutas de la aplicación |
| 4 | `frontend/src/App.jsx` | Integra las rutas |
| 5 | `frontend/src/main.jsx` | Monta React y configura BrowserRouter |
| 6 | `frontend/index.html` | Documento HTML de entrada de Vite |
| Apoyo | `frontend/src/services/api.js` | Peticiones HTTP a la API |
| Apoyo | `frontend/src/styles/` | Estilos compartidos y adaptación móvil |

El navegador carga index.html y main.jsx; App renderiza las rutas, las rutas eligen páginas y las páginas utilizan los componentes. La organización conserva el orden solicitado sin agregar autenticación.

## Organización del backend

| Carpeta o archivo | Responsabilidad |
| --- | --- |
| `backend/src/routes/apiRoutes.js` | Endpoints y métodos HTTP |
| `backend/src/controllers/` | Validación y respuestas de cada CRUD |
| `backend/src/models/` | Consultas parametrizadas de catálogo, ventas y detalles |
| `backend/src/database/schema.sql` | DDL MySQL/InnoDB de las seis tablas, restricciones e índices |
| `backend/src/database/connection.js` | Conexión, creación inicial y transacciones |
| `backend/src/database/seed.js` | Datos ficticios de la primera ejecución |
| `backend/src/middleware/errorHandler.js` | Traduce validaciones y restricciones en respuestas HTTP |
| `backend/src/app.js` | Configuración de Express y CORS |
| `backend/src/server.js` | Inicio y cierre del servidor |
| `backend/test/api.test.js` | Pruebas HTTP sobre MySQL real y datos aislados |

Los modelos usan funciones con responsabilidad concreta. No se añadió un ORM porque el trabajo permite SQL directo y el alcance es pequeño. Los cuatro catálogos comparten una implementación con una lista cerrada de entidades; los valores del usuario siempre se envían como parámetros SQL.

## Modelo y reglas de negocio

| Tabla | Relación principal |
| --- | --- |
| categorias | Una categoría agrupa cero o varios productos |
| productos | Cada producto tiene una categoría y puede aparecer en varias ventas |
| clientes | Un cliente puede tener varias ventas; una venta puede ser de mostrador |
| metodos_pago | Cada venta tiene un método; un método puede usarse en varias ventas |
| ventas | Cabecera con fecha, método de pago, cliente opcional y observaciones |
| detalle_ventas | Vincula ventas y productos con cantidad y precio histórico |

El diseño separa entidades y evita listas de productos en una sola celda. La pareja `(venta_id, producto_id)` es única. Una venta tiene entre uno y cincuenta productos distintos; las cantidades son enteros de 1 a 999. La API garantiza el mínimo de un detalle y protege la eliminación del último; las FKs del esquema garantizan la existencia de los padres. El borrado de una venta elimina sus detalles mediante la cascada de esa relación agregada.

MySQL guarda `productos.precio` y `detalle_ventas.precio_unitario` como `decimal(10,2)` en colones: ₡2 200,00 se almacena como `2200.00`. El contrato HTTP conserva los nombres `precio_centimos` y `precio_unitario_centimos` para mantener los formularios actuales. El backend convierte los céntimos enteros a texto decimal exacto antes de escribir, y SQL convierte el importe a enteros al leer; los DECIMAL no se convierten a flotantes de JavaScript. Los precios admiten entre cero y un millón de colones. Los totales se calculan con aritmética DECIMAL en SQL y se entregan como céntimos enteros seguros.

Al registrar un detalle se toma el precio actual del producto. Al editar cantidad se mantiene el precio histórico; al sustituirlo por otro producto se toma el precio del nuevo producto. Cambiar el catálogo no altera ventas anteriores. La creación y edición de una venta se ejecutan dentro de una transacción InnoDB con una sola conexión: un producto inválido revierte la cabecera y todos sus detalles.

Los cambios de detalles bloquean la venta con SELECT FOR UPDATE y usan READ COMMITTED para volver a leer después del bloqueo. Esto protege el mínimo de un detalle frente a borrados simultáneos.

Las categorías, productos, clientes y métodos de pago referenciados no se eliminan mientras tengan dependencias. La API responde 409 y la interfaz muestra el motivo. Para eliminar una venta se pide confirmación y se informa de que también se eliminan sus detalles.

Las fechas se guardan como DATETIME(3) interpretado explícitamente como UTC y la API devuelve ISO UTC y se muestran en horario de Costa Rica. El formulario convierte explícitamente la hora local de Costa Rica a UTC.

## API REST

| Entidad | Ruta base |
| --- | --- |
| Categorías | `/api/categorias` |
| Productos | `/api/productos` |
| Clientes | `/api/clientes` |
| Métodos de pago | `/api/metodos-pago` |
| Ventas | `/api/ventas` |
| Detalle de ventas | `/api/detalle-ventas` |

En cada ruta: POST crea (201), GET lista (200), GET /:id consulta (200 o 404), PUT /:id actualiza (200) y DELETE /:id elimina (204 sin cuerpo). Entradas inválidas devuelven 400, conflictos devuelven 409 y cuerpos excesivos devuelven 413. Los errores inesperados devuelven 500 sin exponer SQL. Las listas responden con un arreglo JSON y admiten `buscar`, `limit` de 1 a 200 y `offset` de 0 a 100000. Los detalles también admiten `venta_id`.

Los PUT de catálogo representan sus campos editables: se incluyen los obligatorios y los opcionales omitidos pasan a NULL. En ventas se envía el conjunto completo de detalles. No se acepta un total ni un precio unitario aportado por el cliente. En PUT de detalles se editan producto y cantidad; el detalle conserva su venta.

Crear un producto:

```json
{"nombre":"Espresso","categoria_id":1,"precio_centimos":140000,"descripcion":"Café corto"}
```

Crear una venta (IDs existentes):

```json
{"cliente_id":null,"metodo_pago_id":1,"detalles":[{"producto_id":1,"cantidad":2}]}
```

Crear un detalle adicional a una venta existente:

```json
{"venta_id":1,"producto_id":2,"cantidad":1}
```

CORS permite únicamente los orígenes locales declarados en `backend/.env`; el middleware responde OPTIONS antes de las rutas. CORS regula la lectura en navegadores y no sustituye autorización ni bloquea clientes como Postman. No se utilizan cookies, tokens ni credenciales de acceso en este proyecto académico.

## Probar con Postman

1. Iniciar el backend con los datos de demostración.
2. Importar `postman/Cafe_Nube.postman_collection.json`.
3. Mantener `base_url=http://localhost:3001/api`.
4. Ejecutar las carpetas en orden. Los POST guardan automáticamente los IDs temporales usados por las peticiones siguientes.

La colección contiene 38 peticiones, incluyendo los CRUD y cuatro casos que esperan errores controlados. Se crean y eliminan registros temporales propios; los productos iniciales con ID 1 y 2 y el método de pago con ID 1 deben seguir disponibles. Los ID de ejemplo se refieren exclusivamente a esta base ficticia. El borrado de una categoría usada espera 409.

## Pruebas automatizadas

```bash
npm test
npm run build
```

Las pruebas usan peticiones HTTP reales contra Express y MySQL. Cada prueba crea una base temporal con nombre `cafetest_` y un identificador aleatorio; al terminar elimina exclusivamente esa base creada por la prueba. El usuario de pruebas necesita permisos CREATE y DROP DATABASE. No se elimina ni reinicia `cafeteria`. El informe se encuentra en `documentacion/Resultados_Pruebas.md`.

## Entregables del día 1

| Requisito del enunciado | Evidencia incluida |
| --- | --- |
| Tema y justificación empresarial | `documentacion/01_Tema_y_Justificacion_Cafe_Nube.docx` |
| DER con atributos y relaciones | `documentacion/Cafeteria_Modelo_y_Estructura.drawio`, primera pestaña |
| Organización backend y frontend | Carpetas y archivos del proyecto; segunda pestaña del diagrama |
| Crear y listar al menos una entidad | Seis CRUD completos, pruebas HTTP y colección Postman |
| Validaciones y confirmación de eliminación | Backend validado y diálogos en React |

Se entrega un repositorio local con un commit inicial y el código listo para ejecutarse. El repositorio remoto de GitHub no se crea ni se publica automáticamente: cuando se disponga de su URL, puede añadirse como origin y enviarse la rama main.

## Referencias técnicas

Consultadas el 4 de noviembre de 2026. La elección de las seis tablas corresponde al diseño de este proyecto, no a una imposición del enunciado.

- [Express y manejo de errores](https://expressjs.com/en/guide/error-handling/).
- [Middleware CORS de Express](https://expressjs.com/en/resources/middleware/cors/).
- [MySQL y DECIMAL](https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html).
- [MySQL y lecturas con bloqueo](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html).
- [MySQL2 y consultas con promesas](https://sidorares.github.io/node-mysql2/docs).
