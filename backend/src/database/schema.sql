create table categorias (
    id integer primary key,
    nombre text not null collate nocase unique check (length(trim(nombre)) between 2 and 80),
    descripcion text check (descripcion is null or length(descripcion) <= 300)
) strict;

create table productos (
    id integer primary key,
    categoria_id integer not null references categorias(id) on delete restrict,
    nombre text not null collate nocase unique check (length(trim(nombre)) between 2 and 100),
    descripcion text check (descripcion is null or length(descripcion) <= 300),
    precio_centimos integer not null check (precio_centimos between 0 and 100000000)
) strict;

create table clientes (
    id integer primary key,
    nombre text not null check (length(trim(nombre)) between 2 and 100),
    telefono text check (telefono is null or length(telefono) <= 30),
    correo text collate nocase unique check (correo is null or length(correo) <= 120)
) strict;

create table metodos_pago (
    id integer primary key,
    nombre text not null collate nocase unique check (length(trim(nombre)) between 2 and 80),
    descripcion text check (descripcion is null or length(descripcion) <= 300)
) strict;

create table ventas (
    id integer primary key,
    cliente_id integer references clientes(id) on delete restrict,
    metodo_pago_id integer not null references metodos_pago(id) on delete restrict,
    fecha text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) check (length(fecha) = 24),
    observaciones text check (observaciones is null or length(observaciones) <= 300)
) strict;

create table detalle_ventas (
    id integer primary key,
    venta_id integer not null references ventas(id) on delete cascade,
    producto_id integer not null references productos(id) on delete restrict,
    cantidad integer not null check (cantidad between 1 and 999),
    precio_unitario_centimos integer not null check (precio_unitario_centimos between 0 and 100000000),
    unique (venta_id, producto_id)
) strict;

create index idx_productos_categoria on productos(categoria_id);
create index idx_ventas_fecha on ventas(fecha);
create index idx_ventas_cliente on ventas(cliente_id);
create index idx_ventas_metodo on ventas(metodo_pago_id);
create index idx_detalles_producto on detalle_ventas(producto_id);

pragma user_version = 1;
