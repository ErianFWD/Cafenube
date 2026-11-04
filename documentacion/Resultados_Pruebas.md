# Resultados de verificación de Café Nube con MySQL

Fecha: 4 de noviembre de 2026. Autor: Erian Badilla Fallas.

| Comprobación ejecutada | Resultado |
| --- | --- |
| Motor ejecutado mediante SELECT VERSION() | MySQL 8.0.46 de Ubuntu, InnoDB |
| Conector | mysql2 3.24.6 |
| Pruebas de API con Express y MySQL real | 16 aprobadas, 0 fallidas |
| Recorridos de interfaz en Chromium | 9 aprobados, 0 errores JavaScript |
| Colección Postman ejecutada con Newman | 38 peticiones y 38 comprobaciones aprobadas, 0 fallidas |
| React con Vite | Compilación correcta, 43 módulos |
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
2. Producto: crear, consultar, editar, cancelar borrado y eliminar.
3. Cliente: crear, editar datos opcionales y eliminar.
4. Categoría y método de pago: CRUD desde los formularios.
5. Eliminar una categoría relacionada muestra el conflicto y mantiene el diálogo.
6. Venta: crear dos líneas, ver detalle, editar cantidad y eliminar.
7. Detalle de venta: crear, editar cantidad y eliminar desde su pantalla.
8. Vista móvil: menú y navegación sin desbordamiento horizontal.
9. Ruta desconocida y regreso al inicio.

Se comprobó la vista de escritorio de 1440 píxeles y móvil de 390 píxeles. La página no presenta desbordamiento horizontal; las tablas anchas se desplazan dentro de su contenedor. Los seis módulos permiten crear, consultar, editar y eliminar desde los formularios.

## Cómo repetir las pruebas

Configurar MySQL en `backend/.env`, iniciar el servicio MySQL y ejecutar desde la raíz:

```bash
npm test
npm run build
```

El usuario MySQL usado por las pruebas necesita permisos CREATE y DROP DATABASE. Las pruebas eliminan exclusivamente las bases aleatorias que crean con prefijo `cafetest_`; la base `cafeteria` se conserva.

Para repetir Postman, preparar los ejemplos con `npm run db:setup`, iniciar con `npm run dev` e importar `postman/Cafe_Nube.postman_collection.json`. Ejecutar sus carpetas en orden. Los productos iniciales 1 y 2 y el método de pago 1 deben existir. Los casos negativos esperan estados 400, 404 o 409.

La versión ejecutada fue MySQL 8.0.46. El proyecto admite MySQL 8.0.16 o posterior y recomienda 8.4 para una instalación nueva; no se afirma haber probado otras versiones. La entrega corresponde a ejecución local y no publica un repositorio remoto.
