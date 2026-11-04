# Actualización visual de Café Nube

Esta entrega actualiza el frontend del proyecto MySQL que ya está funcionando e integra el logo esmeralda con bordes dorados que aprobaste. Incluye portada fotográfica, una paleta verde esmeralda con dorado y naranja, tipografías locales Jost y Cormorant Garamond, un catálogo con fotografías reales y filtros por categoría.

## Instalar en tu proyecto actual

1. Detén `npm run dev` con Ctrl+C.
2. Extrae este ZIP en una carpeta temporal.
3. Copia la carpeta `frontend` de esta actualización dentro de la raíz de tu proyecto, donde ya están `backend`, `frontend` y `package.json`.
4. Combina las carpetas y acepta reemplazar los archivos coincidentes. Conserva la carpeta existente: esta actualización contiene `src`, `public` e `index.html`, y no incluye archivos `.env` ni `package.json`.
5. Desde la raíz del proyecto ejecuta:

```bash
npm run dev
```

Abre http://localhost:5173. Si la pestaña estaba abierta, recarga con Ctrl+F5.

La conexión configurada en `backend/.env`, incluida tu base `cafenube`, se conserva. Esta actualización se aplica al frontend; no necesita crear tablas ni ejecutar otra vez `npm run db:setup`. Tampoco agrega dependencias npm.

Si estabas ejecutando la versión compilada, usa `npm run build` y luego `npm start` para actualizarla.

## Logo esmeralda y oro

El logo se usa en el menú lateral y el pie de página. Su emblema aparece en la cabecera, el sello de la portada y el icono de la pestaña del navegador. Los dos PNG con fondo transparente también están incluidos para reutilizarlos:

- `frontend/public/branding/cafe-nube-esmeralda-logo.png`: logo horizontal de 2172 × 724 píxeles.
- `frontend/public/branding/cafe-nube-esmeralda-icono.png`: emblema de 1254 × 1254 píxeles.

El componente `frontend/src/components/BrandLogo.jsx` comparte las variantes y `frontend/src/styles/logo.css` adapta sus tamaños a escritorio y móvil. Los PNG se prepararon con generación y edición de imagen a partir de la propuesta elegida; conservan transparencia real.

## Qué incluye

- Portada con fotografía real de preparación de café, títulos editoriales y accesos al menú y registro de ventas.
- Colores más intensos, mayor contraste y estilos compartidos en todos los módulos.
- Fotografías de referencia para los ocho productos del menú de demostración.
- Catálogo en tarjetas o tabla, con búsqueda y filtros por categoría.
- Miniaturas de productos en ventas, favoritos y vista previa del formulario.
- Adaptación para móvil, tablet y escritorio, con confirmaciones al eliminar.
- Imágenes WebP y fuentes WOFF locales, sin cargar imágenes o fuentes de terceros al usar la aplicación.

Las fotografías son imágenes reales de referencia, no fotografías tomadas en el negocio del usuario. Se asignan por el nombre del producto desde `frontend/src/utils/productMedia.js`; esto evita depender de los ID de MySQL. Un producto que no coincida usa una fotografía de granos de café. Para personalizar el menú, sustituye los archivos de `frontend/public/images/` o agrega una asociación en ese archivo.

## Procedencia de recursos

La referencia visual es https://cafebritt.cr/; Café Nube conserva su nombre y su diseño propio. Las fotografías se obtuvieron de Unsplash y sus fuentes se incluyen en `frontend/public/images/fuentes.json`. Licencia: https://unsplash.com/license.

Las tipografías Jost y Cormorant Garamond proceden de Google Fonts, con sus licencias SIL Open Font License incluidas en `frontend/public/fonts/`. Las fuentes se distribuyen en formato WOFF para uso local.

La organización de React conserva `components`, `pages`, `routes`, `App.jsx`, `main.jsx` e `index.html`.
