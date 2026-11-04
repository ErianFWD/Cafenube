# Resultados de verificación de Café Nube

Fecha: 4 de noviembre de 2026. Proyecto académico de Erian Badilla Fallas.

## Resultado general

| Comprobación ejecutada | Resultado |
| --- | --- |
| Pruebas automatizadas de API, Express y SQLite (`npm test`) | 14 aprobadas, 0 fallidas |
| Recorridos de interfaz en navegador Chromium | 9 aprobados, 0 errores JavaScript |
| Colección Postman ejecutada con Newman | 38 peticiones y 38 comprobaciones aprobadas, 0 fallidas |
| Compilación React con Vite (`npm run build`) | Correcta, 43 módulos transformados |
| Esquema SQLite | 6 tablas; `integrity_check` devuelve `ok` |
| Archivo draw.io | 2 páginas editables, identificadores y conectores válidos |
| Documento de justificación | 2 páginas renderizadas e inspeccionadas visualmente |

Se utilizó Node.js 24.22.1. Las pruebas HTTP usan bases aisladas: SQLite en memoria y un archivo temporal para persistencia. La revisión del navegador y Newman usaron una base temporal independiente con datos ficticios. No se modificaron datos de una cafetería real.

## Pruebas de API aprobadas

1. El esquema implementa seis tablas con FK y datos de ejemplo íntegros.
2. CRUD completo por HTTP de categorías, productos, clientes y métodos de pago.
3. Ventas y detalles tienen CRUD, totales calculados y borrado conjunto.
4. Los seis recursos conservan 404 para GET, PUT y DELETE de un ID inexistente.
5. Validaciones rechazan tipos, nulos obligatorios, IDs, campos extra y precios inválidos.
6. UNICIDAD y FK rechazan duplicados o relaciones inválidas.
7. Una venta inválida revierte cabecera y detalles en la misma transacción.
8. Ventas vacías, cantidades inválidas y productos repetidos no se aceptan.
9. Precios históricos y edición atómica de ventas conservan los registros previos.
10. CORS permite los orígenes declarados y responde preflight sin autenticación.
11. JSON inválido, cuerpo excesivo y ruta desconocida dan respuestas controladas.
12. Las consultas parametrizadas conservan una entrada de texto sin ejecutarla como SQL.
13. La persistencia sobre archivo sobrevive reinicios sin resembrar registros borrados.
14. Búsqueda y paginación tienen límites y orden determinista.

## Recorridos de interfaz aprobados

1. Dashboard conectado a SQLite y sin desbordamiento de página.
2. Producto: crear, consultar, editar, cancelar borrado y eliminar.
3. Cliente: crear, editar datos opcionales y eliminar.
4. Categoría y método de pago: CRUD desde los formularios.
5. Eliminar una categoría relacionada muestra el conflicto y mantiene el diálogo.
6. Venta: crear dos líneas, ver detalle, editar cantidad y eliminar.
7. Detalle de venta: crear, editar cantidad y eliminar desde su pantalla.
8. Vista móvil: menú y navegación sin desbordamiento horizontal.
9. Ruta desconocida y regreso al inicio.

La revisión visual cubrió escritorio de 1440 píxeles y móvil de 390 píxeles. Las tablas anchas se desplazan dentro de su contenedor en móvil; la página no presenta desbordamiento horizontal. Se comprobaron los estados de confirmación, cancelación y conflicto por relaciones, además de los formularios de las seis entidades.

## Colección Postman

Se ejecutó `postman/Cafe_Nube.postman_collection.json` con Newman 6 contra una instancia temporal de la API. Cada una de las 38 peticiones comprueba su estado HTTP. Los casos negativos esperan 400, 404 o 409 y se consideran aprobados al recibir ese estado. Las pruebas automatizadas de Node realizan las comprobaciones adicionales de contenido, integridad, transacciones y persistencia.

Para repetir las pruebas, iniciar el proyecto con los datos de demostración e importar la colección en Postman. También puede ejecutarse desde terminal:

```bash
npx newman run postman/Cafe_Nube.postman_collection.json --env-var base_url=http://localhost:3001/api
```

Los datos iniciales con ID 1 y 2 referenciados por la colección deben existir. Los registros temporales de la colección se eliminan al completar sus carpetas en orden.

## Alcance de la entrega

La base comprobada es SQLite, permitida por el enunciado. Los pagos son registros de métodos de pago, sin procesamiento bancario. El proyecto no implementa autenticación porque el enunciado la excluye. El repositorio entregado es local; no se ha publicado un repositorio remoto de GitHub.

