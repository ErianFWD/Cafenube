import { money } from '../utils/format.js';
import Icon from './Icon.jsx';
import ProductPhoto from './ProductPhoto.jsx';
export default function ProductGallery({ rows, loading, onEdit, onDelete }) {
  if (loading) return <div className="empty-state"><span className="loading-dot" />Cargando el menú…</div>;
  if (!rows.length) return <div className="empty-state"><Icon name="coffee" size={32} /><strong>No se encontraron productos</strong><span>Prueba otra búsqueda o agrega un producto al menú.</span></div>;
  return <div className="product-gallery">{rows.map((row,index)=><article className="menu-product-card" key={row.id}>
    <div className="product-image-wrap"><ProductPhoto product={row} eager={index < 3} /><span className="product-category-badge">{row.categoria_nombre}</span><span className="photo-reference">Foto de referencia</span></div>
    <div className="product-card-body"><span className="product-card-code">MENÚ · #{String(row.id).padStart(3,'0')}</span><h3>{row.nombre}</h3><p>{row.descripcion || 'Un nuevo sabor para disfrutar en Café Nube.'}</p><div className="product-card-bottom"><strong>{money(row.precio_centimos)}</strong><div className="row-actions"><button className="icon-button" type="button" onClick={()=>onEdit(row)} aria-label={`Editar registro ${row.id}`} title="Editar producto"><Icon name="edit" size={19} /></button><button className="icon-button delete-button" type="button" onClick={()=>onDelete(row)} aria-label={`Eliminar registro ${row.id}`} title="Eliminar producto"><Icon name="trash" size={19} /></button></div></div></div>
  </article>)}</div>;
}
