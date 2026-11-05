import { DataTypes } from 'sequelize';

// Mapeo del esquema existente: no sincroniza ni modifica tablas al iniciar.
export function defineEntities(sequelize) {
 const id = () => ({type:DataTypes.INTEGER, primaryKey:true, autoIncrement:true, allowNull:false});
 const text = (n,nullable=true) => ({type:DataTypes.STRING(n),allowNull:nullable});
 const fk = (nullable=false) => ({type:DataTypes.INTEGER,allowNull:nullable});
 const name = n => ({...text(n,false),validate:{len:[2,n]}});
 const define = (tableName,attributes,indexes=[]) => sequelize.define(tableName,attributes,{tableName,timestamps:false,indexes});
 const categorias = define('categorias',{id:id(),nombre:{...name(80),unique:true},descripcion:text(300)});
 const productos = define('productos',{id:id(),categoria_id:fk(),nombre:{...name(100),unique:true},descripcion:text(300),precio:{type:DataTypes.DECIMAL(10,2),allowNull:false,validate:{min:0,max:1000000}}});
 const clientes = define('clientes',{id:id(),nombre:name(100),telefono:text(30),correo:{...text(120),unique:true}});
 const metodos_pago = define('metodos_pago',{id:id(),nombre:{...name(80),unique:true},descripcion:text(300)});
 const ventas = define('ventas',{id:id(),cliente_id:fk(true),metodo_pago_id:fk(),fecha:{type:DataTypes.DATE(3),allowNull:false},observaciones:text(300)},[{fields:['fecha']}]);
 const detalle_ventas = define('detalle_ventas',{id:id(),venta_id:fk(),producto_id:fk(),cantidad:{type:DataTypes.INTEGER,allowNull:false,validate:{min:1,max:999}},precio_unitario:{type:DataTypes.DECIMAL(10,2),allowNull:false,validate:{min:0,max:1000000}}},[{unique:true,fields:['venta_id','producto_id']}]);
 for (const [parent,child,key,parentAlias,childAlias,onDelete] of [
  [categorias,productos,'categoria_id','productos','categoria','RESTRICT'],
  [clientes,ventas,'cliente_id','ventas','cliente','RESTRICT'],
  [metodos_pago,ventas,'metodo_pago_id','ventas','metodo_pago','RESTRICT'],
  [ventas,detalle_ventas,'venta_id','detalles','venta','CASCADE'],
  [productos,detalle_ventas,'producto_id','detalles','producto','RESTRICT']
 ]) {
  parent.hasMany(child,{foreignKey:key,as:parentAlias,onDelete,onUpdate:'RESTRICT'});
  child.belongsTo(parent,{foreignKey:key,as:childAlias,onDelete,onUpdate:'RESTRICT'});
 }
 return {categorias,productos,clientes,metodos_pago,ventas,detalle_ventas};
}
export function cents(decimal) {
 const [whole,fraction=''] = String(decimal).split('.');
 const result = Number(BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0')));
 if (!Number.isSafeInteger(result)) throw new Error('Importe fuera de rango seguro');
 return result;
}
