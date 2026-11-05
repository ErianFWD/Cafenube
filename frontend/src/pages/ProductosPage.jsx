import ResourcePage from '../components/ResourcePage.jsx';
import ProductPhoto from '../components/ProductPhoto.jsx';
import { money } from '../utils/format.js';
const config = {
  gallery: true,
  path: '/productos',
  title: 'Productos',
  description: 'Mantén el menú actualizado y organiza tus productos por categoría.',
  newLabel: 'Nuevo producto',
  editTitle: 'Editar producto',
  listTitle: 'Productos del menú',
  label: 'productos',
  columns: [
    {
      key: 'id',
      label: 'Código',
      render: (r) => <span className="row-code">#{String(r.id).padStart(3, '0')}</span>,
    },
    {
      key: 'nombre',
      label: 'Producto',
      render: (r) => (
        <div className="product-cell">
          <ProductPhoto product={r} className="product-table-photo" />
          <span>
            <strong>{r.nombre}</strong>
            <small>{r.descripcion || 'Sin descripción'}</small>
          </span>
        </div>
      ),
    },
    {
      key: 'categoria_nombre',
      label: 'Categoría',
      render: (r) => <span className="tag">{r.categoria_nombre}</span>,
    },
    {
      key: 'precio_centimos',
      label: 'Precio',
      align: 'align-right',
      render: (r) => <strong className="amount">{money(r.precio_centimos)}</strong>,
    },
  ],
  fields: [
    {
      name: 'nombre',
      label: 'Nombre del producto',
      required: true,
      minLength: 2,
      maxLength: 100,
      placeholder: 'Ej. Cappuccino',
      wide: true,
    },
    {
      name: 'categoria_id',
      label: 'Categoría',
      type: 'select',
      resource: '/categorias',
      required: true,
    },
    { name: 'precio_centimos', label: 'Precio en colones (₡)', type: 'price', required: true },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Ingredientes o características del producto.',
      wide: true,
    },
  ],
  note: 'Los cambios de precio no alteran las ventas que ya fueron registradas.',
};
export default function ProductosPage() {
  return <ResourcePage config={config} />;
}
