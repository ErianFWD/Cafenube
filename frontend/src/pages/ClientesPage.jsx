import ResourcePage from '../components/ResourcePage.jsx';
import Icon from '../components/Icon.jsx';
import { money, initials } from '../utils/format.js';
const config = {
  path: '/clientes',
  title: 'Clientes',
  description: 'Conserva la información de contacto de quienes visitan tu cafetería.',
  newLabel: 'Nuevo cliente',
  editTitle: 'Editar cliente',
  listTitle: 'Directorio de clientes',
  label: 'clientes',
  columns: [
    {
      key: 'id',
      label: 'Código',
      render: (r) => <span className="row-code">#{String(r.id).padStart(3, '0')}</span>,
    },
    {
      key: 'nombre',
      label: 'Cliente',
      render: (r) => (
        <div className="person-cell">
          <span className="person-avatar">{initials(r.nombre)}</span>
          <strong>{r.nombre}</strong>
        </div>
      ),
    },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'correo', label: 'Correo electrónico' },
  ],
  fields: [
    {
      name: 'nombre',
      label: 'Nombre completo',
      required: true,
      minLength: 2,
      maxLength: 100,
      placeholder: 'Ej. Ana Mora',
      wide: true,
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'tel',
      maxLength: 30,
      placeholder: 'Ej. 8888-1234',
    },
    {
      name: 'correo',
      label: 'Correo electrónico',
      type: 'email',
      maxLength: 120,
      placeholder: 'Ej. ana@example.test',
    },
  ],
  note: 'Puedes registrar una venta como cliente de mostrador sin crear un cliente.',
};
export default function ClientesPage() {
  return <ResourcePage config={config} />;
}
