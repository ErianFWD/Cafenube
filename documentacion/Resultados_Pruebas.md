# Resultados de verificación de Café Nube con MySQL

Fecha: 4 de noviembre de 2026. Autor: Erian Badilla Fallas.

| Comprobación ejecutada | Resultado |
| --- | --- |
| Motor ejecutado mediante SELECT VERSION() | MySQL 8.0.46 de Ubuntu, InnoDB |
| Conector | mysql2 3.24.6 |
| Pruebas de API con Express y MySQL real | 16 aprobadas, 0 fallidas |
| Recorridos de interfaz en Chromium | 11 aprobados, 0 errores JavaScript; imágenes y fuentes sin respuestas de error |
| Colección Postman ejecutada con Newman | 38 peticiones y 38 comprobaciones aprobadas, 0 fallidas |
| React con Vite | Compilación correcta, 49 módulos |
| Modelo relacional | 6 tablas, 5 claves foráneas, restricciones de unicidad y CHECK |
| Documento y diagrama | Word de 2 páginas inspeccionado; draw.io editable con 2 pestañas |

Las pruebas se ejecutaron con Node.js 24.22.1 y una instancia MySQL aislada con datos ficticios. Cada prueba de API creó su propia base temporal y la eliminó al finalizar. La interfaz y Newman usaron una base de demostración independiente. El código conserva la estructura de React y las rutas HTTP del proyecto.

## Pruebas de API aprobadas

1. el esquema implementa seis tablas con FK y datos de ejemplo íntegros.
2. CRUD completo por HTTP de categorías, productos, clientes y métodos de pago.
3. ventas y detalles tienen CRUD, totales calculados y borrado conjunto.
4. los seis recursos conservan 404 para GET, PUT y DELETE de un ID inexistente.
5. validaciones rechazan tipos, nulos obligatorios, IDs, campos extra y precios inválidos.
6. UNICIDAD y FK rechazan duplicados o relaciones inválidas.
7. una venta inválida revierte cabecera y detalles en la misma transacción.
8. ventas vacías, cantidades inválidas y productos repetidos no se aceptan.
9. precios históricos y edición atómica de ventas conservan los registros previos.
10. CORS permite los orígenes declarados y responde preflight sin autenticación.
11. JSON inválido, cuerpo excesivo y ruta desconocida dan respuestas controladas.
12. las consultas parametrizadas conservan una entrada de texto sin ejecutarla como SQL.
13. la persistencia MySQL sobrevive al cierre del pool y setup no resembra.
14. búsqueda y paginación tienen límites y orden determinista.
15. DECIMAL guarda colones exactos y la API conserva céntimos y fechas ISO UTC.
16. el borrado concurrente de detalles mantiene al menos una línea.

## Recorridos de interfaz aprobados

1. Dashboard conectado a MySQL y sin desbordamiento de página.
2. Catálogo fotográfico: imágenes locales, fuentes, filtros y vista de tabla.
3. Producto: crear, consultar, editar, cancelar borrado y eliminar.
4. Cliente: crear, editar datos opcionales y eliminar.
5. Categoría y método de pago: CRUD desde los formularios.
6. Eliminar una categoría relacionada muestra el conflicto y mantiene el diálogo.
7. Venta: crear dos líneas, ver detalle, editar cantidad y eliminar.
8. Detalle de venta: crear, editar cantidad y eliminar desde su pantalla.
9. Vista móvil: menú y navegación sin desbordamiento horizontal.
10. Catálogo móvil, filtro desde portada y vista previa de fotografía.
11. Ruta desconocida y regreso al inicio.

La interfaz renovada se comprobó con MySQL 8.0.46 y fotografías locales reales de referencia. Se inspeccionaron la portada y el catálogo a 1440 píxeles de ancho, el catálogo a 1024 píxeles y las vistas móviles a 390 píxeles. Las imágenes y fuentes cargaron sin respuestas de error. Se validó el filtro por categoría, la búsqueda, la alternancia tarjetas/tabla y el acceso a una categoría desde la portada.

Las pruebas de los formularios incluyeron las seis entidades, confirmación y cancelación del borrado, conflictos por relaciones y ventas con varios productos. La compilación React con Vite transformó 49 módulos. El cambio visual conserva el backend MySQL y sus rutas HTTP.

## Aplicación del logo esmeralda y oro

El logo aprobado conserva el grano ovalado con división curva y utiliza esmeralda pulida con bordes dorados. Se prepararon PNG con transparencia para el logo horizontal y el emblema. El menú, la cabecera, el sello de portada, el pie y el favicon usan estos recursos locales.

Se ejecutaron cinco comprobaciones específicas con Chromium, Express y una instancia aislada MySQL 8.0.46:

1. Logo horizontal en menú y pie; emblema en cabecera y portada, cargados correctamente.
2. Favicon PNG disponible con la ruta del emblema aprobado.
3. Marca visible y sin desbordamiento en las seis pantallas de gestión.
4. El logo del pie vuelve al inicio.
5. Logo y emblema adaptados a móvil; menú abre y el logo lo cierra al volver al inicio.

Resultado: cinco aprobadas, sin errores JavaScript ni respuestas de error de los recursos de marca. La compilación actual transformó 49 módulos. Se inspeccionaron las vistas de escritorio y móvil; el backend no cambió en esta actualización. Las pruebas de API, Newman y los once recorridos completos de interfaz descritos arriba corresponden a la revisión funcional anterior del mismo proyecto.

## Cómo repetir las pruebas

Configurar MySQL en `backend/.env`, iniciar el servicio MySQL y ejecutar desde la raíz:

```bash
npm test
npm run build
```

El usuario MySQL usado por las pruebas necesita permisos CREATE y DROP DATABASE. Las pruebas eliminan exclusivamente las bases aleatorias que crean con prefijo `cafetest_`; la base `cafeteria` se conserva.

Para repetir Postman, preparar los ejemplos con `npm run db:setup`, iniciar con `npm run dev` e importar `postman/Cafe_Nube.postman_collection.json`. Ejecutar sus carpetas en orden. Los productos iniciales 1 y 2 y el método de pago 1 deben existir. Los casos negativos esperan estados 400, 404 o 409.

La versión ejecutada fue MySQL 8.0.46. El proyecto admite MySQL 8.0.16 o posterior y recomienda 8.4 para una instalación nueva; no se afirma haber probado otras versiones. La entrega corresponde a ejecución local y no publica un repositorio remoto.
